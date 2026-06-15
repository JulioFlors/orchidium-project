import { influxClient } from '../lib/influx'

interface InfluxRow {
  time?: string
  temperature?: number
  humidity?: number
}

async function main() {
  console.log('==================================================')
  console.log('ANALIZANDO DELTAS DE 30 MINUTOS EN MADRUGADA ESTABLE')
  console.log('==================================================')

  const query = `
    SELECT time, temperature, humidity
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= now() - interval '3 days'
    ORDER BY time ASC
  `

  try {
    const stream = influxClient.query(query)
    const rows: InfluxRow[] = []

    for await (const row of stream) {
      rows.push(row)
    }

    const nights: Record<string, InfluxRow[]> = {}

    rows.forEach((r) => {
      if (!r.time) return
      const date = new Date(r.time)
      const localTime = new Date(date.getTime() - 4 * 3600 * 1000) // VET (UTC-4)
      const hour = localTime.getUTCHours()

      let isLateNight = false
      let nightKey = ''

      if (hour >= 22) {
        isLateNight = true
        nightKey = `${localTime.getUTCFullYear()}-${String(localTime.getUTCMonth() + 1).padStart(2, '0')}-${String(localTime.getUTCDate()).padStart(2, '0')}`
      } else if (hour < 6) {
        isLateNight = true
        const prevDay = new Date(localTime.getTime() - 24 * 3600 * 1000)

        nightKey = `${prevDay.getUTCFullYear()}-${String(prevDay.getUTCMonth() + 1).padStart(2, '0')}-${String(prevDay.getUTCDate()).padStart(2, '0')}`
      }

      if (isLateNight) {
        if (!nights[nightKey]) {
          nights[nightKey] = []
        }
        nights[nightKey].push(r)
      }
    })

    for (const [night, samples] of Object.entries(nights)) {
      console.log(`\n--------------------------------------------------`)
      console.log(`Madrugada del ${night} (${samples.length} muestras)`)
      console.log(`--------------------------------------------------`)

      if (samples.length < 6) {
        console.log('  Muestras insuficientes.')
        continue
      }

      let saturatedCount = 0
      let passCount = 0

      const tempDrops30m: number[] = []
      const humRises30m: number[] = []

      // Analizar deltas de 30 minutos (comparar punto actual con el de hace 30 minutos)
      for (let i = 6; i < samples.length; i++) {
        const current = samples[i]
        const past = samples[i - 6] // Hace ~30 min

        if (
          current.humidity !== undefined &&
          past.humidity !== undefined &&
          current.temperature !== undefined &&
          past.temperature !== undefined
        ) {
          // Filtrar por periodos de alta humedad (Hum actual >= 90%)
          if (current.humidity >= 90.0) {
            saturatedCount++

            // Caída de temperatura en 30 min (valor del pasado - actual)
            const tempDrop = past.temperature - current.temperature
            // Subida de humedad en 30 min (actual - pasado)
            const humRise = current.humidity - past.humidity

            tempDrops30m.push(tempDrop)
            humRises30m.push(humRise)

            // Propuesta de regla: Caída de temp <= 0.5°C AND subida de hum <= 0.5% en 30 min
            if (tempDrop <= 0.5 && humRise <= 0.5) {
              passCount++
            }
          }
        }
      }

      if (saturatedCount > 0) {
        tempDrops30m.sort((a, b) => a - b)
        humRises30m.sort((a, b) => a - b)

        const getPercentile = (arr: number[], pct: number) => {
          const idx = Math.floor((arr.length - 1) * pct)

          return arr[idx]
        }

        console.log(`  Muestras saturadas (Hum >= 90%): ${saturatedCount}`)
        console.log(`  Caída de Temperatura en 30m (Pasado - Actual):`)
        console.log(
          `    Min: ${tempDrops30m[0].toFixed(2)}°C | P50: ${getPercentile(tempDrops30m, 0.5).toFixed(2)}°C | P90: ${getPercentile(tempDrops30m, 0.9).toFixed(2)}°C | Max: ${tempDrops30m[tempDrops30m.length - 1].toFixed(2)}°C`,
        )
        console.log(`  Subida de Humedad en 30m (Actual - Pasado):`)
        console.log(
          `    Min: ${humRises30m[0].toFixed(2)}% | P50: ${getPercentile(humRises30m, 0.5).toFixed(2)}% | P90: ${getPercentile(humRises30m, 0.9).toFixed(2)}% | Max: ${humRises30m[humRises30m.length - 1].toFixed(2)}%`,
        )

        console.log(
          `  Cumplimiento de la regla propuesta (TempDrop <= 0.5°C && HumRise <= 0.5% en 30 min):`,
        )
        console.log(
          `    Tasa de coincidencia: ${((passCount / saturatedCount) * 100).toFixed(1)}% (${passCount}/${saturatedCount})`,
        )

        // Probar alternativas de umbrales
        let altCount_05_10 = 0
        let altCount_06_08 = 0
        let altCount_06_10 = 0

        for (let i = 6; i < samples.length; i++) {
          const current = samples[i]
          const past = samples[i - 6]

          if (
            current.humidity !== undefined &&
            past.humidity !== undefined &&
            current.temperature !== undefined &&
            past.temperature !== undefined
          ) {
            if (current.humidity >= 90.0) {
              const tempDrop = past.temperature - current.temperature
              const humRise = current.humidity - past.humidity

              if (tempDrop <= 0.5 && humRise <= 1.0) altCount_05_10++
              if (tempDrop <= 0.6 && humRise <= 0.8) altCount_06_08++
              if (tempDrop <= 0.6 && humRise <= 1.0) altCount_06_10++
            }
          }
        }

        console.log(
          `    Tasa con TempDrop <= 0.5°C && HumRise <= 1.0%: ${((altCount_05_10 / saturatedCount) * 100).toFixed(1)}%`,
        )
        console.log(
          `    Tasa con TempDrop <= 0.6°C && HumRise <= 0.8%: ${((altCount_06_08 / saturatedCount) * 100).toFixed(1)}%`,
        )
        console.log(
          `    Tasa con TempDrop <= 0.6°C && HumRise <= 1.0%: ${((altCount_06_10 / saturatedCount) * 100).toFixed(1)}%`,
        )
      } else {
        console.log('  No se encontraron muestras saturadas en esta madrugada.')
      }
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
