'use server'

import { revalidatePath } from 'next/cache'
import { prisma, TaskPurpose, TaskStatus, TaskSource, type ZoneType } from '@package/database'
import { Cron } from 'croner'

import { Logger } from '@/lib'

export interface DosingTaskItem {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  executedAt: string | null
  status: TaskStatus
  source: TaskSource
  notes: string | null
  agrochemicalId: string | null
  agrochemical?: {
    id: string
    name: string
    purpose: string
    type: string
    preparation: string
  } | null
  schedule?: {
    id: string
    name: string
    fertilizationProgram?: { id: string; name: string } | null
    phytosanitaryProgram?: { id: string; name: string } | null
  } | null
  routineName?: string
}

/**
 * Obtiene la agenda e historial de dosificaciones manuales combinando
 * registros confirmados (ManualDosingLog) y proyecciones de rutinas manuales.
 */
export async function getDosingTasks(limit = 50, offset = 0) {
  try {
    // 1. Obtener registros confirmados / agendados de la base de datos (ManualDosingLog)
    const logs = await prisma.manualDosingLog.findMany({
      include: {
        agrochemical: true,
        schedule: {
          include: {
            fertilizationProgram: true,
            phytosanitaryProgram: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const actualTasks: DosingTaskItem[] = logs.map((task) => {
      let routineName = ''

      if (task.schedule?.fertilizationProgram?.name) {
        routineName = `Programa: ${task.schedule.fertilizationProgram.name}`
      } else if (task.schedule?.phytosanitaryProgram?.name) {
        routineName = `Programa: ${task.schedule.phytosanitaryProgram.name}`
      } else if (task.schedule?.name) {
        routineName = task.schedule.name
      } else {
        routineName = 'Aplicación Manual Independiente'
      }

      return {
        id: task.id,
        purpose: task.purpose,
        zones: task.zones,
        duration: task.duration,
        scheduledAt: task.scheduledAt.toISOString(),
        executedAt: task.executedAt ? task.executedAt.toISOString() : null,
        status: task.status,
        source: TaskSource.MANUAL,
        notes: task.notes,
        agrochemicalId: task.agrochemicalId,
        agrochemical: task.agrochemical
          ? {
              id: task.agrochemical.id,
              name: task.agrochemical.name,
              purpose: task.agrochemical.purpose,
              type: task.agrochemical.type,
              preparation: task.agrochemical.preparation,
            }
          : null,
        schedule: task.schedule
          ? {
              id: task.schedule.id,
              name: task.schedule.name,
              fertilizationProgram: task.schedule.fertilizationProgram,
              phytosanitaryProgram: task.schedule.phytosanitaryProgram,
            }
          : null,
        routineName,
      }
    })

    // 2. Obtener rutinas activas de dosificación manual para calcular proyecciones futuras
    const manualSchedules = await prisma.automationSchedule.findMany({
      where: {
        isEnabled: true,
        executionType: 'MANUAL',
      },
      include: {
        fertilizationProgram: {
          include: {
            productsCycle: {
              include: { agrochemical: true },
            },
          },
        },
        phytosanitaryProgram: {
          include: {
            productsCycle: {
              include: { agrochemical: true },
            },
          },
        },
      },
    })

    const projectedTasks: DosingTaskItem[] = []

    for (const schedule of manualSchedules) {
      try {
        const cron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' })
        const nextRun = cron.nextRun()

        if (nextRun) {
          // Determinar el producto agroquímico del programa si aplica
          const firstCycle =
            schedule.fertilizationProgram?.productsCycle[0] ||
            schedule.phytosanitaryProgram?.productsCycle[0]

          const agro = firstCycle?.agrochemical

          let routineName = ''

          if (schedule.fertilizationProgram?.name) {
            routineName = `Programa: ${schedule.fertilizationProgram.name}`
          } else if (schedule.phytosanitaryProgram?.name) {
            routineName = `Programa: ${schedule.phytosanitaryProgram.name}`
          } else {
            routineName = schedule.name
          }

          projectedTasks.push({
            id: `proj-${schedule.id}-${nextRun.getTime()}`,
            purpose: schedule.purpose,
            zones: schedule.zones,
            duration: schedule.durationMinutes,
            scheduledAt: nextRun.toISOString(),
            executedAt: null,
            status: TaskStatus.PENDING,
            source: TaskSource.ROUTINE,
            notes: 'Proyección automática de rutina manual',
            agrochemicalId: agro?.id || null,
            agrochemical: agro
              ? {
                  id: agro.id,
                  name: agro.name,
                  purpose: agro.purpose,
                  type: agro.type,
                  preparation: agro.preparation,
                }
              : null,
            schedule: {
              id: schedule.id,
              name: schedule.name,
              fertilizationProgram: schedule.fertilizationProgram,
              phytosanitaryProgram: schedule.phytosanitaryProgram,
            },
            routineName,
          })
        }
      } catch (err) {
        Logger.warn(`Error calculando proyección cron para rutina ${schedule.id}:`, err)
      }
    }

    // Unir tareas reales y proyectadas ordenadas por fecha programada
    const combinedData = [...actualTasks, ...projectedTasks].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    )

    return {
      success: true,
      data: combinedData,
    }
  } catch (error) {
    Logger.error('Error fetching dosing tasks:', error)

    return {
      success: false,
      error: 'Error al obtener la agenda de dosificación.',
    }
  }
}

/**
 * Crea un nuevo registro/tarea manual de dosificación en ManualDosingLog.
 */
export async function createDosingTask(data: {
  agrochemicalId: string
  purpose: TaskPurpose
  scheduledAt: string
  zones: ZoneType[]
  notes?: string
  status?: TaskStatus
}) {
  try {
    const scheduledDate = new Date(data.scheduledAt)
    const finalStatus = data.status || TaskStatus.PENDING
    const isCompleted = finalStatus === TaskStatus.COMPLETED

    if (!isCompleted && scheduledDate < new Date()) {
      return {
        success: false,
        error:
          'La fecha y hora de una tarea pendiente deben ser futuras (o marca la opción "Registrar como completada").',
      }
    }

    const newTask = await prisma.manualDosingLog.create({
      data: {
        agrochemicalId: data.agrochemicalId,
        purpose: data.purpose,
        scheduledAt: scheduledDate,
        executedAt: isCompleted ? scheduledDate : undefined,
        status: finalStatus,
        zones: data.zones,
        notes: data.notes || null,
        duration: 15,
      },
    })

    revalidatePath('/dosing')

    return {
      success: true,
      data: newTask,
    }
  } catch (error) {
    Logger.error('Error creating dosing task:', error)

    return {
      success: false,
      error: 'No se pudo crear el registro de dosificación.',
    }
  }
}

/**
 * Actualiza los datos de una tarea de dosificación existente en ManualDosingLog.
 */
export async function updateDosingTask(
  taskId: string,
  data: {
    agrochemicalId: string
    purpose: TaskPurpose
    scheduledAt: string
    zones: ZoneType[]
    notes?: string
    status?: TaskStatus
  },
) {
  try {
    const scheduledDate = new Date(data.scheduledAt)
    const finalStatus = data.status || TaskStatus.PENDING
    const isCompleted = finalStatus === TaskStatus.COMPLETED

    if (!isCompleted && scheduledDate < new Date()) {
      return {
        success: false,
        error:
          'La fecha y hora de una tarea pendiente deben ser futuras (o marca la opción "Registrar como completada").',
      }
    }

    const updatedTask = await prisma.manualDosingLog.update({
      where: { id: taskId },
      data: {
        agrochemicalId: data.agrochemicalId,
        purpose: data.purpose,
        scheduledAt: scheduledDate,
        executedAt: isCompleted ? scheduledDate : null,
        status: finalStatus,
        zones: data.zones,
        notes: data.notes || null,
      },
    })

    revalidatePath('/dosing')

    return {
      success: true,
      data: updatedTask,
    }
  } catch (error) {
    Logger.error('Error updating dosing task:', error)

    return {
      success: false,
      error: 'No se pudo actualizar la tarea de dosificación.',
    }
  }
}

/**
 * Actualiza el estado de una tarea de dosificación (Completar, Posponer, Cancelar).
 */
export async function updateDosingTaskStatus(
  taskId: string,
  status: TaskStatus,
  postponeHours?: number,
) {
  try {
    const existingTask = await prisma.manualDosingLog.findUnique({
      where: { id: taskId },
    })

    if (!existingTask) {
      return { success: false, error: 'Tarea no encontrada.' }
    }

    let newScheduledAt = existingTask.scheduledAt
    let executedAt = existingTask.executedAt

    if (postponeHours && postponeHours > 0) {
      newScheduledAt = new Date(existingTask.scheduledAt.getTime() + postponeHours * 3600 * 1000)
    }

    if (status === TaskStatus.COMPLETED) {
      executedAt = new Date()
    }

    const updatedTask = await prisma.manualDosingLog.update({
      where: { id: taskId },
      data: {
        status,
        scheduledAt: newScheduledAt,
        executedAt,
      },
    })

    revalidatePath('/dosing')

    return {
      success: true,
      data: updatedTask,
    }
  } catch (error) {
    Logger.error('Error updating dosing task status:', error)

    return {
      success: false,
      error: 'No se pudo actualizar el estado de la tarea.',
    }
  }
}

/**
 * Elimina una tarea de dosificación en ManualDosingLog.
 */
export async function deleteDosingTask(taskId: string) {
  try {
    await prisma.manualDosingLog.delete({
      where: { id: taskId },
    })

    revalidatePath('/dosing')

    return { success: true }
  } catch (error) {
    Logger.error('Error deleting dosing task:', error)

    return {
      success: false,
      error: 'No se pudo eliminar el registro.',
    }
  }
}
