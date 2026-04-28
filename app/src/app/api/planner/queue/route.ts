import { NextResponse } from 'next/server'
import { prisma, TaskStatus } from '@package/database'
import { Cron } from 'croner'

import { Logger } from '@/lib'

export async function GET() {
  try {
    // 1. Fetch active tasks
    const manualTasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [
            TaskStatus.PENDING,
            TaskStatus.CONFIRMED,
            TaskStatus.WAITING_CONFIRMATION,
            TaskStatus.AUTHORIZED,
            TaskStatus.DISPATCHED,
            TaskStatus.ACKNOWLEDGED,
            TaskStatus.IN_PROGRESS,
          ],
        },
      },
      include: {
        schedule: { select: { name: true } },
        agrochemical: { select: { name: true, type: true } },
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
      isRoutine: task.source === 'ROUTINE',
      routineName: task.schedule?.name,
      agrochemicalName: task.agrochemical?.name,
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
    const routineTasksRaw = schedules
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
            scheduledAt: nextDate, // Keep as Date for filtering
            status: 'PENDING',
            isRoutine: true,
            routineName: schedule.name,
          }
        } catch {
          // Ignoramos crons defectuosos
          return null
        }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)

    // 4. Filter out routine tasks that are already "materialized" in TaskLog
    // (This prevents showing projections for tasks that were already cancelled or started)
    const scheduleIds = routineTasksRaw.map((t) => t.originalId)
    const scheduledDates = routineTasksRaw.map((t) => t.scheduledAt)

    const existingLogs = await prisma.taskLog.findMany({
      where: {
        scheduleId: { in: scheduleIds },
        scheduledAt: { in: scheduledDates },
      },
      select: { scheduleId: true, scheduledAt: true },
    })

    const routineTasks = routineTasksRaw
      .filter((rt) => {
        const exists = existingLogs.some(
          (log) =>
            log.scheduleId === rt.originalId &&
            log.scheduledAt.getTime() === rt.scheduledAt.getTime(),
        )

        return !exists
      })
      .map((rt) => ({
        ...rt,
        scheduledAt: rt.scheduledAt.toISOString(), // Convert back to string for response
      }))

    // 5. Merge and sort
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
