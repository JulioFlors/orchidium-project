import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)
  if (isNaN(Number(s))) return new Date(s)
  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

interface Sample {
  timestamp: number
  value: number
}

interface BatchSummary {
  min: number
  max: number
  timestamp: number
  samples: Sample[]
}

function pushBatchMetrics(queue: BatchSummary[], samples: Sample[], timestamp: number, isLux = false) {
  const values = samples.map((s) => s.value)
  let min = Math.min(...values)
  let max = Math.max(...values)

  if (isLux && values.length > 0) {
    const sortedAsc = [...values].sort((a, b) => a - b)
    const low5 = sortedAsc.slice(0, Math.min(5, sortedAsc.length))
    min = low5.reduce((sum, val) => sum + val, 0) / low5.length
    max = values.reduce((sum, val) => sum + val, 0) / values.length
  }

  queue.unshift({ min, max, timestamp, samples })
  if (queue.length > 6) queue.pop()
}

async function main() {
  console.log('=== SIMULACIÓN COMPARATIVA DE VARIABILIDAD Y MULTIPLICADORES ===')
  console.log('Rango: 9 de Julio, 6:00 pm (22:00 UTC) a 8:00 pm (00:00 UTC)')
  
  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-09T22:00:00Z'
      AND time <= '2026-07-10T00:00:00Z'
    ORDER BY time ASC
  `

  const rows: any[] = []
  const stream = influxClient.query(query)
  for await (const row of stream) {
    rows.push(row)
  }

  // Pre-cargar datos anteriores para poblar las colas b1, b2, b3
  const preQuery = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-09T21:00:00Z'
      AND time < '2026-07-09T22:00:00Z'
    ORDER BY time ASC
  `
  const preRows: any[] = []
  const preStream = influxClient.query(preQuery)
  for await (const row of preStream) {
    preRows.push(row)
  }

  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []

  // Pre-poblar los lotes históricos de 10 min
  const INTERVAL_MS = 10 * 60 * 1000
  let currentStartMs = 0
  let tempSamples: Sample[] = []
  let humSamples: Sample[] = []

  for (const row of preRows) {
    const tMs = rowTimeToDate(row.time).getTime()
    if (currentStartMs === 0) currentStartMs = tMs

    if (tMs - currentStartMs >= INTERVAL_MS) {
      pushBatchMetrics(tempBatches, tempSamples, currentStartMs)
      pushBatchMetrics(humBatches, humSamples, currentStartMs)
      tempSamples = []
      humSamples = []
      currentStartMs = tMs
    }

    if (row.temperature != null) tempSamples.push({ timestamp: tMs, value: Number(row.temperature) })
    if (row.humidity != null) humSamples.push({ timestamp: tMs, value: Number(row.humidity) })
  }

  // Reset del agrupador para la ventana real
  currentStartMs = 0
  tempSamples = []
  humSamples = []

  for (const row of rows) {
    const tMs = rowTimeToDate(row.time).getTime()
    if (currentStartMs === 0) currentStartMs = tMs

    if (tMs - currentStartMs >= INTERVAL_MS) {
      evaluateAndPrint(currentStartMs, tempBatches, humBatches)

      pushBatchMetrics(tempBatches, tempSamples, currentStartMs)
      pushBatchMetrics(humBatches, humSamples, currentStartMs)

      tempSamples = []
      humSamples = []
      currentStartMs = tMs
    }

    if (row.temperature != null) tempSamples.push({ timestamp: tMs, value: Number(row.temperature) })
    if (row.humidity != null) humSamples.push({ timestamp: tMs, value: Number(row.humidity) })
  }
}

function evaluateAndPrint(
  timestampMs: number,
  tempBatches: BatchSummary[],
  humBatches: BatchSummary[]
) {
  if (tempBatches.length < 4 || humBatches.length < 4) return

  const localTime = new Date(timestampMs).toLocaleString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Caracas',
  })

  // Lote actual b0
  const currentMinTemp = tempBatches[0].min
  const currentMaxHum = humBatches[0].max

  // Variabilidad previa en b1, b2, b3
  const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
  const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
  const varTempPre = maxTempPre - minTempPre

  const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
  const maxHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
  const varHumPre = maxHumPre - minHumPre

  // Cambio actual en b0, b1, b2
  const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
  const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
  const varTempCur = maxTempCur - minTempCur

  const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
  const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
  const varHumCur = maxHumCur - minHumCur

  const trendTemp = tempBatches[0].min - tempBatches[2].max
  const isTempFalling = trendTemp < -0.1

  const trendHum = humBatches[0].max - humBatches[2].min
  const isHumRising = trendHum > 0.5

  const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

  console.log(`\n========================================================================`)
  console.log(`Evaluación Lote: ${localTime} | Temp Mín B0: ${currentMinTemp}°C | Hum Máx B0: ${currentMaxHum}%`)
  console.log(`Variabilidad Previa (b1,b2,b3) -> varTempPre: ${varTempPre.toFixed(2)}°C | varHumPre: ${varHumPre.toFixed(2)}%`)
  console.log(`Cambio Actual (b0,b1,b2)       -> varTempCur: ${varTempCur.toFixed(2)}°C | varHumCur: ${varHumCur.toFixed(2)}%`)
  console.log(`Tendencias -> Caída Temp: ${isTempFalling} (${trendTemp.toFixed(2)}) | Subida Hum: ${isHumRising} (+${trendHum.toFixed(2)}) | PreSaturado: ${isPreSaturated}`)

  // 1. Configuración Original (T: 1.8, H: 1.6)
  const tFloorOrig = minHumPre >= 98.0 ? 0.8 : 0.7
  const tThresholdOrig = Math.max(tFloorOrig, varTempPre * 1.8)
  const hThresholdOrig = Math.max(3.0, varHumPre * 1.6)
  const triggeredOrig = (varTempCur >= tThresholdOrig && isTempFalling) && 
                        ((varHumCur >= hThresholdOrig && isHumRising) || isPreSaturated)

  // 2. Configuración Sensibilidad A (-2 puntos: T: 1.6, H: 1.4)
  const tThresholdA = Math.max(tFloorOrig, varTempPre * 1.6)
  const hThresholdA = Math.max(3.0, varHumPre * 1.4)
  const triggeredA = (varTempCur >= tThresholdA && isTempFalling) && 
                      ((varHumCur >= hThresholdA && isHumRising) || isPreSaturated)

  // 3. Configuración Sensibilidad B (-4 puntos: T: 1.4, H: 1.2)
  const tThresholdB = Math.max(tFloorOrig, varTempPre * 1.4)
  const hThresholdB = Math.max(3.0, varHumPre * 1.2)
  const triggeredB = (varTempCur >= tThresholdB && isTempFalling) && 
                      ((varHumCur >= hThresholdB && isHumRising) || isPreSaturated)

  console.log(`  ----------------------------------------------------------------------`)
  console.log(`  [ORIGINAL] Mult T: 1.8 | H: 1.6 -> Req dT: ${tThresholdOrig.toFixed(2)} | Req dH: ${hThresholdOrig.toFixed(2)} -> DISPARA: ${triggeredOrig ? 'SÍ' : 'NO'}`)
  console.log(`  [SIM A -2] Mult T: 1.6 | H: 1.4 -> Req dT: ${tThresholdA.toFixed(2)} | Req dH: ${hThresholdA.toFixed(2)} -> DISPARA: ${triggeredA ? 'SÍ' : 'NO'}`)
  console.log(`  [SIM B -4] Mult T: 1.4 | H: 1.2 -> Req dT: ${tThresholdB.toFixed(2)} | Req dH: ${hThresholdB.toFixed(2)} -> DISPARA: ${triggeredB ? 'SÍ' : 'NO'}`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
