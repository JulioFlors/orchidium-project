import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)
  if (isNaN(Number(s))) return new Date(s)
  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  console.log('Verificando continuidad de datos en InfluxDB del 10 de Julio en la madrugada (03:50 UTC a 05:00 UTC)...')
  
  const query = `
    SELECT time, temperature, humidity
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-10T03:50:00Z'
      AND time <= '2026-07-10T05:00:00Z'
    ORDER BY time ASC
  `

  const rows: any[] = []
  try {
    const stream = influxClient.query(query)
    for await (const row of stream) {
      rows.push(row)
    }
  } catch (err) {
    console.error('Error consultando InfluxDB:', err)
  }

  console.log(`Muestras encontradas: ${rows.length}`)
  if (rows.length > 0) {
    console.log(`Primera muestra: ${rowTimeToDate(rows[0].time).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`)
    console.log(`Última muestra: ${rowTimeToDate(rows[rows.length - 1].time).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await influxClient.close()
  })
