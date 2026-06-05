import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  console.log('==================================================')
  console.log('BUSCANDO REGISTROS DE EMA CON POSIBLE DESFASE')
  console.log('==================================================')

  try {
    // Buscar cualquier registro de ZONA_A en las últimas 24 horas y en el futuro
    const query = `
      SELECT time, temperature, humidity, illuminance
      FROM "environment_metrics"
      WHERE "zone" = 'ZONA_A'
        AND time >= now() - INTERVAL '12 hours'
      ORDER BY time DESC
      LIMIT 50
    `
    const stream = influxClient.query(query)
    let count = 0

    for await (const row of stream) {
      const dbTime = rowTimeToDate(row.time)
      const caracasStr = new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(dbTime)

      console.log(
        `[UTC: ${dbTime.toISOString()}] [Caracas: ${caracasStr}] Temp: ${row.temperature} | Hum: ${row.humidity} | Lux: ${row.illuminance}`,
      )
      count++
    }
    console.log(`Total registros encontrados: ${count}`)
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
