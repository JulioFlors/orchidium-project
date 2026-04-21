import { NextResponse } from 'next/server'

import { influxClient } from '@/lib/influxdb'

export async function GET(_request: Request) {
  const { searchParams } = new URL(_request.url)
  const range = searchParams.get('range') || '24h'
  const zone = searchParams.get('zone') || 'EXTERIOR'

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
      rangeString = '365d'
      break
    default:
      rangeString = '24h'
  }

  const timeFilter = range === 'all' ? '' : `AND time >= now() - interval '${rangeString}'`

  const query = `
    SELECT 
      time,
      duration_seconds,
      intensity_percent
    FROM "rain_events"
    WHERE "zone" = '${zone}'
    ${timeFilter}
    ORDER BY time ASC
  `

  try {
    const reader = influxClient.query(query)
    const events = []
    let totalDuration = 0
    let totalIntensity = 0

    for await (const row of reader) {
      // Conversión segura de tiempo (nanosegundos a ISO string)
      let timeStr = ''

      try {
        if (row.time instanceof Date) {
          timeStr = row.time.toISOString()
        } else if (typeof row.time === 'bigint' || typeof row.time === 'number') {
          const ms = Number(BigInt(row.time) / BigInt(1000000))

          timeStr = new Date(ms).toISOString()
        } else {
          timeStr = new Date(String(row.time)).toISOString()
        }
      } catch {
        timeStr = new Date().toISOString()
      }

      events.push({
        time: timeStr,
        duration: Number(row.duration_seconds),
        intensity: Number(row.intensity_percent),
      })
      totalDuration += Number(row.duration_seconds)
      totalIntensity += Number(row.intensity_percent)
    }

    return NextResponse.json({
      totalDurationSeconds: totalDuration,
      averageIntensity: events.length > 0 ? Math.round(totalIntensity / events.length) : 0,
      eventCount: events.length,
      events,
    })
  } catch (error: unknown) {
    const err = error as Error
    const errorMessage = err.message || err.toString()

    if (errorMessage.includes('not found') || errorMessage.includes('table')) {
      return NextResponse.json({
        totalDurationSeconds: 0,
        averageIntensity: 0,
        eventCount: 0,
        events: [],
      })
    }

    console.error('Error querying Rain Events:', error)

    return NextResponse.json(
      { error: 'Error al obtener datos de telemetría del pluviómetro' },
      { status: 500 },
    )
  }
}
