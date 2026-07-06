import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-07-06T12:30:00.000Z')
  const endTime = new Date('2026-07-06T13:10:00.000Z')

  const query = `
    SELECT time, temperature, humidity, illuminance, zone, source, context
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime.toISOString()}'
      AND time <= '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  console.log(
    `📡 Consultando telemetría de ${startTime.toISOString()} a ${endTime.toISOString()}...`,
  )
  const stream = influxClient.query(query)
  const rows: any[] = []

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`📊 Muestras recuperadas: ${rows.length}`)
  console.log(JSON.stringify(rows, null, 2))
}

main().catch(console.error)
