import { NextResponse } from 'next/server'
import { prisma, TaskStatus } from '@package/database'
import { Cron } from 'croner'

import { Logger } from '@/lib'

export async function GET() {
  try {
    // 1. Fetch manual pending tasks
    const manualTasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [TaskStatus.PENDING, TaskStatus.CONFIRMED, TaskStatus.IN_PROGRESS],
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    const formattedManualTasks = manualTasks.map((task) => ({
      id: task.id,
      purpose: task.purpose,
      zones: task.zones,
      duration: task.duration,
      scheduledAt: task.scheduledAt.toISOString(),
      status: task.status,
      isRoutine: false,
      notes: task.notes,
      source: task.source,
    }))

    // 2. Fetch enabled automation schedules
    const schedules = await prisma.automationSchedule.findMany({
      where: {
        isEnabled: true,
      },
    })

    // 3. Compute next execution date for each schedule
    const routineTasks = schedules
      .map((schedule) => {
        try {
          // Parse using Croner with the correct Caracas timezone (matches backend)
          const job = new Cron(schedule.cronTrigger, {
            timezone: 'America/Caracas',
          })

          const nextDate = job.nextRun()

          if (!nextDate) return null // Por si el cron es inválido o no tiene próxima ejecución

          return {
            id: `routine-${schedule.id}`,
            originalId: schedule.id,
            purpose: schedule.purpose,
            zones: schedule.zones,
            duration: schedule.durationMinutes,
            scheduledAt: nextDate.toISOString(),
            status: 'PENDING',
            isRoutine: true,
            routineName: schedule.name,
          }
        } catch {
          // Ignoramos crons defectuosos
          return null
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(Boolean) as any[]

    // 4. Merge and sort
    const combinedTasks = [...formattedManualTasks, ...routineTasks].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime()
      const timeB = new Date(b.scheduledAt).getTime()

      return timeA - timeB
    })

    return NextResponse.json(combinedTasks)
  } catch (error) {
    Logger.error('Error fetching planner queue:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
