import { influxClient } from '../lib/influx'

async function main() {
  console.log('Consultando telemetría de InfluxDB para hoy 29 de junio (2:30 PM - 3:45 PM)...')
  const startTime = '2026-06-29T18:30:00Z' // 2:30 PM Caracas es 18:30 UTC
  const endTime = '2026-06-29T19:45:00Z' // 3:45 PM Caracas es 19:45 UTC

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime}'
      AND time <= '${endTime}'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)
  console.log('Hora Caracas | Temp (°C) | Hum (%) | Lux')
  console.log('-------------------------------------------')
  for await (const row of stream) {
    const date = new Date(row.time)
    const timeStr = date.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const temp = row.temperature != null ? Number(row.temperature).toFixed(2) : 'null'
    const hum = row.humidity != null ? Number(row.humidity).toFixed(2) : 'null'
    const lux = row.illuminance != null ? Number(row.illuminance).toFixed(0) : 'null'
    console.log(`${timeStr} | ${temp} | ${hum} | ${lux}`)
  }
}

main().catch(console.error)
