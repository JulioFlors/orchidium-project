'use server'

import { prisma, TaskStatus } from '@package/database'
import { revalidatePath } from 'next/cache'

interface TaskConfirmationResult {
  success: boolean
  error?: string
}

/**
 * Obtiene las tareas pendientes de confirmación del usuario (agroquímicos).
 * Busca tareas con estado WAITING_CONFIRMATION que aún no han expirado.
 */
export async function getPendingConfirmationTasks() {
  try {
    const tasks = await prisma.taskLog.findMany({
      where: {
        status: TaskStatus.WAITING_CONFIRMATION,
      },
      include: {
        agrochemical: { select: { name: true, type: true } },
        schedule: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    return {
      success: true,
      data: tasks.map((t) => ({
        id: t.id,
        purpose: t.purpose,
        scheduledAt: t.scheduledAt,
        duration: t.duration,
        zones: t.zones,
        agrochemicalName: t.agrochemical?.name ?? null,
        agrochemicalType: t.agrochemical?.type ?? null,
        scheduleName: t.schedule?.name ?? null,
      })),
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, data: [], error: msg }
  }
}

/**
 * Confirma que el tanque de agroquímicos está preparado.
 * Cambia WAITING_CONFIRMATION → AUTHORIZED para que el motor de polling lo ejecute.
 */
export async function confirmAgrochemicalTask(taskId: string): Promise<TaskConfirmationResult> {
  try {
    const task = await prisma.taskLog.findUnique({ where: { id: taskId } })

    if (!task) return { success: false, error: 'Tarea no encontrada.' }
    if (task.status !== TaskStatus.WAITING_CONFIRMATION) {
      return {
        success: false,
        error: `La tarea ya no está en espera de confirmación (estado: ${task.status}).`,
      }
    }

    await prisma.taskLog.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.AUTHORIZED,
        notes: 'Tanque auxiliar confirmado por el usuario.',
      },
    })

    // Registrar evento de auditoría
    await prisma.taskEventLog.create({
      data: {
        taskId,
        status: TaskStatus.AUTHORIZED,
        notes: 'Confirmación manual: tanque preparado.',
      },
    })

    revalidatePath('/orchidarium')
    revalidatePath('/history')

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: msg }
  }
}

/**
 * Omite una tarea de agroquímicos (no se preparó el tanque, se pospone, etc.).
 * Cambia WAITING_CONFIRMATION → SKIPPED con nota auditable.
 */
export async function skipAgrochemicalTask(
  taskId: string,
  reason?: string,
): Promise<TaskConfirmationResult> {
  try {
    const task = await prisma.taskLog.findUnique({ where: { id: taskId } })

    if (!task) return { success: false, error: 'Tarea no encontrada.' }
    if (task.status !== TaskStatus.WAITING_CONFIRMATION) {
      return {
        success: false,
        error: `La tarea ya no está en espera de confirmación (estado: ${task.status}).`,
      }
    }

    const skipNote = reason || 'Omitida manualmente por el usuario.'

    await prisma.taskLog.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SKIPPED,
        notes: skipNote,
      },
    })

    await prisma.taskEventLog.create({
      data: {
        taskId,
        status: TaskStatus.SKIPPED,
        notes: skipNote,
      },
    })

    revalidatePath('/orchidarium')
    revalidatePath('/history')

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: msg }
  }
}
