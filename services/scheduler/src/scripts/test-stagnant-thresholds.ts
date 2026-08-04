import * as fs from 'fs'
import * as path from 'path'

import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'
import { isDaytime } from '../lib/rain-manager'

// Rango de prueba: últimos 30 días (desde el 24 de junio para incluir el primer evento registrado)
const START_DATE = new Date('2026-07-21T00:00:00.000Z')
const END_DATE = new Date('2026-07-24T23:59:59.999Z')

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

interface InferredEvent {
  startedAt: number
  endedAt: number
}

// Cargar la bitácora histórica
function loadRealEvents(): Array<{
  id: string
  startedAt: string
  endedAt: string
  description: string
}> {
  try {
    const resourcesDir = path.join(__dirname, 'resources')
    const logPath = path.join(resourcesDir, 'historical-observed-rain.json')

    if (fs.existsSync(logPath)) {
      return JSON.parse(fs.readFileSync(logPath, 'utf8'))
    }
  } catch (err) {
    Logger.error('Error al cargar la bitácora:', err)
  }

  return []
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

function runSimulation(
  allSamples: { temp: Sample[]; hum: Sample[]; lux: Sample[] },
  timestamps: number[],
  TEMP_CESE_THRESHOLD: number,
  HUM_CESE_THRESHOLD: number,
  GUARD_TEMP_THRESHOLD: number,
): InferredEvent[] {
  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []

  let isTelemetryRainActive = false
  let rainStartedAt: number | null = null
  let lastRainClosedAt: number | null = null

  const inferredEvents: InferredEvent[] = []

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

        luxBatchesLocal.push({
          min: minLuxAvg,
          max: Math.max(...luxVals),
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

    const currentMinTemp = tempBatches[0].min
    const currentMaxHum = humBatches[0].max
    const currentMinLux = luxBatches[0].min
    const isDay = isDaytime(tMs)

    if (isDay && luxBatches[0].max === 0 && luxBatches[0].samples.every((s) => s.value === 0)) {
      continue
    }

    // 1. Trigger Inicio
    if (!isTelemetryRainActive) {
      if (lastRainClosedAt !== null && tMs - lastRainClosedAt < 10 * 60 * 1000) continue
      if (currentMinLux >= 26000) continue

      const baseTemp1 = tempBatches[1].max
      const baseHum1 = humBatches[1].min
      const baseLux1 = luxBatches[1].max
      const dTemp1 = currentMinTemp - baseTemp1
      const dHum1 = currentMaxHum - baseHum1

      let triggered = false

      if (isDay) {
        if (baseLux1 <= 15000) {
          if (dTemp1 <= -1.8 && dHum1 >= 6.0) triggered = true
        } else {
          if (dTemp1 <= -2.5 && dHum1 >= 6.0) triggered = true
        }
      } else {
        if (dTemp1 <= -1.0 && dHum1 >= 3.0) triggered = true
      }

      if (triggered) {
        isTelemetryRainActive = true
        rainStartedAt = tMs
      }
    }

    // 2. Trigger Cese
    if (isTelemetryRainActive) {
      const durationMin = (tMs - rainStartedAt!) / 60000

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

        if (tempBatches.length >= 2) {
          const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)
          const caidaNeta20 = maxTemp20 - tempBatches[0].min

          allowStagnantClose = caidaNeta20 <= GUARD_TEMP_THRESHOLD
        }

        if (isHumStagnant && isTempStagnant && allowStagnantClose) {
          isTelemetryRainActive = false
          lastRainClosedAt = tMs
          inferredEvents.push({ startedAt: rainStartedAt!, endedAt: tMs })
        }
      }
    }
  }

  // Cerrar evento pendiente si lo hay al final
  if (isTelemetryRainActive && rainStartedAt) {
    inferredEvents.push({ startedAt: rainStartedAt, endedAt: timestamps[timestamps.length - 1] })
  }

  return inferredEvents
}

function evaluateRecall(
  realEvents: Record<string, unknown>[],
  inferredEvents: InferredEvent[],
): { recall: number; fn: Record<string, unknown>[] } {
  let truePositives = 0
  const falseNegatives: Record<string, unknown>[] = []

  for (const re of realEvents) {
    const reStart = new Date(re.startedAt).getTime()
    const reEnd = new Date(re.endedAt).getTime()

    const detected = inferredEvents.some((inf) => {
      return inf.startedAt <= reEnd && inf.endedAt >= reStart
    })

    if (detected) {
      truePositives++
    } else {
      falseNegatives.push(re)
    }
  }

  const recall = realEvents.length > 0 ? (truePositives / realEvents.length) * 100 : 0

  return { recall, fn: falseNegatives }
}

async function main() {
  Logger.info('════════════════════════════════════════════════════════')
  Logger.info('  EXPERIMENTACIÓN DE UMBRALES DE ESTANCAMIENTO')
  Logger.info('════════════════════════════════════════════════════════')

  // 1. Cargar Lluvias Reales
  const realEvents = loadRealEvents()

  Logger.info(`Lluvias reales cargadas de la bitácora: ${realEvents.length}`)

  // 2. Cargar Telemetría de 30 días
  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${START_DATE.toISOString()}'
      AND time <= '${END_DATE.toISOString()}'
    ORDER BY time ASC
  `

  Logger.info(`Recuperando telemetría desde ${START_DATE.toLocaleDateString()}...`)
  const allSamples: { temp: Sample[]; hum: Sample[]; lux: Sample[] } = {
    temp: [],
    hum: [],
    lux: [],
  }

  let rowCount = 0
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
  Logger.info(`Muestras leídas de InfluxDB: ${rowCount}`)

  const timestamps = Array.from(
    new Set([
      ...allSamples.temp.map((s) => s.timestamp),
      ...allSamples.hum.map((s) => s.timestamp),
      ...allSamples.lux.map((s) => s.timestamp),
    ]),
  ).sort((a, b) => a - b)

  // Filtrar eventos reales relevantes para el rango analizado
  const relevantRealEvents = realEvents.filter((re) => {
    const reStart = new Date(re.startedAt).getTime()

    return reStart >= START_DATE.getTime() && reStart <= END_DATE.getTime()
  })

  // 3. Ejecutar los dos escenarios de simulación
  Logger.info('\n🧪 3.1 Ejecutando Escenario ACTUAL (Umbrales de 0.4°C)...')
  const eventsActual = runSimulation(allSamples, timestamps, 0.4, 1.0, 0.4)
  const statsActual = evaluateRecall(relevantRealEvents, eventsActual)

  Logger.info('\n🧪 3.2 Ejecutando Escenario PROPUESTO (Estancamiento 0.5°C | Guardia 0.6°C)...')
  const eventsProp1 = runSimulation(allSamples, timestamps, 0.5, 1.0, 0.6)
  const statsProp1 = evaluateRecall(relevantRealEvents, eventsProp1)

  Logger.info('\n🧪 3.3 Ejecutando Escenario OPTIMIZADO (Estancamiento 0.5°C | Guardia 0.7°C)...')
  const eventsProp2 = runSimulation(allSamples, timestamps, 0.5, 1.0, 0.7)
  const statsProp2 = evaluateRecall(relevantRealEvents, eventsProp2)

  Logger.info('\n🧪 3.4 Ejecutando Escenario AGRESIVO (Estancamiento 0.5°C | Guardia 0.8°C)...')
  const eventsProp3 = runSimulation(allSamples, timestamps, 0.5, 1.0, 0.8)
  const statsProp3 = evaluateRecall(relevantRealEvents, eventsProp3)

  // 4. Evaluar duración del evento de hoy (24 de julio)
  // Busquemos los eventos de hoy (2026-07-24)
  const getTodayEventStr = (events: InferredEvent[]): string => {
    const todayEvents = events.filter((e) => {
      const localDateStr = new Date(e.startedAt).toLocaleDateString('en-CA', {
        timeZone: 'America/Caracas',
      })

      return localDateStr === '2026-07-24'
    })

    if (todayEvents.length === 0) return 'No detectado'

    return todayEvents
      .map((event) => {
        const durMin = (event.endedAt - event.startedAt) / 60000
        const startStr = new Date(event.startedAt).toLocaleTimeString('es-VE', {
          timeZone: 'America/Caracas',
        })
        const endStr = new Date(event.endedAt).toLocaleTimeString('es-VE', {
          timeZone: 'America/Caracas',
        })

        return `\n     * ${startStr} a ${endStr} (Duración: ${durMin.toFixed(1)} min)`
      })
      .join('')
  }

  // 5. Mostrar Informe Comparativo Final
  console.log('\n============================================================')
  console.log('       INFORME COMPARATIVO DE CALIBRACIÓN DE CESE')
  console.log('============================================================')
  console.log(` Escenario A: ACTUAL (Estancamiento ≤0.4°C | Guardia ≤0.4°C)`)
  console.log(`   - Eventos Inferidos totales: ${eventsActual.length}`)
  console.log(
    `   - Sensibilidad (Recall): ${statsActual.recall.toFixed(1)}% (${relevantRealEvents.length - statsActual.fn.length}/${relevantRealEvents.length})`,
  )
  console.log(`   - Lluvias de HOY (24 de Julio): ${getTodayEventStr(eventsActual)}`)
  console.log(' -----------------------------------------------------------')
  console.log(` Escenario B: PROPUESTO (Estancamiento ≤0.5°C | Guardia ≤0.6°C)`)
  console.log(`   - Eventos Inferidos totales: ${eventsProp1.length}`)
  console.log(
    `   - Sensibilidad (Recall): ${statsProp1.recall.toFixed(1)}% (${relevantRealEvents.length - statsProp1.fn.length}/${relevantRealEvents.length})`,
  )
  console.log(`   - Lluvias de HOY (24 de Julio): ${getTodayEventStr(eventsProp1)}`)
  console.log(' -----------------------------------------------------------')
  console.log(` Escenario C: OPTIMIZADO (Estancamiento ≤0.5°C | Guardia ≤0.7°C)`)
  console.log(`   - Eventos Inferidos totales: ${eventsProp2.length}`)
  console.log(
    `   - Sensibilidad (Recall): ${statsProp2.recall.toFixed(1)}% (${relevantRealEvents.length - statsProp2.fn.length}/${relevantRealEvents.length})`,
  )
  console.log(`   - Lluvias de HOY (24 de Julio): ${getTodayEventStr(eventsProp2)}`)
  console.log(' -----------------------------------------------------------')
  console.log(` Escenario D: AGRESIVO (Estancamiento ≤0.5°C | Guardia ≤0.8°C)`)
  console.log(`   - Eventos Inferidos totales: ${eventsProp3.length}`)
  console.log(
    `   - Sensibilidad (Recall): ${statsProp3.recall.toFixed(1)}% (${relevantRealEvents.length - statsProp3.fn.length}/${relevantRealEvents.length})`,
  )
  console.log(`   - Lluvias de HOY (24 de Julio): ${getTodayEventStr(eventsProp3)}`)
  console.log('============================================================\n')

  if (statsProp2.fn.length > 0) {
    Logger.warn('Lluvias reales omitidas en Escenario Optimizado (FN):')
    for (const fn of statsProp2.fn) {
      Logger.warn(`  - [${fn.startedAt}]: ${fn.description}`)
    }
  }
}

main().catch((err) => {
  Logger.error('Error fatal:', err)
})
