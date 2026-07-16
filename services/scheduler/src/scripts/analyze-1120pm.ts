import { prisma } from '@package/database'

import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

interface MetricSample {
  time: Date
  temperature: number | null
  humidity: number | null
  illuminance: number | null
  rain_intensity: number | null
}

async function main() {
  console.log(
    'Querying InfluxDB for July 10, 02:00:00 to 03:35:00 UTC (10:00pm to 11:35pm Caracas)...',
  )

  const query = `
    SELECT time, temperature, humidity, illuminance, rain_intensity
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-10T02:00:00Z'
      AND time <= '2026-07-10T03:35:00Z'
    ORDER BY time ASC
  `

  const samples: MetricSample[] = []

  try {
    const stream = influxClient.query(query)

    for await (const row of stream) {
      samples.push({
        time: rowTimeToDate(row.time),
        temperature: row.temperature != null ? Number(row.temperature) : null,
        humidity: row.humidity != null ? Number(row.humidity) : null,
        illuminance: row.illuminance != null ? Number(row.illuminance) : null,
        rain_intensity: row.rain_intensity != null ? Number(row.rain_intensity) : null,
      })
    }
  } catch (err) {
    console.error('Error querying influx:', err)
    process.exit(1)
  }

  console.log(`Found ${samples.length} telemetry samples in this window.`)
  if (samples.length === 0) {
    console.log('No data found.')
    process.exit(0)
  }

  // Print all samples
  console.log('\n--- Telemetry Samples (Caracas Local Time) ---')
  for (const s of samples) {
    const localStr = s.time.toLocaleString('es-VE', { timeZone: 'America/Caracas' })

    console.log(
      `[${localStr}] Temp: ${s.temperature != null ? s.temperature.toFixed(1) : 'N/A'}°C | Hum: ${s.humidity != null ? s.humidity.toFixed(1) : 'N/A'}% | Lux: ${s.illuminance != null ? s.illuminance.toFixed(0) : 'N/A'} | RainIntensity: ${s.rain_intensity}`,
    )
  }

  // Check if physical rain triggered or if there was any rain_intensity > 0
  const physicalRainSamples = samples.filter(
    (s) => s.rain_intensity != null && s.rain_intensity > 0,
  )

  console.log(`\nSamples with physical rain (rain_intensity > 0): ${physicalRainSamples.length}`)

  // Let's also check if there are any virtual rain events registered in PostgreSQL for this window
  const dbEvents = await prisma.rainEvent.findMany({
    where: {
      startedAt: {
        gte: new Date('2026-07-10T02:00:00Z'),
        lte: new Date('2026-07-10T03:35:00Z'),
      },
    },
  })

  console.log(`\nVirtual rain events in DB during this window: ${dbEvents.length}`)
  for (const ev of dbEvents) {
    console.log(
      `- Event ID: ${ev.id} started at ${ev.startedAt.toISOString()} | Closed: ${ev.endedAt?.toISOString()} | Type: ${ev.triggerType}`,
    )
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
    await prisma.$disconnect()
  })
