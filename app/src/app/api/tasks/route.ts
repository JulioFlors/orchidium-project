import { NextResponse } from 'next/server'
import { prisma, TaskStatus, TaskPurpose, ZoneType } from '@package/database'

export async function GET() {
  try {
    const tasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      // You can include relations if needed
      // include: { schedule: true, agrochemical: true }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching pending tasks:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { purpose, zones, scheduledAt, durationMinutes, notes } = body as {
      purpose: TaskPurpose
      zones: ZoneType[]
      scheduledAt: string // ISO date string
      durationMinutes: number
      notes?: string
    }

    if (!purpose || !zones || zones.length === 0 || !scheduledAt || !durationMinutes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const taskLog = await prisma.$transaction(async (tx) => {
      const newLog = await tx.taskLog.create({
        data: {
          purpose,
          zones,
          status: TaskStatus.PENDING,
          source: 'DEFERRED',
          scheduledAt: new Date(scheduledAt),
          duration: durationMinutes,
          notes: notes || null,
        },
      })

      // Auditoría inicial
      await tx.taskEventLog.create({
        data: {
          taskId: newLog.id,
          status: TaskStatus.PENDING,
          notes: 'Tarea agendada por el usuario desde el planificador.',
        },
      })

      return newLog
    })

    return NextResponse.json(taskLog, { status: 201 })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating deferred task:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
