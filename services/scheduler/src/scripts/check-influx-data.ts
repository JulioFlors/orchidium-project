import { influxClient } from '../lib/influx'

async function main() {
  const targetTime = new Date('2026-05-21T04:17:48.000Z')
  const startTime = new Date(targetTime.getTime() - 30 * 60 * 1000).toISOString()
  const endTime = new Date(targetTime.getTime() + 60 * 60 * 1000).toISOString()

  console.log(`Querying InfluxDB from ${startTime} to ${endTime}...`)

  try {
    const query = `
      SELECT time, "rain_intensity", "temperature", "humidity" 
      FROM "environment_metrics" 
      WHERE "zone" = 'EXTERIOR' 
        AND time >= '${startTime}' 
        AND time <= '${endTime}'
      ORDER BY time ASC
      LIMIT 100
    `
    const stream = influxClient.query(query)
    let count = 0

    for await (const row of stream) {
      console.log(
        `Row: time=${row.time}, rain_intensity=${row.rain_intensity}, temp=${row.temperature}, hum=${row.humidity}`,
      )
      count++
    }
    console.log(`Total rows found: ${count}`)
  } catch (err) {
    console.error('Error querying InfluxDB:', err)
  }
}

main()
