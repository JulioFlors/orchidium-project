import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@package/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const device = searchParams.get('device')

  if (!device) {
    return NextResponse.json({ error: 'Missing device query parameter' }, { status: 400 })
  }

  try {
    const latestLog = await prisma.deviceLog.findFirst({
      where: { device },
      orderBy: { timestamp: 'desc' },
    })

    if (latestLog) {
      return NextResponse.json({
        timestamp: latestLog.timestamp.getTime(),
        status: latestLog.status.toLowerCase(),
      })
    }

    return NextResponse.json(null)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching device status from database' },
      { status: 500 }
    )
  }
}
