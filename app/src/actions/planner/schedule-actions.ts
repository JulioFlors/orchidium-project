'use server'

import { revalidatePath } from 'next/cache'
import prisma, { type TaskPurpose, type ZoneType, CollisionGuard } from '@package/database'

import { sendMqttCommand } from '@/lib/server'

/**
 * Notifica al Scheduler via MQTT que las rutinas en DB han cambiado.
 */
async function notifySchedulerSync() {
  try {
    await sendMqttCommand('PristinoPlant/System/Scheduler/Sync', {
      action: 'SYNC_SCHEDULES',
      timestamp: Date.now(),
    })
  } catch {
    // Si falla el envio puntual de MQTT, la auditoria nocturna resincronizara
  }
}

/**
 * Obtiene todas las rutinas de riego automatizado (AutomationSchedule)
 */
export async function getSchedules() {
  try {
    const schedules = await prisma.automationSchedule.findMany({
      include: {
        fertilizationProgram: true,
        phytosanitaryProgram: true,
      },
      orderBy: [{ purpose: 'asc' }, { name: 'asc' }],
    })

    return { success: true, data: schedules }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message || 'Error fetch schedules' }
    }

    return { success: false, error: 'Error fetch schedules' }
  }
}

/**
 * Activa o desactiva una rutina de riego específica
 */
export async function toggleSchedule(id: string, isEnabled: boolean) {
  try {
    if (isEnabled) {
      const schedule = await prisma.automationSchedule.findUnique({ where: { id } })

      if (!schedule) return { success: false, error: 'Rutina no encontrada' }

      const collisionCheck = await CollisionGuard.validateCronSchedule(
        schedule.cronTrigger,
        schedule.durationMinutes,
        7,
        id,
      )

      if (collisionCheck.hasCollision) {
        return { success: false, error: collisionCheck.details || 'Colisión detectada' }
      }
    }

    const updated = await prisma.automationSchedule.update({
      where: { id },
      data: { isEnabled },
    })

    revalidatePath('/schedules')
    await notifySchedulerSync()

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Error toggling schedule' }
  }
}

/**
 * DTO para crear o editar rutinas de riego
 */
export interface ScheduleInput {
  id?: string
  name: string
  purpose: TaskPurpose
  cronTrigger: string // e.g., "0 16 * * *"
  durationMinutes: number
  zones: ZoneType[]
  fertilizationProgramId?: string | null
  phytosanitaryProgramId?: string | null
}

/**
 * Crea o actualiza una rutina de riego
 */
export async function upsertSchedule(data: ScheduleInput) {
  try {
    const existingName = await prisma.automationSchedule.findFirst({
      where: {
        name: data.name.trim(),
        id: data.id ? { not: data.id } : undefined,
      },
    })

    if (existingName) {
      return {
        success: false,
        error: `Ya existe una rutina de riego llamada "${data.name}".`,
      }
    }

    const collisionCheck = await CollisionGuard.validateCronSchedule(
      data.cronTrigger,
      data.durationMinutes,
      7,
      data.id,
    )

    if (collisionCheck.hasCollision) {
      return { success: false, error: collisionCheck.details || 'Colisión de horario detectada' }
    }

    let result

    if (data.id) {
      result = await prisma.automationSchedule.update({
        where: { id: data.id },
        data: {
          name: data.name.trim(),
          purpose: data.purpose,
          cronTrigger: data.cronTrigger,
          durationMinutes: data.durationMinutes,
          zones: data.zones,
          fertilizationProgram: data.fertilizationProgramId
            ? { connect: { id: data.fertilizationProgramId } }
            : { disconnect: true },
          phytosanitaryProgram: data.phytosanitaryProgramId
            ? { connect: { id: data.phytosanitaryProgramId } }
            : { disconnect: true },
        },
      })
    } else {
      result = await prisma.automationSchedule.create({
        data: {
          name: data.name.trim(),
          purpose: data.purpose,
          cronTrigger: data.cronTrigger,
          durationMinutes: data.durationMinutes,
          zones: data.zones,
          fertilizationProgram: data.fertilizationProgramId
            ? { connect: { id: data.fertilizationProgramId } }
            : undefined,
          phytosanitaryProgram: data.phytosanitaryProgramId
            ? { connect: { id: data.phytosanitaryProgramId } }
            : undefined,
        },
      })
    }

    revalidatePath('/schedules')
    await notifySchedulerSync()

    return { success: true, data: result }
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return { success: false, error: 'Ya existe una rutina con ese nombre' }
    }

    if (error instanceof Error) {
      return { success: false, error: error.message || 'Error upserting schedule' }
    }

    return { success: false, error: 'Error upserting schedule' }
  }
}

/**
 * Elimina una rutina de riego
 */
export async function deleteSchedule(id: string) {
  try {
    await prisma.automationSchedule.delete({
      where: { id },
    })
    revalidatePath('/schedules')
    await notifySchedulerSync()

    return { success: true }
  } catch {
    return { success: false, error: 'Error borrando la rutina' }
  }
}
