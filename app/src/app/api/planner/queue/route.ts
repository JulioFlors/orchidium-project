import { NextResponse } from 'next/server'
import { prisma, TaskStatus } from '@package/database'

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
          // Extraer la hora deseada usando RegExp: "0 18 * * *" -> 18, "0 6 * * 1" -> 6
          const match = schedule.cronTrigger.match(/^(\d+|\*)\s+(\d+)\s+/)

          if (!match) throw new Error(`Cron inválido: ${schedule.cronTrigger}`)

          const scheduledHour = parseInt(match[2], 10)

          // Calcular la proxima ejecucion en hora local
          const now = new Date()
          const nextDate = new Date()

          // Si la hora programada ya pasó hoy, se programa para mañana
          if (now.getHours() >= scheduledHour) {
            nextDate.setDate(now.getDate() + 1)
          }

          nextDate.setHours(scheduledHour, 0, 0, 0)

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
    // eslint-disable-next-line no-console
    console.error('Error fetching planner queue:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
