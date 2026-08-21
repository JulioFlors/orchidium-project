import * as fs from 'fs'
import * as path from 'path'

import { prisma, ZoneType } from '@package/database'

import { influxClient } from '../lib/influx'
import {
  isDaytime,
  getCaracasHour,
  getHumGradientMetrics,
  getTempGradientMetrics,
} from '../lib/rain-manager'
import { classifyCurrentDay, DayClassification } from '../lib/day-classifier'

const ENV_BACKFILL_DAYS = process.env.BACKFILL_DAYS
  ? parseInt(process.env.BACKFILL_DAYS, 10)
  : undefined
const START_DATE = new Date('2026-05-25T04:00:00.000Z') // 25 de Mayo 00:00:00 Caracas
const DRY_RUN = process.env.BACKFILL_DRY_RUN === 'true'
const COOLDOWN_MS = 15 * 60 * 1000 // 15 minutos sin lluvia para cerrar evento físico
const BATCH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutos por lote de telemetría exterior

interface Sample {
  value: number
  timestamp: number
}

interface BatchSummary {
  min: number
  max: number
  timestamp: number
  samples: Sample[]
}

const stats = {
  totalInferred: 0,
  triggers: {} as Record<string, number>,
  closes: {} as Record<string, number>,
  vetos: 0,
}

const inferredEventsForComparison: { startedAt: Date; endedAt: Date }[] = []

/**
 * 🛡️ PARCHE DE TELEMETRÍA CORRUPTA:
 * Omitir el procesamiento del 10 al 17 de Agosto de 2026 debido a telemetría corrupta,
 * lecturas intercaladas/duplicadas, desfase horario o datos no confiables de la estación EMA EXTERIOR.
 */
function isCorruptTelemetryDate(date: Date): boolean {
  try {
    const caracasStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
    const [m, d, y] = caracasStr.split('/')
    const dayNum = parseInt(d, 10)

    return y === '2026' && m === '08' && dayNum >= 10 && dayNum <= 17
  } catch {
    return false
  }
}

const log = {
  info: (msg: string) => console.log(`📡 [ INFO ] ${msg}`),
  warn: (msg: string) => console.log(`⚠️ [ WARN ] ${msg}`),
  success: (msg: string) => console.log(`✅ [ DONE ] ${msg}`),
  error: (msg: string, err?: unknown) => console.error(`❌ [ ERR  ] ${msg}`, err ?? ''),
  blank: () => console.log(''),
}

async function main() {
  const now = new Date()
  let startTime: Date
  const endTime = now
  let modeText = ''

  if (ENV_BACKFILL_DAYS != null && !isNaN(ENV_BACKFILL_DAYS)) {
    startTime = new Date(now)
    startTime.setDate(startTime.getDate() - ENV_BACKFILL_DAYS)
    startTime.setHours(0, 0, 0, 0)
    modeText = `Personalizado (${ENV_BACKFILL_DAYS} días)`
  } else {
    startTime = START_DATE
    const diffTime = Math.max(0, endTime.getTime() - startTime.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    modeText = `Completo desde 25 de Mayo (${diffDays} días)`
  }

  log.info('════════════════════════════════════════════════════════')
  log.info(`  Recontrucción de los Eventos de LLuvia Inferida`)
  log.info(`  Modo: ${modeText}`)
  if (DRY_RUN) log.warn('  ⚠️  MODO DRY-RUN — No se escribirá en Postgres')
  log.info('════════════════════════════════════════════════════════')

  log.blank()

  // 1. Reconstruir Lluvia Física
  await rebuildPhysicalRain(startTime, endTime)

  // 2. Reconstruir Inferencia de Lluvia Virtual
  log.info('🔮 Reconstruyendo eventos de lluvia inferida')
  await rebuildInferredRain(startTime, endTime)

  log.blank()

  log.info('════════════════════════════════════════════════════════')
  log.info('  REPORTE DE EFECTIVIDAD DE REGLAS (INFERENCIA)')
  log.info(`  Total Eventos Inferidos: ${stats.totalInferred}`)
  log.info(`  Total Vetos / Falsos Positivos Evitados: ${stats.vetos}`)
  log.info('  ----------------------------------------------------')
  log.info('  Distribución de Triggers de Inicio:')
  for (const [type, count] of Object.entries(stats.triggers)) {
    log.info(`    - ${type}: ${count}`)
  }
  log.info('  ----------------------------------------------------')
  log.info('  Distribución de Reglas de Cese:')
  for (const [type, count] of Object.entries(stats.closes)) {
    log.info(`    - ${type}: ${count}`)
  }
  log.info('════════════════════════════════════════════════════════')

  log.blank()

  // 3. Contrastar con la bitácora manual de lluvias reales observadas
  try {
    const resourcesDir = path.join(__dirname, 'resources')
    const logPath = path.join(resourcesDir, 'historical-observed-rain.json')

    if (fs.existsSync(logPath)) {
      const rawData = fs.readFileSync(logPath, 'utf8')
      const cleanData = rawData.replace(/^\uFEFF/, '')
      const realEvents = JSON.parse(cleanData) as Array<{
        id: string
        dayOfWeek?: string
        startedAt: string
        endedAt: string
        description: string
        limitationReason?: string
        limitationNotes?: string
      }>

      // Filtrar eventos reales que se solapen con el período bajo análisis
      const relevantRealEvents = realEvents.filter((re) => {
        const reStart = new Date(re.startedAt).getTime()

        return reStart >= startTime.getTime() && reStart <= endTime.getTime()
      })

      if (relevantRealEvents.length > 0) {
        let truePositives = 0
        const falseNegatives: typeof relevantRealEvents = []

        for (const realEvent of relevantRealEvents) {
          const reStart = new Date(realEvent.startedAt).getTime()
          const reEnd = new Date(realEvent.endedAt).getTime()

          // Buscar si existe un evento inferido que se solape (con 30 min de tolerancia por desfase de reloj humano)
          const TOLERANCE_MS = 30 * 60 * 1000
          const isDetected = inferredEventsForComparison.some((inf) => {
            const infStart = inf.startedAt.getTime()
            const infEnd = inf.endedAt.getTime()

            const overlap =
              Math.min(reEnd + TOLERANCE_MS, infEnd + TOLERANCE_MS) -
              Math.max(reStart - TOLERANCE_MS, infStart - TOLERANCE_MS)

            return overlap > 0
          })

          if (isDetected) {
            truePositives++
          } else {
            falseNegatives.push(realEvent)
          }
        }

        // ── Clasificación Avanzada de Falsos Negativos ──────────────────────
        const INSIGNIFICANT_DURATION_MIN = 10
        const SUNNY_DAY_LUX_THRESHOLD = 26000

        interface ClassifiedFN {
          event: (typeof falseNegatives)[0]
          durationMin: number
          avgDayLux: number | null
          dayType: string
          category:
            'LIMITATION_DOCUMENTED' | 'SIGNIFICANT' | 'INSIGNIFICANT_SUNNY' | 'INSIGNIFICANT_CLOUDY'
        }

        const classifiedFNs: ClassifiedFN[] = []

        // Cache de clasificación del día (8am-4pm) por día
        const dayClassCache = new Map<string, DayClassification | null>()

        for (const fn of falseNegatives) {
          const fnStart = new Date(fn.startedAt)
          const fnEnd = new Date(fn.endedAt)
          const durationMin = (fnEnd.getTime() - fnStart.getTime()) / (60 * 1000)

          if (fn.limitationReason || isCorruptTelemetryDate(fnStart)) {
            classifiedFNs.push({
              event: fn,
              durationMin,
              avgDayLux: null,
              dayType: 'N/A',
              category: 'LIMITATION_DOCUMENTED',
            })
          } else if (durationMin > INSIGNIFICANT_DURATION_MIN) {
            // Evento de duración significativa: cuenta como candidato a calibración
            classifiedFNs.push({
              event: fn,
              durationMin,
              avgDayLux: null,
              dayType: 'N/A',
              category: 'SIGNIFICANT',
            })
          } else {
            // Micro-evento (≤ 10 min): evaluar condición solar del día usando day-classifier (8am-4pm)
            const dayKey = fnStart.toISOString().substring(0, 10) // YYYY-MM-DD

            let dayClass: DayClassification | null = dayClassCache.get(dayKey) ?? null

            if (!dayClassCache.has(dayKey)) {
              try {
                dayClass = await classifyCurrentDay(fnStart, true)
              } catch {
                dayClass = null
              }
              dayClassCache.set(dayKey, dayClass)
            }

            const avgLux = dayClass?.avgLuxSince8am ?? null
            const dayType = dayClass?.type ?? 'DESCONOCIDO'

            if (avgLux !== null && avgLux >= SUNNY_DAY_LUX_THRESHOLD) {
              classifiedFNs.push({
                event: fn,
                durationMin,
                avgDayLux: avgLux,
                dayType,
                category: 'INSIGNIFICANT_SUNNY',
              })
            } else {
              classifiedFNs.push({
                event: fn,
                durationMin,
                avgDayLux: avgLux,
                dayType,
                category: 'INSIGNIFICANT_CLOUDY',
              })
            }
          }
        }

        const documentedLimitations = classifiedFNs.filter(
          (f) => f.category === 'LIMITATION_DOCUMENTED',
        )
        const significantFNs = classifiedFNs.filter((f) => f.category === 'SIGNIFICANT')
        const insignificantSunnyFNs = classifiedFNs.filter(
          (f) => f.category === 'INSIGNIFICANT_SUNNY',
        )
        const insignificantCloudyFNs = classifiedFNs.filter(
          (f) => f.category === 'INSIGNIFICANT_CLOUDY',
        )

        // Recall Bruto (sin ajustar)
        const totalReal = relevantRealEvents.length
        const recallBrutoPct = ((truePositives / totalReal) * 100).toFixed(1)

        // Recall Ajustado: excluir limitaciones documentadas y garúas insignificantes soleadas
        const totalExcluded = documentedLimitations.length + insignificantSunnyFNs.length
        const totalAdjusted = Math.max(0, totalReal - totalExcluded)
        const adjustedFN = significantFNs.length + insignificantCloudyFNs.length
        const adjustedTP = Math.max(0, totalAdjusted - adjustedFN)
        const recallAjustadoPct =
          totalAdjusted > 0 ? ((adjustedTP / totalAdjusted) * 100).toFixed(1) : '0.0'

        log.info('════════════════════════════════════════════════════════')
        log.info('  VALIDACIÓN COMPARATIVA: BITÁCORA MANUAL DE LLUVIA')
        log.info('════════════════════════════════════════════════════════')
        log.info(`  Total de lluvias reales registradas en período: ${totalReal}`)
        log.info(`  Verdaderos Positivos (Detectadas): ${truePositives}`)
        log.info(`  Falsos Negativos (Omitidas): ${falseNegatives.length}`)
        log.info(`  Sensibilidad Bruta (Recall): ${recallBrutoPct}%`)
        log.info('  ----------------------------------------------------')
        log.info(`  📊 Desglose de Falsos Negativos:`)
        log.info(
          `     🛡️ Limitaciones Físicas Documentadas (Saturación/Cortes/Desfase): ${documentedLimitations.length} [Justificadas]`,
        )
        log.info(
          `     🍃 Micro-eventos en Día Soleado (≤ ${INSIGNIFICANT_DURATION_MIN} min, ≥ ${(SUNNY_DAY_LUX_THRESHOLD / 1000).toFixed(0)}klx): ${insignificantSunnyFNs.length} [Descartables sin impacto en riego]`,
        )
        log.info(
          `     🔍 Significativos No Explicados (> ${INSIGNIFICANT_DURATION_MIN} min): ${significantFNs.length} [Candidatas a calibración]`,
        )
        log.info(
          `     ☁️ Micro-eventos en Día Nublado (≤ ${INSIGNIFICANT_DURATION_MIN} min, < ${(SUNNY_DAY_LUX_THRESHOLD / 1000).toFixed(0)}klx): ${insignificantCloudyFNs.length}`,
        )
        log.info('  ----------------------------------------------------')
        log.info(
          `  🎯 Sensibilidad Ajustada (excluyendo ${documentedLimitations.length} limitaciones y ${insignificantSunnyFNs.length} micro-garúa(s)): ${recallAjustadoPct}%`,
        )
        log.info(
          `     (Base ajustada: ${totalAdjusted} eventos | Detectados: ${adjustedTP} | Omitidos Reales: ${adjustedFN})`,
        )
        log.info('  ----------------------------------------------------')

        if (significantFNs.length > 0) {
          log.warn('  ⚠️  Lluvias SIGNIFICATIVAS no explicadas (Candidatas a calibración):')
          for (const fn of significantFNs) {
            const startStr = new Date(fn.event.startedAt).toLocaleTimeString('es-VE', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Caracas',
            })
            const endStr = new Date(fn.event.endedAt).toLocaleTimeString('es-VE', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Caracas',
            })
            const dateStr = new Date(fn.event.startedAt).toLocaleDateString('es-VE', {
              timeZone: 'America/Caracas',
            })
            const dayOfWeekLabel = fn.event.dayOfWeek ? `${fn.event.dayOfWeek} ` : ''

            log.warn(
              `    - [${dayOfWeekLabel}${dateStr} ${startStr} - ${endStr}] (${fn.durationMin.toFixed(0)} min): ${fn.event.description}`,
            )
          }
        }

        if (insignificantCloudyFNs.length > 0) {
          log.warn('  ☁️ Micro-eventos omitidos en Día NUBLADO (cuentan como fallo):')
          for (const fn of insignificantCloudyFNs) {
            const startStr = new Date(fn.event.startedAt).toLocaleTimeString('es-VE', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Caracas',
            })
            const endStr = new Date(fn.event.endedAt).toLocaleTimeString('es-VE', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Caracas',
            })
            const dateStr = new Date(fn.event.startedAt).toLocaleDateString('es-VE', {
              timeZone: 'America/Caracas',
            })
            const dayOfWeekLabel = fn.event.dayOfWeek ? `${fn.event.dayOfWeek} ` : ''
            const luxLabel =
              fn.avgDayLux !== null ? `${(fn.avgDayLux / 1000).toFixed(1)}klx prom` : 'N/A'

            log.warn(
              `    - [${dayOfWeekLabel}${dateStr} ${startStr} - ${endStr}] (${fn.durationMin.toFixed(0)} min, ${luxLabel} [${fn.dayType}]): ${fn.event.description}`,
            )
          }
        }

        if (adjustedFN === 0) {
          log.success(
            '  🎉 ¡Perfecto! El motor inferencial detectó el 100% de las lluvias reales evaluables.',
          )
        }
        log.info('════════════════════════════════════════════════════════')
      }
    }
  } catch (err) {
    log.error('Error al contrastar con la bitácora manual de lluvia:', err)
  }

  log.blank()

  await prisma.$disconnect()
  await influxClient.close()

  log.success('🎉 Reconstrucción de historial finalizada con éxito.')
}

async function rebuildPhysicalRain(startTime: Date, endTime: Date) {
  let currentEvent: { startedAt: Date; endedAt: Date; intensities: number[] } | null = null

  const BLOCK_MS = 2 * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = endTime.getTime()

  while (startMs < endMs) {
    const blockStart = new Date(startMs)
    let nextMs = startMs + BLOCK_MS

    if (nextMs > endMs) nextMs = endMs
    const blockEnd = new Date(nextMs)

    if (isCorruptTelemetryDate(blockStart)) {
      startMs = nextMs
      continue
    }

    const query = `
      SELECT time, "rain_intensity"
      FROM "environment_metrics"
      WHERE "zone" = 'EXTERIOR'
        AND time >= '${blockStart.toISOString()}'
        AND time < '${blockEnd.toISOString()}'
      ORDER BY time ASC
    `

    try {
      const stream = influxClient.query(query)

      for await (const row of stream) {
        const tDate = rowTimeToDate(row.time)
        const intensity = row.rain_intensity != null ? Number(row.rain_intensity) : 0

        if (intensity > 0) {
          if (!currentEvent) {
            currentEvent = { startedAt: tDate, endedAt: tDate, intensities: [intensity] }
          } else {
            const gap = tDate.getTime() - currentEvent.endedAt.getTime()

            if (gap > COOLDOWN_MS) {
              await savePhysicalEvent(currentEvent)
              currentEvent = { startedAt: tDate, endedAt: tDate, intensities: [intensity] }
            } else {
              currentEvent.endedAt = tDate
              currentEvent.intensities.push(intensity)
            }
          }
        } else {
          if (currentEvent) {
            const gap = tDate.getTime() - currentEvent.endedAt.getTime()

            if (gap > COOLDOWN_MS) {
              await savePhysicalEvent(currentEvent)
              currentEvent = null
            }
          }
        }
      }
    } catch (err) {
      log.error(`Error procesando bloque de lluvia física:`, err)
    }
    startMs = nextMs
  }

  if (currentEvent) {
    await savePhysicalEvent(currentEvent)
  }
}

async function rebuildInferredRain(startTime: Date, endTime: Date) {
  if (!DRY_RUN) {
    log.info(`🧹 Limpiando eventos de lluvia inferida antiguos.`)
    const deleteResult = await prisma.rainEvent.deleteMany({
      where: {
        isInfered: true,
        startedAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    })

    log.success(`🧹 Listo: Se eliminaron ${deleteResult.count} eventos.`)
  }

  let createdCount = 0

  const isWithinSolarTimeRange = (timeVal: number): boolean => {
    try {
      const d = new Date(timeVal)
      const localHour = (d.getUTCHours() - 4 + 24) % 24
      const localMin = d.getUTCMinutes()
      const totalMinutes = localHour * 60 + localMin

      return totalMinutes > 300 && totalMinutes < 1140 // 5:00 AM a 7:00 PM VET
    } catch {
      return false
    }
  }

  const BLOCK_MS = 1 * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = endTime.getTime()

  // Buffers deslizantes (tamaño 6)
  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []

  let isTelemetryRainActive = false
  let minLuxInRain: number | null = null
  let minTempInRain: number | null = null
  let minTempInRainTimestamp: number | null = null
  let maxHumInRain: number | null = null
  let baselineLux: number | null = null
  let baselineTemp: number | null = null
  let baselineHum: number | null = null
  let baselineVarTemp: number | null = null
  let baselineVarHum: number | null = null
  let baselineAgeMinutes: number | null = null
  let rainStartedAt: number | null = null
  let lastRainClosedAt: number | null = null

  let currentIntervalStartMs = 0
  let tempBuffer: Sample[] = []
  let humBuffer: Sample[] = []
  let luxBuffer: Sample[] = []

  const flushIntervalAndEvaluate = async (timestampMs: number) => {
    const isSolar = isWithinSolarTimeRange(timestampMs)
    const hasLux = luxBuffer.length >= 5 || !isSolar

    if (tempBuffer.length >= 5 && humBuffer.length >= 5 && hasLux) {
      // 🛡️ Protección de Secuencia de Batches: Si hay una lluvia activa y la telemetría se interrumpe por > 11 min
      if (isTelemetryRainActive && tempBatches.length > 0) {
        const timeGapMs = timestampMs - tempBatches[0].timestamp

        if (timeGapMs > 11 * 60 * 1000) {
          const lastValidTs = tempBatches[0].timestamp
          const gapMin = Math.round(timeGapMs / 60000)
          const endSampleT = tempBatches[0]?.samples[tempBatches[0].samples.length - 1]
          const endSampleH = humBatches[0]?.samples[humBatches[0].samples.length - 1]
          const endSampleL = luxBatches[0]?.samples[luxBatches[0].samples.length - 1]

          await closeVirtualEvent(
            new Date(lastValidTs),
            'EMA_OFFLINE',
            `Ema Desconectado: pérdida de telemetría exterior durante lluvia activa (sin datos en ${gapMin} min). Cese automático por desconexión.`,
            {
              temp: endSampleT ? endSampleT.value : (tempBatches[0]?.min ?? null),
              hum: endSampleH ? endSampleH.value : (humBatches[0]?.max ?? null),
              lux: endSampleL ? endSampleL.value : (luxBatches[0]?.min ?? null),
            },
            {
              type: 'EMA_OFFLINE',
            },
          )

          isTelemetryRainActive = false
          rainStartedAt = null
          lastRainClosedAt = timestampMs
          maxHumInRain = null
          baselineVarTemp = null
          baselineVarHum = null
          createdCount++

          // Limpiar las colas de batches para reiniciar la sincronización con el nuevo flujo de datos
          tempBatches.length = 0
          humBatches.length = 0
          luxBatches.length = 0
        }
      }

      if (luxBuffer.length < 5) {
        luxBuffer = Array(5).fill({ value: 0, timestamp: timestampMs })
      }
      pushBatchMetrics(tempBatches, tempBuffer, timestampMs)
      pushBatchMetrics(humBatches, humBuffer, timestampMs)
      pushBatchMetrics(luxBatches, luxBuffer, timestampMs, true)
    }

    tempBuffer = []
    humBuffer = []
    luxBuffer = []

    // 1. Autogenerar batches de lux de fallback si la cola está vacía o incompleta (ej: por lagunas de datos o noche)
    // para evitar TypeError en accesos directos a luxBatches[0] y bloqueos de retorno temprano.
    while (luxBatches.length < 4) {
      const refTimestamp =
        tempBatches.length > luxBatches.length
          ? tempBatches[luxBatches.length].timestamp
          : timestampMs - luxBatches.length * 10 * 60 * 1000

      luxBatches.push({
        min: 0,
        max: 0,
        timestamp: refTimestamp,
        samples: Array(10).fill({ value: 0, timestamp: refTimestamp }),
      })
    }

    if (tempBatches.length < 4 || humBatches.length < 4) return
    const currentMinTemp = tempBatches[0].min
    const currentMaxHum = humBatches[0].max
    const currentMinLux = luxBatches[0].min

    // Aislamiento Temporal Estricto por Regla de Inferencia:
    const isB1Clean = lastRainClosedAt === null || tempBatches[1].timestamp >= lastRainClosedAt
    const isB2Clean =
      lastRainClosedAt === null ||
      (tempBatches.length >= 3 && tempBatches[2].timestamp >= lastRainClosedAt)
    const isB3Clean =
      lastRainClosedAt === null ||
      (tempBatches.length >= 4 && tempBatches[3].timestamp >= lastRainClosedAt)

    const isDay = isDaytime(timestampMs)

    // Durante el día, sí requerimos que haya un lote de lux real válido para las reglas diurnas.
    // Si todos los samples son 0, significa que la cola de lux sigue siendo ficticia (sensor offline o atascado en 0 lx de día).
    if (isDay && luxBatches[0].max === 0 && luxBatches[0].samples.every((s) => s.value === 0)) {
      return
    }

    if (!isTelemetryRainActive) {
      if (lastRainClosedAt !== null && timestampMs - lastRainClosedAt < 10 * 60 * 1000) return
      if (currentMinLux >= 26000) return

      let triggered = false
      let triggerReason = ''
      let calculatedBaselineTemp: number | null = null
      let calculatedBaselineHum: number | null = null
      let calculatedBaselineLux: number | null = null
      let calculatedBaselineAgeMinutes = 10
      let triggerType: string | null = null
      let tempDeltaTemp = 0
      let tempDeltaHum = 0
      let dropPct = 0

      if (isDay && isB1Clean) {
        // Guarda de seguridad: durante el día exigimos un baseLux1 válido (lote 1 de lux con lecturas > 0)
        if (luxBatches.length < 2 || luxBatches[1].max === 0) {
          return
        }

        // --- REGLAS DIURNAS ---
        const baseTemp1 = tempBatches[1].max
        const baseHum1 = humBatches[1].min
        const baseLux1 = luxBatches[1].max
        const dTemp1 = currentMinTemp - baseTemp1
        const dHum1 = currentMaxHum - baseHum1

        let luxCondition = false
        let tempDropThreshold = -3.0
        let humRobust = 12.0
        let humSensitive = 12.0
        let isSensible = false

        if (baseLux1 <= 15000) {
          // Rama A (Cielo muy nublado: <= 15 klx)
          luxCondition = true
          tempDropThreshold = -1.5
          humRobust = 12.0
          humSensitive = 10.0
        } else if (baseLux1 <= 26000) {
          // Rama C (Cielo intermedio: 15 klx < Lux <= 26 klx)
          luxCondition = currentMinLux <= baseLux1 * 0.6
          if (currentMinLux <= 15000) {
            isSensible = true
            tempDropThreshold = -1.5
            humRobust = 10.0
            humSensitive = 8.0
          }
        } else {
          // Rama B (Cielo soleado: > 26 klx)
          luxCondition = currentMinLux <= baseLux1 * 0.4
          if (currentMinLux <= 15000) {
            isSensible = true
            tempDropThreshold = -2.0
            humRobust = 10.0
            humSensitive = 8.0
          }
        }

        const humCondition =
          dHum1 >= humSensitive || (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

        if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
          let passesGradient = true
          const isPreSaturated = baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0

          if (dHum1 < humRobust && !isPreSaturated) {
            const hSlopes = getHumGradientMetrics(humBatches[0].samples)
            const tSlopes = getTempGradientMetrics(tempBatches[0].samples)
            const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
            const hasSteepTemp = tSlopes.maxDrop1m <= -0.5

            passesGradient = hasSteepHum || hasSteepTemp
            if (!passesGradient) stats.vetos++
          }

          if (passesGradient) {
            triggered = true
            triggerReason = `Inferencia de Día (10M): Incremento de +${dHum1.toFixed(1)}% HR y caída térmica de ${Math.abs(dTemp1).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
            calculatedBaselineTemp = baseTemp1
            calculatedBaselineHum = baseHum1
            calculatedBaselineLux = baseLux1
            calculatedBaselineAgeMinutes = 10
            tempDeltaTemp = dTemp1
            tempDeltaHum = dHum1
            dropPct = baseLux1 > 0 ? ((baseLux1 - currentMinLux) / baseLux1) * 100 : 0

            if (baseLux1 <= 10000) {
              triggerType = 'DAY_RAMA_A_OSCURO_10M'
            } else if (baseLux1 <= 15000) {
              triggerType = 'DAY_RAMA_A_NUBLADO_10M'
            } else if (baseLux1 <= 26000) {
              triggerType = isSensible
                ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_10M'
                : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_10M'
            } else {
              triggerType = isSensible
                ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_10M'
                : 'DAY_RAMA_B_SOLEADO_ROBUSTO_10M'
            }
          }
        }

        if (
          !triggered &&
          isB2Clean &&
          tempBatches.length >= 3 &&
          humBatches.length >= 3 &&
          luxBatches.length >= 3
        ) {
          const baseTemp2 = tempBatches[2].max
          const baseHum2 = humBatches[2].min
          const baseLux2 = luxBatches[2].max
          const dTemp2 = currentMinTemp - baseTemp2
          const dHum2 = currentMaxHum - baseHum2

          let luxCondition2 = false
          let tempDropThreshold2 = -3.0
          let humRobust = 14.0
          let humSensitive = 14.0
          let isSensible = false

          if (baseLux2 <= 15000) {
            // Rama A (Cielo muy nublado: <= 15 klx)
            luxCondition2 = true
            tempDropThreshold2 = -2.5
            humRobust = 14.0
            humSensitive = 12.0
          } else if (baseLux2 <= 26000) {
            // Rama C (Cielo intermedio: 15 klx < Lux <= 26 klx)
            luxCondition2 = currentMinLux <= baseLux2 * 0.6
            if (currentMinLux <= 15000) {
              isSensible = true
              tempDropThreshold2 = -2.5
              humRobust = 12.0
              humSensitive = 10.0
            }
          } else {
            // Rama B (Cielo soleado: > 26 klx)
            luxCondition2 = currentMinLux <= baseLux2 * 0.4
            if (currentMinLux <= 15000) {
              isSensible = true
              tempDropThreshold2 = -3.0
              humRobust = 12.0
              humSensitive = 10.0
            }
          }

          const humCondition2 =
            dHum2 >= humSensitive || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp2 <= tempDropThreshold2 && humCondition2 && luxCondition2) {
            let passesGradient = true
            const isPreSaturated = baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0

            if (dHum2 < humRobust && !isPreSaturated) {
              const hSlopes = getHumGradientMetrics(humBatches[0].samples)
              const tSlopes = getTempGradientMetrics(tempBatches[0].samples)
              const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
              const hasSteepTemp = tSlopes.maxDrop1m <= -0.5

              passesGradient = hasSteepHum || hasSteepTemp
              if (!passesGradient) stats.vetos++
            }

            if (passesGradient) {
              triggered = true
              triggerReason = `Inferencia de Día (20M): Incremento de +${dHum2.toFixed(1)}% HR y caída térmica de ${Math.abs(dTemp2).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
              calculatedBaselineTemp = baseTemp2
              calculatedBaselineHum = baseHum2
              calculatedBaselineLux = baseLux2
              calculatedBaselineAgeMinutes = 20
              tempDeltaTemp = dTemp2
              tempDeltaHum = dHum2
              dropPct = baseLux2 > 0 ? ((baseLux2 - currentMinLux) / baseLux2) * 100 : 0

              if (baseLux2 <= 10000) {
                triggerType = 'DAY_RAMA_A_OSCURO_20M'
              } else if (baseLux2 <= 15000) {
                triggerType = 'DAY_RAMA_A_NUBLADO_20M'
              } else if (baseLux2 <= 26000) {
                triggerType = isSensible
                  ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_20M'
                  : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_20M'
              } else {
                triggerType = isSensible
                  ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_20M'
                  : 'DAY_RAMA_B_SOLEADO_ROBUSTO_20M'
              }
            }
          }

          if (
            !triggered &&
            isB3Clean &&
            tempBatches.length >= 4 &&
            humBatches.length >= 4 &&
            luxBatches.length >= 4
          ) {
            const baseTemp3 = tempBatches[3].max
            const baseHum3 = humBatches[3].min
            const baseLux3 = luxBatches[3].max
            const dTemp3 = currentMinTemp - baseTemp3
            const dHum3 = currentMaxHum - baseHum3

            let luxCondition3 = false
            let tempDropThreshold3 = -3.5
            let humRobust3 = 16.0
            let humSensitive3 = 14.0
            let isSensible = false

            if (baseLux3 <= 15000) {
              luxCondition3 = true
              tempDropThreshold3 = -3.5
              humRobust3 = 16.0
              humSensitive3 = 14.0
            } else if (baseLux3 <= 26000) {
              luxCondition3 = currentMinLux <= baseLux3 * 0.6
              if (currentMinLux <= 15000) {
                isSensible = true
                tempDropThreshold3 = -3.5
                humRobust3 = 14.0
                humSensitive3 = 12.0
              }
            } else {
              luxCondition3 = currentMinLux <= baseLux3 * 0.4
              if (currentMinLux <= 15000) {
                isSensible = true
                tempDropThreshold3 = -4.0
                humRobust3 = 14.0
                humSensitive3 = 12.0
              }
            }

            const humCondition3 =
              dHum3 >= humSensitive3 ||
              (baseHum3 >= 86.0 && baseHum3 <= 95.0 && currentMaxHum >= 98.0)

            if (dTemp3 <= tempDropThreshold3 && humCondition3 && luxCondition3) {
              let passesGradient = true
              const isPreSaturated = baseHum3 >= 86.0 && baseHum3 <= 95.0 && currentMaxHum >= 98.0

              if (dHum3 < humRobust3 && !isPreSaturated) {
                const hSlopes = getHumGradientMetrics(humBatches[0].samples)
                const tSlopes = getTempGradientMetrics(tempBatches[0].samples)
                const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
                const hasSteepTemp = tSlopes.maxDrop1m <= -0.5

                passesGradient = hasSteepHum || hasSteepTemp
                if (!passesGradient) stats.vetos++
              }

              if (passesGradient) {
                triggered = true
                triggerReason = `Inferencia de Día (30M): Incremento de +${dHum3.toFixed(1)}% HR y caída térmica de ${Math.abs(dTemp3).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
                calculatedBaselineTemp = baseTemp3
                calculatedBaselineHum = baseHum3
                calculatedBaselineLux = baseLux3
                calculatedBaselineAgeMinutes = 30
                tempDeltaTemp = dTemp3
                tempDeltaHum = dHum3
                dropPct = baseLux3 > 0 ? ((baseLux3 - currentMinLux) / baseLux3) * 100 : 0

                if (baseLux3 <= 10000) {
                  triggerType = 'DAY_RAMA_A_OSCURO_30M'
                } else if (baseLux3 <= 15000) {
                  triggerType = 'DAY_RAMA_A_NUBLADO_30M'
                } else if (baseLux3 <= 26000) {
                  triggerType = isSensible
                    ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_30M'
                    : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_30M'
                } else {
                  triggerType = isSensible
                    ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_30M'
                    : 'DAY_RAMA_B_SOLEADO_ROBUSTO_30M'
                }
              }
            }
          }
        }
      } else if (!isDay && isB3Clean) {
        // --- REGLAS NOCTURNAS (Fórmula B Calibrada + Filtro de Rocío) ---
        // Calma previa (Lotes 1, 2, 3)
        const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
        const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
        const varTempPre = maxTempPre - minTempPre

        const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
        const maxHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
        const varHumPre = maxHumPre - minHumPre

        // Bloque actual (Lotes 0, 1, 2)
        const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
        const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
        const varTempCur = maxTempCur - minTempCur

        const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
        const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
        const varHumCur = maxHumCur - minHumCur

        const tempFloor = minHumPre >= 98.0 ? 0.8 : 0.7
        const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.6)
        const humRiseThreshold = Math.max(3.0, varHumPre * 1.4)

        // Dirección y tendencias
        const trendTemp = tempBatches[0].min - tempBatches[2].max
        const isTempFalling = trendTemp < -0.1

        const trendHum = humBatches[0].max - humBatches[2].min
        const isHumRising = trendHum > 0.5

        const trendLux = luxBatches[0].max - luxBatches[1].max
        const isLuxRising = trendLux > 50 && luxBatches[0].min > 0

        const isTempDropAbrupt = varTempCur >= tempDropThreshold && isTempFalling
        const isHumRiseAbrupt = varHumCur >= humRiseThreshold && isHumRising
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

        if (isTempDropAbrupt && (isHumRiseAbrupt || (isPreSaturated && !isLuxRising))) {
          triggered = true
          calculatedBaselineTemp = tempBatches[1].max
          calculatedBaselineHum = humBatches[1].min
          calculatedBaselineLux = 0
          calculatedBaselineAgeMinutes = 10
          tempDeltaTemp = currentMinTemp - tempBatches[1].max
          tempDeltaHum = currentMaxHum - humBatches[1].min
          dropPct = 0
          triggerType = 'NIGHT_10M'

          triggerReason = `Inferencia de Noche: Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${Math.abs(tempDeltaTemp).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%)`
        }
      }

      if (triggered) {
        isTelemetryRainActive = true

        baselineLux = calculatedBaselineLux ?? luxBatches[0].max
        baselineTemp = calculatedBaselineTemp ?? tempBatches[0].max
        baselineHum = calculatedBaselineHum ?? humBatches[0].min
        baselineAgeMinutes = calculatedBaselineAgeMinutes

        if (isB3Clean && tempBatches.length >= 4 && humBatches.length >= 4) {
          const varTemp1 = tempBatches[1].max - tempBatches[1].min
          const varTemp2 = tempBatches[2].max - tempBatches[2].min
          const varTemp3 = tempBatches[3].max - tempBatches[3].min

          baselineVarTemp = Math.min(0.6, Math.max(varTemp1, varTemp2, varTemp3, 0.15))

          const varHum1 = humBatches[1].max - humBatches[1].min
          const varHum2 = humBatches[2].max - humBatches[2].min
          const varHum3 = humBatches[3].max - humBatches[3].min

          baselineVarHum = Math.min(2.0, Math.max(varHum1, varHum2, varHum3, 0.5))
        } else {
          baselineVarTemp = null
          baselineVarHum = null
        }

        let preciseStartMs = timestampMs
        const baselineT = calculatedBaselineTemp ?? tempBatches[1]?.max ?? baselineTemp
        const samplesT = tempBatches[0].samples
        // Estimación retrospectiva del inicio preciso de lluvia:
        // De día busca caída térmica de -1.2°C; de noche se ajusta a -0.20°C para absorber inercia del sensor.
        const dropThreshold = isDay ? -1.2 : -0.2
        const matchingSample = samplesT.find((s) => s.value - baselineT <= dropThreshold)

        if (matchingSample) {
          preciseStartMs = matchingSample.timestamp
        } else {
          const minSample = samplesT.reduce(
            (min, s) => (s.value < min.value ? s : min),
            samplesT[0],
          )

          if (minSample) preciseStartMs = minSample.timestamp
        }

        rainStartedAt = preciseStartMs

        minLuxInRain = luxBatches[0].min
        const startSampleT = samplesT.find((s) => s.timestamp === preciseStartMs)

        minTempInRain = startSampleT ? startSampleT.value : tempBatches[0].min
        minTempInRainTimestamp = preciseStartMs
        maxHumInRain = humBatches[0].max

        await openVirtualEvent(
          new Date(preciseStartMs),
          {
            temp: baselineTemp,
            hum: baselineHum,
            lux: baselineLux,
            ageMinutes: baselineAgeMinutes,
          },
          triggerReason,
          {
            temp: currentMinTemp,
            hum: currentMaxHum,
            lux: currentMinLux,
          },
          {
            type: triggerType,
            tempDrop: tempDeltaTemp,
            humRise: tempDeltaHum,
            luxDropPct: dropPct,
          },
        )
      }
    } else {
      // Evaluar Cese
      if (rainStartedAt !== null) {
        const durationMin = (timestampMs - rainStartedAt) / 60000

        // 1. Actualizar extremos en lluvia cronológicamente
        minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
        maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

        for (const s of tempBatches[0].samples) {
          if (s.timestamp >= (rainStartedAt ?? 0)) {
            if (minTempInRain === null || s.value < minTempInRain) {
              minTempInRain = s.value
              minTempInRainTimestamp = s.timestamp
            }
          }
        }

        let closedByRecovery = false

        if (isDay) {
          // 2. ☀️ Recuperación Solar incondicional (Día — Evaluación Deslizante 10m en 20m)
          if (minLuxInRain !== null) {
            const combinedLuxSamples: Sample[] = []

            if (luxBatches.length >= 1) combinedLuxSamples.push(...luxBatches[0].samples)
            if (luxBatches.length >= 2) combinedLuxSamples.push(...luxBatches[1].samples)

            combinedLuxSamples.sort((a, b) => a.timestamp - b.timestamp)

            let foundSolarSubWindow = false
            let solarStartMs = timestampMs
            let solarMaxLux = 0
            let solarMinLux = 0
            let solarSampleCount = 0

            if (combinedLuxSamples.length >= 3) {
              const newestTs = combinedLuxSamples[combinedLuxSamples.length - 1].timestamp
              const oldestTs = combinedLuxSamples[0].timestamp

              if (newestTs - oldestTs >= 8 * 60 * 1000) {
                for (let offsetMin = 10; offsetMin >= 0; offsetMin -= 1) {
                  const winEnd = newestTs - offsetMin * 60 * 1000
                  const winStart = winEnd - 10 * 60 * 1000

                  const subL = combinedLuxSamples.filter(
                    (s) => s.timestamp >= winStart && s.timestamp <= winEnd,
                  )

                  if (subL.length >= 3 && subL.every((s) => s.value >= 26000)) {
                    foundSolarSubWindow = true
                    solarStartMs = subL[0].timestamp
                    solarMaxLux = Math.max(...subL.map((s) => s.value))
                    solarMinLux = Math.min(...subL.map((s) => s.value))
                    solarSampleCount = subL.length
                    break
                  }
                }
              }
            }

            if (foundSolarSubWindow) {
              closedByRecovery = true
              let preciseEndMs = solarStartMs

              if (preciseEndMs < rainStartedAt) preciseEndMs = rainStartedAt

              const endSampleT =
                tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                tempBatches[0].samples[0]
              const endSampleH =
                humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                humBatches[0].samples[0]

              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs

              await closeVirtualEvent(
                new Date(preciseEndMs),
                'SOLAR_RECOVERY',
                `☀️ Recuperación Solar — Sol pleno sostenido: las ${solarSampleCount} muestras de la sub-ventana >= 26k lux (mín: ${solarMinLux.toFixed(0)} lx). Cese al inicio de la ráfaga solar.`,
                {
                  temp: endSampleT ? endSampleT.value : tempBatches[0].min,
                  hum: endSampleH ? endSampleH.value : humBatches[0].max,
                  lux: solarMinLux,
                },
                {
                  type: 'SOLAR_RECOVERY',
                  luxMax: solarMaxLux,
                },
              )
              minTempInRain = null
              minTempInRainTimestamp = null
              minLuxInRain = null
              maxHumInRain = null
              baselineTemp = null
              baselineHum = null
              baselineLux = null
              baselineVarTemp = null
              baselineVarHum = null
              createdCount++
            }
          }

          // 3. 🌤️ Recuperación Progresiva Diurna (Condicional)
          if (!closedByRecovery && baselineLux !== null && minLuxInRain !== null) {
            const preLux = baselineLux
            const minLux = minLuxInRain
            const relativeDrop = Math.min(1.0, (preLux - minLux) / preLux)
            const alpha = 1.0 - 0.65 * relativeDrop
            const luxRecoveryThreshold = minLux + alpha * (preLux - minLux)

            const currentAverageLux = luxBatches[0].max
            const currentTemp = tempBatches[0].min
            const currentHum = humBatches[0].max

            const isLuxRecovered =
              currentAverageLux >= luxRecoveryThreshold && currentAverageLux >= 15000
            const isTempRecovered = minTempInRain !== null && currentTemp >= minTempInRain + 2.0
            const isHumRecovered = maxHumInRain !== null && currentHum <= maxHumInRain - 3.0

            if (isLuxRecovered && isTempRecovered && isHumRecovered) {
              closedByRecovery = true
              const firstSample = luxBatches[0].samples[0]
              let preciseEndMs = firstSample ? firstSample.timestamp : timestampMs

              if (preciseEndMs < rainStartedAt) preciseEndMs = rainStartedAt

              const endSampleT =
                tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                tempBatches[0].samples[0]
              const endSampleH =
                humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                humBatches[0].samples[0]

              const tempRecovery = currentTemp - minTempInRain!
              const humDrop = maxHumInRain! - currentHum

              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs

              await closeVirtualEvent(
                new Date(preciseEndMs),
                'PROGRESSIVE_RECOVERY',
                `🌤️ Recuperación Progresiva — Despeje solar con validación cruzada: iluminancia promedio ${currentAverageLux.toFixed(0)} lx (umbral elástico: ${Math.round(luxRecoveryThreshold).toLocaleString()} lx) + recuperación térmica +${tempRecovery.toFixed(1)}°C desde ${minTempInRain!.toFixed(1)}°C (umbral >= 2.0°C) + caída de humedad -${humDrop.toFixed(1)}% HR desde ${maxHumInRain!.toFixed(1)}% HR (umbral >= 3.0% HR). Cese al inicio del lote de recuperación.`,
                {
                  temp: endSampleT ? endSampleT.value : currentTemp,
                  hum: endSampleH ? endSampleH.value : currentHum,
                  lux: firstSample ? firstSample.value : currentMinLux,
                },
                {
                  type: 'PROGRESSIVE_RECOVERY',
                  luxMax: currentAverageLux,
                  tempRecovery,
                  humVar: humDrop,
                },
              )
              minTempInRain = null
              minTempInRainTimestamp = null
              minLuxInRain = null
              maxHumInRain = null
              baselineTemp = null
              baselineHum = null
              baselineLux = null
              baselineVarTemp = null
              baselineVarHum = null
              createdCount++
            }
          }

          // 4. ☁️ Cese por Variación Térmica Diurna
          if (!closedByRecovery && minTempInRain !== null && minTempInRainTimestamp !== null) {
            const caracasHour = getCaracasHour(timestampMs)
            const isAfternoonOrNight = caracasHour >= 16 || caracasHour < 7
            const isSaturated = humBatches[0].max >= 96.0
            const minRecoveryRequired = !isAfternoonOrNight && isSaturated ? 1.2 : 0.6

            // Solo evaluar muestras que ocurrieron ESTRICTAMENTE DESPUÉS de haber tocado el mínimo de temperatura
            const recoverySamples = tempBatches[0].samples.filter(
              (s) => s.timestamp > minTempInRainTimestamp! && s.timestamp >= rainStartedAt!,
            )

            const matchingEndSample = recoverySamples.find(
              (s) => s.value >= minTempInRain! + minRecoveryRequired,
            )

            if (matchingEndSample) {
              closedByRecovery = true
              const preciseEndMs = matchingEndSample.timestamp
              const tempRecovery = matchingEndSample.value - minTempInRain!

              const endSampleT = matchingEndSample
              const endSampleH =
                humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                humBatches[0].samples[humBatches[0].samples.length - 1]
              const endSampleL =
                luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                luxBatches[0].samples[luxBatches[0].samples.length - 1]

              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs

              const minTempBeforeReset = minTempInRain

              minTempInRain = null
              minTempInRainTimestamp = null
              minLuxInRain = null
              maxHumInRain = null
              baselineTemp = null
              baselineHum = null
              baselineLux = null
              baselineVarTemp = null
              baselineVarHum = null

              const closeReasonText = `🌡️ Cese de Lluvia Intermitente (Variación Térmica): la temperatura se recuperó +${tempRecovery.toFixed(2)}°C (Temp: ${endSampleT.value.toFixed(1)}°C vs mínimo en lluvia: ${minTempBeforeReset.toFixed(1)}°C, Hum: ${tempBatches[0].max.toFixed(1)}% HR, Lux: ${currentMinLux.toFixed(0)} lx)`

              await closeVirtualEvent(
                new Date(preciseEndMs),
                'THERMAL_VARIATION',
                closeReasonText,
                {
                  temp: endSampleT ? endSampleT.value : tempBatches[0].max,
                  hum: endSampleH ? endSampleH.value : tempBatches[0].max,
                  lux: endSampleL ? endSampleL.value : currentMinLux,
                },
                {
                  type: 'THERMAL_VARIATION',
                  minTemp: minTempBeforeReset,
                  tempRecovery,
                },
              )
              createdCount++
            }
          }
        }

        if (closedByRecovery) return

        // 5. ☁️ Cese por Estancamiento — Día y Noche (Fallback de Última Instancia)
        if (durationMin >= 10 && tempBatches.length >= 1 && humBatches.length >= 1) {
          const tSamples = tempBatches[0].samples
          const hSamples = humBatches[0].samples

          const firstTemp = tSamples[0]?.value ?? tempBatches[0].min
          const lastTemp = tSamples[tSamples.length - 1]?.value ?? tempBatches[0].min
          const netTempDrop = firstTemp - lastTemp
          const diffTemp = netTempDrop

          const firstHum = hSamples[0]?.value ?? humBatches[0].min
          const lastHum = hSamples[hSamples.length - 1]?.value ?? humBatches[0].max
          const netHumRise = lastHum - firstHum
          const diffHum = netHumRise

          const tempCeseThreshold =
            baselineVarTemp !== null ? Math.min(0.8, Math.max(0.4, 1.2 * baselineVarTemp)) : 0.4
          const humCeseThreshold =
            baselineVarHum !== null ? Math.min(2.5, Math.max(1.0, 1.2 * baselineVarHum)) : 1.0

          const isSaturated = humBatches[0].max >= 100.0
          const isHumStagnant = isSaturated ? true : netHumRise <= humCeseThreshold
          const isTempStagnant = netTempDrop <= tempCeseThreshold

          if (isHumStagnant && isTempStagnant) {
            let allowStagnantClose = true

            // 🛡️ Protección Térmica (Siempre 20 minutos de B0+B1)
            if (tempBatches.length >= 2) {
              const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)
              const caidaNeta20 = maxTemp20 - tempBatches[0].min

              allowStagnantClose = caidaNeta20 <= 0.4
            }

            if (allowStagnantClose) {
              let preciseEndMs = tSamples[tSamples.length - 1]?.timestamp ?? timestampMs

              if (activeVirtualEvent && preciseEndMs < activeVirtualEvent.startedAt.getTime()) {
                preciseEndMs = activeVirtualEvent.startedAt.getTime()
              }

              const endSampleT =
                tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                tempBatches[0].samples[tempBatches[0].samples.length - 1]
              const endSampleH =
                humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                humBatches[0].samples[humBatches[0].samples.length - 1]
              const endSampleL =
                luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
                luxBatches[0].samples[luxBatches[0].samples.length - 1]

              const isSustained = durationMin >= 60
              const hours = Math.floor(durationMin / 60)
              const minutes = Math.round(durationMin % 60)
              const durationStr =
                hours > 0
                  ? minutes > 0
                    ? `${hours}h ${minutes}min`
                    : `${hours}h`
                  : `${minutes}min`

              const closeReasonText = isSustained
                ? isDay
                  ? `☀️ Cese de Lluvia Intermitente (Estancamiento): estabilidad climática alcanzada tras lluvia prolongada (duración: ${durationStr}). Sin variación significativa de temperatura (variación ≤ ${tempCeseThreshold.toFixed(1)}°C) ni humedad (variación ≤ ${humCeseThreshold.toFixed(1)}% HR) durante 10 minutos (dT=${diffTemp.toFixed(1)}°C, dH=${diffHum.toFixed(1)}% HR, Temp: ${endSampleT.value.toFixed(1)}°C, Hum: ${endSampleH.value.toFixed(1)}% HR).`
                  : `☁️ Cese de Lluvia Intermitente (Estancamiento Nocturno): estabilidad climática alcanzada tras lluvia prolongada (duración: ${durationStr}). Sin variación significativa de temperatura (variación ≤ ${tempCeseThreshold.toFixed(1)}°C) ni humedad (variación ≤ ${humCeseThreshold.toFixed(1)}% HR) durante 10 minutos (dT=${diffTemp.toFixed(1)}°C, dH=${diffHum.toFixed(1)}% HR, Temp: ${endSampleT.value.toFixed(1)}°C, Hum: ${endSampleH.value.toFixed(1)}% HR).`
                : `Estancamiento climático dinámico: sin fluctuación de temperatura (variación ≤ ${tempCeseThreshold.toFixed(1)}°C) ni humedad (variación ≤ ${humCeseThreshold.toFixed(1)}% HR) durante 10 minutos (dT=${diffTemp.toFixed(1)}°C, dH=${diffHum.toFixed(1)}% HR, Temp: ${tempBatches[0].min.toFixed(1)}°C, Hum: ${tempBatches[0].max.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`

              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs

              const createdEvent = await closeVirtualEvent(
                new Date(preciseEndMs),
                'STAGNANT',
                closeReasonText,
                {
                  temp: endSampleT ? endSampleT.value : currentMinTemp,
                  hum: endSampleH ? endSampleH.value : currentMaxHum,
                  lux: endSampleL ? endSampleL.value : currentMinLux,
                },
                {
                  type: isDay ? 'STAGNANT_DAY' : 'STAGNANT_NIGHT',
                  tempVar: diffTemp,
                  humVar: diffHum,
                },
              )

              // Si fue Lluvia Intermitente prolongada, actualizamos el triggerReason en Postgres retroactivamente
              if (isSustained && createdEvent && createdEvent.id) {
                try {
                  const originalReason = createdEvent.triggerReason || ''
                  const newReason = originalReason.startsWith('Lluvia Intermitente')
                    ? originalReason
                    : `Lluvia Intermitente: ${originalReason}`

                  await prisma.rainEvent.update({
                    where: { id: createdEvent.id },
                    data: { triggerReason: newReason },
                  })
                } catch {
                  // Silencioso
                }
              }

              minTempInRain = null
              minLuxInRain = null
              maxHumInRain = null
              baselineTemp = null
              baselineHum = null
              baselineLux = null
              baselineVarTemp = null
              baselineVarHum = null
              createdCount++

              return
            }
          }
        }
      }
    }
  }

  while (startMs < endMs) {
    const blockStart = new Date(startMs)
    let nextMs = startMs + BLOCK_MS

    if (nextMs > endMs) nextMs = endMs
    const blockEnd = new Date(nextMs)

    if (isCorruptTelemetryDate(blockStart)) {
      startMs = nextMs
      continue
    }

    const query = `
      SELECT time, temperature, humidity, illuminance
      FROM "environment_metrics"
      WHERE "zone" = 'EXTERIOR'
        AND time >= '${blockStart.toISOString()}'
        AND time < '${blockEnd.toISOString()}'
      ORDER BY time ASC
    `

    try {
      const stream = influxClient.query(query)

      for await (const row of stream) {
        const tDate = rowTimeToDate(row.time)
        const tMs = tDate.getTime()

        if (currentIntervalStartMs === 0) {
          currentIntervalStartMs = tMs
        }

        const hasEnoughSamples = tempBuffer.length >= 10 && humBuffer.length >= 10
        const isTimeWindowExceeded = tMs - currentIntervalStartMs >= BATCH_INTERVAL_MS

        if (hasEnoughSamples || isTimeWindowExceeded) {
          await flushIntervalAndEvaluate(currentIntervalStartMs)
          currentIntervalStartMs = tMs
        }

        if (row.temperature != null) {
          const tVal = Number(row.temperature)

          if (tVal > 5.0 && tVal < 55.0) tempBuffer.push({ value: tVal, timestamp: tMs })
        }
        if (row.humidity != null) {
          const hVal = Number(row.humidity)

          if (hVal > 10.0 && hVal <= 100.0) humBuffer.push({ value: hVal, timestamp: tMs })
        }
        if (row.illuminance != null) {
          const lVal = Number(row.illuminance)

          if (lVal >= 0) luxBuffer.push({ value: lVal, timestamp: tMs })
        } else {
          const sampleHour = (tDate.getUTCHours() - 4 + 24) % 24

          if (sampleHour >= 19 || sampleHour < 5) {
            luxBuffer.push({ value: 0, timestamp: tMs })
          }
        }
      }
    } catch (err) {
      log.error(`Error procesando bloque de inferencia:`, err)
    }

    startMs = nextMs
  }

  if (tempBuffer.length > 0 || humBuffer.length > 0 || luxBuffer.length > 0) {
    await flushIntervalAndEvaluate(currentIntervalStartMs)
  }

  if (activeVirtualEvent) {
    const lastValidTs = tempBatches[0]?.timestamp || currentIntervalStartMs || Date.now()
    const timeSinceLastSample = Date.now() - lastValidTs

    if (timeSinceLastSample > 11 * 60 * 1000) {
      const gapMin = Math.round(timeSinceLastSample / 60000)
      const endSampleT = tempBatches[0]?.samples[tempBatches[0].samples.length - 1]
      const endSampleH = humBatches[0]?.samples[humBatches[0].samples.length - 1]
      const endSampleL = luxBatches[0]?.samples[luxBatches[0].samples.length - 1]

      await closeVirtualEvent(
        new Date(lastValidTs),
        'EMA_OFFLINE',
        `Ema Desconectado: pérdida de telemetría exterior al término del historial (sin datos en ${gapMin} min). Cese automático por desconexión.`,
        {
          temp: endSampleT ? endSampleT.value : (tempBatches[0]?.min ?? null),
          hum: endSampleH ? endSampleH.value : (humBatches[0]?.max ?? null),
          lux: endSampleL ? endSampleL.value : (luxBatches[0]?.min ?? null),
        },
        {
          type: 'EMA_OFFLINE',
        },
      )
    } else {
      await saveOpenVirtualEvent()
    }
    createdCount++
  }

  log.success(`🔮  Reconstrucción completada: ${createdCount}`)
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

function pushBatchMetrics(
  queue: BatchSummary[],
  samples: Sample[],
  timestamp: number,
  isLux = false,
) {
  const values = samples.map((s) => s.value)
  let min = Math.min(...values)
  let max = Math.max(...values)

  if (isLux && values.length > 0) {
    const sortedAsc = [...values].sort((a, b) => a - b)
    const low5 = sortedAsc.slice(0, Math.min(5, sortedAsc.length))

    min = low5.reduce((sum, val) => sum + val, 0) / low5.length

    const sortedDesc = [...values].sort((a, b) => b - a)
    const high5 = sortedDesc.slice(0, Math.min(5, sortedDesc.length))

    max = high5.reduce((sum, val) => sum + val, 0) / high5.length
  }

  queue.unshift({ min, max, timestamp, samples })
  if (queue.length > 6) queue.pop()
}

async function savePhysicalEvent(event: { startedAt: Date; endedAt: Date; intensities: number[] }) {
  let { startedAt, endedAt } = event
  const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)

  if (startedAt.getFullYear() < 2025) {
    startedAt = new Date(startedAt)
    startedAt.setFullYear(startedAt.getFullYear() + 30)
    endedAt = new Date(endedAt)
    endedAt.setFullYear(endedAt.getFullYear() + 30)
  }

  const avgIntensity = Number(
    (event.intensities.reduce((a, b) => a + b, 0) / event.intensities.length).toFixed(2),
  )
  const peakIntensity = Math.max(...event.intensities)

  if (DRY_RUN) return

  await prisma.rainEvent.upsert({
    where: {
      zone_startedAt: { zone: ZoneType.EXTERIOR, startedAt },
    },
    create: {
      startedAt,
      endedAt,
      durationSeconds,
      avgIntensity,
      peakIntensity,
      zone: ZoneType.EXTERIOR,
      isInfered: false,
      closedBy: 'REBUILD_SCRIPT',
    },
    update: {
      endedAt,
      durationSeconds,
      avgIntensity,
      peakIntensity,
      closedBy: 'REBUILD_SCRIPT',
    },
  })
}

let activeVirtualEvent: {
  startedAt: Date
  baselineTemp: number | null
  baselineHum: number | null
  baselineLux: number | null
  baselineAgeMinutes: number | null
  triggerReason: string
  startTemp?: number | null
  startHum?: number | null
  startLux?: number | null
  triggerType?: string | null
  triggerTempDrop?: number | null
  triggerHumRise?: number | null
  triggerLuxDropPct?: number | null
} | null = null

async function openVirtualEvent(
  startedAt: Date,
  baselines: {
    temp: number | null
    hum: number | null
    lux: number | null
    ageMinutes: number | null
  },
  triggerReason: string,
  startMetrics?: {
    temp: number | null
    hum: number | null
    lux: number | null
  },
  triggerData?: {
    type: string | null
    tempDrop: number | null
    humRise: number | null
    luxDropPct: number | null
  },
) {
  let cleanStart = startedAt

  if (cleanStart.getFullYear() < 2025) {
    cleanStart = new Date(cleanStart)
    cleanStart.setFullYear(cleanStart.getFullYear() + 30)
  }

  activeVirtualEvent = {
    startedAt: cleanStart,
    baselineTemp: baselines.temp,
    baselineHum: baselines.hum,
    baselineLux: baselines.lux,
    baselineAgeMinutes: baselines.ageMinutes,
    triggerReason,
    startTemp: startMetrics?.temp ?? null,
    startHum: startMetrics?.hum ?? null,
    startLux: startMetrics?.lux ?? null,
    triggerType: triggerData?.type ?? null,
    triggerTempDrop: triggerData?.tempDrop ?? null,
    triggerHumRise: triggerData?.humRise ?? null,
    triggerLuxDropPct: triggerData?.luxDropPct ?? null,
  }

  if (triggerData?.type) {
    stats.totalInferred++
    stats.triggers[triggerData.type] = (stats.triggers[triggerData.type] || 0) + 1
  }
}

async function saveOpenVirtualEvent() {
  if (!activeVirtualEvent) return null

  let cleanStart = activeVirtualEvent.startedAt

  if (cleanStart.getFullYear() < 2025) {
    cleanStart = new Date(cleanStart)
    cleanStart.setFullYear(cleanStart.getFullYear() + 30)
  }

  if (DRY_RUN) {
    activeVirtualEvent = null

    return null
  }

  const record = await prisma.rainEvent.upsert({
    where: {
      zone_startedAt: { zone: ZoneType.EXTERIOR, startedAt: cleanStart },
    },
    create: {
      startedAt: cleanStart,
      endedAt: null,
      zone: ZoneType.EXTERIOR,
      isInfered: true,
      baselineTemp: activeVirtualEvent.baselineTemp,
      baselineHum: activeVirtualEvent.baselineHum,
      baselineLux: activeVirtualEvent.baselineLux,
      baselineAgeMinutes: activeVirtualEvent.baselineAgeMinutes,
      triggerReason: activeVirtualEvent.triggerReason,
      startTemp: activeVirtualEvent.startTemp ?? null,
      startHum: activeVirtualEvent.startHum ?? null,
      startLux: activeVirtualEvent.startLux ?? null,
      triggerType: activeVirtualEvent.triggerType ?? null,
      triggerTempDrop: activeVirtualEvent.triggerTempDrop ?? null,
      triggerHumRise: activeVirtualEvent.triggerHumRise ?? null,
      triggerLuxDropPct: activeVirtualEvent.triggerLuxDropPct ?? null,
    },
    update: {
      endedAt: null,
    },
  })

  activeVirtualEvent = null

  return record
}

async function closeVirtualEvent(
  endedAt: Date,
  closeType: string,
  closeReason: string,
  endMetrics?: {
    temp: number | null
    hum: number | null
    lux: number | null
  },
  closeData?: {
    type: string | null
    minTemp?: number | null
    tempRecovery?: number | null
    tempVar?: number | null
    humVar?: number | null
    luxMax?: number | null
  },
) {
  if (!activeVirtualEvent) return null

  if (closeType) {
    stats.closes[closeType] = (stats.closes[closeType] || 0) + 1
  }

  let cleanEnd = endedAt

  if (cleanEnd.getFullYear() < 2025) {
    cleanEnd = new Date(cleanEnd)
    cleanEnd.setFullYear(cleanEnd.getFullYear() + 30)
  }

  const durationSeconds = Math.round(
    (cleanEnd.getTime() - activeVirtualEvent.startedAt.getTime()) / 1000,
  )

  // Guardar en memoria para contraste comparativo
  inferredEventsForComparison.push({
    startedAt: activeVirtualEvent.startedAt,
    endedAt: cleanEnd,
  })

  if (DRY_RUN) {
    activeVirtualEvent = null

    return null
  }

  const record = await prisma.rainEvent.upsert({
    where: {
      zone_startedAt: { zone: ZoneType.EXTERIOR, startedAt: activeVirtualEvent.startedAt },
    },
    create: {
      startedAt: activeVirtualEvent.startedAt,
      endedAt: cleanEnd,
      durationSeconds: durationSeconds > 0 ? durationSeconds : 60,
      zone: ZoneType.EXTERIOR,
      isInfered: true,
      baselineTemp: activeVirtualEvent.baselineTemp,
      baselineHum: activeVirtualEvent.baselineHum,
      baselineLux: activeVirtualEvent.baselineLux,
      baselineAgeMinutes: activeVirtualEvent.baselineAgeMinutes,
      triggerReason: activeVirtualEvent.triggerReason,
      closeReason,
      closedBy: `REBUILD_SCRIPT_${closeType}`,
      startTemp: activeVirtualEvent.startTemp ?? null,
      startHum: activeVirtualEvent.startHum ?? null,
      startLux: activeVirtualEvent.startLux ?? null,
      endTemp: endMetrics?.temp ?? null,
      endHum: endMetrics?.hum ?? null,
      endLux: endMetrics?.lux ?? null,
      triggerType: activeVirtualEvent.triggerType ?? null,
      triggerTempDrop: activeVirtualEvent.triggerTempDrop ?? null,
      triggerHumRise: activeVirtualEvent.triggerHumRise ?? null,
      triggerLuxDropPct: activeVirtualEvent.triggerLuxDropPct ?? null,
      closeType: closeData?.type ?? null,
      closeMinTemp: closeData?.minTemp ?? null,
      closeTempRecovery: closeData?.tempRecovery ?? null,
      closeTempVar: closeData?.tempVar ?? null,
      closeHumVar: closeData?.humVar ?? null,
      closeLuxMax: closeData?.luxMax ?? null,
    },
    update: {
      endedAt: cleanEnd,
      durationSeconds: durationSeconds > 0 ? durationSeconds : 60,
      closeReason,
      closedBy: `REBUILD_SCRIPT_${closeType}`,
      endTemp: endMetrics?.temp ?? null,
      endHum: endMetrics?.hum ?? null,
      endLux: endMetrics?.lux ?? null,
      closeType: closeData?.type ?? null,
      closeMinTemp: closeData?.minTemp ?? null,
      closeTempRecovery: closeData?.tempRecovery ?? null,
      closeTempVar: closeData?.tempVar ?? null,
      closeHumVar: closeData?.humVar ?? null,
      closeLuxMax: closeData?.luxMax ?? null,
    },
  })

  activeVirtualEvent = null

  return record
}

main().catch((err) => {
  log.error('Error fatal en el script de reconstrucción híbrida de lluvia:', err)
  process.exit(1)
})
