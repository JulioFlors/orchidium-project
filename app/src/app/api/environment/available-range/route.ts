import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { getAvailableTelemetryRange } from '@/lib/server'
import { Logger } from '@/lib'

export async function GET() {
  try {
    const range = await getAvailableTelemetryRange()

    return NextResponse.json(range)
  } catch (error) {
    Logger.error('Error en la API de rango disponible de telemetría:', error)

    return NextResponse.json({ error: 'Error al obtener rango de fechas' }, { status: 500 })
  }
}
