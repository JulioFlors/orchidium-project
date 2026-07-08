import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  const start = '2026-07-05T15:00:00Z' // 11:00 AM Caracas
  const end = '2026-07-05T22:00:00Z' // 6:00 PM Caracas

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${start}'
      AND time <= '${end}'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)

  console.log('time,temp,hum,lux')
  for await (const row of stream) {
    const tDate = rowTimeToDate(row.time)
    const tCaracas = new Date(tDate.getTime() - 4 * 60 * 60 * 1000).toISOString().slice(11, 19)

    console.log(`${tCaracas},${row.temperature},${row.humidity},${row.illuminance}`)
  }
}

main()
