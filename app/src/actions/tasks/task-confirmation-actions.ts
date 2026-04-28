'use server'

import { prisma, TaskStatus } from '@package/database'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import { auth } from '@/lib/server'

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

    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    const userName = session?.user?.name || 'Administrador'

    await prisma.taskLog.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.AUTHORIZED,
        notes: `Tanque auxiliar confirmado por ${userName}.`,
      },
    })

    // Registrar evento de auditoría
    await prisma.taskEventLog.create({
      data: {
        taskId,
        status: TaskStatus.AUTHORIZED,
        notes: `Confirmación manual por ${userName}: tanque preparado.`,
        userId,
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

    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    const userName = session?.user?.name || 'Administrador'

    const skipNote = reason || `Omitida manualmente por ${userName}.`

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
        userId,
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
 * Reprograma una tarea de agroquímicos para una nueva fecha/hora.
 * No afecta a la programación maestra (AutomationSchedule).
 */
export async function rescheduleAgrochemicalTask(
  taskId: string,
  newDate: Date,
): Promise<TaskConfirmationResult> {
  try {
    const task = await prisma.taskLog.findUnique({ where: { id: taskId } })

    if (!task) return { success: false, error: 'Tarea no encontrada.' }

    // Solo permitir reprogramar tareas que no han finalizado
    const allowedStatuses: TaskStatus[] = [
      TaskStatus.WAITING_CONFIRMATION,
      TaskStatus.PENDING,
      TaskStatus.FAILED,
      TaskStatus.AUTHORIZED,
    ]

    if (!allowedStatuses.includes(task.status)) {
      return {
        success: false,
        error: `No se puede reprogramar una tarea en estado ${task.status}.`,
      }
    }

    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    const userName = session?.user?.name || 'Administrador'

    await prisma.taskLog.update({
      where: { id: taskId },
      data: {
        scheduledAt: newDate,
        status: TaskStatus.WAITING_CONFIRMATION, // Vuelve a esperar confirmación para la nueva fecha
        notes: `Reprogramada por ${userName} para el ${newDate.toLocaleString('es-VE')}.`,
      },
    })

    await prisma.taskEventLog.create({
      data: {
        taskId,
        status: TaskStatus.WAITING_CONFIRMATION,
        notes: `Reprogramada por ${userName} para: ${newDate.toISOString()}`,
        userId,
      },
    })

    revalidatePath('/orchidarium')
    revalidatePath('/history')
    revalidatePath('/queue')

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: msg }
  }
}

/**
 * Pospone una tarea de agroquímicos por un número fijo de horas (24 o 48).
 * La tarea vuelve al estado WAITING_CONFIRMATION.
 */
export async function postponeAgrochemicalTask(
  taskId: string,
  hours: 24 | 48,
): Promise<TaskConfirmationResult> {
  try {
    const task = await prisma.taskLog.findUnique({ where: { id: taskId } })

    if (!task) return { success: false, error: 'Tarea no encontrada.' }

    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    const userName = session?.user?.name || 'Administrador'

    const newDate = new Date(task.scheduledAt.getTime() + hours * 60 * 60 * 1000)

    await prisma.taskLog.update({
      where: { id: taskId },
      data: {
        scheduledAt: newDate,
        status: TaskStatus.WAITING_CONFIRMATION,
        notes: `Pospuesta ${hours}h por ${userName}.`,
      },
    })

    await prisma.taskEventLog.create({
      data: {
        taskId,
        status: TaskStatus.WAITING_CONFIRMATION,
        notes: `Pospuesta ${hours}h por ${userName} para: ${newDate.toISOString()}`,
        userId,
      },
    })

    revalidatePath('/orchidarium')
    revalidatePath('/history')
    revalidatePath('/queue')

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: msg }
  }
}
