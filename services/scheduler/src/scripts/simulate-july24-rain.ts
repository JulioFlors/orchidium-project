import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'
import { isDaytime } from '../lib/rain-manager'

const START_DATE = new Date('2026-07-24T16:00:00.000Z') // 12:00 PM Caracas
const END_DATE = new Date('2026-07-24T19:00:00.000Z') // 3:00 PM Caracas

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

// Configuración de umbrales a simular (para poder cambiarlos y evaluar)
const TEMP_CESE_THRESHOLD = 0.5
const HUM_CESE_THRESHOLD = 1.0

// Buffers deslizantes globales
const tempBatches: BatchSummary[] = []
const humBatches: BatchSummary[] = []
const luxBatches: BatchSummary[] = []

let createdCount = 0
let isTelemetryRainActive = false
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

  // 1. Evaluar Inicio de Lluvia
  if (!isTelemetryRainActive) {
    if (lastRainClosedAt !== null && timestampMs - lastRainClosedAt < 10 * 60 * 1000) return
    if (currentMinLux >= 26000) return

    const baseTemp1 = tempBatches[1].max
    const baseHum1 = humBatches[1].min
    const baseLux1 = luxBatches[1].max
    const dTemp1 = currentMinTemp - baseTemp1
    const dHum1 = currentMaxHum - baseHum1

    // Simular un trigger simple del Paso 1 diurno
    let triggered = false
    let triggerType = ''

    if (isDay) {
      if (baseLux1 <= 15000) {
        // Nublado
        if (dTemp1 <= -1.8 && dHum1 >= 6.0) {
          triggered = true
          triggerType = 'DAY_RAMA_A_NUBLADO_10M'
        }
      } else {
        // Soleado / Intermedio
        if (dTemp1 <= -2.5 && dHum1 >= 6.0) {
          triggered = true
          triggerType = 'DAY_RAMA_B_SOLEADO_10M'
        }
      }
    }

    if (triggered) {
      isTelemetryRainActive = true
      rainStartedAt = timestampMs
      minLuxInRain = currentMinLux
      minTempInRain = currentMinTemp
      maxHumInRain = currentMaxHum
      baselineLux = luxBatches[1].max
      baselineTemp = tempBatches[1].max
      baselineHum = humBatches[1].min
      Logger.success(
        `🌧️ [ INICIO DETECTADO ] ${new Date(timestampMs).toLocaleTimeString('es-VE')} - Tipo: ${triggerType}`,
      )
    }
  }

  // 2. Evaluar Cese de Lluvia
  if (isTelemetryRainActive) {
    const durationMin = (timestampMs - rainStartedAt!) / 60000

    if (durationMin >= 10) {
      const tSamples = tempBatches[0].samples
      const hSamples = humBatches[0].samples

      const firstTemp = tSamples[0]?.value ?? tempBatches[0].min
      const lastTemp = tSamples[tSamples.length - 1]?.value ?? tempBatches[0].min
      const netTempDrop = firstTemp - lastTemp

      const firstHum = hSamples[0]?.value ?? humBatches[0].min
      const lastHum = hSamples[hSamples.length - 1]?.value ?? humBatches[0].max
      const netHumRise = lastHum - firstHum

      const isSaturated = humBatches[0].max >= 100.0
      const isHumStagnant = isSaturated ? true : netHumRise <= HUM_CESE_THRESHOLD
      const isTempStagnant = netTempDrop <= TEMP_CESE_THRESHOLD

      let allowStagnantClose = true
      let caidaNeta20 = 0

      if (tempBatches.length >= 2) {
        const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)

        caidaNeta20 = maxTemp20 - tempBatches[0].min
        allowStagnantClose = caidaNeta20 <= 0.7
      }

      // Imprimir log de diagnóstico del estancamiento para evaluar entre 1:00 pm y 1:40 pm
      const d = new Date(timestampMs)
      const localHour = (d.getUTCHours() - 4 + 24) % 24
      const localMin = d.getUTCMinutes()
      const timeStr = d.toLocaleTimeString('es-VE')

      if ((localHour === 12 && localMin >= 50) || (localHour === 13 && localMin <= 20)) {
        Logger.info(
          `🔍 [EVAL ${timeStr}] Duración: ${durationMin.toFixed(0)}m | TempB0: ${firstTemp.toFixed(1)}->${lastTemp.toFixed(1)} (netTempDrop: ${netTempDrop.toFixed(2)}°C) | HumB0: ${firstHum.toFixed(1)}->${lastHum.toFixed(1)} (netHumRise: ${netHumRise.toFixed(2)}%) | MaxHum: ${humBatches[0].max.toFixed(1)}% | caidaNeta20: ${caidaNeta20.toFixed(2)}°C | HumStagnant: ${isHumStagnant} | TempStagnant: ${isTempStagnant} | allowStagnant: ${allowStagnantClose}`,
        )
      }

      if (isHumStagnant && isTempStagnant && allowStagnantClose) {
        isTelemetryRainActive = false
        lastRainClosedAt = timestampMs
        Logger.success(
          `☁️ [ EVENTO CERRADO — STAGNANT ] ${timeStr} (Duración: ${durationMin.toFixed(1)} min)`,
        )
        createdCount++
      }
    }
  }
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info(`  SIMULACIÓN EN DIRECTO — 24 de Julio de 2026`)
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

    const timestamps = Array.from(
      new Set([
        ...allSamples.temp.map((s) => s.timestamp),
        ...allSamples.hum.map((s) => s.timestamp),
        ...allSamples.lux.map((s) => s.timestamp),
      ]),
    ).sort((a, b) => a - b)

    for (const tMs of timestamps) {
      const buildBatch = (
        samples: Sample[],
        startOffsetMin: number,
        endOffsetMin: number,
      ): Sample[] => {
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
