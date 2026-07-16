import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  console.log(
    'Querying InfluxDB for July 9, 22:00:00 to July 10, 00:00:00 UTC (6:00pm to 8:00pm Caracas)...',
  )

  const query = `
    SELECT time, temperature, humidity, illuminance, rain_intensity
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-09T22:00:00Z'
      AND time <= '2026-07-10T00:00:00Z'
    ORDER BY time ASC
  `

  const samples: any[] = []
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

  console.log(`Found ${samples.length} telemetry samples.`)
  for (const s of samples) {
    const localStr = s.time.toLocaleString('es-VE', { timeZone: 'America/Caracas' })

    console.log(
      `[${localStr}] Temp: ${s.temperature != null ? s.temperature.toFixed(1) : 'N/A'}°C | Hum: ${s.humidity != null ? s.humidity.toFixed(1) : 'N/A'}% | Lux: ${s.illuminance != null ? s.illuminance.toFixed(0) : 'N/A'} | RainIntensity: ${s.rain_intensity}`,
    )
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
