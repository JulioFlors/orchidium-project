import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  console.log('Querying InfluxDB telemetry between 11:30pm and 12:00am Caracas local time...')

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-10T03:30:00Z'
      AND time <= '2026-07-10T04:00:00Z'
    ORDER BY time ASC
  `

  const rows: any[] = []
  const stream = influxClient.query(query)

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`Retrieved ${rows.length} rows for the close analysis.`)
  for (const r of rows) {
    const localStr = rowTimeToDate(r.time).toLocaleString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Caracas',
    })

    console.log(`[${localStr}] Temp: ${r.temperature}°C | Hum: ${r.humidity}%`)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
