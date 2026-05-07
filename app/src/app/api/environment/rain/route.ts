import { NextResponse } from 'next/server'

import { Logger } from '@/lib'
import { ZoneType } from '@/config/mappings'
import { getRainSummaryInternal } from '@/lib/server/environment'

export async function GET(_request: Request) {
  const { searchParams } = new URL(_request.url)
  const range = searchParams.get('range') || '12h'
  const zone = (searchParams.get('zone') || ZoneType.EXTERIOR) as ZoneType

  try {
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
