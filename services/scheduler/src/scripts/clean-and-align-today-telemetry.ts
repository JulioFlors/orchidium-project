import { Point } from '@influxdata/influxdb3-client'

import { influxClient } from '../lib/influx'

interface MetricRow {
  time: Date
  rawTime: unknown
  temperature: number | null
  humidity: number | null
  illuminance: number | null
  rainIntensity: number | null
  source: string
  zone: string
  context: string
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (s.length > 13) {
    return new Date(Number(s.substring(0, 13)))
  }
  const n = Number(s)

  return isNaN(n) ? new Date(s) : new Date(n)
}

function getMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function main() {
  const args = process.argv.slice(2)
  const targetZone = args[0] && !args[0].startsWith('--') && isNaN(Number(args[0])) ? args[0] : 'EXTERIOR'
  const hours = 24
  const runWrite = args.includes('--write')

  console.log('==================================================')
  console.log(`DESDUPLICADOR Y ALINEADOR DE TELEMETRÍA (${targetZone})`)
  console.log(`Configuración: Zona = ${targetZone} | Ventana = ${hours}h | Modo escritura = ${runWrite}`)
  console.log('==================================================')

  try {
    const query = `
      SELECT time, temperature, humidity, illuminance, rain_intensity, source, context
      FROM "environment_metrics"
      WHERE "zone" = '${targetZone}'
        AND time >= now() - INTERVAL '${hours} hours'
      ORDER BY time ASC
    `

    console.log(`\n📡 Consultando InfluxDB para zona '${targetZone}'...`)
    const stream = influxClient.query(query)
    const rows: MetricRow[] = []

    for await (const r of stream) {
      const row = r as Record<string, unknown>
      const t = rowTimeToDate(row.time)

      rows.push({
        time: t,
        rawTime: row.time,
        temperature: row.temperature != null ? Number(row.temperature) : null,
        humidity: row.humidity != null ? Number(row.humidity) : null,
        illuminance: row.illuminance != null ? Number(row.illuminance) : null,
        rainIntensity: row.rain_intensity != null ? Number(row.rain_intensity) : null,
        source: String(row.source || 'Weather_Station'),
        zone: String(row.zone || targetZone),
        context: String(row.context || 'readings'),
      })
    }

    console.log(`✅ Se obtuvieron ${rows.length} registros en total.`)

    if (rows.length === 0) {
      console.log('ℹ️ No hay registros para procesar.')
      return
    }

    // 2. Procesamiento y detección de anomalías por ventana móvil
    const pointsToWrite: Point[] = []
    let correctedCount = 0

    const WINDOW_SIZE = 11 // Ventana impar para mediana local

    for (let i = 0; i < rows.length; i++) {
      const current = rows[i]
      const startIdx = Math.max(0, i - Math.floor(WINDOW_SIZE / 2))
      const endIdx = Math.min(rows.length - 1, i + Math.floor(WINDOW_SIZE / 2))
      const neighborWindow = rows.slice(startIdx, endIdx + 1)

      const tempNeighbors = neighborWindow.map((r) => r.temperature).filter((v): v is number => v !== null)
      const humNeighbors = neighborWindow.map((r) => r.humidity).filter((v): v is number => v !== null)
      const luxNeighbors = neighborWindow.map((r) => r.illuminance).filter((v): v is number => v !== null)

      const medianTemp = getMedian(tempNeighbors)
      const medianHum = getMedian(humNeighbors)
      const medianLux = getMedian(luxNeighbors)

      let isSpurious = false
      let newTemp = current.temperature
      let newHum = current.humidity
      let newLux = current.illuminance

      // Detección de desviación espuria (ej: pico de +3.5°C o +10% de humedad respecto a mediana local)
      if (current.temperature !== null && Math.abs(current.temperature - medianTemp) > 3.5) {
        newTemp = Number(medianTemp.toFixed(1))
        isSpurious = true
      }

      if (current.humidity !== null && Math.abs(current.humidity - medianHum) > 10.0) {
        newHum = Number(medianHum.toFixed(1))
        isSpurious = true
      }

      if (current.illuminance !== null && Math.abs(current.illuminance - medianLux) > 15000) {
        newLux = Math.round(medianLux)
        isSpurious = true
      }

      if (isSpurious) {
        correctedCount++
        if (correctedCount <= 10) {
          console.log(`\n[Anomalía detectada #${correctedCount} @ ${current.time.toISOString()}]:`)
          if (current.temperature !== newTemp) console.log(`  - Temp: ${current.temperature}°C -> ${newTemp}°C (Mediana: ${medianTemp.toFixed(1)}°C)`)
          if (current.humidity !== newHum) console.log(`  - Hum:  ${current.humidity}% -> ${newHum}% (Mediana: ${medianHum.toFixed(1)}%)`)
          if (current.illuminance !== newLux) console.log(`  - Lux:  ${current.illuminance} -> ${newLux} (Mediana: ${medianLux})`)
        }

        const point = Point.measurement('environment_metrics')
          .setTag('source', current.source)
          .setTag('zone', current.zone)
          .setTag('context', current.context)
          .setTimestamp(current.time)

        if (newTemp !== null) point.setFloatField('temperature', newTemp)
        if (newHum !== null) point.setFloatField('humidity', newHum)
        if (newLux !== null) point.setIntField('illuminance', newLux)
        if (current.rainIntensity !== null) point.setFloatField('rain_intensity', current.rainIntensity)

        pointsToWrite.push(point)
      }
    }

    console.log('\n==================================================')
    console.log(`RESUMEN DE ALINEACIÓN (${targetZone}):`)
    console.log(`- Total de registros leídos: ${rows.length}`)
    console.log(`- Puntos espurios detectados para sobreescritura: ${correctedCount}`)
    console.log('==================================================')

    if (runWrite && pointsToWrite.length > 0) {
      console.log('\n🚀 Escribiendo puntos sobreescritos a InfluxDB...')
      let written = 0

      for (const pt of pointsToWrite) {
        await influxClient.write(pt)
        written++
        if (written % 20 === 0 || written === pointsToWrite.length) {
          console.log(`  - Sobreescritos ${written}/${pointsToWrite.length} puntos...`)
        }
      }
      console.log('✅ Sobreescritura in-situ completada con éxito en InfluxDB.')
    } else if (correctedCount > 0) {
      console.log('\nℹ️ Simulación (Dry-Run) finalizada sin realizar escrituras.')
      console.log('   Para aplicar la sobreescritura real en InfluxDB, ejecute con "--write":')
      console.log(`   npx tsx src/scripts/clean-and-align-today-telemetry.ts ${targetZone} --write`)
    } else {
      console.log('\n✨ No se encontraron anomalías espurias. La serie temporal está perfectamente limpia.')
    }
  } catch (err) {
    console.error('❌ Error durante la desduplicación y alineación:', err)
  }
}

main()
