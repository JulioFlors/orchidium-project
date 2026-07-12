import { influxClient } from '../lib/influx'

async function main() {
  console.log('Querying InfluxDB for recent EXTERIOR environment_metrics...')
  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= now() - INTERVAL '2 hours'
    ORDER BY time DESC
    LIMIT 20
  `
  const stream = influxClient.query(query)
  for await (const row of stream) {
    console.log(row)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
