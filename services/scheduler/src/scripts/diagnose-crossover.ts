import { influxClient } from '../lib/influx'

async function main() {
  const startTime = new Date('2026-07-06T00:00:00.000Z')
  const endTime = new Date()

  // Consultar todas las tags y metadatos de las últimas 12 horas para zone = EXTERIOR
  const query = `
    SELECT time, temperature, humidity, illuminance, zone, source, context
    FROM "environment_metrics"
    WHERE time >= '${startTime.toISOString()}'
      AND time <= '${endTime.toISOString()}'
    ORDER BY time ASC
  `

  console.log(`📡 Consultando InfluxDB para diagnosticar cruce de datos...`)
  const stream = influxClient.query(query)
  const rows: any[] = []

  for await (const row of stream) {
    rows.push(row)
  }

  console.log(`📊 Muestras recuperadas: ${rows.length}`)

  // 1. Separar las muestras por zone y ver qué valores de temperatura/humedad reportan
  const extRows = rows.filter((r) => r.zone === 'EXTERIOR')
  const intRows = rows.filter((r) => r.zone === 'ZONA_A')

  console.log(`\n=== METADATOS DE TELEMETRÍA (EXTERIOR) ===`)
  // Ver si hay fuentes distintas o si los datos se duplican/cruzan
  const extSources = new Set(extRows.map((r) => r.source))

  console.log('Fuentes en EXTERIOR:', Array.from(extSources))

  // Analizar la frecuencia de muestreo de EXTERIOR
  // Si reporta cada minuto, o si hay múltiples lecturas en el mismo minuto con valores muy distintos
  const samplesByMinute: { [key: string]: any[] } = {}

  for (const r of extRows) {
    if (r.temperature === null) continue
    const minKey = new Date(r.time).toISOString().substring(0, 16) // YYYY-MM-DDTHH:mm

    if (!samplesByMinute[minKey]) {
      samplesByMinute[minKey] = []
    }
    samplesByMinute[minKey].push(r)
  }

  console.log('\n🔍 Analizando minutos con múltiples muestras de temperatura en EXTERIOR:')
  let conflictCount = 0

  for (const [min, list] of Object.entries(samplesByMinute)) {
    if (list.length > 1) {
      // Calcular diferencia máxima de temperatura en el mismo minuto
      const temps = list.map((l) => l.temperature)
      const diff = Math.max(...temps) - Math.min(...temps)

      if (diff > 0.3) {
        conflictCount++
        if (conflictCount <= 10) {
          console.log(
            `⚠️ Conflicto en ${min}: ${list.length} muestras. Valores: ${temps.join(', ')}°C | Fuentes: ${list.map((l) => l.source).join(', ')}`,
          )
        }
      }
    }
  }
  console.log(`Total de minutos con conflictos térmicos (>0.3°C de diferencia): ${conflictCount}`)

  // 2. Comparar los valores climáticos de la ZONA_A y EXTERIOR en momentos de conflicto
  console.log('\n🔍 Comparando si las muestras "intrusas" de EXTERIOR coinciden con ZONA_A:')
  // Tomemos un minuto de conflicto y busquemos qué había en ZONA_A a esa misma hora
  for (const [min, list] of Object.entries(samplesByMinute)) {
    const temps = list.map((l) => l.temperature)
    const diff = Math.max(...temps) - Math.min(...temps)

    if (diff > 0.3) {
      const tInt = intRows.filter((r) => new Date(r.time).toISOString().substring(0, 16) === min)

      console.log(`Minuto: ${min}`)
      console.log(
        `- Muestras en EXTERIOR: ${list.map((l) => `${l.temperature}°C (Hum: ${l.humidity}%)`).join(' vs ')}`,
      )
      console.log(
        `- Muestras en ZONA_A:   ${tInt.map((l) => `${l.temperature}°C (Hum: ${l.humidity}%)`).join(' vs ')}`,
      )
      break
    }
  }
}

main().catch(console.error)
