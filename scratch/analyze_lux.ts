import { influxClient } from '../app/src/lib/server/influxdb'

async function analyzeLux() {
  const now = new Date()
  const days = 7

  console.log(`🔍 Analizando tendencias de Lux en Producción (Últimos ${days} días)...`)

  for (let i = 0; i < days; i++) {
    const start = new Date(now)
    start.setDate(now.getDate() - i)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    console.log(`\n📅 Día: ${start.toLocaleDateString()}`)

    // Query SQL para InfluxDB v3 (IOx)
    const query = `
      SELECT illuminance as lux, time FROM "environment_metrics" 
      WHERE "zone" = 'EXTERIOR'
      AND time >= '${start.toISOString()}' 
      AND time <= '${end.toISOString()}'
      ORDER BY time ASC
    `

    try {
      const result = await influxClient.query(query)
      const rows: any[] = []
      for await (const row of result) {
        rows.push(row)
      }

      if (rows.length === 0) {
        console.log('   (Sin datos)')
        continue
      }

      const getStats = (startH: number, endH: number) => {
        const filtered = rows.filter((r: any) => {
          const d = new Date(r.time)
          const h = (d.getUTCHours() - 4 + 24) % 24 // Ajuste a Caracas Time
          return h >= startH && h < endH
        }).map((r: any) => Number(r.lux || 0))

        if (filtered.length === 0) return 'N/A'
        const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length
        const max = Math.max(...filtered)
        const min = Math.min(...filtered)
        return `Avg: ${avg.toFixed(0)}, Max: ${max.toFixed(0)}, Min: ${min.toFixed(0)} (${filtered.length} pts)`
      }

      console.log(`   🌅 05:00 - 08:00: ${getStats(5, 8)}`)
      console.log(`   ☀️ 08:00 - 16:00: ${getStats(8, 16)}`)
      console.log(`   🌇 16:00 - 19:00: ${getStats(16, 19)}`)
      console.log(`   🌙 Resto: ${getStats(19, 24)} y ${getStats(0, 5)}`)

    } catch (err) {
      console.error(`   ❌ Error: ${err}`)
    }
  }
}

analyzeLux().catch(console.error)
