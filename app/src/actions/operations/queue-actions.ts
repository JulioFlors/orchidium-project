'use server'

import { prisma, TaskStatus, TaskPurpose, ZoneType } from '@package/database'
import { Cron } from 'croner'

interface CombinedTask {
  id: string
  originalId: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  status: string
  isRoutine: boolean
  routineName?: string
}

/**
 * Obtiene la cola combinada de tareas (manuales pendientes y próximas ejecuciones de rutinas).
 */
export async function getQueueTasks() {
  try {
    // 1. Obtener tareas manuales pendientes, confirmadas o en progreso
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

    const formattedManualTasks: CombinedTask[] = manualTasks.map((task) => ({
      id: task.id,
      originalId: task.id,
      purpose: task.purpose,
      zones: task.zones,
      duration: task.duration,
      scheduledAt: task.scheduledAt.toISOString(),
      status: task.status,
      isRoutine: false,
    }))

    // 2. Obtener automatizaciones activas
    const schedules = await prisma.automationSchedule.findMany({
      where: {
        isEnabled: true,
      },
    })

    // 3. Calcular próxima ejecución para cada rutina
    const routineTasks = schedules
      .map((schedule): CombinedTask | null => {
        try {
          const job = new Cron(schedule.cronTrigger, {
            timezone: 'America/Caracas',
          })

          const nextDate = job.nextRun()

          if (!nextDate) return null

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
        } catch (err) {
          console.error(`Cron inválido para rutina ${schedule.name}:`, err)

          return null
        }
      })
      .filter((t): t is CombinedTask => t !== null)

    // 4. Fusionar y ordenar por fecha
    const combinedTasks = [...formattedManualTasks, ...routineTasks].sort((a, b) => {
      if (!a || !b) return 0

      const timeA = new Date(a.scheduledAt).getTime()
      const timeB = new Date(b.scheduledAt).getTime()

      return timeA - timeB
    })

    return {
      success: true,
      data: combinedTasks,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('Error fetching planner queue (server action):', error)

    return {
      success: false,
      error: 'Error al obtener la cola de ejecución: ' + errorMessage,
    }
  }
}
