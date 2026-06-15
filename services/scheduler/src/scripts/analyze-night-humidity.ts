import { influxClient } from '../lib/influx'

interface InfluxRow {
  time?: string
  temperature?: number
  humidity?: number
  illuminance?: number
}

async function main() {
  console.log('Analizando telemetría nocturna de los últimos 7 días...')

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000)

  const query = `
    SELECT time, temperature, humidity, illuminance
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${sevenDaysAgo.toISOString()}'
    ORDER BY time ASC
  `

  try {
    const stream = influxClient.query(query)
    const rows: InfluxRow[] = []

    for await (const row of stream) {
      rows.push(row)
    }

    console.log(`Leídos ${rows.length} registros.`)

    const nights: Record<string, InfluxRow[]> = {}

    rows.forEach((r) => {
      if (!r.time) return
      const date = new Date(r.time)
      const localTime = new Date(date.getTime() - 4 * 3600 * 1000) // VET (UTC-4)
      const hour = localTime.getUTCHours()

      let nightKey = ''

      if (hour >= 16) {
        nightKey =
          localTime.getUTCFullYear() +
          '-' +
          String(localTime.getUTCMonth() + 1).padStart(2, '0') +
          '-' +
          String(localTime.getUTCDate()).padStart(2, '0')
      } else if (hour < 8) {
        const prevDay = new Date(localTime.getTime() - 24 * 3600 * 1000)

        nightKey =
          prevDay.getUTCFullYear() +
          '-' +
          String(prevDay.getUTCMonth() + 1).padStart(2, '0') +
          '-' +
          String(prevDay.getUTCDate()).padStart(2, '0')
      } else {
        return
      }

      if (!nights[nightKey]) {
        nights[nightKey] = []
      }
      nights[nightKey].push(r)
    })

    for (const [night, samples] of Object.entries(nights)) {
      console.log(`\n==================================================`)
      console.log(`NOCHE DEL ${night} (4:00 PM a 8:00 AM) - ${samples.length} muestras`)
      console.log(`==================================================`)

      if (samples.length === 0) continue

      const humidities = samples.map((s) => s.humidity).filter((h): h is number => h !== undefined)
      const temperatures = samples
        .map((s) => s.temperature)
        .filter((t): t is number => t !== undefined)

      const maxHum = Math.max(...humidities)
      const minHum = Math.min(...humidities)
      const maxTemp = Math.max(...temperatures)
      const minTemp = Math.min(...temperatures)

      console.log(`  Humedad: Min ${minHum.toFixed(1)}% | Max ${maxHum.toFixed(1)}%`)
      console.log(`  Temperatura: Min ${minTemp.toFixed(1)}°C | Max ${maxTemp.toFixed(1)}°C`)

      // Mostrar evolución resumida: 4 PM, 8 PM, 12 AM, 4 AM, 8 AM
      const checkHours = [16, 20, 0, 4, 8]

      console.log(`  Perfil de la Noche:`)

      checkHours.forEach((targetHour) => {
        // Encontrar la muestra más cercana a esta hora local
        let closestSample: InfluxRow | null = null
        let minDiff = Infinity

        samples.forEach((s) => {
          if (!s.time) return
          const sDate = new Date(s.time)
          const sLocal = new Date(sDate.getTime() - 4 * 3600 * 1000)
          const sHour = sLocal.getUTCHours()
          const sMin = sLocal.getUTCMinutes()

          let diff = Math.abs(sHour - targetHour)

          if (targetHour === 0 && sHour > 20) {
            diff = Math.abs(24 - sHour)
          }

          // Considerar minutos para mayor precisión
          const totalDiff = diff * 60 + sMin

          if (totalDiff < minDiff) {
            minDiff = totalDiff
            closestSample = s
          }
        })

        if (closestSample && minDiff < 120) {
          const sDate = new Date((closestSample as InfluxRow).time!)
          const sLocal = new Date(sDate.getTime() - 4 * 3600 * 1000)

          console.log(
            `    [${String(targetHour).padStart(2, '0')}:00] Temp: ${(closestSample as InfluxRow).temperature?.toFixed(1)}°C | Hum: ${(closestSample as InfluxRow).humidity?.toFixed(1)}% (Real: ${String(sLocal.getUTCHours()).padStart(2, '0')}:${String(sLocal.getUTCMinutes()).padStart(2, '0')})`,
          )
        }
      })
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
