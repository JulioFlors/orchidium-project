'use server'

import { revalidatePath } from 'next/cache'
import prisma, { type TaskPurpose, type ZoneType } from '@package/database'

import { sendMqttCommand } from '@/lib/server'

/**
 * Notifica al Scheduler via MQTT que las rutinas en DB han cambiado.
 */
async function notifySchedulerSync() {
  try {
    await sendMqttCommand('PristinoPlant/System/Scheduler/Sync', {
      action: 'SYNC_DOSING_SCHEDULES',
      timestamp: Date.now(),
    })
  } catch {
    // La auditoría periódica sincroniza si MQTT no está disponible
  }
}

/**
 * Obtiene todas las rutinas de dosificación manual (DosingSchedule)
 */
export async function getDosingSchedules() {
  try {
    const schedules = await prisma.dosingSchedule.findMany({
      include: {
        fertilizationProgram: true,
        phytosanitaryProgram: true,
      },
      orderBy: [{ purpose: 'asc' }, { name: 'asc' }],
    })

    return { success: true, data: schedules }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message || 'Error al obtener rutinas de dosificación' }
    }

    return { success: false, error: 'Error al obtener rutinas de dosificación' }
  }
}

/**
 * Activa o desactiva una rutina de dosificación específica
 */
export async function toggleDosingSchedule(id: string, isEnabled: boolean) {
  try {
    const updated = await prisma.dosingSchedule.update({
      where: { id },
      data: { isEnabled },
    })

    revalidatePath('/dosing-schedules')
    revalidatePath('/dosing')
    await notifySchedulerSync()

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Error al alternar estado de la rutina de dosificación' }
  }
}

/**
 * DTO para crear o editar rutinas de dosificación
 */
export interface DosingScheduleInput {
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
 * Crea o actualiza una rutina de dosificación
 */
export async function upsertDosingSchedule(data: DosingScheduleInput) {
  try {
    // Validar unicidad del nombre
    const existingName = await prisma.dosingSchedule.findFirst({
      where: {
        name: data.name.trim(),
        id: data.id ? { not: data.id } : undefined,
      },
    })

    if (existingName) {
      return {
        success: false,
        error: `Ya existe una rutina de dosificación llamada "${data.name}".`,
      }
    }

    let result

    if (data.id) {
      result = await prisma.dosingSchedule.update({
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
      result = await prisma.dosingSchedule.create({
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

    revalidatePath('/dosing-schedules')
    revalidatePath('/dosing')
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
      return { success: false, error: error.message || 'Error al guardar rutina de dosificación' }
    }

    return { success: false, error: 'Error al guardar rutina de dosificación' }
  }
}

/**
 * Elimina una rutina de dosificación
 */
export async function deleteDosingSchedule(id: string) {
  try {
    await prisma.dosingSchedule.delete({
      where: { id },
    })

    revalidatePath('/dosing-schedules')
    revalidatePath('/dosing')
    await notifySchedulerSync()

    return { success: true }
  } catch {
    return { success: false, error: 'Error al eliminar la rutina de dosificación' }
  }
}
