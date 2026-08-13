import { Point } from '@influxdata/influxdb3-client'

import { influxClient } from '../lib/influx'

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  const args = process.argv.slice(2)
  const targetZone = args[0] && !args[0].startsWith('--') && isNaN(Number(args[0])) ? args[0] : 'EXTERIOR'
  const shiftHoursArg = args.find((a) => !isNaN(Number(a)))
  const shiftHours = shiftHoursArg ? Number(shiftHoursArg) : 4 // Por defecto desplazar +4 horas
  const runWrite = args.includes('--write')

  console.log('==================================================')
  console.log(`AJUSTADOR DE TIMESTAMPS DEL NODO EMA (${targetZone})`)
  console.log(`Configuración: Zona = ${targetZone} | Desplazamiento = ${shiftHours} horas | Modo escritura = ${runWrite}`)
  console.log('==================================================')

  try {
    // 1. Obtener registros de las últimas 16 horas para la zona objetivo
    const query = `
      SELECT time, temperature, humidity, illuminance, source, context
      FROM "environment_metrics"
      WHERE "zone" = '${targetZone}'
        AND time >= now() - INTERVAL '16 hours'
      ORDER BY time ASC
    `
    const stream = influxClient.query(query)
    const pointsToWrite: Point[] = []
    let count = 0

    for await (const row of stream) {
      const origTime = rowTimeToDate(row.time)
      // Calcular nueva fecha aplicando el offset (shiftHours)
      const adjustedTime = new Date(origTime.getTime() + shiftHours * 3600000)

      const origLocal = new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        timeStyle: 'medium',
      }).format(origTime)

      const adjLocal = new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        timeStyle: 'medium',
      }).format(adjustedTime)

      console.log(`Reg [${count}]:`)
      console.log(`  - Original  (UTC): ${origTime.toISOString()} | Local Caracas: ${origLocal}`)
      console.log(`  - Corregido (UTC): ${adjustedTime.toISOString()} | Local Caracas: ${adjLocal}`)
      console.log(
        `  - Datos: Temp=${row.temperature}°C | Hum=${row.humidity}% | Lux=${row.illuminance}`,
      )

      // Crear el nuevo punto corregido
      const point = Point.measurement('environment_metrics')
        .setTag('source', String(row.source || 'Weather_Station'))
        .setTag('zone', targetZone)
        .setTag('context', String(row.context || 'readings'))
        .setTimestamp(adjustedTime)

      let hasFields = false

      if (row.temperature != null) {
        point.setFloatField('temperature', Number(row.temperature))
        hasFields = true
      }
      if (row.humidity != null) {
        point.setFloatField('humidity', Number(row.humidity))
        hasFields = true
      }
      if (row.illuminance != null) {
        point.setFloatField('illuminance', Number(row.illuminance))
        hasFields = true
      }

      if (hasFields) {
        pointsToWrite.push(point)
      }
      count++
    }

    console.log(`\nTotal de registros leídos: ${count}`)
    console.log(`Total de puntos corregidos listos para escribir: ${pointsToWrite.length}`)

    if (runWrite && pointsToWrite.length > 0) {
      console.log('\nEscribiendo puntos corregidos a InfluxDB...')
      let written = 0

      for (const pt of pointsToWrite) {
        await influxClient.write(pt)
        written++
        if (written % 10 === 0) {
          console.log(`  - Escritos ${written}/${pointsToWrite.length} puntos...`)
        }
      }
      console.log('✅ Escritura completada con éxito.')
    } else {
      console.log(
        '\nℹ️ Ejecutado en modo Dry-Run. Use el parámetro "--write" para escribir los cambios:',
      )
      console.log('   npx tsx src/scripts/adjust-ema-timestamps.ts 4 --write')
    }
  } catch (err) {
    console.error('Error durante el ajuste de timestamps:', err)
  }
}

main()
