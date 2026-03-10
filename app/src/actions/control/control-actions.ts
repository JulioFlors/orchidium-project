'use server'

import { revalidatePath } from 'next/cache'
import prisma, { type TaskPurpose, type ZoneType, CollisionGuard } from '@package/database'

// Mapeo inverso de Frontend -> Backend
const CIRCUIT_TO_PURPOSE: Record<string, TaskPurpose> = {
  irrigation: 'IRRIGATION',
  humidification: 'HUMIDIFICATION',
  soilWet: 'SOIL_WETTING',
  fertigation: 'FERTIGATION',
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
        error: `Colisión hidráulica detectada con una tarea agendada para ejecutarse cerca de ahora.`,
      }
    }

    // Crear el log de tarea manual
    const log = await prisma.taskLog.create({
      data: {
        purpose,
        status: 'CONFIRMED', // Confirmado implícitamente por el usuario manual
        scheduledAt: new Date(),
        duration: durationMinutes,
        zones: [zone],
        notes: 'Ejecución manual desde Control Panel',
      },
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
    const updated = await prisma.taskLog.updateMany({
      where: { id: { in: taskIds }, status: 'WAITING_CONFIRMATION' },
      data: {
        status: 'PENDING',
        scheduledAt: new Date(), // El Scheduler lo despachará al instante (próximo tick)
        notes: 'Confirmado manualmente por el usuario tras rellenar bidón.',
      },
    })

    revalidatePath('/control')
    revalidatePath('/planner')

    return { success: true, count: updated.count }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: 'Error confirmando tareas programadas: ' + error.message }
    }

    return { success: false, error: 'Error confirmando tareas programadas.' }
  }
}
