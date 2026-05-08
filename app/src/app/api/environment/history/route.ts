import { NextResponse } from 'next/server'

import { getSensorDataInternal } from '@/lib/server'
import { Logger } from '@/lib'
import { ZoneType } from '@/config/mappings'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '12h'
  const zone = searchParams.get('zone') || 'DEFAULT'
  const metric = searchParams.get('metric')

  try {
    const data = await getSensorDataInternal(range, zone as ZoneType, metric)

    return NextResponse.json(data)
  } catch (error) {
    Logger.error('Error en la API de datos ambientales:', error)

    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })
  }
}
