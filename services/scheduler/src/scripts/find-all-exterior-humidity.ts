import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-07-06T00:00:00.000Z')
  const endTime = new Date()

  // Buscar todas las fuentes distintas y zonas distintas en las últimas 24 horas
  const query = `
    SELECT time, humidity, temperature, zone, source, context
    FROM "environment_metrics"
    WHERE time >= '${startTime.toISOString()}'
      AND time <= '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  console.log(`📡 Consultando toda la telemetría de humedad en InfluxDB de hoy...`)
  const stream = influxClient.query(query)
  const rows: any[] = []

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`📊 Muestras totales recuperadas: ${rows.length}`)

  // Agrupar todas las combinaciones de source y zone
  const combinations: {
    [key: string]: { count: number; minHum: number; maxHum: number; lastHum: number }
  } = {}

  for (const r of rows) {
    if (r.humidity === null || isNaN(Number(r.humidity))) continue
    const key = `${r.zone} | ${r.source}`

    if (!combinations[key]) {
      combinations[key] = { count: 0, minHum: 999, maxHum: -999, lastHum: 0 }
    }
    const h = Number(r.humidity)

    combinations[key].count++
    if (h < combinations[key].minHum) combinations[key].minHum = h
    if (h > combinations[key].maxHum) combinations[key].maxHum = h
    combinations[key].lastHum = h
  }

  console.log('\n📌 Combinaciones de Zone | Source y rangos de humedad de hoy:')
  console.log(JSON.stringify(combinations, null, 2))

  // Buscar momentos donde la humedad sea 100% en la zona EXTERIOR
  const ext100 = rows.filter((r) => r.zone === 'EXTERIOR' && r.humidity === 100)

  console.log(`\nMuestras de 100% de humedad en EXTERIOR encontradas: ${ext100.length}`)
  if (ext100.length > 0) {
    console.log('Primeras 5 muestras de 100% de humedad en EXTERIOR:')
    ext100.slice(0, 5).forEach((r) => {
      console.log(
        `- Time: ${new Date(r.time).toISOString()} | Src: ${r.source} | Temp: ${r.temperature}°C`,
      )
    })
  }

  // Buscar momentos de la mañana (10:45 a 10:55 UTC) y ver todos los sources
  console.log('\n🔍 Muestras de 10:45 a 10:55 UTC (6:45 a 6:55 am local Caracas) de hoy:')
  const dawn = rows.filter((r) => r.time >= 1783325100000 && r.time <= 1783325700000)

  dawn.forEach((r) => {
    console.log(
      `- Time: ${new Date(r.time).toISOString()} | Zone: ${r.zone} | Src: ${r.source} | Temp: ${r.temperature} | Hum: ${r.humidity}`,
    )
  })
}

main().catch(console.error)
