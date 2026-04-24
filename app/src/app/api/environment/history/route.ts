import { NextResponse } from 'next/server'

import { getSensorHistoryInternal } from '@/lib/server'
import { Logger } from '@/lib'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '12h'
  const zone = searchParams.get('zone') || 'DEFAULT'
  const metric = searchParams.get('metric')

  try {
    const data = await getSensorHistoryInternal(range, zone, metric)

    return NextResponse.json(data)
  } catch (error) {
    Logger.error('Error in Environment History API:', error)

    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })
  }
}
