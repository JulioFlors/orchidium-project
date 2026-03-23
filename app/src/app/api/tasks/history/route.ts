import { NextResponse } from 'next/server'
import { prisma, TaskStatus } from '@package/database'

export async function GET() {
  try {
    const tasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [
            TaskStatus.CONFIRMED,
            TaskStatus.IN_PROGRESS,
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.EXPIRED,
            TaskStatus.CANCELLED,
            TaskStatus.SKIPPED,
          ],
        },
      },
      orderBy: {
        scheduledAt: 'desc', // Más recientes primero
      },
      take: 50, // Para evitar sobrecargar la vista
    })

    return NextResponse.json(tasks)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching history tasks:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
