import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-07-03T14:18:00.000Z')
  const endTime = new Date('2026-07-03T14:21:00.000Z')

  // Consultar todas las columnas y tags
  const query = `
    SELECT *
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime.toISOString()}'
      AND time < '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)

  console.log('--- REGISTROS CON TAGS DE HOY ---')
  for await (const row of stream) {
    console.log(JSON.stringify(row, null, 2))
  }
}

main().catch(console.error)
