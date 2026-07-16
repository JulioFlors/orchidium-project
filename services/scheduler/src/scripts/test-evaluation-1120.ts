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

// Emulates pushBatchMetrics for 10-minute sliding windows (sliding by 1 minute)
function pushBatchMetrics(queue: BatchSummary[], sample: Sample, isLux = false) {
  const now = sample.timestamp

  // If queue is empty or the latest batch is older than 10 minutes, create a new batch
  if (queue.length === 0 || now - queue[0].timestamp >= 10 * 60 * 1000) {
    queue.unshift({
      min: sample.value,
      max: sample.value,
      timestamp: now,
      samples: [sample],
    })
    if (queue.length > 6) queue.pop()
  } else {
    // Otherwise, append to current batch
    queue[0].samples.push(sample)
    // Keep only samples from the last 10 minutes inside this batch
    queue[0].samples = queue[0].samples.filter((s) => now - s.timestamp < 10 * 60 * 1000)

    const values = queue[0].samples.map((s) => s.value)

    if (isLux && values.length > 0) {
      queue[0].min = Math.min(...values) // Simplified for test
      queue[0].max = values.reduce((sum, val) => sum + val, 0) / values.length
    } else {
      queue[0].min = Math.min(...values)
      queue[0].max = Math.max(...values)
    }
  }
}

async function main() {
  console.log(
    'Minute-by-minute simulation from 11:00pm (03:00 UTC) to 11:45pm (03:45 UTC) July 10...',
  )

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-10T03:00:00Z'
      AND time <= '2026-07-10T03:45:00Z'
    ORDER BY time ASC
  `

  const rows: any[] = []
  const stream = influxClient.query(query)

  for await (const row of stream) {
    rows.push(row)
  }

  // We need to pre-populate batches 1, 2, 3 using data from 10:00pm to 11:00pm
  const preQuery = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-10T02:00:00Z'
      AND time < '2026-07-10T03:00:00Z'
    ORDER BY time ASC
  `
  const preRows: any[] = []
  const preStream = influxClient.query(preQuery)

  for await (const row of preStream) {
    preRows.push(row)
  }

  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []
  const luxBatches: BatchSummary[] = []

  // Pre-populate sliding window
  for (const row of preRows) {
    const tMs = rowTimeToDate(row.time).getTime()

    if (row.temperature != null)
      pushBatchMetrics(tempBatches, { timestamp: tMs, value: Number(row.temperature) })
    if (row.humidity != null)
      pushBatchMetrics(humBatches, { timestamp: tMs, value: Number(row.humidity) })
    if (row.illuminance != null)
      pushBatchMetrics(luxBatches, { timestamp: tMs, value: Number(row.illuminance) }, true)
  }

  console.log(`Pre-population complete. Temp batches count: ${tempBatches.length}`)

  // Evaluate minute by minute
  for (const row of rows) {
    const tDate = rowTimeToDate(row.time)
    const tMs = tDate.getTime()

    if (row.temperature != null)
      pushBatchMetrics(tempBatches, { timestamp: tMs, value: Number(row.temperature) })
    if (row.humidity != null)
      pushBatchMetrics(humBatches, { timestamp: tMs, value: Number(row.humidity) })
    if (row.illuminance != null)
      pushBatchMetrics(luxBatches, { timestamp: tMs, value: Number(row.illuminance) }, true)

    evaluate(tMs, tempBatches, humBatches, luxBatches)
  }
}

function evaluate(
  timestampMs: number,
  tempBatches: BatchSummary[],
  humBatches: BatchSummary[],
  luxBatches: BatchSummary[],
) {
  if (tempBatches.length < 4 || humBatches.length < 4) return

  const localTime = new Date(timestampMs).toLocaleString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Caracas',
  })

  // 1. Current minute values
  const currentMinTemp = tempBatches[0].samples[tempBatches[0].samples.length - 1]?.value
  const currentMaxHum = humBatches[0].samples[humBatches[0].samples.length - 1]?.value

  if (currentMinTemp == null || currentMaxHum == null) return

  // 2. Pre-calm statistics (Batches 1, 2, 3)
  const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
  const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
  const varTempPre = maxTempPre - minTempPre

  const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
  const maxHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
  const varHumPre = maxHumPre - minHumPre

  // 3. Current window statistics (Batches 0, 1, 2)
  const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
  const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
  const varTempCur = maxTempCur - minTempCur

  const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
  const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
  const varHumCur = maxHumCur - minHumCur

  // --- ORIGINAL CONFIGURATION ---
  const tempFloorOrig = minHumPre >= 98.0 ? 0.8 : 0.7
  const tempDropThresholdOrig = Math.max(tempFloorOrig, varTempPre * 1.8)
  const humRiseThresholdOrig = Math.max(3.0, varHumPre * 1.6)

  const trendTempOrig = tempBatches[0].min - tempBatches[2].max
  const isTempFallingOrig = trendTempOrig < -0.1
  const trendHumOrig = humBatches[0].max - humBatches[2].min
  const isHumRisingOrig = trendHumOrig > 0.5

  const isTempDropAbruptOrig = varTempCur >= tempDropThresholdOrig && isTempFallingOrig
  const isHumRiseAbruptOrig = varHumCur >= humRiseThresholdOrig && isHumRisingOrig
  const isPreSaturatedOrig = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0
  const triggerOrig = isTempDropAbruptOrig && (isHumRiseAbruptOrig || isPreSaturatedOrig)

  // --- OPTIMIZED MORE REACTIVE CONFIGURATION ---
  const tempFloorOpt = minHumPre >= 98.0 ? 0.6 : 0.5 // Lowered minimum temp floor slightly
  const tempDropThresholdOpt = Math.max(tempFloorOpt, varTempPre * 1.3) // Lowered multiplier 1.8 -> 1.3
  const humRiseThresholdOpt = Math.max(2.5, varHumPre * 1.2) // Lowered min rise 3.0 -> 2.5 and multiplier 1.6 -> 1.2

  const trendTempOpt = tempBatches[0].min - tempBatches[2].max
  const isTempFallingOpt = trendTempOpt < -0.05 // More sensitive to temp falling trend
  const trendHumOpt = humBatches[0].max - humBatches[2].min
  const isHumRisingOpt = trendHumOpt > 0.3 // More sensitive to hum rising trend

  const isTempDropAbruptOpt = varTempCur >= tempDropThresholdOpt && isTempFallingOpt
  const isHumRiseAbruptOpt = varHumCur >= humRiseThresholdOpt && isHumRisingOpt
  const triggerOpt = isTempDropAbruptOpt && (isHumRiseAbruptOpt || isPreSaturatedOrig)

  if (triggerOrig || triggerOpt) {
    console.log(
      `[${localTime}] Temp: ${currentMinTemp.toFixed(1)}°C | Hum: ${currentMaxHum.toFixed(1)}%`,
    )
    console.log(
      `  ORIGINAL -> Trigger: ${triggerOrig} (Required DT: ${tempDropThresholdOrig.toFixed(2)}, Actual DT: ${varTempCur.toFixed(2)} | Required DH: ${humRiseThresholdOrig.toFixed(2)}, Actual DH: ${varHumCur.toFixed(2)})`,
    )
    console.log(
      `  OPTIMIZED -> Trigger: ${triggerOpt} (Required DT: ${tempDropThresholdOpt.toFixed(2)}, Actual DT: ${varTempCur.toFixed(2)} | Required DH: ${humRiseThresholdOpt.toFixed(2)}, Actual DH: ${varHumCur.toFixed(2)})`,
    )
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
