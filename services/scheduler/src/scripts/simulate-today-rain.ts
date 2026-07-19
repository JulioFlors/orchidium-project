import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'
import { isDaytime, getHumGradientMetrics, getTempGradientMetrics } from '../lib/rain-manager'

const START_DATE = new Date('2026-07-18T00:00:00.000Z')
const END_DATE = new Date('2026-07-18T23:59:59.999Z')

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

const isWithinSolarTimeRange = (timeVal: number): boolean => {
  try {
    const d = new Date(timeVal)
    const localHour = (d.getUTCHours() - 4 + 24) % 24
    const localMin = d.getUTCMinutes()
    const totalMinutes = localHour * 60 + localMin

    return totalMinutes > 300 && totalMinutes < 1140
  } catch {
    return false
  }
}

// Buffers deslizantes globales
const tempBatches: BatchSummary[] = []
const humBatches: BatchSummary[] = []
const luxBatches: BatchSummary[] = []

let createdCount = 0
let isTelemetryRainActive = false
let minLuxInRain: number | null = null
let minTempInRain: number | null = null
let maxHumInRain: number | null = null
let baselineLux: number | null = null
let baselineTemp: number | null = null
let baselineHum: number | null = null
let baselineAgeMinutes: number | null = null
let rainStartedAt: number | null = null
let lastRainClosedAt: number | null = null

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function evaluateAtTimestamp(timestampMs: number) {
  const currentMinTemp = tempBatches[0].min
  const currentMaxHum = humBatches[0].max
  const currentMinLux = luxBatches[0].min

  const isDay = isDaytime(timestampMs)

  if (isDay && luxBatches[0].max === 0 && luxBatches[0].samples.every((s) => s.value === 0)) {
    return
  }

  if (!isTelemetryRainActive) {
    if (lastRainClosedAt !== null && timestampMs - lastRainClosedAt < 10 * 60 * 1000) return
    if (currentMinLux >= 26000) return

    const baseTemp1 = tempBatches[1].max
    const baseHum1 = humBatches[1].min
    const baseLux1 = luxBatches[1].max
    const dTemp1 = currentMinTemp - baseTemp1
    const dHum1 = currentMaxHum - baseHum1

    let triggered = false
    let triggerType = ''
    let triggerReason = ''
    let calculatedBaselineTemp: number | null = null
    let calculatedBaselineHum: number | null = null
    let calculatedBaselineLux: number | null = null
    let calculatedBaselineAgeMinutes = 10
    let tempDeltaTemp = 0
    let tempDeltaHum = 0
    let dropPct = 0

    if (isDay) {
      // Paso 1 - Diurno
      let luxCondition = false
      let tempDropThreshold = -1.5
      let humRobust = 12.0
      let humSensitive = 10.0
      let isSensible = false

      if (baseLux1 <= 15000) {
        luxCondition = true
        tempDropThreshold = -1.5
        humRobust = 12.0
        humSensitive = 10.0
      } else if (baseLux1 <= 26000) {
        luxCondition = currentMinLux <= baseLux1 * 0.6
        if (currentMinLux <= 15000) {
          isSensible = true
          tempDropThreshold = -1.5
          humRobust = 10.0
          humSensitive = 8.0
        }
      } else {
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
          triggerReason = `Inferencia de Día (10M): +${dHum1.toFixed(1)}% HR, caída ${dTemp1.toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
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

      // Paso 2 - Diurno
      if (!triggered && tempBatches.length >= 3) {
        const baseTemp2 = tempBatches[2].max
        const baseHum2 = humBatches[2].min
        const baseLux2 = luxBatches[2].max
        const dTemp2 = currentMinTemp - baseTemp2
        const dHum2 = currentMaxHum - baseHum2

        let luxCondition2 = false
        let tempDropThreshold2 = -2.5
        let humRobust2 = 14.0
        let humSensitive2 = 12.0
        let isSensible2 = false

        if (baseLux2 <= 15000) {
          luxCondition2 = true
          tempDropThreshold2 = -2.5
          humRobust2 = 14.0
          humSensitive2 = 12.0
        } else if (baseLux2 <= 26000) {
          luxCondition2 = currentMinLux <= baseLux2 * 0.6
          if (currentMinLux <= 15000) {
            isSensible2 = true
            tempDropThreshold2 = -2.5
            humRobust2 = 12.0
            humSensitive2 = 10.0
          }
        } else {
          luxCondition2 = currentMinLux <= baseLux2 * 0.4
          if (currentMinLux <= 15000) {
            isSensible2 = true
            tempDropThreshold2 = -3.0
            humRobust2 = 12.0
            humSensitive2 = 10.0
          }
        }

        const humCondition2 =
          dHum2 >= humSensitive2 || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

        if (dTemp2 <= tempDropThreshold2 && humCondition2 && luxCondition2) {
          let passesGradient = true
          const isPreSaturated = baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0

          if (dHum2 < humRobust2 && !isPreSaturated) {
            const hSlopes = getHumGradientMetrics(humBatches[0].samples)
            const tSlopes = getTempGradientMetrics(tempBatches[0].samples)
            const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
            const hasSteepTemp = tSlopes.maxDrop1m <= -0.5

            passesGradient = hasSteepHum || hasSteepTemp
            if (!passesGradient) stats.vetos++
          }

          if (passesGradient) {
            triggered = true
            triggerReason = `Inferencia de Día (20M): +${dHum2.toFixed(1)}% HR, caída ${dTemp2.toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
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
              triggerType = isSensible2
                ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_20M'
                : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_20M'
            } else {
              triggerType = isSensible2
                ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_20M'
                : 'DAY_RAMA_B_SOLEADO_ROBUSTO_20M'
            }
          }
        }
      }

      // Paso 3 - Diurno
      if (!triggered && tempBatches.length >= 4) {
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
          dHum3 >= humSensitive3 || (baseHum3 >= 86.0 && baseHum3 <= 95.0 && currentMaxHum >= 98.0)

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
            triggerReason = `Inferencia de Día (30M): +${dHum3.toFixed(1)}% HR, caída ${dTemp3.toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`
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

    if (triggered) {
      isTelemetryRainActive = true
      baselineLux = calculatedBaselineLux ?? luxBatches[0].max
      baselineTemp = calculatedBaselineTemp ?? tempBatches[0].max
      baselineHum = calculatedBaselineHum ?? humBatches[0].min
      baselineAgeMinutes = calculatedBaselineAgeMinutes

      let preciseStartMs = timestampMs
      const baselineT = calculatedBaselineTemp ?? tempBatches[1]?.max ?? baselineTemp
      const samplesT = tempBatches[0].samples
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
      minTempInRain = tempBatches[0].min
      maxHumInRain = humBatches[0].max

      stats.totalInferred++
      stats.triggers[triggerType] = (stats.triggers[triggerType] || 0) + 1

      Logger.info(`[ EVENTO ABIERTO ] ${new Date(preciseStartMs).toLocaleTimeString('es-VE')} - Tipo: ${triggerType} | Razón: ${triggerReason}`)
    }
  } else {
    // Evaluar Cese
    if (rainStartedAt !== null) {
      const durationMin = (timestampMs - rainStartedAt) / 60000

      minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
      minTempInRain = Math.min(minTempInRain ?? currentMinTemp, currentMinTemp)
      maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

      let closedByRecovery = false

      if (isDay) {
        // 2. Recuperación Progresiva (Día)
        if (
          baselineLux !== null &&
          minLuxInRain !== null &&
          minTempInRain !== null &&
          maxHumInRain !== null
        ) {
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
          const isTempRecovered = currentTemp >= minTempInRain + 2.0
          const isHumRecovered = currentHum <= maxHumInRain - 3.0

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

            const tempRecovery = currentTemp - minTempInRain
            const humDrop = maxHumInRain - currentHum

            isTelemetryRainActive = false
            lastRainClosedAt = preciseEndMs
            stats.closes['PROGRESSIVE_RECOVERY'] = (stats.closes['PROGRESSIVE_RECOVERY'] || 0) + 1

            Logger.info(`[ EVENTO CERRADO — PROGRESSIVE_RECOVERY ] ${new Date(preciseEndMs).toLocaleTimeString('es-VE')} (Duración: ${durationMin.toFixed(1)} min)`)
            maxHumInRain = null
            createdCount++
          }
        }

        // 3. Recuperación Solar incondicional (Día)
        if (!closedByRecovery && minLuxInRain !== null) {
          const allSamplesAbove26k =
            luxBatches[0].samples.length > 0 && luxBatches[0].samples.every((s) => s.value >= 26000)

          if (allSamplesAbove26k) {
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

            isTelemetryRainActive = false
            lastRainClosedAt = preciseEndMs
            stats.closes['SOLAR_RECOVERY'] = (stats.closes['SOLAR_RECOVERY'] || 0) + 1

            Logger.info(`[ EVENTO CERRADO — SOLAR_RECOVERY ] ${new Date(preciseEndMs).toLocaleTimeString('es-VE')} (Duración: ${durationMin.toFixed(1)} min)`)
            maxHumInRain = null
            createdCount++
          }
        }
      }

      // 4. Cese por Variación Térmica Diurna (Cese de Lluvia Intermitente)
      if (!closedByRecovery && isDay && minTempInRain !== null) {
        const currentTemp = tempBatches[0].min
        const tempRecovery = currentTemp - minTempInRain

        if (tempRecovery >= 0.6) {
          closedByRecovery = true
          let preciseEndMs = timestampMs
          const matchingEndSample = tempBatches[0].samples.find(
            (s) => s.value >= minTempInRain! + 0.6,
          )
          if (matchingEndSample) {
            preciseEndMs = matchingEndSample.timestamp
          } else {
            const lastSample = tempBatches[0].samples[tempBatches[0].samples.length - 1]
            if (lastSample) preciseEndMs = lastSample.timestamp
          }
          if (preciseEndMs < rainStartedAt) preciseEndMs = rainStartedAt

          const endSampleT =
            tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
            tempBatches[0].samples[tempBatches[0].samples.length - 1]
          const endSampleH =
            humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
            humBatches[0].samples[humBatches[0].samples.length - 1]

          isTelemetryRainActive = false
          lastRainClosedAt = preciseEndMs
          stats.closes['THERMAL_VARIATION'] = (stats.closes['THERMAL_VARIATION'] || 0) + 1

          Logger.info(`[ EVENTO CERRADO — THERMAL_VARIATION ] ${new Date(preciseEndMs).toLocaleTimeString('es-VE')} (Duración: ${durationMin.toFixed(1)} min)`)
          maxHumInRain = null
          createdCount++
        }
      }

      if (closedByRecovery) return

      // 5. Cese por Estancamiento — MODIFICADO PARA LA SIMULACIÓN
      if (tempBatches.length >= 1 && humBatches.length >= 1) {
        const tempCeseThreshold = 0.4
        const humCeseThreshold = 1.0 // Unificado de vuelta a 1.0% HR

        const tSamples = tempBatches[0].samples
        const hSamples = humBatches[0].samples

        const firstTemp = tSamples[0]?.value ?? tempBatches[0].min
        const lastTemp = tSamples[tSamples.length - 1]?.value ?? tempBatches[0].min
        const netTempDrop = firstTemp - lastTemp // > 0 si cae, <= 0 si sube

        const firstHum = hSamples[0]?.value ?? humBatches[0].min
        const lastHum = hSamples[hSamples.length - 1]?.value ?? humBatches[0].max
        const netHumRise = lastHum - firstHum // > 0 si sube, <= 0 si baja

        const isSaturated = humBatches[0].max >= 100.0
        const isHumStagnant = isSaturated ? true : netHumRise <= humCeseThreshold
        const isTempStagnant = netTempDrop <= tempCeseThreshold

        if (isHumStagnant && isTempStagnant) {
          let allowStagnantClose = true

          // Guardia térmica a 20 min en vez de 30 min en ambientes no saturados diurnos
          if (isDay) {
            if (isSaturated) {
              if (tempBatches.length >= 3) {
                const maxTemp30 = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
                allowStagnantClose = (maxTemp30 - tempBatches[0].min) <= 0.4
              }
            } else {
              if (tempBatches.length >= 2) {
                const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)
                allowStagnantClose = (maxTemp20 - tempBatches[0].min) <= 0.4
              }
            }
          }

          if (allowStagnantClose) {
            const firstSample = tempBatches[0].samples[0]
            let preciseEndMs = firstSample ? firstSample.timestamp : timestampMs
            if (preciseEndMs < rainStartedAt) preciseEndMs = rainStartedAt

            isTelemetryRainActive = false
            lastRainClosedAt = preciseEndMs
            stats.closes['STAGNANT'] = (stats.closes['STAGNANT'] || 0) + 1

            Logger.info(`[ EVENTO CERRADO — STAGNANT ] ${new Date(preciseEndMs).toLocaleTimeString('es-VE')} (Duración: ${durationMin.toFixed(1)} min)`)
            maxHumInRain = null
            createdCount++
          }
        }
      }
    }
  }
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info(`  SIMULACIÓN DESLIZANTE DE HOY (18 de Julio de 2026)`)
  Logger.info('════════════════════════════════════════════════════════')

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${START_DATE.toISOString()}'
      AND time <= '${END_DATE.toISOString()}'
    ORDER BY time ASC
  `

  const allSamples: { temp: Sample[]; hum: Sample[]; lux: Sample[] } = {
    temp: [],
    hum: [],
    lux: [],
  }

  let rowCount = 0
  try {
    const stream = influxClient.query(query)
    for await (const row of stream) {
      rowCount++
      const tDate = rowTimeToDate(row.time)
      const tMs = tDate.getTime()

      if (row.temperature != null) {
        const tVal = Number(row.temperature)
        if (tVal > 5.0 && tVal < 55.0) allSamples.temp.push({ value: tVal, timestamp: tMs })
      }
      if (row.humidity != null) {
        const hVal = Number(row.humidity)
        if (hVal > 10.0 && hVal <= 100.0) allSamples.hum.push({ value: hVal, timestamp: tMs })
      }
      if (row.illuminance != null) {
        const lVal = Number(row.illuminance)
        if (lVal >= 0) allSamples.lux.push({ value: lVal, timestamp: tMs })
      }
    }

    Logger.info(`Registros InfluxDB leídos: ${rowCount}`)

    // Agrupar muestras en orden cronológico en un set de timestamps únicos (cada minuto)
    const timestamps = Array.from(
      new Set([
        ...allSamples.temp.map((s) => s.timestamp),
        ...allSamples.hum.map((s) => s.timestamp),
        ...allSamples.lux.map((s) => s.timestamp),
      ])
    ).sort((a, b) => a - b)

    // Evaluar minuto a minuto usando ventanas deslizantes de los últimos 75 min
    for (const tMs of timestamps) {
      const buildBatch = (samples: Sample[], startOffsetMin: number, endOffsetMin: number): Sample[] => {
        const start = tMs - startOffsetMin * 60 * 1000
        const end = tMs - endOffsetMin * 60 * 1000
        return samples.filter((s) => s.timestamp >= start && s.timestamp < end)
      }

      const tempBatchesLocal: BatchSummary[] = []
      const humBatchesLocal: BatchSummary[] = []
      const luxBatchesLocal: BatchSummary[] = []

      const steps = [
        { start: 10, end: 0 },
        { start: 20, end: 10 },
        { start: 30, end: 20 },
        { start: 40, end: 30 },
        { start: 50, end: 40 },
        { start: 60, end: 50 },
      ]

      let hasEnoughData = true
      for (const step of steps) {
        const tS = buildBatch(allSamples.temp, step.start, step.end)
        const hS = buildBatch(allSamples.hum, step.start, step.end)
        const lS = buildBatch(allSamples.lux, step.start, step.end)

        if (tS.length < 3 || hS.length < 3) {
          hasEnoughData = false
          break
        }

        const tempVals = tS.map((s) => s.value)
        const humVals = hS.map((s) => s.value)
        tempBatchesLocal.push({
          min: Math.min(...tempVals),
          max: Math.max(...tempVals),
          timestamp: tMs - step.end * 60 * 1000,
          samples: tS,
        })
        humBatchesLocal.push({
          min: Math.min(...humVals),
          max: Math.max(...humVals),
          timestamp: tMs - step.end * 60 * 1000,
          samples: hS,
        })

        if (lS.length > 0) {
          const luxVals = lS.map((s) => s.value)
          const sortedLuxAsc = [...luxVals].sort((a, b) => a - b)
          const low5Lux = sortedLuxAsc.slice(0, Math.min(5, sortedLuxAsc.length))
          const minLuxAvg = low5Lux.reduce((sum, val) => sum + val, 0) / low5Lux.length

          const sortedLuxDesc = [...luxVals].sort((a, b) => b - a)
          const high5Lux = sortedLuxDesc.slice(0, Math.min(5, sortedLuxDesc.length))
          const maxLuxAvg = high5Lux.reduce((sum, val) => sum + val, 0) / high5Lux.length

          luxBatchesLocal.push({
            min: minLuxAvg,
            max: maxLuxAvg,
            timestamp: tMs - step.end * 60 * 1000,
            samples: lS,
          })
        } else {
          luxBatchesLocal.push({
            min: 0,
            max: 0,
            timestamp: tMs - step.end * 60 * 1000,
            samples: [],
          })
        }
      }

      if (!hasEnoughData) continue

      tempBatches.splice(0, tempBatches.length, ...tempBatchesLocal)
      humBatches.splice(0, humBatches.length, ...humBatchesLocal)
      luxBatches.splice(0, luxBatches.length, ...luxBatchesLocal)

      await evaluateAtTimestamp(tMs)
    }

    Logger.info('════════════════════════════════════════════════════════')
    Logger.info('  RESULTADO DE LA SIMULACIÓN')
    Logger.info(`  Total Eventos Creados: ${createdCount}`)
    Logger.info('════════════════════════════════════════════════════════')

  } catch (err) {
    Logger.error('Error durante la simulación:', err)
  }
}

main().catch((err) => {
  Logger.error('Error fatal:', err)
})
