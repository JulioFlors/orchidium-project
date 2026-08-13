import { Point } from '@influxdata/influxdb3-client'

import { influxClient } from '../lib/influx'

interface RawRow {
  time: unknown
  source?: unknown
  zone?: unknown
  context?: unknown
  temperature?: unknown
  humidity?: unknown
  illuminance?: unknown
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

async function main() {
  const args = process.argv.slice(2)
  const targetZone = args[0] && !args[0].startsWith('--') ? args[0] : 'EXTERIOR'
  const targetDateStr = args[1] && !args[1].startsWith('--') ? args[1] : '2026-08-12'
  const runWrite = args.includes('--write')

  const startIso = `${targetDateStr}T00:00:00.000Z`
  const endIso = `${targetDateStr}T23:59:59.999Z`

  console.log('==================================================')
  console.log(`INVALIDADOR DE TELEMETRÍA A NULL (${targetZone})`)
  console.log(`Configuración: Zona = ${targetZone} | Fecha = ${targetDateStr} | Modo escritura = ${runWrite}`)
  console.log('==================================================')

  try {
    const query = `
      SELECT time, temperature, humidity, illuminance, source, context
      FROM "environment_metrics"
      WHERE "zone" = '${targetZone}'
        AND time >= TIMESTAMP '${startIso}'
        AND time <= TIMESTAMP '${endIso}'
      ORDER BY time ASC
    `

    console.log(`\n📡 Consultando registros de InfluxDB para zona '${targetZone}' el día ${targetDateStr}...`)
    const stream = influxClient.query(query)
    const pointsToWrite: Point[] = []
    let count = 0

    for await (const r of stream) {
      const row = r as RawRow
      const t = rowTimeToDate(row.time)

      count++

      // Crear punto con la estampa de tiempo exacta e invalidar métricas con NaN / NULL
      const point = Point.measurement('environment_metrics')
        .setTag('source', String(row.source || 'Weather_Station'))
        .setTag('zone', String(row.zone || targetZone))
        .setTag('context', String(row.context || 'readings'))
        .setTimestamp(t)
        .setFloatField('temperature', Number.NaN)
        .setFloatField('humidity', Number.NaN)
        .setFloatField('illuminance', Number.NaN)
        .setBooleanField('invalidated', true)

      pointsToWrite.push(point)
    }

    console.log(`✅ Se encontraron ${count} registros para el día ${targetDateStr}.`)

    if (count === 0) {
      console.log('ℹ️ No se encontraron registros en el rango especificado.')
      return
    }

    console.log('\n==================================================')
    console.log(`RESUMEN DE INVALIDACIÓN (${targetZone} - ${targetDateStr}):`)
    console.log(`- Total de registros seleccionados para invalidación a NULL: ${count}`)
    console.log('==================================================')

    if (runWrite && pointsToWrite.length > 0) {
      console.log('\n🚀 Sobreescribiendo registros a NULL en InfluxDB...')
      let written = 0

      for (const pt of pointsToWrite) {
        await influxClient.write(pt)
        written++
        if (written % 100 === 0 || written === pointsToWrite.length) {
          console.log(`  - Invalidados ${written}/${pointsToWrite.length} puntos...`)
        }
      }
      console.log('✅ Invalidación a NULL completada con éxito en InfluxDB.')
    } else {
      console.log('\nℹ️ Simulación (Dry-Run) finalizada sin modificar la base de datos.')
      console.log('   Para aplicar la invalidación a NULL real en InfluxDB, ejecute con "--write":')
      console.log(`   npx tsx src/scripts/invalidate-august12-telemetry.ts ${targetZone} ${targetDateStr} --write`)
    }
  } catch (err) {
    console.error('❌ Error durante la invalidación:', err)
  }
}

main()
