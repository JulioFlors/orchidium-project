import { influxClient } from '../lib/influx'

interface InfluxRow {
  time?: string
  temperature?: number
  humidity?: number
}

// Lista de noches en formato local (del 30 de mayo al 6 de junio)
// Cada noche va de las 16:00 (4:00 PM VET = 20:00 UTC) a las 08:00 (8:00 AM VET del día siguiente = 12:00 UTC)
const NIGHTS_RANGE = [
  { date: '2026-05-30', startUtc: '2026-05-30T20:00:00Z', endUtc: '2026-05-31T12:00:00Z' },
  { date: '2026-05-31', startUtc: '2026-05-31T20:00:00Z', endUtc: '2026-06-01T12:00:00Z' },
  { date: '2026-06-01', startUtc: '2026-06-01T20:00:00Z', endUtc: '2026-06-02T12:00:00Z' },
  { date: '2026-06-02', startUtc: '2026-06-02T20:00:00Z', endUtc: '2026-06-03T12:00:00Z' },
  { date: '2026-06-03', startUtc: '2026-06-03T20:00:00Z', endUtc: '2026-06-04T12:00:00Z' },
  { date: '2026-06-04', startUtc: '2026-06-04T20:00:00Z', endUtc: '2026-06-05T12:00:00Z' },
  { date: '2026-06-05', startUtc: '2026-06-05T20:00:00Z', endUtc: '2026-06-06T12:00:00Z' },
  { date: '2026-06-06', startUtc: '2026-06-06T20:00:00Z', endUtc: '2026-06-07T12:00:00Z' },
]

async function analyzeNight(night: (typeof NIGHTS_RANGE)[0]) {
  const query = `
    SELECT time, temperature, humidity
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${night.startUtc}'
      AND time <= '${night.endUtc}'
    ORDER BY time ASC
  `

  const stream = influxClient.query(query)
  const rows: InfluxRow[] = []

  for await (const row of stream) {
    if (
      row.humidity === 0 ||
      row.temperature === 0 ||
      (row.temperature !== undefined && row.temperature <= 0.1)
    ) {
      continue // Ignorar lecturas inválidas del sensor
    }
    rows.push(row)
  }

  console.log(`\n==================================================`)
  console.log(`NOCHE DEL ${night.date} (Local 4:00 PM a 8:00 AM)`)
  console.log(`Muestras leídas de InfluxDB: ${rows.length}`)
  console.log(`==================================================`)

  if (rows.length < 12) {
    console.log(
      '❌ Muestras insuficientes para evaluar (mínimo 12 requeridas para ventanas de 60m).',
    )

    return
  }

  // Resumen básico de la noche
  const humiditiesAll = rows.map((r) => r.humidity).filter((h): h is number => h !== undefined)
  const tempsAll = rows.map((r) => r.temperature).filter((t): t is number => t !== undefined)

  if (humiditiesAll.length > 0 && tempsAll.length > 0) {
    const minH = Math.min(...humiditiesAll)
    const maxH = Math.max(...humiditiesAll)
    const avgH = humiditiesAll.reduce((a, b) => a + b, 0) / humiditiesAll.length

    const minT = Math.min(...tempsAll)
    const maxT = Math.max(...tempsAll)
    const avgT = tempsAll.reduce((a, b) => a + b, 0) / tempsAll.length

    console.log(`📊 Perfil de la Noche:`)
    console.log(
      `   Humedad: Min ${minH.toFixed(1)}% | Max ${maxH.toFixed(1)}% | Promedio ${avgH.toFixed(1)}%`,
    )
    console.log(
      `   Temperatura: Min ${minT.toFixed(1)}°C | Max ${maxT.toFixed(1)}°C | Promedio ${avgT.toFixed(1)}°C`,
    )
  }

  let saturatedWindowsCount = 0
  const humDeltas: number[] = []
  const tempDeltas: number[] = []

  // Umbrales propuestos para evaluar coincidencia
  let count_05_02 = 0
  let count_08_03 = 0
  let count_10_04 = 0
  let count_12_05 = 0
  let count_15_05 = 0

  // Ventana deslizante de 60 minutos
  for (let i = 0; i < rows.length; i++) {
    const startSample = rows[i]

    if (!startSample.time) continue
    const startTimeMs = new Date(startSample.time).getTime()

    const windowSamples: InfluxRow[] = [startSample]

    for (let j = i + 1; j < rows.length; j++) {
      const s = rows[j]

      if (!s.time) continue
      const diffMin = (new Date(s.time).getTime() - startTimeMs) / 60000

      if (diffMin <= 60.0) {
        windowSamples.push(s)
      } else {
        break
      }
    }

    const firstTime = new Date(windowSamples[0].time!).getTime()
    const lastTime = new Date(windowSamples[windowSamples.length - 1].time!).getTime()
    const actualSpanMin = (lastTime - firstTime) / 60000

    // Validar ventana de al menos 50 min de duración y suficientes lecturas
    if (actualSpanMin >= 50 && actualSpanMin <= 65 && windowSamples.length >= 6) {
      const humidities = windowSamples
        .map((s) => s.humidity)
        .filter((h): h is number => h !== undefined)
      const temperatures = windowSamples
        .map((s) => s.temperature)
        .filter((t): t is number => t !== undefined)

      if (humidities.length > 0 && temperatures.length > 0) {
        const avgHum = humidities.reduce((sum, h) => sum + h, 0) / humidities.length

        // Analizamos cuando está saturado (Hum >= 90%)
        if (avgHum >= 90.0) {
          saturatedWindowsCount++

          const maxHum = Math.max(...humidities)
          const minHum = Math.min(...humidities)
          const maxTemp = Math.max(...temperatures)
          const minTemp = Math.min(...temperatures)

          const diffH = maxHum - minHum
          const diffT = maxTemp - minTemp

          humDeltas.push(diffH)
          tempDeltas.push(diffT)

          if (diffH <= 0.5 && diffT <= 0.2) count_05_02++
          if (diffH <= 0.8 && diffT <= 0.3) count_08_03++
          if (diffH <= 1.0 && diffT <= 0.4) count_10_04++
          if (diffH <= 1.2 && diffT <= 0.5) count_12_05++
          if (diffH <= 1.5 && diffT <= 0.5) count_15_05++
        }
      }
    }
  }

  if (saturatedWindowsCount > 0) {
    humDeltas.sort((a, b) => a - b)
    tempDeltas.sort((a, b) => a - b)

    const getPercentile = (arr: number[], pct: number) => {
      const idx = Math.floor((arr.length - 1) * pct)

      return arr[idx]
    }

    console.log(`📈 Análisis de Estabilidad (en ${saturatedWindowsCount} ventanas con HR >= 90%):`)
    console.log(`   Rango Humedad (Max-Min en 60m):`)
    console.log(
      `     Min: ${humDeltas[0].toFixed(2)}% | P50: ${getPercentile(humDeltas, 0.5).toFixed(2)}% | P90: ${getPercentile(humDeltas, 0.9).toFixed(2)}% | Max: ${humDeltas[humDeltas.length - 1].toFixed(2)}%`,
    )
    console.log(`   Rango Temperatura (Max-Min en 60m):`)
    console.log(
      `     Min: ${tempDeltas[0].toFixed(2)}°C | P50: ${getPercentile(tempDeltas, 0.5).toFixed(2)}°C | P90: ${getPercentile(tempDeltas, 0.9).toFixed(2)}°C | Max: ${tempDeltas[tempDeltas.length - 1].toFixed(2)}°C`,
    )

    console.log(`🎯 Tasa de Activación del Cierre por Estancamiento:`)
    console.log(
      `   - Lim 0.5% HR && 0.2°C Temp: ${((count_05_02 / saturatedWindowsCount) * 100).toFixed(1)}% (${count_05_02}/${saturatedWindowsCount})`,
    )
    console.log(
      `   - Lim 0.8% HR && 0.3°C Temp: ${((count_08_03 / saturatedWindowsCount) * 100).toFixed(1)}% (${count_08_03}/${saturatedWindowsCount})`,
    )
    console.log(
      `   - Lim 1.0% HR && 0.4°C Temp: ${((count_10_04 / saturatedWindowsCount) * 100).toFixed(1)}% (${count_10_04}/${saturatedWindowsCount})`,
    )
    console.log(
      `   - Lim 1.2% HR && 0.5°C Temp: ${((count_12_05 / saturatedWindowsCount) * 100).toFixed(1)}% (${count_12_05}/${saturatedWindowsCount})`,
    )
    console.log(
      `   - Lim 1.5% HR && 0.5°C Temp: ${((count_15_05 / saturatedWindowsCount) * 100).toFixed(1)}% (${count_15_05}/${saturatedWindowsCount})`,
    )
  } else {
    console.log('ℹ️ No se encontraron ventanas con humedad promedio >= 90.0% en esta noche.')
  }
}

async function main() {
  console.log('🚀 Iniciando análisis de estancamiento por noche...')
  try {
    for (const night of NIGHTS_RANGE) {
      await analyzeNight(night)
    }
  } catch (err) {
    console.error('Error durante el análisis:', err)
  }
}

main()
