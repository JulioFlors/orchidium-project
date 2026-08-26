import { Cron } from 'croner'
import prisma, { TaskStatus } from '@package/database'

import { Logger } from './logger'

interface ActiveDosingCronEntry {
  cron: Cron
  cronTrigger: string
}

/**
 * GESTOR DINÁMICO DE RUTINAS DE DOSIFICACIÓN (DosingScheduleManager)
 * Administra los crons en memoria para las rutinas de dosificación manual del laboratorio.
 * Pre-agenda tareas en DosingLog y genera notificaciones para Telegram / n8n.
 */
class DosingScheduleManager {
  private activeCrons = new Map<string, ActiveDosingCronEntry>()

  /**
   * Sincroniza las rutinas de dosificación de la base de datos con Croner.
   */
  async syncDosingSchedules(silent: boolean = false): Promise<void> {
    try {
      const activeSchedules = await prisma.dosingSchedule.findMany({
        where: { isEnabled: true },
        include: {
          fertilizationProgram: {
            include: {
              productsCycle: {
                include: { agrochemical: true },
              },
            },
          },
          phytosanitaryProgram: {
            include: {
              productsCycle: {
                include: { agrochemical: true },
              },
            },
          },
        },
      })

      const dbScheduleIds = new Set(activeSchedules.map((s) => s.id))
      let addedCount = 0
      let removedCount = 0
      let updatedCount = 0

      // 1. Detener y remover crons que ya no están habilitados o fueron eliminados en DB
      for (const [id, entry] of this.activeCrons.entries()) {
        if (!dbScheduleIds.has(id)) {
          entry.cron.stop()
          this.activeCrons.delete(id)
          removedCount++
        }
      }

      // 2. Crear o actualizar crons según el estado actual de la DB
      for (const schedule of activeSchedules) {
        const existing = this.activeCrons.get(schedule.id)

        if (!existing) {
          const cron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' }, async () => {
            await this.handleDosingTrigger(schedule.id)
          })

          this.activeCrons.set(schedule.id, { cron, cronTrigger: schedule.cronTrigger })
          addedCount++
        } else if (existing.cronTrigger !== schedule.cronTrigger) {
          existing.cron.stop()
          const newCron = new Cron(
            schedule.cronTrigger,
            { timezone: 'America/Caracas' },
            async () => {
              await this.handleDosingTrigger(schedule.id)
            },
          )

          this.activeCrons.set(schedule.id, { cron: newCron, cronTrigger: schedule.cronTrigger })
          updatedCount++
        }
      }

      const totalActive = this.activeCrons.size
      const hasChanges = addedCount > 0 || removedCount > 0 || updatedCount > 0

      if (!silent || hasChanges) {
        Logger.cron(
          `Dosificación Manual: ${totalActive} rutinas activas (+${addedCount} / -${removedCount} / ~${updatedCount})`,
        )
      }
    } catch (error) {
      Logger.error('Error durante la sincronización de rutinas de dosificación:', error)
    }
  }

  /**
   * Pre-agenda tareas de dosificación con 12h de antelación para que el usuario pueda confirmarlas/prepararlas.
   */
  async preScheduleDosing(): Promise<void> {
    try {
      const activeSchedules = await prisma.dosingSchedule.findMany({
        where: { isEnabled: true },
        include: {
          fertilizationProgram: {
            include: {
              productsCycle: {
                include: { agrochemical: true },
              },
            },
          },
          phytosanitaryProgram: {
            include: {
              productsCycle: {
                include: { agrochemical: true },
              },
            },
          },
        },
      })

      const now = new Date()
      const twelveHoursAhead = new Date(now.getTime() + 12 * 60 * 60000)

      for (const schedule of activeSchedules) {
        const cron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' })
        const nextOccurrence = cron.nextRun()

        if (nextOccurrence && nextOccurrence <= twelveHoursAhead) {
          const startWindow = new Date(nextOccurrence.getTime() - 60000)
          const endWindow = new Date(nextOccurrence.getTime() + 60000)

          const existing = await prisma.dosingLog.findFirst({
            where: {
              scheduleId: schedule.id,
              scheduledAt: { gte: startWindow, lte: endWindow },
            },
          })

          if (!existing) {
            const firstCycle =
              schedule.fertilizationProgram?.productsCycle[0] ||
              schedule.phytosanitaryProgram?.productsCycle[0]

            const agroId = firstCycle?.agrochemicalId

            if (!agroId) {
              Logger.warn(
                `Rutina de dosificación ${schedule.name} no tiene agroquímicos asociados.`,
              )
              continue
            }

            const task = await prisma.dosingLog.create({
              data: {
                scheduleId: schedule.id,
                purpose: schedule.purpose,
                zones: schedule.zones,
                status: TaskStatus.WAITING_CONFIRMATION,
                source: 'ROUTINE',
                scheduledAt: nextOccurrence,
                duration: schedule.durationMinutes || 15,
                agrochemicalId: agroId,
                notes: `Tarea pre-agendada de dosificación manual: ${schedule.name}`,
              },
            })

            // Crear notificación vinculada para n8n / Telegram
            await prisma.notification.create({
              data: {
                type: 'AGROCHEMICAL_CONFIRM',
                title: 'Confirmación de Dosificación',
                description: `Se requiere preparar el insumo para la rutina: ${schedule.name} programada para el ${nextOccurrence.toLocaleTimeString('es-VE')}`,
                dosingLogId: task.id,
                priority: 'HIGH',
              },
            })

            Logger.agro(
              `Pre-agendada tarea de dosificación "${schedule.name}" para el ${nextOccurrence.toLocaleString('es-VE')}`,
            )
          }
        }
      }
    } catch (error) {
      Logger.error('Error en preScheduleDosing:', error)
    }
  }

  /**
   * Ejecuta el trigger de una rutina de dosificación llegada su hora exacta.
   */
  private async handleDosingTrigger(scheduleId: string): Promise<void> {
    try {
      const schedule = await prisma.dosingSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          fertilizationProgram: {
            include: { productsCycle: true },
          },
          phytosanitaryProgram: {
            include: { productsCycle: true },
          },
        },
      })

      if (!schedule || !schedule.isEnabled) return

      const now = new Date()
      const startWindow = new Date(now.getTime() - 5 * 60000)
      const endWindow = new Date(now.getTime() + 5 * 60000)

      // Verificar si ya existe el DosingLog (creado previamente por preSchedule)
      const existing = await prisma.dosingLog.findFirst({
        where: {
          scheduleId: schedule.id,
          scheduledAt: { gte: startWindow, lte: endWindow },
        },
      })

      if (!existing) {
        const firstCycle =
          schedule.fertilizationProgram?.productsCycle[0] ||
          schedule.phytosanitaryProgram?.productsCycle[0]

        if (!firstCycle) return

        const task = await prisma.dosingLog.create({
          data: {
            scheduleId: schedule.id,
            purpose: schedule.purpose,
            zones: schedule.zones,
            status: TaskStatus.PENDING,
            source: 'ROUTINE',
            scheduledAt: now,
            duration: schedule.durationMinutes || 15,
            agrochemicalId: firstCycle.agrochemicalId,
            notes: `Tarea de dosificación activada: ${schedule.name}`,
          },
        })

        await prisma.notification.create({
          data: {
            type: 'AGROCHEMICAL_CONFIRM',
            title: 'Hora de Aplicación',
            description: `Hora de aplicar la rutina de dosificación: ${schedule.name}`,
            dosingLogId: task.id,
            priority: 'HIGH',
          },
        })
      }
    } catch (error) {
      Logger.error(`Error procesando trigger de dosificación (${scheduleId}):`, error)
    }
  }

  /**
   * Evalúa y expira las tareas manuales de dosificación (DosingLog) que superaron las 24 horas
   * posteriores a su hora programada sin ser completadas, canceladas o pospuestas.
   * Genera notificación para n8n / Telegram y limpia confirmaciones pendientes.
   */
  async evaluateExpiredDosingTasks(): Promise<void> {
    try {
      const now = Date.now()
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60000)

      const expiredLogs = await prisma.dosingLog.findMany({
        where: {
          status: { in: [TaskStatus.WAITING_CONFIRMATION, TaskStatus.PENDING] },
          scheduledAt: { lt: twentyFourHoursAgo },
        },
        include: {
          agrochemical: { select: { name: true } },
          schedule: { select: { name: true } },
        },
      })

      if (expiredLogs.length === 0) return

      for (const log of expiredLogs) {
        const expirationNote =
          '[EXPIRADA] Tarea no confirmada en 24h posteriores a su ejecución programada.'
        const notes = log.notes ? `${log.notes}\n${expirationNote}` : expirationNote

        await prisma.dosingLog.update({
          where: { id: log.id },
          data: {
            status: TaskStatus.EXPIRED,
            notes,
          },
        })

        // 1. Marcar notificaciones previas de confirmación de esta tarea como leídas
        await prisma.notification.updateMany({
          where: {
            dosingLogId: log.id,
            status: 'UNREAD',
          },
          data: {
            status: 'READ',
            readAt: new Date(),
          },
        })

        // 2. Crear nueva notificación para avisar a Telegram (n8n) que la tarea expiró
        const productName = log.agrochemical?.name || 'Insumo'
        const scheduleName = log.schedule?.name || 'Dosificación Manual'
        const scheduledTimeStr = log.scheduledAt.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Caracas',
        })

        await prisma.notification.create({
          data: {
            type: 'TASK_STATUS',
            title: 'Dosificación Manual Expirada',
            description: `La tarea de dosificación de "${productName}" (${scheduleName}) programada para las ${scheduledTimeStr} fue marcada como expirada tras 24h sin completarse.`,
            dosingLogId: log.id,
            priority: 'HIGH',
          },
        })

        Logger.agro(
          `Dosificación manual expirada: Tarea "${scheduleName}" - "${productName}" (${log.id.slice(0, 8)}) marcada como EXPIRED.`,
        )
      }
    } catch (error) {
      Logger.error('Error evaluando tareas de dosificación expiradas:', error)
    }
  }

  getActiveCount(): number {
    return this.activeCrons.size
  }
}

export const dosingScheduleManager = new DosingScheduleManager()
