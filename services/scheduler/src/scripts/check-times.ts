import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  // InfluxDB v3 suele devolver BigInt en nanosegundos (19 caracteres)
  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  console.log('==================================================')
  console.log('DIAGNÓSTICO DE TIMESTAMPS Y HORA LOCAL (CORREGIDO)')
  console.log('==================================================')

  try {
    const query = `
      SELECT time, temperature, humidity, zone, source
      FROM "environment_metrics"
      WHERE time >= now() - INTERVAL '6 hours'
      ORDER BY time DESC
      LIMIT 15
    `
    const stream = influxClient.query(query)

    for await (const row of stream) {
      const dbTime = rowTimeToDate(row.time)
      const caracasStr = new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(dbTime)

      const utcStr = dbTime.toISOString()

      console.log(
        `Zone: ${row.zone} | Source: ${row.source} | UTC en DB: ${utcStr} | Local Caracas: ${caracasStr} | Raw Time: ${row.time}`,
      )
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
