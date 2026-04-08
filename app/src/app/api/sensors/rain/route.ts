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
    SELECT *
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
      events.push({
        time: row.time,
        duration: row.duration_seconds,
        intensity: row.intensity_percent,
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
    // eslint-disable-next-line no-console
    console.error('Error querying Rain Events:', error)

    return NextResponse.json({ error: 'Failed to fetch rain data' }, { status: 500 })
  }
}
