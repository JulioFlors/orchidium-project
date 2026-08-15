import prisma, { NotificationStatus } from '@package/database'

import { Logger } from './logger'

/**
 * Calcula la siguiente fecha límite de limpieza:
 * Exactamente 2 días (48 horas) después de la limpieza, fijada a las 8:00 AM (Caracas).
 */
function calculateNextDueAt(from: Date): Date {
  const nextDate = new Date(from.getTime() + 2 * 24 * 60 * 60 * 1000)
  // Fijar a las 8:00 AM
  nextDate.setHours(8, 0, 0, 0)

  return nextDate
}

class FilterMaintenanceManager {
  /**
   * Registra una limpieza de filtro confirmada por el usuario (vía Telegram /filter o Web UI).
   */
  async recordFilterCleaning(
    source: 'TELEGRAM_BOT' | 'WEB_UI' = 'WEB_UI',
    confirmedBy?: string,
    notes?: string,
  ): Promise<void> {
    try {
      const now = new Date()
      const nextDueAt = calculateNextDueAt(now)

      await prisma.filterCleaningLog.create({
        data: {
          cleanedAt: now,
          nextDueAt,
          notes,
          confirmedBy,
          source,
        },
      })

      // Marcar todas las notificaciones pendientes de mantenimiento de filtro como LEÍDAS
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

      Logger.cron(
        `Limpieza de filtro registrada con éxito (${source}). Próxima limpieza: ${nextDueAt.toLocaleString('es-VE')}`,
      )
    } catch (error) {
      Logger.error('Error registrando limpieza de filtro:', error)
      throw error
    }
  }

  /**
   * Evaluación rutinaria (disparada diariamente a las 8:00 AM).
   * Si han pasado >= 48 horas desde la última limpieza, emite recordatorio para n8n/Telegram.
   */
  async evaluateDailyFilterMaintenance(): Promise<void> {
    try {
      const latestClean = await prisma.filterCleaningLog.findFirst({
        orderBy: { cleanedAt: 'desc' },
      })

      const now = new Date()
      const isDue = !latestClean || now >= latestClean.nextDueAt

      if (isDue) {
        // Verificar si ya existe una notificación no leída para no saturar
        const unread = await prisma.notification.findFirst({
          where: {
            type: 'MAINTENANCE_REMINDER',
            status: NotificationStatus.UNREAD,
          },
        })

        if (!unread) {
          await prisma.notification.create({
            data: {
              type: 'MAINTENANCE_REMINDER',
              title: 'Mantenimiento del Filtro de Agua',
              description:
                'Recordatorio: Han transcurrido 48 horas desde la última limpieza del filtro de agua. Por favor realizar el mantenimiento antes del riego de las 11:00 AM.',
              priority: 'HIGH',
            },
          })

          Logger.cron('Notificación de mantenimiento de filtro de 48h emitida a n8n/Telegram.')
        }
      }
    } catch (error) {
      Logger.error('Error evaluando mantenimiento diario de filtro:', error)
    }
  }

  /**
   * Pre-evaluación ejecutada 1 hora antes de cualquier tarea del circuito hidráulico.
   * Si el filtro está vencido, insiste con notificación de advertencia.
   */
  async evaluatePreIrrigationFilterCheck(routineName: string): Promise<boolean> {
    try {
      const latestClean = await prisma.filterCleaningLog.findFirst({
        orderBy: { cleanedAt: 'desc' },
      })

      const now = new Date()
      const isOverdue = !latestClean || now >= latestClean.nextDueAt

      if (isOverdue) {
        await prisma.notification.create({
          data: {
            type: 'MAINTENANCE_REMINDER',
            title: 'Filtro Sucio: Riego Próximo en 1h',
            description: `Atención: La rutina "${routineName}" iniciará en 1 hora y el filtro de agua no ha sido limpiado. Confirma la limpieza con /filter en Telegram o desde la Web.`,
            priority: 'URGENT',
          },
        })

        Logger.warn(`Alerta preventiva de filtro enviada 1h antes del riego "${routineName}".`)

        return false
      }

      return true
    } catch (error) {
      Logger.error('Error en pre-evaluación de filtro antes de riego:', error)

      return true
    }
  }

  /**
   * Obtiene el estado actual del filtro de agua.
   */
  async getFilterStatus() {
    const latestClean = await prisma.filterCleaningLog.findFirst({
      orderBy: { cleanedAt: 'desc' },
    })

    const now = new Date()
    const isDue = !latestClean || now >= latestClean.nextDueAt

    return {
      lastCleanedAt: latestClean?.cleanedAt || null,
      nextDueAt: latestClean?.nextDueAt || null,
      isDue,
    }
  }
}

export const filterMaintenanceManager = new FilterMaintenanceManager()
