import { influxClient } from '../lib/influx'

async function main() {
  const start = new Date('2026-07-09T12:50:00Z') // 08:50 am Caracas
  const end = new Date('2026-07-09T13:30:00Z') // 09:30 am Caracas

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${start.toISOString()}'
      AND time <= '${end.toISOString()}'
    ORDER BY time ASC
  `

  console.log('Querying InfluxDB...')
  const stream = influxClient.query(query)
  const rows: any[] = []

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`Found ${rows.length} rows:`)
  for (const r of rows) {
    const tLocal = new Date(r.time).toLocaleString('es-VE', { timeZone: 'America/Caracas' })

    console.log(
      `[${tLocal}] Temp: ${r.temperature?.toFixed(1)}°C, Hum: ${r.humidity?.toFixed(1)}%, Lux: ${r.illuminance?.toFixed(0)}`,
    )
  }
}

main().catch(console.error)
