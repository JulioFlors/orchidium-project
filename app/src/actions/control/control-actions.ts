'use server'

import { revalidatePath } from 'next/cache'
import prisma, { type TaskPurpose, type ZoneType, CollisionGuard } from '@package/database'

// Mapeo inverso de Frontend -> Backend
const CIRCUIT_TO_PURPOSE: Record<string, TaskPurpose> = {
  IRRIGATION: 'IRRIGATION',
  HUMIDIFICATION: 'HUMIDIFICATION',
  SOIL_WETTING: 'SOIL_WETTING',
  FERTIGATION: 'FERTIGATION',
  FUMIGATION: 'FUMIGATION',
}

/**
 * Crea una tarea manual de manera oficial en el Historial,
 * devolviendo su UUID para acoplarlo a la publicación MQTT.
 */
export async function createManualTask(
  circuit: string,
  durationMinutes: number,
  zone: ZoneType = 'ZONA_A',
) {
  try {
    const purpose = CIRCUIT_TO_PURPOSE[circuit]

    if (!purpose) throw new Error('Circuito inválido')

    // Validar colisión antes de accionar manualmente
    const collisionCheck = await CollisionGuard.checkTimeWindow(new Date(), durationMinutes)

    if (collisionCheck.hasCollision) {
      return {
        success: false,
        error: `Colisión hidráulica detectada con una tarea agendada para ejecutarse proximamente.`,
      }
    }

    // Crear el log de tarea manual con evento atómico
    const log = await prisma.$transaction(async (tx) => {
      const newLog = await tx.taskLog.create({
        data: {
          purpose,
          status: 'DISPATCHED', // Se envía inmediatamente vía MQTT
          source: 'MANUAL',
          scheduledAt: new Date(),
          executedAt: new Date(),
          duration: durationMinutes,
          zones: [zone],
          notes: 'Ejecución manual desde el Panel de Control',
        },
      })

      // Auditoría
      await tx.taskEventLog.create({
        data: {
          taskId: newLog.id,
          status: 'DISPATCHED',
          notes: 'Usuario inició ejecución manual desde el Panel de Control.',
        },
      })

      return newLog
    })

    return { success: true, taskId: log.id }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        success: false,
        error: 'Error agregando al historial la operación manual: ' + error.message,
      }
    }

    return { success: false, error: 'Error agregando al historial la operación manual' }
  }
}

export async function getWaitingAgrochemicalTasks() {
  try {
    const tasks = await prisma.taskLog.findMany({
      where: {
        status: 'WAITING_CONFIRMATION',
        purpose: { in: ['FERTIGATION', 'FUMIGATION'] },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        schedule: { select: { name: true } },
      },
    })

    return { success: true, data: tasks }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: 'Error obteniendo tareas en espera: ' + error.message }
    }

    return { success: false, error: 'Error obteniendo tareas en espera' }
  }
}

export async function confirmWaitingTasks(taskIds: string[]) {
  try {
    let affectedCount = 0

    await prisma.$transaction(async (tx) => {
      // Idempotencia: Filtrar tareas que realmente estén esperando confirmación
      const validTasks = await tx.taskLog.findMany({
        where: { id: { in: taskIds }, status: 'WAITING_CONFIRMATION' },
        select: { id: true },
      })

      const validIds = validTasks.map((t) => t.id)

      affectedCount = validIds.length

      if (affectedCount === 0) return // fue procesado previamente

      // 1. Actualizar logs solo de las válidas
      await tx.taskLog.updateMany({
        where: { id: { in: validIds } },
        data: {
          status: 'AUTHORIZED',
          scheduledAt: new Date(),
          notes: 'Confirmado: Tanque de Agroquímicos preparado.',
        },
      })

      // 2. Crear eventos solo para las válidas
      for (const id of validIds) {
        await tx.taskEventLog.create({
          data: {
            taskId: id,
            status: 'AUTHORIZED',
            notes: 'Usuario autorizó la ejecución tras confirmar preparación de insumos.',
          },
        })
      }
    })

    if (affectedCount > 0) {
      revalidatePath('/control')
      revalidatePath('/queue')
    }

    return { success: true, count: affectedCount }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: 'Error confirmando tareas programadas: ' + error.message }
    }

    return { success: false, error: 'Error confirmando tareas programadas.' }
  }
}

/**
 * Cierra manualmente un circuito y registra en el historial la intervención del usuario.
 */
export async function cancelManualTask(taskId: string, notes?: string) {
  try {
    let wasModified = false

    await prisma.$transaction(async (tx) => {
      // Idempotencia: Comprobar que no esté finalizada ya
      const currentTask = await tx.taskLog.findUnique({
        where: { id: taskId },
        select: { status: true },
      })

      const terminalStatuses = ['CANCELLED', 'COMPLETED', 'FAILED']

      if (!currentTask || terminalStatuses.includes(currentTask.status)) return

      wasModified = true

      // 1. Marcar como cancelada
      // Si la tarea estaba en PENDING/AUTHORIZED, usamos la nota proporcionada o una por defecto.
      // Si estaba en IN_PROGRESS, usamos la nota específica solicitada por el usuario.
      const finalNotes =
        notes ||
        (currentTask.status === 'IN_PROGRESS'
          ? 'El Admin cerró el circuito desde el Centro de Control.'
          : 'Tarea Cancelada por el Admin antes de iniciar')

      await tx.taskLog.update({
        data: {
          status: 'CANCELLED',
          notes: finalNotes,
        },
        where: { id: taskId },
      })

      // 2. Auditoría
      await tx.taskEventLog.create({
        data: {
          taskId: taskId,
          status: 'CANCELLED',
          notes: finalNotes,
        },
      })
    })

    if (wasModified) {
      // Forzamos revalidar historial solo si hubo cambios reales
      revalidatePath('/control')
    }

    return { success: true, count: wasModified ? 1 : 0 }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: 'Error cancelando tarea manual: ' + error.message }
    }

    return { success: false, error: 'Error cancelando tarea manual.' }
  }
}

/**
 * Obtiene la línea de tiempo de eventos para una tarea específica.
 */
export async function getTaskEvents(taskId: string) {
  try {
    const events = await prisma.taskEventLog.findMany({
      where: { taskId },
      orderBy: { timestamp: 'asc' },
    })

    return { success: true, data: events }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: 'Error obteniendo eventos: ' + error.message }
    }

    return { success: false, error: 'Error obteniendo eventos de la tarea.' }
  }
}
