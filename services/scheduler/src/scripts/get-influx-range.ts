import { influxClient } from '../lib/influx'

async function main() {
  // Acotamos a los últimos 10 días para evitar el error de planeación de escaneo masivo
  const query = `
    SELECT time 
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= now() - interval '10 days'
    ORDER BY time ASC
    LIMIT 1
  `
  const queryLast = `
    SELECT time 
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= now() - interval '10 days'
    ORDER BY time DESC
    LIMIT 1
  `

  try {
    const streamFirst = influxClient.query(query)
    for await (const row of streamFirst) {
      console.log('Primer registro en los últimos 10 días:', row.time)
    }

    const streamLast = influxClient.query(queryLast)
    for await (const row of streamLast) {
      console.log('Último registro en los últimos 10 días:', row.time)
    }
  } catch (err) {
    console.error('Error consultando InfluxDB:', err)
  }
}

main()
