import { NextResponse } from 'next/server'

import { influxClient } from '@/lib/influxdb'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '24h' // default to 24h
  const zone = searchParams.get('zone') || 'Orchidarium' // default zone

  if (!influxClient) {
    return NextResponse.json({ error: 'InfluxDB client not initialized' }, { status: 500 })
  }

  let rangeString = '24h'

  switch (range) {
    case '1h':
      rangeString = '1h'
      break
    case '24h':
      rangeString = '24h'
      break
    case '7d':
      rangeString = '7d'
      break
    case '30d':
      rangeString = '30d'
      break
    case 'all':
      rangeString = '30d'
      break // Cloud free tier limit
    default:
      rangeString = '24h'
  }

  // Consulta SQL para InfluxDB v3
  // Obtenemos temperatura y humedad promedio agrupada por ventanas de tiempo para suavizar la gráfica
  // La ventana depende del rango total

  // InfluxDB v3 usa SQL.
  // El servicio 'ingest' escribe en la medición "environment_metrics".

  const query = `
    SELECT *
    FROM "environment_metrics"
    WHERE "zone" = '${zone}'
    AND time >= now() - interval '${rangeString}'
    ORDER BY time ASC
  `

  try {
    const reader = influxClient.query(query)
    const data = []

    for await (const row of reader) {
      const point = {
        time: row.time,
        temperature: row.temperature,
        humidity: row.humidity,
        lux: row.light_intensity || 0, // Ingest uses 'light_intensity'
      }

      data.push(point)
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    // Handle "table not found" as empty data (fresh system)
    const err = error as Error
    const errorMessage = err.message || err.toString()

    if (errorMessage.includes('not found') || errorMessage.includes('table')) {
      // Silent return for fresh systems
      return NextResponse.json([])
    }

    // eslint-disable-next-line no-console
    console.error('Error querying InfluxDB:', error)

    return NextResponse.json({ error: 'Failed to fetch sensor data' }, { status: 500 })
  }
}
