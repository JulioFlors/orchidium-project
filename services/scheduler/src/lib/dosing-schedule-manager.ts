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
          const newCron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' }, async () => {
            await this.handleDosingTrigger(schedule.id)
          })

          this.activeCrons.set(schedule.id, { cron: newCron, cronTrigger: schedule.cronTrigger })
          updatedCount++
        }
      }

      const totalActive = this.activeCrons.size
      const hasChanges = addedCount > 0 || removedCount > 0 || updatedCount > 0

      if (!silent || hasChanges) {
        if (hasChanges) {
          Logger.cron(
            `Sincronización de rutinas de dosificación: ${totalActive} activas (+${addedCount} / -${removedCount} / ~${updatedCount})`,
          )
        } else {
          Logger.cron(
            `Sincronización de dosificación completada. ${totalActive} rutinas activas.`,
          )
        }
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
              Logger.warn(`Rutina de dosificación ${schedule.name} no tiene agroquímicos asociados.`)
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

  getActiveCount(): number {
    return this.activeCrons.size
  }
}

export const dosingScheduleManager = new DosingScheduleManager()
