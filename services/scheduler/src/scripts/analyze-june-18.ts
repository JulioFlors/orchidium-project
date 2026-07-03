import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-06-18T00:00:00.000Z')
  const endTime = new Date('2026-06-19T00:00:00.000Z')

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime.toISOString()}'
      AND time < '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)
  console.log('--- TELEMETRÍA DEL 18 DE JUNIO (12:00 PM - 1:00 PM CARACAS) ---')
  for await (const row of stream) {
    const d = new Date(row.time as string)
    const hour = (d.getUTCHours() - 4 + 24) % 24
    if (hour === 12) {
      console.log(
        `[${d.toLocaleTimeString('es-VE')}] Temp: ${row.temperature}°C | Hum: ${row.humidity}% | Lux: ${row.illuminance} lx`
      )
    }
  }
}

main().catch(console.error)
