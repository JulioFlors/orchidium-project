import { NextResponse } from 'next/server'

import { influxClient } from '@/lib/influxdb'

export async function GET(_request: Request) {
  // const { searchParams } = new URL(request.url)
  // const range = searchParams.get('range') || '24h'
  // const zone = searchParams.get('zone') || 'Orchidarium'

  if (!influxClient) {
    return NextResponse.json({ error: 'InfluxDB client not initialized' }, { status: 500 })
  }

  /*
  let rangeString = '24h'

  switch (range) {
    case '1h':
      rangeString = '1h'
      break
    case '7d':
      rangeString = '7d'
      break
    case '30d':
      rangeString = '30d'
      break
    case 'all':
      rangeString = '30d'
      break
    default:
      rangeString = '24h'
  }
  */

  // Temporalmente inhabilitado ya que el sensor de lluvia no está activo y la tabla no existe.
  // Esto previene spam de errores (RpcError table not found) en los logs de InfluxDB.
  return NextResponse.json({
    totalDurationSeconds: 0,
    averageIntensity: 0,
    eventCount: 0,
    events: [],
  })

  /*
  // Consulta para obtener eventos de lluvia (Deshabilitada)
  const query = `
    SELECT *
    FROM "rain_events"
    WHERE "zone" = '${zone}'
    AND time >= now() - interval '${rangeString}'
    ORDER BY time ASC
  `

  try {
    const reader = influxClient.query(query)
    // ...
  } catch (error: unknown) {
    // ...
  }
  */
}
