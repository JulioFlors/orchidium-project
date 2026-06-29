import { influxClient } from '../lib/influx'

async function analyzeDay(dateStr: string) {
  const startTime = `${dateStr}T04:00:00Z`
  const parts = dateStr.split('-').map(Number)
  const localDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
  const nextLocalDate = new Date(localDate.getTime() + 24 * 3600 * 1000)
  const nextDayStr = nextLocalDate.toISOString().split('T')[0]
  const endTime = `${nextDayStr}T03:59:59Z`

  console.log(`\n=== ANÁLISIS DE TELEMETRÍA EXTERIOR PARA EL DÍA LOCAL: ${dateStr} ===`)
  
  const query = `
    SELECT 
      date_bin(interval '1 hour', time) as hour_bin,
      MIN(temperature) as min_temp,
      MAX(temperature) as max_temp,
      MIN(humidity) as min_hum,
      MAX(humidity) as max_hum,
      AVG(illuminance) as avg_lux
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startTime}'
      AND time <= '${endTime}'
    GROUP BY hour_bin
    ORDER BY hour_bin ASC
  `

  try {
    const stream = influxClient.query(query)
    for await (const row of stream) {
      const timeBin = new Date(row.hour_bin)
      const timeStr = timeBin.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' })
      console.log(
        `Hora: ${timeStr} | ` +
        `Temp: [${Number(row.min_temp).toFixed(1)} - ${Number(row.max_temp).toFixed(1)}]°C | ` +
        `Hum: [${Number(row.min_hum).toFixed(1)} - ${Number(row.max_hum).toFixed(1)}]% | ` +
        `Lux Prom: ${Math.round(Number(row.avg_lux))} lx`
      )
    }
  } catch (err) {
    console.error(`Error al consultar día ${dateStr}:`, err)
  }
}

async function main() {
  await analyzeDay('2026-06-25')
  await analyzeDay('2026-06-27')
}

main()
