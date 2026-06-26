import { influxClient } from '../lib/influx'

async function main() {
  console.log('=== PROBANDO DATE_BIN EN INFLUXDB ===')

  const query = `
    SELECT date_bin(interval '5 minutes', time) as bin_time,
           AVG(temperature) as temp,
           AVG(humidity) as hum,
           AVG(illuminance) as lux,
           MAX(rain_intensity) as rain
    FROM "environment_metrics"
    WHERE time >= now() - interval '2 hours'
      AND zone = 'EXTERIOR'
    GROUP BY bin_time
    ORDER BY bin_time ASC
  `

  try {
    const stream = influxClient.query(query)

    for await (const row of stream) {
      console.log(JSON.stringify(row))
    }
  } catch (err) {
    console.error('Error con date_bin:', err)
  } finally {
    await influxClient.close()
  }
}

main().catch(console.error)
