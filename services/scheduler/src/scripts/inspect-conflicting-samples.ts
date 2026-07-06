import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-07-06T08:00:00.000Z')
  const endTime = new Date('2026-07-06T08:15:00.000Z')

  const query = `
    SELECT time, temperature, humidity, illuminance, zone, source, context
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime.toISOString()}'
      AND time <= '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  console.log(`📡 Consultando InfluxDB para inspeccionar muestras conflictivas en EXTERIOR...`)
  const stream = influxClient.query(query)
  const rows: any[] = []

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`📊 Muestras recuperadas: ${rows.length}`)

  // Imprimir cada muestra detalladamente
  rows.forEach((r, i) => {
    console.log(
      `[${i}]: Time: ${new Date(r.time).toISOString()} | Temp: ${r.temperature} | Hum: ${r.humidity} | Illum: ${r.illuminance} | Src: ${r.source} | Ctx: ${r.context}`,
    )
  })
}

main().catch(console.error)
