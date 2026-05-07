import { NextResponse } from 'next/server'
import { prisma, TaskStatus } from '@package/database'

import { Logger } from '@/lib'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const tasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [
            TaskStatus.PENDING,
            TaskStatus.CONFIRMED,
            TaskStatus.IN_PROGRESS,
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.EXPIRED,
            TaskStatus.CANCELLED,
            TaskStatus.DISPATCHED,
            TaskStatus.ACKNOWLEDGED,
            TaskStatus.WAITING_CONFIRMATION,
          ],
        },
      },
      orderBy: {
        scheduledAt: 'desc', // Más recientes primero
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(tasks)
  } catch (error) {
    Logger.error('Error al consultar el historial de tareas:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
