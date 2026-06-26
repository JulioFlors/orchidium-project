import { prisma, ZoneType } from '@package/database'

import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

const BACKFILL_DAYS = parseInt(process.env.BACKFILL_DAYS || '30', 10)
const DRY_RUN = process.env.BACKFILL_DRY_RUN === 'true'
const COOLDOWN_MS = 15 * 60 * 1000 // 15 minutos sin lluvia para cerrar evento físico
const BATCH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutos por lote de telemetría exterior

interface InfluxSample {
  time: Date
  temperature: number | null
  humidity: number | null
  illuminance: number | null
  rain_intensity: number | null
}

interface BatchSummary {
  min: number
  max: number
  timestamp: number
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info(`  RECONSTRUCCIÓN HÍBRIDA DE HISTORIAL: ${BACKFILL_DAYS} días`)
  if (DRY_RUN) Logger.warn('  ⚠️  MODO DRY-RUN — No se escribirá en Postgres')
  Logger.info('════════════════════════════════════════════════════════')

  const now = new Date()
  const startTime = new Date(now)

  startTime.setDate(startTime.getDate() - BACKFILL_DAYS)
  startTime.setHours(0, 0, 0, 0)

  const endTime = new Date(now)

  // 1. Reconstruir Lluvia Física
  Logger.info('⚡ 1. Reconstruyendo eventos de lluvia física...')
  await rebuildPhysicalRain(startTime, endTime)

  // 2. Reconstruir Inferencia de Lluvia Virtual
  Logger.info('🔮 2. Reconstruyendo eventos de lluvia inferida (virtual)...')
  await rebuildInferredRain(startTime, endTime)

  await prisma.$disconnect()
  await influxClient.close()
  Logger.success('🎉 Reconstrucción de historial finalizada con éxito.')
}

async function rebuildPhysicalRain(startTime: Date, endTime: Date) {
  let createdCount = 0
  let currentEvent: { startedAt: Date; endedAt: Date; intensities: number[] } | null = null

  // Consultar rain_intensity en bloques de 5 días
  const BLOCK_MS = 5 * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = endTime.getTime()

  while (startMs < endMs) {
    const blockStart = new Date(startMs)
    let nextMs = startMs + BLOCK_MS

    if (nextMs > endMs) nextMs = endMs
    const blockEnd = new Date(nextMs)

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
              createdCount++
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
              createdCount++
              currentEvent = null
            }
          }
        }
      }
    } catch (err) {
      Logger.error(`Error procesando bloque de lluvia física:`, err)
    }
    startMs = nextMs
  }

  if (currentEvent) {
    await savePhysicalEvent(currentEvent)
    createdCount++
  }

  Logger.success(`Reconstrucción física completada. Eventos creados/actualizados: ${createdCount}`)
}

async function rebuildInferredRain(startTime: Date, endTime: Date) {
  let createdCount = 0
  const BLOCK_MS = 5 * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = endTime.getTime()

  // Buffers deslizantes del simulador del Scheduler (tamaño 6)
  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []

  let isTelemetryRainActive = false
  let minLuxInRain: number | null = null
  let minTempInRain: number | null = null
  let maxHumInRain: number | null = null
  let baselineLux: number | null = null
  let baselineTemp: number | null = null
  let baselineHum: number | null = null
  let rainStartedAt: number | null = null
  let lastRainClosedAt: number | null = null

  // Variables auxiliares para acumular muestras dentro de cada intervalo de 10 min
  let currentIntervalStartMs = 0
  let tempBuffer: number[] = []
  let humBuffer: number[] = []
  let luxBuffer: number[] = []

  const flushIntervalAndEvaluate = async (timestampMs: number) => {
    if (tempBuffer.length > 0) pushBatchMetrics(tempBatches, tempBuffer, timestampMs)
    if (humBuffer.length > 0) pushBatchMetrics(humBatches, humBuffer, timestampMs)
    if (luxBuffer.length > 0) pushBatchMetrics(luxBatches, luxBuffer, timestampMs)

    tempBuffer = []
    humBuffer = []
    luxBuffer = []

    if (tempBatches.length < 3 || humBatches.length < 3 || luxBatches.length < 3) return

    const currentMinTemp = tempBatches[0].min
    const currentMaxHum = humBatches[0].max
    const currentMinLux = luxBatches[0].min

    const date = new Date(timestampMs)
    const caracasHour = (date.getUTCHours() - 4 + 24) % 24
    const isDay = caracasHour >= 8 && caracasHour < 16

    if (!isTelemetryRainActive) {
      if (lastRainClosedAt !== null && timestampMs - lastRainClosedAt < 15 * 60 * 1000) return

      let triggered = false
      let tempBaselineAgeMinutes = 20
      let tempDeltaTemp = 0
      let tempDeltaHum = 0
      let dropPct = 0

      // Paso 1 (20 minutos): Compara el lote actual con el lote inmediatamente previo (datos de hace 10–20 min)
      const baseTemp1 = tempBatches[1].max
      const baseHum1 = humBatches[1].min
      const baseLux1 = luxBatches[1].max
      const dTemp1 = currentMinTemp - baseTemp1
      const dHum1 = currentMaxHum - baseHum1

      if (isDay) {
        let luxCondition = true

        if (baseLux1 > 10000) {
          luxCondition = currentMinLux < baseLux1 * 0.4
        }
        const humCondition =
          dHum1 >= 12.0 || (baseHum1 >= 88.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

        if (dTemp1 <= -3.0 && humCondition && luxCondition) {
          triggered = true
          tempBaselineAgeMinutes = 20
          tempDeltaTemp = dTemp1
          tempDeltaHum = dHum1
          dropPct = baseLux1 > 0 ? ((baseLux1 - currentMinLux) / baseLux1) * 100 : 0
        }
      } else {
        const humCondition =
          dHum1 >= 10.0 || (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

        if (dTemp1 <= -2.0 && humCondition) {
          triggered = true
          tempBaselineAgeMinutes = 20
          tempDeltaTemp = dTemp1
          tempDeltaHum = dHum1
        }
      }

      // Paso 2 (30 minutos): Si no se cumple para 20 min, compara el lote actual con el lote anterior (datos de hace 20–30 min)
      if (!triggered) {
        const baseTemp2 = tempBatches[2].max
        const baseHum2 = humBatches[2].min
        const baseLux2 = luxBatches[2].max
        const dTemp2 = currentMinTemp - baseTemp2
        const dHum2 = currentMaxHum - baseHum2

        if (isDay) {
          let luxCondition = true

          if (baseLux2 > 10000) {
            luxCondition = currentMinLux < baseLux2 * 0.4
          }
          const humCondition =
            dHum2 >= 12.0 || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp2 <= -3.0 && humCondition && luxCondition) {
            triggered = true
            tempBaselineAgeMinutes = 30
            tempDeltaTemp = dTemp2
            tempDeltaHum = dHum2
            dropPct = baseLux2 > 0 ? ((baseLux2 - currentMinLux) / baseLux2) * 100 : 0
          }
        } else {
          const humCondition =
            dHum2 >= 10.0 || (baseHum2 >= 90.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp2 <= -2.0 && humCondition) {
            triggered = true
            tempBaselineAgeMinutes = 30
            tempDeltaTemp = dTemp2
            tempDeltaHum = dHum2
          }
        }
      }

      if (triggered) {
        isTelemetryRainActive = true
        rainStartedAt = timestampMs

        // Optimización de baselines: extraídos del lote [0] (hace 10 min de inicio real)
        baselineLux = luxBatches[0].max
        baselineTemp = tempBatches[0].max
        baselineHum = humBatches[0].min

        // Extremos de lluvia inicializados con el lote [0] actual
        minLuxInRain = luxBatches[0].min
        minTempInRain = tempBatches[0].min
        maxHumInRain = humBatches[0].max

        if (isDay) {
          const triggerReason = `Inferencia de Día: Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${tempDeltaTemp.toFixed(1)}°C en ${tempBaselineAgeMinutes}m (iluminancia cayó un ${dropPct.toFixed(0)}% a ${Math.round(currentMinLux).toLocaleString()} lx).`

          await openVirtualEvent(
            new Date(timestampMs),
            {
              temp: baselineTemp,
              hum: baselineHum,
              lux: baselineLux,
              ageMinutes: 10, // Sincronizado a hace 10min (lote [0])
            },
            triggerReason,
          )
        } else {
          const triggerReason = `Inferencia de Noche: Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${tempDeltaTemp.toFixed(1)}°C en ${tempBaselineAgeMinutes}m.`

          await openVirtualEvent(
            new Date(timestampMs),
            {
              temp: baselineTemp,
              hum: baselineHum,
              lux: baselineLux,
              ageMinutes: 10, // Sincronizado a hace 10min (lote [0])
            },
            triggerReason,
          )
        }
      }
    } else {
      // Si ya está lloviendo, evaluar el cierre
      if (rainStartedAt !== null) {
        const durationMin = (timestampMs - rainStartedAt) / 60000

        // 1. Timeout Absoluto (120 minutos)
        if (durationMin >= 120) {
          isTelemetryRainActive = false
          lastRainClosedAt = timestampMs
          await closeVirtualEvent(
            new Date(timestampMs),
            'TIMEOUT',
            'Lluvia finalizada tras timeout absoluto de 120 minutos.',
          )
          maxHumInRain = null
          createdCount++

          return
        }

        // 2. Atascamiento de Variables tras 60 minutos
        if (durationMin >= 60 && tempBatches.length >= 6 && humBatches.length >= 6) {
          const recentTemp = tempBatches.slice(0, 6)
          const recentHum = humBatches.slice(0, 6)

          const diffHum =
            Math.max(...recentHum.map((b) => b.max)) - Math.min(...recentHum.map((b) => b.min))
          const diffTemp =
            Math.max(...recentTemp.map((b) => b.max)) - Math.min(...recentTemp.map((b) => b.min))

          if (diffHum <= 1.0 && diffTemp <= 0.4) {
            isTelemetryRainActive = false
            lastRainClosedAt = timestampMs
            await closeVirtualEvent(
              new Date(timestampMs),
              'STAGNANT',
              `Estancamiento térmico (variación ≤0.4°C) e hídrico (variación ≤1.0% HR) en los últimos 60 minutos.`,
            )
            maxHumInRain = null
            createdCount++

            return
          }
        }

        minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
        minTempInRain = Math.min(minTempInRain ?? currentMinTemp, currentMinTemp)
        maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

        if (isDay) {
          // 3. Recuperación Térmica e Hídrica Adaptativa (Día)
          if (
            baselineTemp !== null &&
            baselineHum !== null &&
            minTempInRain !== null &&
            maxHumInRain !== null
          ) {
            const currentTemp = tempBatches[0].max
            const currentHum = humBatches[0].min

            const tempDrop = baselineTemp - minTempInRain
            const humRise = maxHumInRain - baselineHum

            // Umbrales adaptativos proporcionales: recuperar el 35% de la caída térmica y secar el 15% del alza hídrica
            const tempThreshold = minTempInRain + Math.max(0.6, tempDrop * 0.35)
            const humThreshold = maxHumInRain - Math.max(2.0, humRise * 0.15)

            const tempRecovered = currentTemp >= tempThreshold
            const humRecovered = currentHum <= humThreshold

            if (tempRecovered && humRecovered) {
              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs
              await closeVirtualEvent(
                new Date(timestampMs),
                'BASELINE_RECOVERY',
                `Cese de lluvia (térmico/hídrico): temperatura subió a ${currentTemp.toFixed(1)}°C (superó el umbral adaptativo de ${tempThreshold.toFixed(1)}°C tras una caída de ${tempDrop.toFixed(1)}°C) y humedad bajó a ${currentHum.toFixed(1)}% (por debajo del umbral de ${humThreshold.toFixed(1)}% tras subir a ${maxHumInRain.toFixed(1)}% HR).`,
              )
              maxHumInRain = null
              createdCount++

              return
            }
          }

          // 4. Recuperación solar adaptativa por despeje (Día)
          if (baselineLux !== null) {
            const preLux = baselineLux
            const minLux = minLuxInRain ?? currentMinLux
            const relativeDrop = Math.min(1.0, (preLux - minLux) / preLux)
            const alpha = 1.0 - 0.65 * relativeDrop
            const luxRecoveryThreshold = minLux + alpha * (preLux - minLux)

            const currentMaxLux = luxBatches[0].max

            if (currentMaxLux >= luxRecoveryThreshold) {
              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs
              await closeVirtualEvent(
                new Date(timestampMs),
                'SOLAR_RECOVERY',
                `Despeje solar: iluminancia subió a ${Math.round(currentMaxLux).toLocaleString()} lx (superó el umbral adaptativo de ${Math.round(luxRecoveryThreshold).toLocaleString()} lx, requiriendo un ${Math.round(alpha * 100)}% de recuperación de la caída de luz de ${Math.round(preLux - minLux).toLocaleString()} lx).`,
              )
              maxHumInRain = null
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

        // Si pasaron 10 minutos, flusheamos y evaluamos
        if (tMs - currentIntervalStartMs >= BATCH_INTERVAL_MS) {
          await flushIntervalAndEvaluate(currentIntervalStartMs)
          currentIntervalStartMs = tMs
        }

        if (row.temperature != null) {
          const tVal = Number(row.temperature)

          if (tVal > 5.0 && tVal < 55.0) tempBuffer.push(tVal)
        }
        if (row.humidity != null) {
          const hVal = Number(row.humidity)

          if (hVal > 10.0 && hVal <= 100.0) humBuffer.push(hVal)
        }
        if (row.illuminance != null) {
          const lVal = Number(row.illuminance)

          if (lVal >= 0) luxBuffer.push(lVal)
        }
      }
    } catch (err) {
      Logger.error(`Error procesando bloque de inferencia:`, err)
    }

    startMs = nextMs
  }

  // Flush final si quedaron muestras
  if (tempBuffer.length > 0 || humBuffer.length > 0 || luxBuffer.length > 0) {
    await flushIntervalAndEvaluate(currentIntervalStartMs)
  }

  Logger.success(
    `Reconstrucción de inferencia completada. Eventos virtuales creados/actualizados: ${createdCount}`,
  )
}

// ---- Helpers de Datos ----

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

function pushBatchMetrics(queue: BatchSummary[], values: number[], timestamp: number) {
  const min = Math.min(...values)
  const max = Math.max(...values)

  queue.unshift({ min, max, timestamp })
  if (queue.length > 6) queue.pop()
}

async function savePhysicalEvent(event: { startedAt: Date; endedAt: Date; intensities: number[] }) {
  let { startedAt, endedAt } = event
  let durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)

  if (durationSeconds <= 0) durationSeconds = 60

  // 1. Saneamiento automático de Timestamps (Epoch de MicroPython)
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

// Variables temporales para el rastreo del evento virtual abierto durante el simulador
let activeVirtualEvent: {
  startedAt: Date
  baselineTemp: number | null
  baselineHum: number | null
  baselineLux: number | null
  baselineAgeMinutes: number | null
  triggerReason: string
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
) {
  // Saneamiento de epoch si es necesario
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
  }
}

async function closeVirtualEvent(endedAt: Date, closeType: string, closeReason: string) {
  if (!activeVirtualEvent) return

  let cleanEnd = endedAt

  if (cleanEnd.getFullYear() < 2025) {
    cleanEnd = new Date(cleanEnd)
    cleanEnd.setFullYear(cleanEnd.getFullYear() + 30)
  }

  const durationSeconds = Math.round(
    (cleanEnd.getTime() - activeVirtualEvent.startedAt.getTime()) / 1000,
  )

  if (DRY_RUN) {
    activeVirtualEvent = null

    return
  }

  await prisma.rainEvent.upsert({
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
    },
    update: {
      endedAt: cleanEnd,
      durationSeconds: durationSeconds > 0 ? durationSeconds : 60,
      closeReason,
      closedBy: `REBUILD_SCRIPT_${closeType}`,
    },
  })

  activeVirtualEvent = null
}

main().catch((err) => {
  Logger.error('Error fatal en el script de reconstrucción híbrida de lluvia:', err)
  process.exit(1)
})
