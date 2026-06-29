import { prisma, ZoneType } from '@package/database'
import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

const BACKFILL_DAYS = parseInt(process.env.BACKFILL_DAYS || '36', 10) // Seteamos por defecto 36 días para cubrir holgadamente desde el 25 de Mayo
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

  const BLOCK_MS = 2 * 24 * 3600 * 1000
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
  if (!DRY_RUN) {
    Logger.info(`🧹 Purgando eventos de lluvia inferida antiguos de Postgres (Rango: ${startTime.toISOString()} - ${endTime.toISOString()})...`)
    const deleteResult = await prisma.rainEvent.deleteMany({
      where: {
        isInfered: true,
        startedAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    })
    Logger.success(`🧹 Purgado completo: Se eliminaron ${deleteResult.count} eventos virtuales antiguos.`)
  }

  let createdCount = 0
  const BLOCK_MS = 2 * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = endTime.getTime()

  // Buffers deslizantes (tamaño 6)
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

    if (tempBatches.length < 4 || humBatches.length < 4 || luxBatches.length < 4) return

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
      let triggerReason = ''

      if (isDay) {
        // --- REGLAS DIURNAS ---
        const baseTemp1 = tempBatches[1].max
        const baseHum1 = humBatches[1].min
        const baseLux1 = luxBatches[1].max
        const dTemp1 = currentMinTemp - baseTemp1
        const dHum1 = currentMaxHum - baseHum1

        let luxCondition = true
        let tempDropThreshold = -3.0
        let humRiseThreshold = 10.0

        if (baseLux1 <= 10000) {
          luxCondition = true
          tempDropThreshold = -1.2
          humRiseThreshold = 4.0
        } else {
          luxCondition = currentMinLux < baseLux1 * 0.4
        }

        const humCondition =
          dHum1 >= humRiseThreshold || (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

        if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
          triggered = true
          triggerReason = `Inferencia de Día: Incremento de +${dHum1.toFixed(1)}% HR y caída térmica de ${Math.abs(dTemp1).toFixed(1)}°C`
          tempBaselineAgeMinutes = 20
          tempDeltaTemp = dTemp1
          tempDeltaHum = dHum1
          dropPct = baseLux1 > 0 ? ((baseLux1 - currentMinLux) / baseLux1) * 100 : 0
        }

        if (!triggered) {
          const baseTemp2 = tempBatches[2].max
          const baseHum2 = humBatches[2].min
          const baseLux2 = luxBatches[2].max
          const dTemp2 = currentMinTemp - baseTemp2
          const dHum2 = currentMaxHum - baseHum2

          let luxCondition2 = true
          let tempDropThreshold2 = -3.0
          let humRiseThreshold2 = 12.0

          if (baseLux2 <= 10000) {
            luxCondition2 = true
            tempDropThreshold2 = -1.2
            humRiseThreshold2 = 4.0
          } else {
            luxCondition2 = currentMinLux < baseLux2 * 0.4
          }

          const humCondition2 =
            dHum2 >= humRiseThreshold2 || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp2 <= tempDropThreshold2 && humCondition2 && luxCondition2) {
            triggered = true
            triggerReason = `Inferencia de Día: Incremento de +${dHum2.toFixed(1)}% HR y caída térmica de ${Math.abs(dTemp2).toFixed(1)}°C`
            tempBaselineAgeMinutes = 30
            tempDeltaTemp = dTemp2
            tempDeltaHum = dHum2
            dropPct = baseLux2 > 0 ? ((baseLux2 - currentMinLux) / baseLux2) * 100 : 0
          }
        }
      } else {
        // --- REGLAS NOCTURNAS (Fórmula B Calibrada + Filtro de Rocío 98.0%) ---
        const maxTempPreAll = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
        const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
        const varTempPre = maxTempPreAll - Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
        const varHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max) - minHumPreAll

        const currentTempDrop = maxTempPreAll - currentMinTemp
        const currentHumRise = currentMaxHum - minHumPreAll

        const tempFloor = minHumPreAll >= 98.0 ? 0.50 : 0.35
        const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.8)
        const humRiseThreshold = Math.max(1.5, varHumPre * 1.6)

        const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
        const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

        if (varTempPre <= 0.6 && isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
          triggered = true
          triggerReason = `Inferencia de Noche: Caída térmica de ${currentTempDrop.toFixed(1)}°C en ${tempBaselineAgeMinutes}m.`
          tempBaselineAgeMinutes = 30
          tempDeltaTemp = -currentTempDrop
          tempDeltaHum = currentHumRise
        }
      }

      if (triggered) {
        isTelemetryRainActive = true
        rainStartedAt = timestampMs

        baselineLux = luxBatches[0].max
        baselineTemp = tempBatches[0].max
        baselineHum = humBatches[0].min

        minLuxInRain = luxBatches[0].min
        minTempInRain = tempBatches[0].min
        maxHumInRain = humBatches[0].max

        await openVirtualEvent(
          new Date(timestampMs),
          {
            temp: baselineTemp,
            hum: baselineHum,
            lux: baselineLux,
            ageMinutes: 10, // Sincronizado a hace 10m
          },
          triggerReason,
        )
      }
    } else {
      // Evaluar Cese
      if (rainStartedAt !== null) {
        const durationMin = (timestampMs - rainStartedAt) / 60000

        // 1. Cese por Estancamiento de Variables (15 min de duración mínima)
        if (durationMin >= 15) {
          const diffHum = humBatches[0].max - humBatches[0].min
          const diffTemp = tempBatches[0].max - tempBatches[0].min
          const tempCeseThreshold = 0.4
          const humCeseThreshold = 1.0

          if (diffHum <= humCeseThreshold && diffTemp <= tempCeseThreshold) {
            isTelemetryRainActive = false
            lastRainClosedAt = timestampMs
            await closeVirtualEvent(
              new Date(timestampMs),
              'STAGNANT',
              `STAGNANT (dT=${diffTemp.toFixed(1)}°C <= 0.4, dH=${diffHum.toFixed(1)}% <= 1)`,
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
          // 2. Recuperación Adaptativa (Día)
          if (baselineTemp !== null && baselineHum !== null && minTempInRain !== null && maxHumInRain !== null) {
            const currentTemp = tempBatches[0].min
            const currentHum = humBatches[0].max
            const tempDrop = baselineTemp - minTempInRain
            const humRise = maxHumInRain - baselineHum

            const tempThreshold = minTempInRain + Math.max(0.6, tempDrop * 0.35)
            const humThreshold = maxHumInRain - Math.max(2.0, humRise * 0.15)

            if (currentTemp >= tempThreshold && currentHum <= humThreshold) {
              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs
              await closeVirtualEvent(
                new Date(timestampMs),
                'BASELINE_RECOVERY',
                `BASELINE_RECOVERY (Temp: ${currentTemp.toFixed(1)}°C >= ${tempThreshold.toFixed(1)}°C, Hum: ${currentHum.toFixed(1)}% <= ${humThreshold.toFixed(1)}%)`,
              )
              maxHumInRain = null
              createdCount++
              return
            }
          }

          // 3. Recuperación Solar adaptativa (Día)
          if (baselineLux !== null && minLuxInRain !== null) {
            const preLux = baselineLux
            const minLux = minLuxInRain
            const relativeDrop = Math.min(1.0, (preLux - minLux) / preLux)
            const alpha = 1.0 - 0.65 * relativeDrop
            const luxRecoveryThreshold = minLux + alpha * (preLux - minLux)

            const currentMaxLux = luxBatches[0].max
            const lastTempDrop = tempBatches[1].max - tempBatches[0].max
            const isTempStableOrRising = lastTempDrop >= -0.2

            if (currentMaxLux >= luxRecoveryThreshold && isTempStableOrRising) {
              isTelemetryRainActive = false
              lastRainClosedAt = timestampMs
              await closeVirtualEvent(
                new Date(timestampMs),
                'SOLAR_RECOVERY',
                `SOLAR_RECOVERY (Lux max: ${currentMaxLux.toFixed(0)} lx >= ${luxRecoveryThreshold.toFixed(0)} lx)`,
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
        const sampleHour = (tDate.getUTCHours() - 4 + 24) % 24
        if (row.illuminance != null) {
          const lVal = (sampleHour < 8 || sampleHour >= 16) ? 0 : Number(row.illuminance)
          if (lVal >= 0) luxBuffer.push(lVal)
        } else if (sampleHour < 8 || sampleHour >= 16) {
          luxBuffer.push(0)
        }
      }
    } catch (err) {
      Logger.error(`Error procesando bloque de inferencia:`, err)
    }

    startMs = nextMs
  }

  if (tempBuffer.length > 0 || humBuffer.length > 0 || luxBuffer.length > 0) {
    await flushIntervalAndEvaluate(currentIntervalStartMs)
  }

  Logger.success(
    `Reconstrucción de inferencia completada. Eventos virtuales creados/actualizados: ${createdCount}`,
  )
}

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
