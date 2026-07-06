import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-07-06T10:30:00.000Z')
  const endTime = new Date('2026-07-06T11:15:00.000Z')

  const query = `
    SELECT time, temperature, humidity, illuminance, zone, source, context
    FROM "environment_metrics"
    WHERE time >= '${startTime.toISOString()}'
      AND time <= '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  console.log(
    `📡 Consultando InfluxDB sin filtrar zona de ${startTime.toISOString()} a ${endTime.toISOString()}...`,
  )
  const stream = influxClient.query(query)
  const rows: any[] = []

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`📊 Muestras totales: ${rows.length}`)

  // Agrupar por zona y source para ver qué dispositivos reportaron
  const devices: { [key: string]: number } = {}

  for (const r of rows) {
    const key = `${r.zone} | ${r.source} | ${r.context}`

    devices[key] = (devices[key] || 0) + 1
  }
  console.log('📌 Dispositivos y zonas encontradas en el rango:')
  console.log(JSON.stringify(devices, null, 2))

  // Imprimir muestras específicas donde la temperatura sea alrededor de 24.5 y humedad 100
  console.log('\n🔍 Buscando muestras de Temp ≈ 24.5 y Hum = 100:')
  const matches = rows.filter(
    (r) => r.temperature !== null && Math.abs(r.temperature - 24.5) < 0.5 && r.humidity === 100,
  )

  console.log(`Encontradas ${matches.length} muestras coincidentes.`)
  if (matches.length > 0) {
    console.log(JSON.stringify(matches.slice(0, 10), null, 2))
  }
}

main().catch(console.error)
