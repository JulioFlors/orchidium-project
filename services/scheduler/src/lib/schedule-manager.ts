import { Cron } from 'croner'
import prisma from '@package/database'

import { Logger } from './logger'

interface ActiveCronEntry {
  cron: Cron
  cronTrigger: string
}

/**
 * GESTOR DINÁMICO DE RUTINAS (ScheduleManager)
 * Administra el mapa en memoria (Map<string, ActiveCronEntry>) de los crons de rutinas activas.
 * Permite sincronizar y actualizar dinámicamente las tareas cuando el usuario realiza cambios
 * desde la interfaz frontend (/schedules) o durante el boot/auditoría nocturna.
 */
class ScheduleManager {
  private activeCrons = new Map<string, ActiveCronEntry>()

  /**
   * Sincroniza las rutinas de la base de datos con las instancias de Cron en memoria.
   * @param runTaskFn Callback para ejecutar la rutina cuando expire el cron.
   * @param silent Si es verdadero y no hay discrepancias, no emite logs a consola (ideal para auditoría nocturna).
   */
  async syncAutomationSchedules(
    runTaskFn: (scheduleId: string) => Promise<void>,
    silent: boolean = false,
  ): Promise<void> {
    try {
      const activeSchedules = await prisma.automationSchedule.findMany({
        where: { isEnabled: true },
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
          // Rutina nueva o recién activada
          const cron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' }, () => {
            runTaskFn(schedule.id)
          })

          this.activeCrons.set(schedule.id, { cron, cronTrigger: schedule.cronTrigger })
          addedCount++
        } else if (existing.cronTrigger !== schedule.cronTrigger) {
          // La expresión cron de la rutina cambió
          existing.cron.stop()
          const newCron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' }, () => {
            runTaskFn(schedule.id)
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
            `Sincronización de rutinas: ${totalActive} activas (+${addedCount} / -${removedCount} / ~${updatedCount})`,
          )
        } else {
          Logger.cron(
            `Sincronización de rutinas completada. ${totalActive} rutinas activas programadas.`,
          )
        }
      }
    } catch (error) {
      Logger.error('Error durante la sincronización de rutinas (ScheduleManager):', error)
    }
  }

  /**
   * Obtiene la cantidad actual de rutinas programadas en memoria.
   */
  getActiveCount(): number {
    return this.activeCrons.size
  }
}

export const scheduleManager = new ScheduleManager()
