import { influxClient } from '../lib/influx'

async function main() {
  const query = `
    SELECT DISTINCT("source")
    FROM "environment_metrics"
    WHERE time >= now() - INTERVAL '12 hours'
  `

  console.log('📡 Buscando todos los sources distintos en los últimos 7 días...')
  const stream = influxClient.query(query)
  const sources: string[] = []

  for await (const row of stream) {
    sources.push(String(row.source || row.distinct || ''))
  }
  console.log('Sources encontrados:', sources)

  // También busquemos los campos de cada uno para ver qué variables reporta cada dispositivo
  for (const src of sources) {
    if (!src) continue
    const qSrc = `
      SELECT time, temperature, humidity, illuminance, zone
      FROM "environment_metrics"
      WHERE "source" = '${src}'
        AND time >= now() - INTERVAL '1 hour'
      LIMIT 5
    `
    const streamSrc = influxClient.query(qSrc)
    const samples: any[] = []

    for await (const row of streamSrc) {
      samples.push(row)
    }
    console.log(`\n📌 Muestras del source "${src}":`)
    console.log(JSON.stringify(samples, null, 2))
  }
}

main().catch(console.error)
