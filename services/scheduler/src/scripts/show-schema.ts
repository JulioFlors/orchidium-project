import { influxClient } from '../lib/influx'

async function main() {
  console.log('Querying sample rows to inspect columns...')

  try {
    console.log('\n--- environment_metrics ---')
    const stream1 = influxClient.query('SELECT * FROM environment_metrics LIMIT 1')
    let found1 = false

    for await (const row of stream1) {
      console.log('Keys:', Object.keys(row))
      console.log('Sample Row:', row)
      found1 = true
    }
    if (!found1) console.log('No rows in environment_metrics')

    console.log('\n--- system_events ---')
    const stream2 = influxClient.query('SELECT * FROM system_events LIMIT 1')
    let found2 = false

    for await (const row of stream2) {
      console.log('Keys:', Object.keys(row))
      console.log('Sample Row:', row)
      found2 = true
    }
    if (!found2) console.log('No rows in system_events')
  } catch (err) {
    console.error('Error querying samples:', err)
  }
}

main()
