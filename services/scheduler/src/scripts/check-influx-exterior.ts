import { influxClient } from '../lib/influx'

async function main() {
  console.log('=== VERIFICANDO ESTRUCTURA DE INFLUXDB (EXTERIOR) ===')

  const query = `
    SELECT time, source, zone, temperature, humidity, illuminance, rain_intensity
    FROM "environment_metrics"
    WHERE time >= now() - interval '2 days'
      AND zone = 'EXTERIOR'
    LIMIT 20
  `

  try {
    const stream = influxClient.query(query)

    for await (const row of stream) {
      console.log(JSON.stringify(row))
    }
  } catch (err) {
    console.error('Error consultando InfluxDB:', err)
  } finally {
    await influxClient.close()
  }
}

main().catch(console.error)
