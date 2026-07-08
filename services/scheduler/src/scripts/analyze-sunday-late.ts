import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

function toCaracas(date: Date): string {
  return date.toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

async function analyzeSundayLate() {
  console.log('\n======================================================')
  console.log('  ANÁLISIS DE TELEMETRÍA - DOMINGO 5 DE JULIO (Tarde-Noche)')
  console.log('  Ventana: 04:30 PM → 06:30 PM (Caracas)')
  console.log('======================================================\n')

  // 5 Julio 4:30 PM Caracas = 20:30 UTC
  // 5 Julio 6:30 PM Caracas = 22:30 UTC
  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '2026-07-05T20:30:00Z'
      AND time <= '2026-07-05T22:30:00Z'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)
  let prevTemp: number | null = null

  for await (const row of stream) {
    const t = rowTimeToDate(row.time)
    const temp = row.temperature != null ? Number(row.temperature) : null
    const hum = row.humidity != null ? Number(row.humidity) : null
    const lux = row.illuminance != null ? Number(row.illuminance) : null

    const deltaStr =
      prevTemp !== null && temp !== null
        ? `(${temp - prevTemp >= 0 ? '+' : ''}${(temp - prevTemp).toFixed(2)}°C)`
        : ''

    console.log(
      `${toCaracas(t)} | Temp: ${temp !== null ? temp.toFixed(1).padStart(5) : '  N/A'}°C ${deltaStr.padEnd(12)} | Hum: ${hum !== null ? hum.toFixed(1).padStart(5) : '  N/A'}% | Lux: ${lux !== null ? lux.toFixed(0).padStart(7) : '    N/A'} lx`,
    )
    if (temp !== null) prevTemp = temp
  }
}

async function main() {
  try {
    await analyzeSundayLate()
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await influxClient.close()
  }
}

main()
