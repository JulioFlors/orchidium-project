import { NextResponse } from 'next/server'
import { prisma, NotificationStatus } from '@package/database'
import { headers } from 'next/headers'

import { auth } from '@/lib/server'

export async function GET() {
  try {
    await auth.api.getSession({ headers: await headers() })

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        task: {
          select: {
            purpose: true,
            status: true,
            scheduledAt: true,
          },
        },
      },
    })

    const unreadCount = await prisma.notification.count({
      where: { status: NotificationStatus.UNREAD },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
