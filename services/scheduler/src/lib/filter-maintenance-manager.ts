import prisma, { NotificationStatus, TaskStatus } from '@package/database'
import { Cron } from 'croner'

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
                'Recordatorio: Han transcurrido 2 días desde la última limpieza del filtro de agua. Por favor realizar el mantenimiento antes de la próxima ejecucion del circuito hidraulico de riego.',
              priority: 'HIGH',
            },
          })

          Logger.cron('Notificación de mantenimiento de filtro de 2 dias emitida a n8n/Telegram.')
        }
      }
    } catch (error) {
      Logger.error('Error evaluando mantenimiento diario de filtro:', error)
    }
  }

  /**
   * Pre-evaluación ejecutada periódicamente antes de cualquier tarea agendada del circuito hidráulico.
   * Si el filtro está vencido (overdue), busca si en la siguiente hora (~60 min) hay una tarea
   * o rutina agendada para ejecutarse. Si la hay y no se ha emitido alerta previa para esa ventana,
   * emite una notificación de advertencia de filtro sucio.
   */
  async evaluateUpcomingHydraulicTasks(): Promise<void> {
    try {
      const latestClean = await prisma.filterCleaningLog.findFirst({
        orderBy: { cleanedAt: 'desc' },
      })

      const now = new Date()
      const isOverdue = !latestClean || now >= latestClean.nextDueAt

      if (!isOverdue) {
        return
      }

      const oneHourAhead = new Date(now.getTime() + 65 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      // 1. Evaluar rutinas activas en AutomationSchedule (riego, fertirriego, fumigación)
      const activeSchedules = await prisma.automationSchedule.findMany({
        where: { isEnabled: true },
      })

      for (const schedule of activeSchedules) {
        const cron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' })
        const nextOccurrence = cron.nextRun()

        if (nextOccurrence && nextOccurrence > now && nextOccurrence <= oneHourAhead) {
          // Evitar alertas duplicadas para esta rutina en las últimas 2 horas
          const recentAlert = await prisma.notification.findFirst({
            where: {
              type: 'MAINTENANCE_REMINDER',
              description: { contains: schedule.name },
              createdAt: { gte: twoHoursAgo },
            },
          })

          if (!recentAlert) {
            const timeStr = nextOccurrence.toLocaleTimeString('es-VE', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/Caracas',
            })

            await prisma.notification.create({
              data: {
                type: 'MAINTENANCE_REMINDER',
                title: 'Filtro Sucio: Riego Próximo en 1h',
                description: `Atención: La rutina "${schedule.name}" iniciará a las ${timeStr} (~1 hora) y el filtro de agua no ha sido limpiado. Confirma la limpieza con /filter en Telegram o desde la Web.`,
                priority: 'URGENT',
              },
            })

            Logger.warn(
              `Alerta preventiva de filtro emitida 1h antes de rutina "${schedule.name}" (${timeStr}).`,
            )
          }
        }
      }

      // 2. Evaluar tareas autorizadas o pendientes en TaskLog que vayan a correr en la próxima hora
      const upcomingTasks = await prisma.taskLog.findMany({
        where: {
          status: { in: [TaskStatus.AUTHORIZED, TaskStatus.WAITING_CONFIRMATION, TaskStatus.PENDING] },
          scheduledAt: { gt: now, lte: oneHourAhead },
        },
        include: { schedule: true },
      })

      for (const task of upcomingTasks) {
        const taskName = task.schedule?.name || task.notes || 'Tarea de Riego'
        const recentAlert = await prisma.notification.findFirst({
          where: {
            type: 'MAINTENANCE_REMINDER',
            description: { contains: taskName },
            createdAt: { gte: twoHoursAgo },
          },
        })

        if (!recentAlert) {
          const timeStr = task.scheduledAt.toLocaleTimeString('es-VE', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Caracas',
          })

          await prisma.notification.create({
            data: {
              type: 'MAINTENANCE_REMINDER',
              title: 'Filtro Sucio: Riego Próximo en 1h',
              description: `Atención: La tarea "${taskName}" iniciará a las ${timeStr} (~1 hora) y el filtro de agua no ha sido limpiado. Confirma la limpieza con /filter en Telegram o desde la Web.`,
              priority: 'URGENT',
            },
          })

          Logger.warn(`Alerta preventiva de filtro emitida 1h antes de tarea "${taskName}" (${timeStr}).`)
        }
      }
    } catch (error) {
      Logger.error('Error evaluando tareas próximas para mantenimiento de filtro:', error)
    }
  }

  /**
   * Pre-evaluación ejecutada al momento de iniciar cualquier tarea del circuito hidráulico.
   * Si el filtro está vencido, insiste con notificación de advertencia inmediata.
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
