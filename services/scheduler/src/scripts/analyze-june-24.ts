import { influxClient } from '../lib/influx'

async function main() {
  // 10:45 AM Caracas = 14:45 UTC
  // 11:25 AM Caracas = 15:25 UTC
  const startTime = new Date('2026-06-24T14:45:00.000Z')
  const endTime = new Date('2026-06-24T15:25:00.000Z')

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime.toISOString()}'
      AND time < '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)
  console.log('--- TELEMETRÍA DEL 24 DE JUNIO (10:45 AM - 11:25 AM CARACAS) ---')
  for await (const row of stream) {
    const d = new Date(row.time as string)
    console.log(
      `[${d.toLocaleTimeString('es-VE')}] Temp: ${row.temperature}°C | Hum: ${row.humidity}% | Lux: ${row.illuminance} lx`
    )
  }
}

main().catch(console.error)
