import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

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

const BATCH_INTERVAL_MS = 10 * 60 * 1000

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)
  if (isNaN(Number(s))) return new Date(s)
  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

function pushBatchMetrics(queue: BatchSummary[], samples: Sample[], timestamp: number) {
  const values = samples.map((s) => s.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  queue.unshift({ min, max, timestamp, samples })
  if (queue.length > 6) queue.pop()
}

// Simular el motor de inferencia completo
async function runSimulation(require15kSolarThreshold: boolean) {
  // Rango: del 14 de Junio al 3 de Julio
  const startTime = new Date('2026-06-14T04:00:00.000Z')
  const endTime = new Date('2026-07-03T02:00:00.000Z')

  const BLOCK_MS = 2 * 24 * 3600 * 1000
  let startMs = startTime.getTime()
  const endMs = endTime.getTime()

  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []

  let isTelemetryRainActive = false
  let rainStartedAt: number | null = null
  let lastRainClosedAt: number | null = null

  let baselineLux: number | null = null
  let baselineTemp: number | null = null
  let baselineHum: number | null = null

  let minLuxInRain: number | null = null
  let minTempInRain: number | null = null
  let maxHumInRain: number | null = null

  let currentIntervalStartMs = 0
  let tempBuffer: Sample[] = []
  let humBuffer: Sample[] = []
  let luxBuffer: Sample[] = []

  const detectedEvents: Array<{
    startedAt: Date
    endedAt: Date
    durationSec: number
    closeType: string
    closeReason: string
    startLux: number
    endLux: number
  }> = []

  const flushIntervalAndEvaluate = async (timestampMs: number) => {
    if (tempBuffer.length >= 5 && humBuffer.length >= 5 && luxBuffer.length >= 5) {
      pushBatchMetrics(tempBatches, tempBuffer, timestampMs)
      pushBatchMetrics(humBatches, humBuffer, timestampMs)
      pushBatchMetrics(luxBatches, luxBuffer, timestampMs)
    }
    tempBuffer = []
    humBuffer = []
    luxBuffer = []

    if (tempBatches.length < 6 || humBatches.length < 6 || luxBatches.length < 6) return

    const currentMinTemp = tempBatches[0].min
    const currentMaxHum = humBatches[0].max
    const currentMinLux = luxBatches[0].min

    const date = new Date(timestampMs)
    const caracasHour = (date.getUTCHours() - 4 + 24) % 24
    const isDay = caracasHour >= 8 && caracasHour < 17

    if (!isTelemetryRainActive) {
      if (lastRainClosedAt !== null && timestampMs - lastRainClosedAt < 15 * 60 * 1000) return

      let triggered = false

      if (isDay) {
        // Reglas Diurnas B1
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
          dHum1 >= humRiseThreshold || (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

        if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
          triggered = true
        }

        // Reglas Diurnas B2
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
            dHum2 >= humRiseThreshold2 || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

          if (dTemp2 <= tempDropThreshold2 && humCondition2 && luxCondition2) {
            triggered = true
          }
        }
      } else {
        // Reglas Nocturnas
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
        }
      }

      if (triggered) {
        isTelemetryRainActive = true
        baselineLux = luxBatches[0].max
        baselineTemp = tempBatches[0].max
        baselineHum = humBatches[0].min

        let preciseStartMs = timestampMs
        const baselineT = tempBatches[1] ? tempBatches[1].max : baselineTemp
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
      }
    } else {
      // Evaluar Cese
      if (rainStartedAt !== null) {
        const durationMin = (timestampMs - rainStartedAt) / 60000

        // 1. Estancamiento
        if (durationMin >= 15) {
          const diffHum = humBatches[0].max - humBatches[0].min
          const diffTemp = tempBatches[0].max - tempBatches[0].min
          const tempCeseThreshold = 0.4
          const humCeseThreshold = 1.0

          if (diffHum <= humCeseThreshold && diffTemp <= tempCeseThreshold) {
            const lastSample = tempBatches[0].samples[tempBatches[0].samples.length - 1]
            const preciseEndMs = lastSample ? lastSample.timestamp : timestampMs

            isTelemetryRainActive = false
            lastRainClosedAt = preciseEndMs
            detectedEvents.push({
              startedAt: new Date(rainStartedAt),
              endedAt: new Date(preciseEndMs),
              durationSec: Math.round((preciseEndMs - rainStartedAt) / 1000),
              closeType: 'STAGNANT',
              closeReason: `STAGNANT (dT=${diffTemp.toFixed(1)}, dH=${diffHum.toFixed(1)})`,
              startLux: baselineLux ?? 0,
              endLux: currentMinLux,
            })
            maxHumInRain = null
            return
          }
        }

        minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
        minTempInRain = Math.min(minTempInRain ?? currentMinTemp, currentMinTemp)
        maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

        if (isDay) {
          // 2. Baseline Recovery
          if (baselineTemp !== null && baselineHum !== null && minTempInRain !== null && maxHumInRain !== null) {
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

              isTelemetryRainActive = false
              lastRainClosedAt = preciseEndMs
              detectedEvents.push({
                startedAt: new Date(rainStartedAt),
                endedAt: new Date(preciseEndMs),
                durationSec: Math.round((preciseEndMs - rainStartedAt) / 1000),
                closeType: 'BASELINE_RECOVERY',
                closeReason: `BASELINE (T >= ${tempThreshold.toFixed(1)}, H <= ${humThreshold.toFixed(1)})`,
                startLux: baselineLux ?? 0,
                endLux: currentMinLux,
              })
              maxHumInRain = null
              return
            }
          }

          // 3. Solar Recovery
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
              // Validar restricción propuesta si está activa
              const meetsSolarConstraint = !require15kSolarThreshold || currentMaxLux >= 15000

              if (meetsSolarConstraint) {
                let preciseEndMs = timestampMs
                const matchingEndSample = luxBatches[0].samples.find((s) => s.value >= luxRecoveryThreshold)
                if (matchingEndSample) {
                  preciseEndMs = matchingEndSample.timestamp
                } else {
                  const lastSample = luxBatches[0].samples[luxBatches[0].samples.length - 1]
                  if (lastSample) preciseEndMs = lastSample.timestamp
                }

                isTelemetryRainActive = false
                lastRainClosedAt = preciseEndMs
                detectedEvents.push({
                  startedAt: new Date(rainStartedAt),
                  endedAt: new Date(preciseEndMs),
                  durationSec: Math.round((preciseEndMs - rainStartedAt) / 1000),
                  closeType: 'SOLAR_RECOVERY',
                  closeReason: `SOLAR (Lux max: ${currentMaxLux.toFixed(0)} >= ${luxRecoveryThreshold.toFixed(0)})`,
                  startLux: baselineLux ?? 0,
                  endLux: currentMaxLux, // Aquí guardamos el valor real cruzado
                })
                maxHumInRain = null
                return
              }
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
      Logger.error(`Error procesando bloque:`, err)
    }
    startMs = nextMs
  }

  return detectedEvents
}

async function main() {
  Logger.info('⏳ Corriendo simulación de motor virtual (SIN restricción solar < 15klx)...')
  const eventsBefore = await runSimulation(false)

  Logger.info('⏳ Corriendo simulación de motor virtual (CON restricción solar >= 15klx)...')
  const eventsAfter = await runSimulation(true)

  console.log('\n========================================================================')
  console.log(`📊 COMPARATIVA GENERAL DE EVENTOS VIRTUALES`)
  console.log(`   - Sin restricción solar >=15k lx: ${eventsBefore.length} eventos`)
  console.log(`   - Con restricción solar >=15k lx: ${eventsAfter.length} eventos`)
  console.log(`   - Reducción de eventos dudosos: ${eventsBefore.length - eventsAfter.length} (${(((eventsBefore.length - eventsAfter.length) / eventsBefore.length) * 100).toFixed(1)}%)`)
  console.log('========================================================================\n')

  // Buscar casos específicos de discrepancia
  console.log('🔍 CASOS DE ESTUDIO COMPARADOS (Antes vs Después):')
  
  for (const evB of eventsBefore) {
    // Buscar si este evento cambió en la simulación post-restricción
    const match = eventsAfter.find(
      (evA) => Math.abs(evA.startedAt.getTime() - evB.startedAt.getTime()) < 2 * 60 * 1000
    )

    const dateStr = evB.startedAt.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
    const timeBStr = evB.startedAt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    const endBStr = evB.endedAt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })

    const ceilDurB = Math.ceil(evB.durationSec / 60)
    const roundDurB = Math.round(evB.durationSec / 60)

    if (!match) {
      console.log(`\n❌ EVENTO ELIMINADO/ABSORBIDO (Se extendió o se canceló el cese solar prematuro):`)
      console.log(`   📅 Fecha: ${dateStr}`)
      console.log(`   ⏱️  Rango: ${timeBStr} - ${endBStr} (${evB.durationSec}s)`)
      console.log(`   ⏱️  Duración: Math.round = ${roundDurB} min | Math.ceil = ${ceilDurB} min`)
      console.log(`   💡 Cese original: ${evB.closeType} (Lux: ${(evB.endLux/1000).toFixed(1)}k lx) -> ${evB.closeReason}`)
    } else {
      const durDiff = match.durationSec - evB.durationSec
      if (durDiff !== 0) {
        const timeAStr = match.startedAt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
        const endAStr = match.endedAt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
        const ceilDurA = Math.ceil(match.durationSec / 60)
        const roundDurA = Math.round(match.durationSec / 60)

        console.log(`\n♻️ EVENTO REDEFINIDO (Se retrasó el cese solar por estar nublado):`)
        console.log(`   📅 Fecha: ${dateStr}`)
        console.log(`   🔴 ANTES: ${timeBStr} - ${endBStr} (${evB.durationSec}s)`)
        console.log(`             Motivo cese: ${evB.closeType} (Lux: ${(evB.endLux/1000).toFixed(1)}k lx)`)
        console.log(`             Duración: Math.round = ${roundDurB} min | Math.ceil = ${ceilDurB} min`)
        console.log(`   🟢 DESPUÉS: ${timeAStr} - ${endAStr} (${match.durationSec}s) [Extendido +${(durDiff/60).toFixed(1)} min]`)
        console.log(`               Motivo cese: ${match.closeType} (Lux: ${(match.endLux/1000).toFixed(1)}k lx) -> ${match.closeReason}`)
        console.log(`               Duración: Math.round = ${roundDurA} min | Math.ceil = ${ceilDurA} min`)
      }
    }
  }
}

main().catch(console.error)
