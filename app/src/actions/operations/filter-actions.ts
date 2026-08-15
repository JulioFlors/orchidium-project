'use server'

import { revalidatePath } from 'next/cache'
import prisma, { NotificationStatus } from '@package/database'

/**
 * Calcula la siguiente fecha límite de limpieza (+48h a las 8:00 AM Caracas).
 */
function calculateNextDueAt(from: Date): Date {
  const nextDate = new Date(from.getTime() + 2 * 24 * 60 * 60 * 1000)

  nextDate.setHours(8, 0, 0, 0)

  return nextDate
}

/**
 * Obtiene el estado actual de mantenimiento del filtro de agua.
 */
export async function getFilterStatus() {
  try {
    const latestClean = await prisma.filterCleaningLog.findFirst({
      orderBy: { cleanedAt: 'desc' },
    })

    const now = new Date()
    const isDue = !latestClean || now >= latestClean.nextDueAt

    return {
      success: true,
      data: {
        lastCleanedAt: latestClean?.cleanedAt.toISOString() || null,
        nextDueAt: latestClean?.nextDueAt.toISOString() || null,
        isDue,
      },
    }
  } catch {
    return {
      success: false,
      error: 'Error al consultar estado del filtro de agua.',
    }
  }
}

/**
 * Registra una limpieza manual del filtro de agua.
 */
export async function recordFilterCleaning(notes?: string) {
  try {
    const now = new Date()
    const nextDueAt = calculateNextDueAt(now)

    const log = await prisma.filterCleaningLog.create({
      data: {
        cleanedAt: now,
        nextDueAt,
        notes,
        source: 'WEB_UI',
      },
    })

    // Resolver notificaciones pendientes de mantenimiento de filtro
    await prisma.notification.updateMany({
      where: {
        type: 'MAINTENANCE_REMINDER',
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: now,
      },
    })

    revalidatePath('/schedules')
    revalidatePath('/control')

    return {
      success: true,
      data: log,
    }
  } catch {
    return {
      success: false,
      error: 'Error al registrar limpieza del filtro.',
    }
  }
}
