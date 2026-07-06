import { influxClient } from '../lib/influx'

async function main() {
  // 10:00 AM Caracas = 14:00 UTC
  // 11:15 AM Caracas = 15:15 UTC
  const startTime = new Date('2026-07-03T14:00:00.000Z')
  const endTime = new Date('2026-07-03T15:15:00.000Z')

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime.toISOString()}'
      AND time < '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)

  console.log('--- TELEMETRÍA DEL 3 DE JULIO (10:00 AM - 11:15 AM CARACAS) ---')
  for await (const row of stream) {
    const d = new Date(row.time as string)

    console.log(
      `[${d.toLocaleTimeString('es-VE')}] Temp: ${row.temperature}°C | Hum: ${row.humidity}% | Lux: ${row.illuminance} lx`,
    )
  }
}

main().catch(console.error)
