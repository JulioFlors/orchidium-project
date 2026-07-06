import { prisma, ZoneType } from '@package/database'

import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

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

  Logger.info('════════════════════════════════════════════════════════')
  Logger.info(`  RECONSTRUCCIÓN HÍBRIDA DE HISTORIAL`)
  Logger.info(`  Modo: ${modeText}`)
  if (DRY_RUN) Logger.warn('  ⚠️  MODO DRY-RUN — No se escribirá en Postgres')
  Logger.info('════════════════════════════════════════════════════════')

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
    Logger.info(
      `🧹 Purgando eventos de lluvia inferida antiguos de Postgres (Rango: ${startTime.toISOString()} - ${endTime.toISOString()})...`,
    )
    const deleteResult = await prisma.rainEvent.deleteMany({
      where: {
        isInfered: true,
        startedAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    })

    Logger.success(
      `🧹 Purgado completo: Se eliminaron ${deleteResult.count} eventos virtuales antiguos.`,
    )
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
  let tempBuffer: Sample[] = []
  let humBuffer: Sample[] = []
  let luxBuffer: Sample[] = []

  const flushIntervalAndEvaluate = async (timestampMs: number) => {
    const isSolar = isWithinSolarTimeRange(timestampMs)
    const hasLux = luxBuffer.length >= 5 || !isSolar

    if (tempBuffer.length >= 5 && humBuffer.length >= 5 && hasLux) {
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

    if (tempBatches.length < 4 || humBatches.length < 4 || luxBatches.length < 4) return

    const currentMinTemp = tempBatches[0].min
    const currentMaxHum = humBatches[0].max
    const currentMinLux = luxBatches[0].min

    const date = new Date(timestampMs)
    const caracasHour = (date.getUTCHours() - 4 + 24) % 24
    const isDay = caracasHour >= 8 && caracasHour < 17

    if (!isTelemetryRainActive) {
      if (lastRainClosedAt !== null && timestampMs - lastRainClosedAt < 15 * 60 * 1000) return
      if (currentMinLux >= 26000) return

      let triggered = false
      let triggerReason = ''
      let calculatedBaselineTemp: number | null = null
      let calculatedBaselineHum: number | null = null
      let calculatedBaselineLux: number | null = null

      if (isDay) {
        // --- REGLAS DIURNAS ---
        const baseTemp1 = tempBatches[1].max
        const baseHum1 = humBatches[1].min
        const baseLux1 = luxBatches[1].max
        const dTemp1 = currentMinTemp - baseTemp1
        const dHum1 = currentMaxHum - baseHum1

        let luxCondition = false
        let tempDropThreshold = -3.0
        let humRiseThreshold = 10.0

        if (baseLux1 <= 15000) {
          luxCondition = true
          tempDropThreshold = -1.2
          humRiseThreshold = 4.0
        } else if (baseLux1 <= 26000) {
          luxCondition = currentMinLux <= baseLux1 * 0.6
          if (currentMinLux <= 15000) {
            tempDropThreshold = -1.2
            humRiseThreshold = 8.0
          }
        } else {
          luxCondition = currentMinLux <= baseLux1 * 0.4
          if (currentMinLux <= 15000) {
            tempDropThreshold = -1.2
            humRiseThreshold = 8.0
          }
        }

        const humCondition =
          dHum1 >= humRiseThreshold ||
          (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

        if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
          triggered = true
          triggerReason = `Inferencia de Día: Incremento de +${dHum1.toFixed(1)}% HR y caída térmica de ${Math.abs(dTemp1).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
          calculatedBaselineTemp = baseTemp1
          calculatedBaselineHum = baseHum1
          calculatedBaselineLux = baseLux1
        }

        if (!triggered) {
          const baseTemp2 = tempBatches[2].max
          const baseHum2 = humBatches[2].min
          const baseLux2 = luxBatches[2].max
          const dTemp2 = currentMinTemp - baseTemp2
          const dHum2 = currentMaxHum - baseHum2

          let luxCondition2 = false
          let tempDropThreshold2 = -3.0
          let humRiseThreshold2 = 12.0

          if (baseLux2 <= 15000) {
            luxCondition2 = true
            tempDropThreshold2 = -1.2
            humRiseThreshold2 = 4.0
          } else if (baseLux2 <= 26000) {
            luxCondition2 = currentMinLux <= baseLux2 * 0.6
            if (currentMinLux <= 15000) {
              tempDropThreshold2 = -1.2
              humRiseThreshold2 = 8.0
            }
          } else {
            luxCondition2 = currentMinLux <= baseLux2 * 0.4
            if (currentMinLux <= 15000) {
              tempDropThreshold2 = -1.2
              humRiseThreshold2 = 8.0
            }
          }

          const humCondition2 =
            dHum2 >= humRiseThreshold2 ||
            (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp2 <= tempDropThreshold2 && humCondition2 && luxCondition2) {
            triggered = true
            triggerReason = `Inferencia de Día: Incremento de +${dHum2.toFixed(1)}% HR y caída térmica de ${Math.abs(dTemp2).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
            calculatedBaselineTemp = baseTemp2
            calculatedBaselineHum = baseHum2
            calculatedBaselineLux = baseLux2
          }
        }
      } else {
        // --- REGLAS NOCTURNAS (Fórmula B Calibrada + Filtro de Rocío 98.0%) ---
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
        const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.8)
        const humRiseThreshold = Math.max(3.0, varHumPre * 1.6)

        const isTempDropAbrupt = varTempCur >= tempDropThreshold
        const isHumRiseAbrupt = varHumCur >= humRiseThreshold
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

        if (isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
          triggered = true
          // Se calcula el delta térmico relativo al máximo previo de calma
          const currentTempDrop = maxTempPre - currentMinTemp

          triggerReason = `Inferencia de Noche: Incremento de +${(currentMaxHum - minHumPre).toFixed(1)}% HR y caída térmica de ${currentTempDrop.toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%)`
          calculatedBaselineTemp = maxTempPre
          calculatedBaselineHum = minHumPre
          calculatedBaselineLux = 0
        }
      }

      if (triggered) {
        isTelemetryRainActive = true

        baselineLux = calculatedBaselineLux ?? luxBatches[0].max
        baselineTemp = calculatedBaselineTemp ?? tempBatches[0].max
        baselineHum = calculatedBaselineHum ?? humBatches[0].min

        let preciseStartMs = timestampMs
        const baselineT = calculatedBaselineTemp ?? tempBatches[1]?.max ?? baselineTemp
        const samplesT = tempBatches[0].samples
        const dropThreshold = isDay ? -1.2 : -0.35
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
        minTempInRain = tempBatches[0].min
        maxHumInRain = humBatches[0].max

        const startSampleT =
          tempBatches[0].samples.find((s) => s.timestamp === preciseStartMs) ||
          tempBatches[0].samples[0]
        const startSampleH =
          humBatches[0].samples.find((s) => s.timestamp === preciseStartMs) ||
          humBatches[0].samples[0]
        const startSampleL =
          luxBatches[0].samples.find((s) => s.timestamp === preciseStartMs) ||
          luxBatches[0].samples[0]

        await openVirtualEvent(
          new Date(preciseStartMs),
          {
            temp: baselineTemp,
            hum: baselineHum,
            lux: baselineLux,
            ageMinutes: 10,
          },
          triggerReason,
          {
            temp: startSampleT ? startSampleT.value : currentMinTemp,
            hum: startSampleH ? startSampleH.value : currentMaxHum,
            lux: startSampleL ? startSampleL.value : currentMinLux,
          },
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
            const lastSample = tempBatches[0].samples[tempBatches[0].samples.length - 1]
            const preciseEndMs = lastSample ? lastSample.timestamp : timestampMs

            const endSampleT =
              tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              tempBatches[0].samples[tempBatches[0].samples.length - 1]
            const endSampleH =
              humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              humBatches[0].samples[humBatches[0].samples.length - 1]
            const endSampleL =
              luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              luxBatches[0].samples[luxBatches[0].samples.length - 1]

            isTelemetryRainActive = false
            lastRainClosedAt = preciseEndMs
            await closeVirtualEvent(
              new Date(preciseEndMs),
              'STAGNANT',
              `STAGNANT (dT=${diffTemp.toFixed(1)}°C <= 0.4, dH=${diffHum.toFixed(1)}% <= 1, Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`,
              {
                temp: endSampleT ? endSampleT.value : currentMinTemp,
                hum: endSampleH ? endSampleH.value : currentMaxHum,
                lux: endSampleL ? endSampleL.value : currentMinLux,
              },
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
          if (
            baselineTemp !== null &&
            baselineHum !== null &&
            minTempInRain !== null &&
            maxHumInRain !== null
          ) {
            const currentTemp = tempBatches[0].min
            const currentHum = humBatches[0].max
            const tempDrop = baselineTemp - minTempInRain
            const humRise = maxHumInRain - baselineHum

            const tempThreshold = minTempInRain + Math.max(0.6, tempDrop * 0.35)
            const humThreshold = maxHumInRain - Math.max(2.0, humRise * 0.15)

            if (currentTemp >= tempThreshold && currentHum <= humThreshold) {
              let preciseEndMs = timestampMs
              const matchingEndSample = tempBatches[0].samples.find((s) => s.value >= tempThreshold)

              if (matchingEndSample) {
                preciseEndMs = matchingEndSample.timestamp
              } else {
                const lastSample = tempBatches[0].samples[tempBatches[0].samples.length - 1]

                if (lastSample) preciseEndMs = lastSample.timestamp
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

              isTelemetryRainActive = false
              lastRainClosedAt = preciseEndMs
              await closeVirtualEvent(
                new Date(preciseEndMs),
                'BASELINE_RECOVERY',
                `BASELINE_RECOVERY (Temp: ${currentTemp.toFixed(1)}°C >= ${tempThreshold.toFixed(1)}°C, Hum: ${currentHum.toFixed(1)}% <= ${humThreshold.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`,
                {
                  temp: endSampleT ? endSampleT.value : currentTemp,
                  hum: endSampleH ? endSampleH.value : currentHum,
                  lux: endSampleL ? endSampleL.value : currentMinLux,
                },
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
            const isTempStableOrRising = lastTempDrop <= 0.2

            const isUnconditionalSolar = currentMaxLux >= 26000
            const isConditionalSolar =
              currentMaxLux >= luxRecoveryThreshold &&
              isTempStableOrRising &&
              currentMaxLux >= 15000

            if (isUnconditionalSolar || isConditionalSolar) {
              let preciseEndMs = timestampMs
              // Si es incondicional, buscar la muestra >= 26000, si es condicional, buscar la muestra >= luxRecoveryThreshold
              const targetThreshold = isUnconditionalSolar ? 26000 : luxRecoveryThreshold
              const matchingEndSample = luxBatches[0].samples.find(
                (s) => s.value >= targetThreshold,
              )

              if (matchingEndSample) {
                preciseEndMs = matchingEndSample.timestamp
              } else {
                const lastSample = luxBatches[0].samples[luxBatches[0].samples.length - 1]

                if (lastSample) preciseEndMs = lastSample.timestamp
              }

              if (rainStartedAt !== null && preciseEndMs < rainStartedAt) {
                preciseEndMs = rainStartedAt
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

              isTelemetryRainActive = false
              lastRainClosedAt = preciseEndMs

              const closeReasonText = isUnconditionalSolar
                ? `SOLAR_RECOVERY (Sol radiante pleno >= 26k lx, Lux max: ${currentMaxLux.toFixed(0)} lx)`
                : `SOLAR_RECOVERY (Lux max: ${currentMaxLux.toFixed(0)} lx >= ${luxRecoveryThreshold.toFixed(0)} lx, Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`

              await closeVirtualEvent(new Date(preciseEndMs), 'SOLAR_RECOVERY', closeReasonText, {
                temp: endSampleT ? endSampleT.value : tempBatches[0].min,
                hum: endSampleH ? endSampleH.value : humBatches[0].max,
                lux: endSampleL ? endSampleL.value : currentMinLux,
              })
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
  }
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
) {
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
      startTemp: activeVirtualEvent.startTemp ?? null,
      startHum: activeVirtualEvent.startHum ?? null,
      startLux: activeVirtualEvent.startLux ?? null,
      endTemp: endMetrics?.temp ?? null,
      endHum: endMetrics?.hum ?? null,
      endLux: endMetrics?.lux ?? null,
    },
    update: {
      endedAt: cleanEnd,
      durationSeconds: durationSeconds > 0 ? durationSeconds : 60,
      closeReason,
      closedBy: `REBUILD_SCRIPT_${closeType}`,
      endTemp: endMetrics?.temp ?? null,
      endHum: endMetrics?.hum ?? null,
      endLux: endMetrics?.lux ?? null,
    },
  })

  activeVirtualEvent = null
}

main().catch((err) => {
  Logger.error('Error fatal en el script de reconstrucción híbrida de lluvia:', err)
  process.exit(1)
})
