import { influxClient } from '../lib/influx'

async function checkFixedRange(startStr: string, endStr: string): Promise<string | null> {
  const query = `
    SELECT time 
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= '${startStr}T00:00:00Z'
      AND time <= '${endStr}T23:59:59Z'
    ORDER BY time ASC
    LIMIT 1
  `
  try {
    const stream = influxClient.query(query)
    for await (const row of stream) {
      return row.time
    }
  } catch (err) {
    console.error(`Error buscando en rango ${startStr} - ${endStr}:`, err)
  }
  return null
}

async function main() {
  console.log('Buscando el dato más antiguo en InfluxDB mediante bloques de 3 días...')
  
  // Analizaremos del 1 de Junio al 21 de Junio en bloques de 3 días
  const blocks = [
    ['2026-06-01', '2026-06-03'],
    ['2026-06-04', '2026-06-06'],
    ['2026-06-07', '2026-06-09'],
    ['2026-06-10', '2026-06-12'],
    ['2026-06-13', '2026-06-15'],
    ['2026-06-16', '2026-06-18'],
    ['2026-06-19', '2026-06-21'],
    ['2026-06-22', '2026-06-24']
  ]

  let oldestDetected: string | null = null

  for (const [start, end] of blocks) {
    const time = await checkFixedRange(start, end)
    if (time) {
      oldestDetected = time
      console.log(`Encontrado dato en bloque [${start} a ${end}]: ${time}`)
      // Dado que vamos cronológicamente de principio de mes hacia adelante,
      // el primero que encontremos será el más antiguo disponible.
      break
    } else {
      console.log(`Sin datos en bloque [${start} a ${end}]`)
    }
  }

  if (oldestDetected) {
    console.log(`\nEl dato más antiguo disponible en InfluxDB es: ${oldestDetected}`)
  } else {
    console.log('\nNo se detectaron datos en la primera mitad de junio de 2026. Revisando si hay datos en la segunda mitad...')
    // Revisamos el resto del rango (22 de Junio en adelante)
    const timeLast = await checkFixedRange('2026-06-22', '2026-06-25')
    if (timeLast) {
      console.log(`Encontrado registro a partir del 22 de Junio: ${timeLast}`)
    } else {
      console.log('No se encontraron registros en todo Junio.')
    }
  }
}

main()
