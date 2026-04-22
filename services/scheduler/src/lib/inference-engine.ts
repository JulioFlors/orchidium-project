import { prisma, TaskStatus, AutomationSchedule } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'

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
          reason: `Cancelación manual detectada: ${previousCancellation.notes || 'Sin motivo'}`,
          action: 'SKIP',
        }
      }

      // 2. Lógica de Clima (WeatherGuard v2)
      if (schedule.purpose === 'IRRIGATION' || schedule.purpose === 'FERTIGATION') {
        const localConditions = await this.getLatestLocalConditions()
        const forecast = await prisma.weatherForecast.findFirst({
          orderBy: { timestamp: 'desc' },
        })

        // -- Hard Blocks --

        // Lluvia Física Detectada (Sensor Exterior) en los últimos 30-60 min
        // Nota: asumiendo rain_intensity > 0 o detectado localmente
        if (
          localConditions.exterior.rain_intensity &&
          localConditions.exterior.rain_intensity > 1
        ) {
          return {
            shouldCancel: true,
            reason: `Lluvia reciente detectada por estación local (${localConditions.exterior.rain_intensity} mm/h).`,
            action: 'SKIP',
            metadata: { localConditions },
          }
        }

        // Humedad del Suelo Crítica (>40%) según AgroMonitoring
        if (forecast?.soilMoisture && forecast.soilMoisture > 0.4) {
          return {
            shouldCancel: true,
            reason: `Suelo saturado reportado por imágenes satelitales (${(forecast.soilMoisture * 100).toFixed(0)}%).`,
            action: 'SKIP',
            metadata: { forecast },
          }
        }

        // -- Cross-Check Logic --

        const isMidday = now.getHours() >= 11 && now.getHours() <= 15
        const precipProb = forecast?.precipProb || 0

        // Riesgo de Lluvia Inminente
        if (precipProb >= 0.8) {
          const isHotAndSunny =
            localConditions.exterior.lux > 50000 || localConditions.exterior.temp > 30

          if (isHotAndSunny) {
            Logger.info(
              'Refutación: Pronóstico de lluvia alto (>=80%), pero hay sol intenso localmente. Se ejecuta riego.',
            )
            // No cancelamos
          } else {
            return {
              shouldCancel: true,
              reason: `Pronóstico de lluvia inminente (${(precipProb * 100).toFixed(0)}% prob).`,
              action: 'SKIP',
              metadata: { forecast, localConditions },
            }
          }
        }

        // Evaluación de Horario y VPD (Vapor Pressure Deficit)
        if (
          isMidday &&
          localConditions.exterior.temp > 32 &&
          localConditions.exterior.lux > 80000
        ) {
          return {
            shouldCancel: true,
            reason: `Condiciones extremas a mediodía (Temp: ${localConditions.exterior.temp.toFixed(1)}°C, Lux: ${localConditions.exterior.lux}). Riesgo de efecto lupa.`,
            action: 'DEFER',
            metadata: { localConditions },
          }
        }

        // Exceso de Humedad Residual (Suelo + Ambiente)
        if (forecast?.soilMoisture && forecast.soilMoisture >= 0.28) {
          if (localConditions.interior.hum > 85 || localConditions.exterior.hum > 85) {
            return {
              shouldCancel: true,
              reason: `Humedad residual alta. Suelo al ${(forecast.soilMoisture * 100).toFixed(0)}% y atmósfera saturada (>85%). Prevención de hongos.`,
              action: 'SKIP',
              metadata: { forecast, localConditions },
            }
          }
        }
      }

      return { shouldCancel: false, action: 'EXECUTE' }
    } catch (error) {
      Logger.error('Error en InferenceEngine.evaluate:', error)

      // En caso de error, preferimos ejecutar para no dejar a las orquídeas sin agua ante fallos de lógica crítica
      return { shouldCancel: false, action: 'EXECUTE' }
    }
  }

  /**
   * Extrae la última condición física registrada en InfluxDB en los últimos 30 min.
   */
  private static async getLatestLocalConditions() {
    const defaultData = { temp: 0, hum: 0, lux: 0, rain_intensity: 0 }
    const result = {
      exterior: { ...defaultData },
      interior: { ...defaultData },
    }

    try {
      const sqlQuery = `
        SELECT *
        FROM environment_metrics 
        WHERE time >= now() - INTERVAL '30 minutes' 
        ORDER BY time DESC 
        LIMIT 20
      `

      const stream = influxClient.query(sqlQuery)

      let foundExterior = false
      let foundInterior = false

      // Iteramos un poco sobre los resultados para conseguir el dato más fresco de c/u
      for await (const row of stream) {
        if (!foundExterior && row.source === 'Weather_Station') {
          result.exterior.temp = Number(row.temperature || 0)
          result.exterior.hum = Number(row.humidity || 0)
          result.exterior.lux = Number(row.illuminance || 0)
          result.exterior.rain_intensity = Number(row.rain_intensity || 0)
          foundExterior = true
        } else if (!foundInterior && row.source === 'Environmental_Monitoring') {
          result.interior.temp = Number(row.temperature || 0)
          result.interior.hum = Number(row.humidity || 0)
          result.interior.lux = Number(row.illuminance || 0)
          result.interior.rain_intensity = Number(row.rain_intensity || 0)
          foundInterior = true
        }

        if (foundExterior && foundInterior) break
      }
    } catch (error) {
      Logger.warn(
        'No se pudo extraer telemetría reciente de InfluxDB para el motor de inferencia.',
        error,
      )
    }

    return result
  }
}
