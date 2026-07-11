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

function pushBatchMetrics(queue: BatchSummary[], sample: Sample, isLux = false) {
  const now = sample.timestamp
  if (queue.length === 0 || now - queue[0].timestamp >= 10 * 60 * 1000) {
    queue.unshift({ min: sample.value, max: sample.value, timestamp: now, samples: [sample] })
    if (queue.length > 6) queue.pop()
  } else {
    queue[0].samples.push(sample)
    queue[0].samples = queue[0].samples.filter(s => now - s.timestamp < 10 * 60 * 1000)
    const values = queue[0].samples.map(s => s.value)
    queue[0].min = Math.min(...values)
    queue[0].max = Math.max(...values)
  }
}

async function simulateForFloor(tempFloor: number) {
  // Query from 5:30pm (21:30 UTC) to 8:30pm (00:30 UTC) July 9/10
  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-09T21:30:00Z'
      AND time <= '2026-07-10T00:30:00Z'
    ORDER BY time ASC
  `

  const rows: any[] = []
  const stream = influxClient.query(query)
  for await (const row of stream) {
    rows.push(row)
  }

  const tempBatches: BatchSummary[] = []
  const humBatches: BatchSummary[] = []

  let triggerTime: string | null = null

  for (const row of rows) {
    const tMs = rowTimeToDate(row.time).getTime()
    if (row.temperature == null || row.humidity == null) continue

    pushBatchMetrics(tempBatches, { timestamp: tMs, value: Number(row.temperature) })
    pushBatchMetrics(humBatches, { timestamp: tMs, value: Number(row.humidity) })

    if (tempBatches.length < 4 || humBatches.length < 4) continue

    const currentMinTemp = tempBatches[0].samples[tempBatches[0].samples.length - 1].value
    const currentMaxHum = humBatches[0].samples[humBatches[0].samples.length - 1].value

    const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
    const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
    const varTempPre = maxTempPre - minTempPre

    const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
    const varHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max) - minHumPre

    const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
    const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
    const varTempCur = maxTempCur - minTempCur

    const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
    const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
    const varHumCur = maxHumCur - minHumCur

    const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.8)
    const humRiseThreshold = Math.max(3.0, varHumPre * 1.6)

    const trendTemp = tempBatches[0].min - tempBatches[2].max
    const isTempFalling = trendTemp < -0.1
    const trendHum = humBatches[0].max - humBatches[2].min
    const isHumRising = trendHum > 0.5

    const isTempDropAbrupt = varTempCur >= tempDropThreshold && isTempFalling
    const isHumRiseAbrupt = varHumCur >= humRiseThreshold && isHumRising
    const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

    if (isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
      triggerTime = new Date(tMs).toLocaleString('es-VE', { timeZone: 'America/Caracas' })
      break
    }
  }

  console.log(`With tempFloor = ${tempFloor}°C -> Event triggered at: ${triggerTime || 'DID NOT TRIGGER'}`)
}

async function main() {
  await simulateForFloor(0.7)
  await simulateForFloor(1.0)
  await simulateForFloor(1.2)
  await simulateForFloor(1.5)
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
