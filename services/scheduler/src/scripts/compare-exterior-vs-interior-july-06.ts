import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-07-06T08:00:00.000Z')
  const endTime = new Date('2026-07-06T12:00:00.000Z')

  // Obtener telemetría de EXTERIOR e interior ZONA_A
  const query = `
    SELECT time, temperature, humidity, illuminance, zone, source
    FROM "environment_metrics"
    WHERE time >= '${startTime.toISOString()}'
      AND time <= '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  console.log(`📡 Consultando InfluxDB de ${startTime.toISOString()} a ${endTime.toISOString()}...`)
  const stream = influxClient.query(query)
  const rows: any[] = []

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`📊 Muestras recuperadas: ${rows.length}`)

  const extRows = rows.filter((r) => r.zone === 'EXTERIOR')
  const intRows = rows.filter((r) => r.zone === 'ZONA_A')

  console.log(`\n=== DATOS EN EXTERIOR (Muestras: ${extRows.length}) ===`)
  extRows.slice(0, 15).forEach((r) => {
    console.log(
      `- Time: ${r.time} | Temp: ${r.temperature} | Hum: ${r.humidity} | Illum: ${r.illuminance} | Src: ${r.source}`,
    )
  })

  console.log(`\n=== DATOS EN ZONA_A (Muestras: ${intRows.length}) ===`)
  intRows.slice(0, 15).forEach((r) => {
    console.log(
      `- Time: ${r.time} | Temp: ${r.temperature} | Hum: ${r.humidity} | Illum: ${r.illuminance} | Src: ${r.source}`,
    )
  })

  // Encontrar momentos exactos del amanecer (10:40 a 11:00 UTC)
  console.log('\n=== COMPARACIÓN AMANECER (10:40 A 11:00 UTC / 6:40 am a 7:00 am local) ===')
  const dawnExt = extRows.filter((r) => r.time >= 1783324800000 && r.time <= 1783326000000)
  const dawnInt = intRows.filter((r) => r.time >= 1783324800000 && r.time <= 1783326000000)

  console.log('📌 EXTERIOR Dawn:')
  dawnExt.forEach((r) => {
    console.log(
      `- Time: ${new Date(r.time).toISOString()} | Temp: ${r.temperature} | Hum: ${r.humidity} | Illum: ${r.illuminance}`,
    )
  })

  console.log('\n📌 ZONA_A Dawn:')
  dawnInt.forEach((r) => {
    console.log(
      `- Time: ${new Date(r.time).toISOString()} | Temp: ${r.temperature} | Hum: ${r.humidity} | Illum: ${r.illuminance}`,
    )
  })
}

main().catch(console.error)
