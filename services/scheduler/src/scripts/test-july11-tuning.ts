import { influxClient } from '../lib/influx'
import { isDaytime } from '../lib/rain-manager'

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

interface StepData {
  temp: BatchSummary
  hum: BatchSummary
  lux: BatchSummary
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function loadDataRange(startQuery: Date, endQuery: Date): Promise<StepData[]> {
  const tempBuffer: Sample[] = []
  const humBuffer: Sample[] = []
  const luxBuffer: Sample[] = []

  let currentIntervalStartMs = 0
  const BATCH_INTERVAL_MS = 10 * 60 * 1000
  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []

  const flushInterval = (timestampMs: number) => {
    if (tempBuffer.length > 0) {
      const allVals = tempBuffer.map((s) => s.value)

      tempBatches.push({
        min: Math.min(...allVals),
        max: Math.max(...allVals),
        timestamp: timestampMs,
        samples: [...tempBuffer],
      })
    } else if (tempBatches.length > 0) {
      const prev = tempBatches[tempBatches.length - 1]

      tempBatches.push({
        min: prev.min,
        max: prev.max,
        timestamp: timestampMs,
        samples: Array(10).fill({ value: prev.min, timestamp: timestampMs }),
      })
    }

    if (humBuffer.length > 0) {
      const allVals = humBuffer.map((s) => s.value)

      humBatches.push({
        min: Math.min(...allVals),
        max: Math.max(...allVals),
        timestamp: timestampMs,
        samples: [...humBuffer],
      })
    } else if (humBatches.length > 0) {
      const prev = humBatches[humBatches.length - 1]

      humBatches.push({
        min: prev.min,
        max: prev.max,
        timestamp: timestampMs,
        samples: Array(10).fill({ value: prev.min, timestamp: timestampMs }),
      })
    }

    const tDate = new Date(timestampMs)
    const sampleHour = (tDate.getUTCHours() - 4 + 24) % 24
    const isSolar = sampleHour >= 5 && sampleHour < 19
    const effectiveLuxBuffer =
      luxBuffer.length >= 5 || !isSolar
        ? [...luxBuffer]
        : Array(5).fill({ value: 0, timestamp: timestampMs })

    if (effectiveLuxBuffer.length > 0) {
      const allVals = effectiveLuxBuffer.map((s) => s.value)
      const sortedAsc = [...allVals].sort((a, b) => a - b)
      const low5 = sortedAsc.slice(0, Math.min(5, sortedAsc.length))

      luxBatches.push({
        min: low5.reduce((sum, val) => sum + val, 0) / low5.length,
        max: allVals.reduce((sum, val) => sum + val, 0) / allVals.length,
        timestamp: timestampMs,
        samples: effectiveLuxBuffer,
      })
    } else if (luxBatches.length > 0) {
      const prev = luxBatches[luxBatches.length - 1]

      luxBatches.push({
        min: prev.min,
        max: prev.max,
        timestamp: timestampMs,
        samples: Array(10).fill({ value: prev.min, timestamp: timestampMs }),
      })
    }

    tempBuffer.length = 0
    humBuffer.length = 0
    luxBuffer.length = 0
  }

  const CHUNK_MS = 5 * 24 * 60 * 60 * 1000
  let chunkStartMs = startQuery.getTime()
  const endMs = endQuery.getTime()

  while (chunkStartMs < endMs) {
    const chunkEndMs = Math.min(chunkStartMs + CHUNK_MS, endMs)
    const chunkStart = new Date(chunkStartMs)
    const chunkEnd = new Date(chunkEndMs)

    const query = `
      SELECT time, temperature, humidity, illuminance
      FROM "environment_metrics"
      WHERE "zone" = 'EXTERIOR'
        AND time >= '${chunkStart.toISOString()}'
        AND time < '${chunkEnd.toISOString()}'
      ORDER BY time ASC
    `

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
        flushInterval(currentIntervalStartMs)
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

    chunkStartMs = chunkEndMs
  }

  if (currentIntervalStartMs > 0) {
    flushInterval(currentIntervalStartMs)
  }

  const list: StepData[] = []
  const maxLen = Math.min(tempBatches.length, humBatches.length, luxBatches.length)

  for (let i = 0; i < maxLen; i++) {
    list.push({
      temp: tempBatches[i],
      hum: humBatches[i],
      lux: luxBatches[i],
    })
  }

  return list
}

function getSlopeMetrics(samples: Sample[]): { max1m: number; max2m: number } {
  if (samples.length < 2) return { max1m: 0, max2m: 0 }
  let max1m = 0
  let max2m = 0
  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp)

  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].value - sorted[i - 1].value

    if (diff > max1m) max1m = diff
    if (i >= 2) {
      const diff2 = sorted[i].value - sorted[i - 2].value

      if (diff2 > max2m) max2m = diff2
    }
  }

  return { max1m, max2m }
}

function getTempSlopeMetrics(samples: Sample[]): { maxDrop1m: number; maxDrop2m: number } {
  if (samples.length < 2) return { maxDrop1m: 0, maxDrop2m: 0 }
  let maxDrop1m = 0
  let maxDrop2m = 0
  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp)

  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].value - sorted[i - 1].value

    if (diff < maxDrop1m) maxDrop1m = diff
    if (i >= 2) {
      const diff2 = sorted[i].value - sorted[i - 2].value

      if (diff2 > maxDrop2m) maxDrop2m = diff2
    }
  }

  return { maxDrop1m, maxDrop2m }
}

interface SimResult {
  startedAtStr: string
  endedAtStr: string
  triggerType: string
  reason: string
  durationMinutes?: number
}

// Simulación parametrizada
function runSimulation(
  data: StepData[],
  options: {
    nightTempDropMult: number
    nightHumRiseMult: number
    dayTempProgression: { base: number; step: number }
    dayHumOffset: number // 0.0 para original, 2.0 para sensible 1
    useVeto: boolean
  },
): SimResult[] {
  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []

  let rainActive = false
  let rainStartedAtMs = 0
  let minTempInRain = 0
  let maxHumInRain = 0
  const results: SimResult[] = []

  for (const step of data) {
    tempBatches.unshift(step.temp)
    humBatches.unshift(step.hum)
    luxBatches.unshift(step.lux)

    if (tempBatches.length > 6) tempBatches.pop()
    if (humBatches.length > 6) humBatches.pop()
    if (luxBatches.length > 6) luxBatches.pop()

    if (tempBatches.length < 4 || humBatches.length < 4 || luxBatches.length < 4) continue

    const currentMinTemp = tempBatches[0].min
    const currentMaxHum = humBatches[0].max
    const currentMinLux = luxBatches[0].min
    const timestampMs = tempBatches[0].timestamp

    const isDay = isDaytime(timestampMs)
    const timeStr = new Date(timestampMs).toLocaleString('es-VE', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    })

    if (!rainActive) {
      let triggered = false
      let triggerType = ''
      let triggerReason = ''

      if (isDay) {
        // --- PASO 1 (20 Minutos) ---
        const baseTemp1 = tempBatches[1].max
        const baseHum1 = humBatches[1].min
        const baseLux1 = luxBatches[1].max
        const dTemp1 = currentMinTemp - baseTemp1
        const dHum1 = currentMaxHum - baseHum1

        let tempDropThreshold1 = -1.5
        let humRobust1 = 12.0
        let humSensitive1 = 12.0
        let luxCondition1 = false

        if (baseLux1 <= 15000) {
          luxCondition1 = true
          tempDropThreshold1 = options.dayTempProgression.base
          humRobust1 = 12.0
          humSensitive1 = 12.0 - options.dayHumOffset
        } else if (baseLux1 <= 26000) {
          luxCondition1 = currentMinLux <= baseLux1 * 0.6
          tempDropThreshold1 = options.dayTempProgression.base
          humRobust1 = 10.0
          humSensitive1 = 10.0 - options.dayHumOffset
        } else {
          luxCondition1 = currentMinLux <= baseLux1 * 0.4
          tempDropThreshold1 = options.dayTempProgression.base - 0.5
          humRobust1 = 10.0
          humSensitive1 = 10.0 - options.dayHumOffset
        }

        const isHumSensitiveMet1 = dHum1 >= humSensitive1
        const isHumRobustMet1 = dHum1 >= humRobust1
        const isHumPreSaturated1 = baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0

        if (
          dTemp1 <= tempDropThreshold1 &&
          luxCondition1 &&
          (isHumSensitiveMet1 || isHumPreSaturated1)
        ) {
          let vetoPassed = true
          let vetoReason = ''

          if (options.useVeto && !isHumRobustMet1 && !isHumPreSaturated1) {
            const hSlopes = getSlopeMetrics(humBatches[0].samples)
            const tSlopes = getTempSlopeMetrics(tempBatches[0].samples)
            const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
            const hasSteepTemp = tSlopes.maxDrop1m <= -0.5

            vetoPassed = hasSteepHum || hasSteepTemp
            vetoReason = ` [Veto: Hum1m=${hSlopes.max1m.toFixed(1)}%, Temp1m=${tSlopes.maxDrop1m.toFixed(1)}°C | Pasó=${vetoPassed}]`
          }

          if (vetoPassed) {
            triggered = true
            triggerType = 'DIA_20M'
            triggerReason = `20M: Caída Temp: ${dTemp1.toFixed(1)}°C (umbral ${tempDropThreshold1.toFixed(1)}), Alza Hum: +${dHum1.toFixed(1)}% (limites ${humSensitive1.toFixed(1)}%-${humRobust1.toFixed(1)}%), Lux: ${currentMinLux.toFixed(0)} lx${vetoReason}`
          }
        }

        // --- PASO 2 (30 Minutos) ---
        if (!triggered) {
          const baseTemp2 = tempBatches[2].max
          const baseHum2 = humBatches[2].min
          const baseLux2 = luxBatches[2].max
          const dTemp2 = currentMinTemp - baseTemp2
          const dHum2 = currentMaxHum - baseHum2

          let tempDropThreshold2 = -2.5
          let humRobust2 = 14.0
          let humSensitive2 = 14.0
          let luxCondition2 = false

          if (baseLux2 <= 15000) {
            luxCondition2 = true
            tempDropThreshold2 = options.dayTempProgression.base + options.dayTempProgression.step
            humRobust2 = 14.0
            humSensitive2 = 14.0 - options.dayHumOffset
          } else if (baseLux2 <= 26000) {
            luxCondition2 = currentMinLux <= baseLux2 * 0.6
            tempDropThreshold2 = options.dayTempProgression.base + options.dayTempProgression.step
            humRobust2 = 12.0
            humSensitive2 = 12.0 - options.dayHumOffset
          } else {
            luxCondition2 = currentMinLux <= baseLux2 * 0.4
            tempDropThreshold2 =
              options.dayTempProgression.base - 0.5 + options.dayTempProgression.step
            humRobust2 = 12.0
            humSensitive2 = 12.0 - options.dayHumOffset
          }

          const isHumSensitiveMet2 = dHum2 >= humSensitive2
          const isHumRobustMet2 = dHum2 >= humRobust2
          const isHumPreSaturated2 = baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0

          if (
            dTemp2 <= tempDropThreshold2 &&
            luxCondition2 &&
            (isHumSensitiveMet2 || isHumPreSaturated2)
          ) {
            let vetoPassed = true
            let vetoReason = ''

            if (options.useVeto && !isHumRobustMet2 && !isHumPreSaturated2) {
              const hSlopes = getSlopeMetrics(humBatches[0].samples)
              const tSlopes = getTempSlopeMetrics(tempBatches[0].samples)
              const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
              const hasSteepTemp = tSlopes.maxDrop1m <= -0.5

              vetoPassed = hasSteepHum || hasSteepTemp
              vetoReason = ` [Veto: Hum1m=${hSlopes.max1m.toFixed(1)}%, Temp1m=${tSlopes.maxDrop1m.toFixed(1)}°C | Pasó=${vetoPassed}]`
            }

            if (vetoPassed) {
              triggered = true
              triggerType = 'DIA_30M'
              triggerReason = `30M: Caída Temp: ${dTemp2.toFixed(1)}°C (umbral ${tempDropThreshold2.toFixed(1)}), Alza Hum: +${dHum2.toFixed(1)}% (limites ${humSensitive2.toFixed(1)}%-${humRobust2.toFixed(1)}%), Lux: ${currentMinLux.toFixed(0)} lx${vetoReason}`
            }
          }
        }

        // --- PASO 3 (40 Minutos) ---
        if (
          !triggered &&
          tempBatches.length >= 4 &&
          humBatches.length >= 4 &&
          luxBatches.length >= 4
        ) {
          const baseTemp3 = tempBatches[3].max
          const baseHum3 = humBatches[3].min
          const baseLux3 = luxBatches[3].max
          const dTemp3 = currentMinTemp - baseTemp3
          const dHum3 = currentMaxHum - baseHum3

          let tempDropThreshold3 = -3.5
          let humRobust3 = 16.0
          let humSensitive3 = 16.0
          let luxCondition3 = false

          if (baseLux3 <= 15000) {
            luxCondition3 = true
            tempDropThreshold3 =
              options.dayTempProgression.base + options.dayTempProgression.step * 2
            humRobust3 = 16.0
            humSensitive3 = 16.0 - options.dayHumOffset
          } else if (baseLux3 <= 26000) {
            luxCondition3 = currentMinLux <= baseLux3 * 0.6
            tempDropThreshold3 =
              options.dayTempProgression.base + options.dayTempProgression.step * 2
            humRobust3 = 14.0
            humSensitive3 = 14.0 - options.dayHumOffset
          } else {
            luxCondition3 = currentMinLux <= baseLux3 * 0.4
            tempDropThreshold3 =
              options.dayTempProgression.base - 0.5 + options.dayTempProgression.step * 2
            humRobust3 = 14.0
            humSensitive3 = 14.0 - options.dayHumOffset
          }

          const isHumSensitiveMet3 = dHum3 >= humSensitive3
          const isHumRobustMet3 = dHum3 >= humRobust3
          const isHumPreSaturated3 = baseHum3 >= 86.0 && baseHum3 <= 95.0 && currentMaxHum >= 98.0

          if (
            dTemp3 <= tempDropThreshold3 &&
            luxCondition3 &&
            (isHumSensitiveMet3 || isHumPreSaturated3)
          ) {
            let vetoPassed = true
            let vetoReason = ''

            if (options.useVeto && !isHumRobustMet3 && !isHumPreSaturated3) {
              const hSlopes = getSlopeMetrics(humBatches[0].samples)
              const tSlopes = getTempSlopeMetrics(tempBatches[0].samples)
              const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
              const hasSteepTemp = tSlopes.maxDrop1m <= -0.5

              vetoPassed = hasSteepHum || hasSteepTemp
              vetoReason = ` [Veto: Hum1m=${hSlopes.max1m.toFixed(1)}%, Temp1m=${tSlopes.maxDrop1m.toFixed(1)}°C | Pasó=${vetoPassed}]`
            }

            if (vetoPassed) {
              triggered = true
              triggerType = 'DIA_40M'
              triggerReason = `40M: Caída Temp: ${dTemp3.toFixed(1)}°C (umbral ${tempDropThreshold3.toFixed(1)}), Alza Hum: +${dHum3.toFixed(1)}% (limites ${humSensitive3.toFixed(1)}%-${humRobust3.toFixed(1)}%), Lux: ${currentMinLux.toFixed(0)} lx${vetoReason}`
            }
          }
        }
      } else {
        // Noche
        const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
        const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
        const varTempPre = maxTempPre - minTempPre

        const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
        const maxHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
        const varHumPre = maxHumPre - minHumPre

        const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
        const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
        const varHumCur = maxHumCur - minHumCur

        const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
        const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
        const varTempCur = maxTempCur - minTempCur

        const tempFloor = minHumPre >= 98.0 ? 0.8 : 0.7
        const tempDropThreshold = Math.max(tempFloor, varTempPre * options.nightTempDropMult)
        const humRiseThreshold = Math.max(3.0, varHumPre * options.nightHumRiseMult)

        const trendTemp = tempBatches[0].min - tempBatches[2].max
        const isTempFalling = trendTemp < -0.1
        const trendHum = humBatches[0].max - humBatches[2].min
        const isHumRising = trendHum > 0.5

        const isTempDropAbrupt = varTempCur >= tempDropThreshold && isTempFalling
        const isHumRiseAbrupt = varHumCur >= humRiseThreshold && isHumRising
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

        if (isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
          triggered = true
          triggerType = 'NOCHE_20M'
          triggerReason = `TempDrop: ${varTempCur.toFixed(2)}°C (umbral ${tempDropThreshold.toFixed(2)}), HumRise: +${varHumCur.toFixed(1)}% (umbral ${humRiseThreshold.toFixed(1)}), PreSat: ${isPreSaturated}`
        }
      }

      if (triggered) {
        rainActive = true
        rainStartedAtMs = timestampMs
        minTempInRain = currentMinTemp
        maxHumInRain = currentMaxHum
        results.push({
          startedAtStr: timeStr,
          endedAtStr: 'OPEN',
          triggerType,
          reason: triggerReason,
        })
      }
    } else {
      // CIERRE
      const currentTemp = tempBatches[0].min
      const currentHum = humBatches[0].max

      minTempInRain = Math.min(minTempInRain, currentMinTemp)
      maxHumInRain = Math.max(maxHumInRain, currentMaxHum)

      let closeTriggered = false
      let closeReason = ''

      // Cierre por estancamiento (30 min)
      if (timestampMs - rainStartedAtMs >= 30 * 60 * 1000) {
        const last3BatchesT = [tempBatches[0], tempBatches[1], tempBatches[2]]
        const last3BatchesH = [humBatches[0], humBatches[1], humBatches[2]]
        const tMax = Math.max(...last3BatchesT.map((b) => b.max))
        const tMin = Math.min(...last3BatchesT.map((b) => b.min))
        const hMax = Math.max(...last3BatchesH.map((b) => b.max))
        const hMin = Math.min(...last3BatchesH.map((b) => b.min))
        const tVar = tMax - tMin
        const hVar = hMax - hMin

        if (tVar <= 0.15 && hVar <= 0.5) {
          closeTriggered = true
          closeReason = `Estancamiento (VarT: ${tVar.toFixed(2)}, VarH: ${hVar.toFixed(1)})`
        }
      }

      // Cierre por recuperación térmica (+0.6°C)
      const tempRecovery = currentTemp - minTempInRain

      if (!closeTriggered && tempRecovery >= 0.6) {
        closeTriggered = true
        closeReason = `Recuperación térmica (+${tempRecovery.toFixed(2)}°C)`
      }

      // Cierre por sol diurno (lux >= 12,000)
      if (!closeTriggered && isDay && currentMinLux >= 12000) {
        closeTriggered = true
        closeReason = `Recuperación solar (${currentMinLux.toFixed(0)} lx)`
      }

      if (closeTriggered) {
        rainActive = false
        const lastResult = results[results.length - 1]

        if (lastResult) {
          lastResult.endedAtStr = timeStr
          lastResult.reason += ` | Cerrado por: ${closeReason}`
          lastResult.durationMinutes = Math.round((timestampMs - rainStartedAtMs) / 60000)
        }
      }
    }
  }

  return results
}

async function main() {
  const startJuly11 = new Date('2026-07-11T04:00:00Z')
  const endJuly12 = new Date('2026-07-13T04:00:00Z')

  console.log(`📡 [INFO] Consultando InfluxDB para el 11 y 12 de Julio...`)
  const targetData = await loadDataRange(startJuly11, endJuly12)

  const configList = [
    {
      name: '1. ORIGINAL (Umbrales Robustos, offsets=0, Sin Veto)',
      nightTempDropMult: 1.8,
      nightHumRiseMult: 1.6,
      dayTempProgression: { base: -1.5, step: -1.0 }, // Originalmente: Paso 1 -1.5°C, Paso 2 -2.5°C, Paso 3 -3.5°C
      dayHumOffset: 0.0,
      useVeto: false,
    },
    {
      name: '2. SENSIBLE 1 + VETO DE GRADIENTE (Progresión Térmica Simplificada: Base -1.5°C, incrementos -0.5°C)',
      nightTempDropMult: 1.6,
      nightHumRiseMult: 1.4,
      dayTempProgression: { base: -1.5, step: -0.5 }, // Paso 1 -1.5°C, Paso 2 -2.0°C, Paso 3 -2.5°C
      dayHumOffset: 2.0, // Baja los umbrales robustos en 2.0%
      useVeto: true,
    },
  ]

  console.log('\n======================================================================')
  console.log('📊 RESULTADOS DE LA SIMULACIÓN PARA EL 11 Y 12 DE JULIO VET (CORREGIDA)')
  console.log('======================================================================')

  for (const config of configList) {
    const res = runSimulation(targetData, config)

    console.log(`\n🔸 Configuración: ${config.name} (Encontró ${res.length} eventos)`)
    if (res.length === 0) {
      console.log('  ❌ Ningún evento detectado.')
    }
    for (const r of res) {
      console.log(`  🕒 [${r.startedAtStr} -> ${r.endedAtStr}] [Tipo: ${r.triggerType}]`)
      console.log(`     Motivo: ${r.reason}`)
    }
  }
}

main().catch(console.error)
