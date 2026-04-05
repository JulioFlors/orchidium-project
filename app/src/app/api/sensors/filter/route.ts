import { NextResponse } from 'next/server'

import { influxClient } from '@/lib/influxdb'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zone = searchParams.get('zone') || 'EXTERIOR'

  if (!influxClient) {
    return NextResponse.json({ error: 'InfluxDB client not initialized' }, { status: 500 })
  }

  // Obtenemos la última medición de salud del filtro
  const query = `
    SELECT "health_percent", "pressure_reading"
    FROM "filter_health"
    WHERE "zone" = '${zone}'
    AND time >= now() - interval '24h'
    ORDER BY time DESC
    LIMIT 1
  `

  try {
    const reader = influxClient.query(query)

    let lastRecord = null

    for await (const row of reader) {
      lastRecord = {
        health: row.health_percent,
        pressure: row.pressure_reading,
        time: row.time,
      }
      break
    }

    if (!lastRecord) {
      return NextResponse.json({ health: 100, pressure: 0, status: 'unknown' })
    }

    return NextResponse.json({
      ...lastRecord,
      status: lastRecord.health < 70 ? 'warning' : 'optimal',
    })
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error querying Filter Health:', error)

    // Si la tabla no existe aún, devolvemos 100% por defecto
    return NextResponse.json({ health: 100, pressure: 0, status: 'optimal' })
  }
}
