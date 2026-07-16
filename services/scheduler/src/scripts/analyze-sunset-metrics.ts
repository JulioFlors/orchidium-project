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

function pushBatchMetrics(queue: BatchSummary[], sample: Sample) {
  const now = sample.timestamp

  if (queue.length === 0 || now - queue[0].timestamp >= 10 * 60 * 1000) {
    queue.unshift({ min: sample.value, max: sample.value, timestamp: now, samples: [sample] })
    if (queue.length > 6) queue.pop()
  } else {
    queue[0].samples.push(sample)
    queue[0].samples = queue[0].samples.filter((s) => now - s.timestamp < 10 * 60 * 1000)
    const values = queue[0].samples.map((s) => s.value)

    queue[0].min = Math.min(...values)
    queue[0].max = Math.max(...values)
  }
}

async function main() {
  console.log('Running detailed gradient analysis for July 9, 6:30pm to 8:00pm Caracas time...')

  const query = `
    SELECT time, temperature, humidity
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-09T22:30:00Z'
      AND time <= '2026-07-10T00:00:00Z'
    ORDER BY time ASC
  `

  const rows: any[] = []
  const stream = influxClient.query(query)

  for await (const row of stream) {
    rows.push(row)
  }

  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []

  console.log('\nMinute-by-minute calculations:')
  console.log(
    '---------------------------------------------------------------------------------------------------------------------',
  )
  console.log(
    'Time      | Temp  | Hum   | varTPre | tDropTh | varTCur | trendT  | varHPre | hRiseTh | varHCur | trendH  | Triggered',
  )
  console.log(
    '---------------------------------------------------------------------------------------------------------------------',
  )

  for (const row of rows) {
    const tMs = rowTimeToDate(row.time).getTime()

    if (row.temperature == null || row.humidity == null) continue

    const tempVal = Number(row.temperature)
    const humVal = Number(row.humidity)

    pushBatchMetrics(tempBatches, { timestamp: tMs, value: tempVal })
    pushBatchMetrics(humBatches, { timestamp: tMs, value: humVal })

    if (tempBatches.length < 4 || humBatches.length < 4) continue

    const currentMinTemp = tempBatches[0].samples[tempBatches[0].samples.length - 1].value
    const currentMaxHum = humBatches[0].samples[humBatches[0].samples.length - 1].value

    // Pre-calm (Batches 1, 2, 3)
    const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
    const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
    const varTempPre = maxTempPre - minTempPre

    const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
    const maxHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
    const varHumPre = maxHumPre - minHumPre

    // Current window (Batches 0, 1, 2)
    const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
    const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
    const varTempCur = maxTempCur - minTempCur

    const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
    const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
    const varHumCur = maxHumCur - minHumCur

    // Thresholds
    const tempDropThreshold = Math.max(0.7, varTempPre * 1.8)
    const humRiseThreshold = Math.max(3.0, varHumPre * 1.6)

    // Trends
    const trendTemp = tempBatches[0].min - tempBatches[2].max
    const isTempFalling = trendTemp < -0.1

    const trendHum = humBatches[0].max - humBatches[2].min
    const isHumRising = trendHum > 0.5

    const isTempDropAbrupt = varTempCur >= tempDropThreshold && isTempFalling
    const isHumRiseAbrupt = varHumCur >= humRiseThreshold && isHumRising
    const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

    const triggered = isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)

    const timeStr = new Date(tMs).toLocaleString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Caracas',
    })

    console.log(
      `${timeStr} | ${tempVal.toFixed(1)}°C | ${humVal.toFixed(1)}% | ` +
        `${varTempPre.toFixed(2)}    | ${tempDropThreshold.toFixed(2)}    | ${varTempCur.toFixed(2)}    | ${trendTemp.toFixed(2)}   | ` +
        `${varHumPre.toFixed(2)}    | ${humRiseThreshold.toFixed(2)}    | ${varHumCur.toFixed(2)}    | ${trendHum.toFixed(2)}   | ` +
        `${triggered ? 'YES' : 'NO'}`,
    )
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
