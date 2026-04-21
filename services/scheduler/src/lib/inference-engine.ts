import { prisma, TaskStatus, AutomationSchedule, ZoneType } from '@package/database'

import { Logger } from './logger'

export interface InferenceResult {
  shouldCancel: boolean
  reason?: string
  action?: 'SKIP' | 'EXECUTE' | 'DEFER'
  metadata?: Record<string, unknown>
}

export class InferenceEngine {
  /**
   * Evalúa si una rutina debe ejecutarse basándose en condiciones ambientales e intervención manual.
   */
  static async evaluate(schedule: AutomationSchedule): Promise<InferenceResult> {
    try {
      // 1. Verificar si existe una cancelación manual previa (±5 min de la hora actual)
      const now = new Date()
      const fiveMinAgo = new Date(now.getTime() - 5 * 60000)
      const fiveMinFromNow = new Date(now.getTime() + 5 * 60000)

      const previousCancellation = await prisma.taskLog.findFirst({
        where: {
          scheduleId: schedule.id,
          status: { in: [TaskStatus.CANCELLED, TaskStatus.SKIPPED] },
          scheduledAt: {
            gte: fiveMinAgo,
            lte: fiveMinFromNow,
          },
        },
        orderBy: { scheduledAt: 'desc' },
      })

      if (previousCancellation) {
        return {
          shouldCancel: true,
          reason: `Cancelación manual detectada en la cola para esta ejecución: ${previousCancellation.notes || 'Sin motivo'}`,
          action: 'SKIP',
        }
      }

      // 2. Lógica de Clima (WeatherGuard)
      // Nota: Esto migra y expande los placeholders del index
      if (schedule.purpose === 'IRRIGATION' || schedule.purpose === 'FERTIGATION') {
        const rainCheck = await this.checkRainCondition(schedule.zones[0] as ZoneType)

        if (rainCheck.shouldCancel) {
          return {
            shouldCancel: true,
            reason: `Lluvia reciente detectada (${Math.floor(rainCheck.duration / 60)} min acumulados).`,
            action: 'SKIP',
            metadata: rainCheck,
          }
        }

        const forecastCheck = await this.checkWeatherForecast()

        if (forecastCheck.shouldCancel) {
          return {
            shouldCancel: true,
            reason: `Pronóstico de lluvia inminente (${forecastCheck.chance}% de probabilidad).`,
            action: 'SKIP',
            metadata: forecastCheck,
          }
        }
      }

      // 3. (Futuro) Motor de Inferencias Complejas (VPD, DIF, DLI)
      // Aquí se consultará el DailyEnvironmentStat o InfluxDB promediado.

      return { shouldCancel: false, action: 'EXECUTE' }
    } catch (error) {
      Logger.error('Error en InferenceEngine.evaluate:', error)

      // En caso de error, preferimos ejecutar para no dejar a las orquídeas sin agua ante fallos de lógica crítica
      return { shouldCancel: false, action: 'EXECUTE' }
    }
  }

  /**
   * Verifica condiciones de lluvia real (acumulada en sensores).
   */
  private static async checkRainCondition(_zone: ZoneType) {
    // TODO: Implementar consulta real a InfluxDB o base de datos de agregación
    return { shouldCancel: false, duration: 0 }
  }

  /**
   * Verifica pronóstico meteorológico.
   */
  private static async checkWeatherForecast() {
    // TODO: Implementar consulta a WeatherForecast model
    return { shouldCancel: false, chance: 0 }
  }
}
