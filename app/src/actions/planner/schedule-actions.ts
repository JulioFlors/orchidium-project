'use server'

import { revalidatePath } from 'next/cache'
import prisma, {
  type TaskPurpose,
  type ZoneType,
  type ExecutionType,
  CollisionGuard,
} from '@package/database'

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
 * Obtiene todas las rutinas (AutomationSchedule)
 * @param executionType Filtro opcional ('HARDWARE' | 'MANUAL')
 */
export async function getSchedules(executionType?: ExecutionType) {
  try {
    const schedules = await prisma.automationSchedule.findMany({
      where: executionType ? { executionType } : undefined,
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
 * Activa o desactiva una rutina específica
 */
export async function toggleSchedule(id: string, isEnabled: boolean) {
  try {
    if (isEnabled) {
      const schedule = await prisma.automationSchedule.findUnique({ where: { id } })

      if (!schedule) return { success: false, error: 'Rutina no encontrada' }

      if (schedule.executionType === 'HARDWARE') {
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
    }

    const updated = await prisma.automationSchedule.update({
      where: { id },
      data: { isEnabled },
    })

    revalidatePath('/schedules')
    revalidatePath('/dosing-schedules')
    await notifySchedulerSync()

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Error toggling schedule' }
  }
}

/**
 * DTO para crear o editar rutinas
 */
interface ScheduleInput {
  id?: string
  name: string
  purpose: TaskPurpose
  executionType?: ExecutionType
  cronTrigger: string // e.g., "0 16 * * *"
  durationMinutes: number
  zones: ZoneType[]
  fertilizationProgramId?: string | null
  phytosanitaryProgramId?: string | null
}

/**
 * Crea o actualiza una rutina
 */
export async function upsertSchedule(data: ScheduleInput) {
  try {
    const isManual = data.executionType === 'MANUAL'
    const executionType = isManual ? 'MANUAL' : 'HARDWARE'

    if (!isManual) {
      const collisionCheck = await CollisionGuard.validateCronSchedule(
        data.cronTrigger,
        data.durationMinutes,
        7,
        data.id,
      )

      if (collisionCheck.hasCollision) {
        return { success: false, error: collisionCheck.details || 'Colisión de horario detectada' }
      }
    }

    let result

    if (data.id) {
      result = await prisma.automationSchedule.update({
        where: { id: data.id },
        data: {
          name: data.name,
          purpose: data.purpose,
          executionType,
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
          name: data.name,
          purpose: data.purpose,
          executionType,
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
    revalidatePath('/dosing-schedules')
    await notifySchedulerSync()

    return { success: true, data: result }
  } catch (error: unknown) {
    // Si el nombre ya existe (Unique constraint p2002 via prisma)
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
 * Elimina una rutina
 */
export async function deleteSchedule(id: string) {
  try {
    await prisma.automationSchedule.delete({
      where: { id },
    })
    revalidatePath('/schedules')
    revalidatePath('/dosing-schedules')
    await notifySchedulerSync()

    return { success: true }
  } catch {
    return { success: false, error: 'Error borrando la rutina' }
  }
}
