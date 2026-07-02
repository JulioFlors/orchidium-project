import { NextResponse } from 'next/server'

import { Logger } from '@/lib'
import { ZoneType } from '@/config/mappings'
import { getRainSummaryInternal, getRainEventTelemetryInternal } from '@/lib/server/environment'

export async function GET(_request: Request) {
  const { searchParams } = new URL(_request.url)
  const eventId = searchParams.get('eventId')
  const range = searchParams.get('range') || '12h'
  const zone = (searchParams.get('zone') || ZoneType.EXTERIOR) as ZoneType

  try {
    if (eventId) {
      const telemetry = await getRainEventTelemetryInternal(eventId)

      if (!telemetry) {
        return NextResponse.json({ error: 'Evento de lluvia no encontrado' }, { status: 404 })
      }

      return NextResponse.json(telemetry)
    }

    const summary = await getRainSummaryInternal(range, zone)

    return NextResponse.json(summary)
  } catch (error: unknown) {
    Logger.error('Error al consultar los eventos de lluvia:', error)

    return NextResponse.json(
      { error: 'Error al obtener datos de telemetría del pluviómetro' },
      { status: 500 },
    )
  }
}
