import { prisma, TaskStatus, AutomationSchedule, ZoneType } from '@package/database'

import { isCurrentlyRaining } from '../index'

import { Logger } from './logger'
import { classifyCurrentDay } from './day-classifier'
import { influxClient } from './influx'

/**
 * Umbrales Botánicos (Orquídeas Epífitas Tropicales - Cattleya).
 *
 * NOTA: Los umbrales de HR (90%, 80%) son tentativos. No se dispone
 * de datos calibrados del sensor DHT22 interior (aún no activado).
 * Se dejaron TODO: en cada regla que depende de esta calibración.
 */
const THRESHOLDS = {
  // Lluvia acumulada (segundos)
  MIN_RAIN_FOR_IRRIGATION: 1200, // 20 min de lluvia acumulada → omitir riego por aspersión
  MIN_RAIN_FOR_SOIL_WETTING: 1200, // 20 min de lluvia acumulada → omitir humectación suelo

  // Ventanas de análisis (horas)
  RAIN_LOOKBACK_IRRIGATION: 24, // Lluvia acumulada en 24h → aplica a IRRIGATION
  RAIN_LOOKBACK_SOIL_WETTING: 4, // Lluvia acumulada en 4h → aplica a SOIL_WETTING
  RAIN_LOOKBACK_HUMIDIFICATION: 8, // Lluvia acumulada en 8h → aplica a HUMIDIFICATION (8am-4pm)

  // Microclima Interior (bajo mallasombra)
  // TODO: Calibrar con datos reales del DHT22 cuando esté activo
  MAX_HUMIDITY_CRITICAL: 90, // HR > 90% → skip todo lo hídrico (tentativo)
  MAX_HUMIDITY_FOR_MISTING: 80, // HR > 80% + día nublado → skip HUMIDIFICATION
  MIN_HUMIDITY_TRIGGER: 50, // HR < 50% → raíces aéreas deshidratándose

  // Iluminancia (calibrado con observaciones de campo marzo-abril 2026)
  OVERCAST_LUX_THRESHOLD: 26000, // Promedio diario < 26k = nublado confirmado

  // Duración máxima de nebulización (minutos)
  MAX_NEBULIZATION_MINUTES: 3, // > 3min la línea gotea y riega plantas debajo

  // Aspersión
  IRRIGATION_DURATION_MINUTES: 15, // Duración de la rutina de aspersión 6AM
}

export interface InferenceResult {
  shouldCancel: boolean
  reason?: string
  action?: 'SKIP' | 'EXECUTE' | 'DEFER' | 'REQUIRE_CONFIRMATION'
  metadata?: Record<string, unknown>
}

/**
 * OFFSETS DE CALIBRACIÓN EMPÍRICA (PRELIMINARES)
 *
 * // TODO: Estas inferencias deben ser validadas y recalibradas una vez el orquideario
 * esté en producción y se cuente con un histórico suficiente de datos (InfluxDB).
 *
 * NOTA GEOGRÁFICA: Ciudad Guayana, Venezuela (Trópico).
 * El comportamiento térmico/hídrico varía drásticamente entre:
 * - Temporada de Sequía (Verano): Mayor gradiente térmico exterior/interior.
 * - Temporada de Lluvia (Invierno): Humedad ambiente saturada, gradientes mínimos.
 *
 * // TODO: Implementar un modelo de regresión o tabla de consulta por temporada (Mes/Día).
 */

/**
 * Motor de Inferencia v4 — Gestión Ambiental Inteligente.
 *
 * PRINCIPIOS CARDINALES:
 * 1. Jamás cancelar IRRIGACIÓN por pronóstico de APIs.
 *    Solo lluvia REAL acumulada (sensor de gotas) cancela riego.
 * 2. APIs son un FACTOR más para FERTIGATION/FUMIGATION (no decisivo).
 *    Requiere consenso >95% de AMBAS APIs + cielo nublado + más contexto.
 * 3. Los sensores físicos tienen poder de veto absoluto.
 * 4. El clasificador de día (8am-4pm) aporta contexto para pulverización.
 * 5. El motor también CANCELA tareas programadas cuando detecta la necesidad.
 *
 * HERRAMIENTAS DE REGULACIÓN:
 * - Humectación del suelo: sin peligro de mojar plantas, puede repetirse.
 * - Pulverización/Nebulización: máx 3 min, la línea gotea y moja plantas debajo.
 * - Aspersión: solo a las 6AM, 15 min, interdiaria.
 */
export class InferenceEngine {
  static async evaluate(schedule: AutomationSchedule): Promise<InferenceResult> {
    try {
      const now = new Date()

      // ── 1. Cancelación Manual ──
      const fiveMinAgo = new Date(now.getTime() - 5 * 60000)
      const fiveMinFromNow = new Date(now.getTime() + 5 * 60000)

      const previousCancellation = await prisma.taskLog.findFirst({
        where: {
          scheduleId: schedule.id,
          status: TaskStatus.CANCELLED,
          scheduledAt: { gte: fiveMinAgo, lte: fiveMinFromNow },
        },
        orderBy: { scheduledAt: 'desc' },
      })

      if (previousCancellation) {
        return {
          shouldCancel: true,
          reason: `Cancelación manual: ${previousCancellation.notes || 'Sin motivo'}`,
          action: 'SKIP',
        }
      }

      // ── 2. Obtener Telemetría Real + Clasificación del Día ──
      const localConditions = await this.getLatestLocalConditions()
      const dayClass = await classifyCurrentDay()

      const purpose = schedule.purpose

      // ── Lógica de Fallback (Exterior si Interior falla) ──
      const isFallback = !localConditions.foundInterior && localConditions.foundExterior
      const noData = !localConditions.foundInterior && !localConditions.foundExterior

      if (noData) {
        Logger.inference(
          'Telemetría ausente. Omitiendo evaluación de veto ambiental para asegurar ejecución.',
        )

        return { shouldCancel: false, action: 'EXECUTE' }
      }

      const interiorHum = isFallback ? localConditions.exterior.hum : localConditions.interior.hum

      const interiorTemp = isFallback
        ? localConditions.exterior.temp
        : localConditions.interior.temp

      const dataUsed = isFallback ? 'EXT' : 'INT'

      Logger.inference(
        `Evaluando "${schedule.name}" (${purpose}) → HR: ${interiorHum.toFixed(0)}% | Temp: ${interiorTemp.toFixed(1)}°C | Día: ${dayClass.type} | Datos: ${dataUsed}`,
      )

      // ── 3. HARD BLOCK: Lluvia Real en Curso ──
      // Si está lloviendo AHORA → no ejecutar ninguna tarea hídrica
      const currentlyRaining =
        isCurrentlyRaining() ||
        (localConditions.exterior.rain_intensity && localConditions.exterior.rain_intensity > 0)

      if (currentlyRaining) {
        return {
          shouldCancel: true,
          reason: `Está lloviendo ahora (sensor activo: ${isCurrentlyRaining()}, intensidad: ${localConditions.exterior.rain_intensity || 0}).`,
          action: 'SKIP',
          metadata: { localConditions },
        }
      }

      // ── 4. Lluvia Acumulada → IRRIGATION (>20min en 12h) ──
      if (purpose === 'IRRIGATION') {
        const recentRain = await this.getRecentRainAccumulation(THRESHOLDS.RAIN_LOOKBACK_IRRIGATION)

        if (recentRain.durationSeconds >= THRESHOLDS.MIN_RAIN_FOR_IRRIGATION) {
          return {
            shouldCancel: true,
            reason: `Lluvia acumulada: ${Math.round(recentRain.durationSeconds / 60)} min en las últimas ${THRESHOLDS.RAIN_LOOKBACK_IRRIGATION}h.`,
            action: 'SKIP',
            metadata: { recentRain },
          }
        }
      }

      // ── 4.1 Lluvia Acumulada → SOIL_WETTING (Ventana 4h) ──
      if (purpose === 'SOIL_WETTING') {
        const recentRain = await this.getRecentRainAccumulation(
          THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING,
        )

        if (recentRain.durationSeconds > 0) {
          return {
            shouldCancel: true,
            reason: `Cancelación automática: Lluvia detectada en las últimas ${THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING} horas. Suelo ya humectado.`,
            action: 'SKIP',
            metadata: { recentRain },
          }
        }
      }

      // ── 4.2 Lluvia Acumulada → HUMIDIFICATION (Día Botánico 8h) ──
      if (purpose === 'HUMIDIFICATION') {
        const recentRain = await this.getRecentRainAccumulation(
          THRESHOLDS.RAIN_LOOKBACK_HUMIDIFICATION,
        )

        if (recentRain.durationSeconds > 0) {
          return {
            shouldCancel: true,
            reason: `Cancelación automática: Lluvia detectada durante el día botánico (últimas 8h). Ambiente saturado.`,
            action: 'SKIP',
            metadata: { recentRain },
          }
        }
      }

      // ── 5. Humedad Interior Crítica ──
      // TODO: Calibrar umbral cuando DHT22 esté activo. 90% es tentativo.
      // No cancelar basándose en un único parámetro → requiere más contexto.
      // Solo aplica si HR > 90% Y adicionalmente el día es nublado o llovió recientemente.
      if (interiorHum > 0) {
        // Solo evaluar si tenemos datos reales del sensor
        const recentRainCheck = await this.getRecentRainAccumulation(4)
        const rainedRecently = recentRainCheck.durationSeconds > 0
        const cloudyDay = dayClass.type === 'NUBLADO' || dayClass.type === 'LLUVIOSO'

        if (
          interiorHum > THRESHOLDS.MAX_HUMIDITY_CRITICAL &&
          (rainedRecently || cloudyDay) &&
          (purpose === 'IRRIGATION' || purpose === 'HUMIDIFICATION' || purpose === 'SOIL_WETTING')
        ) {
          return {
            shouldCancel: true,
            reason: `HR ${dataUsed} ${interiorHum.toFixed(0)}% (crítica) + ${cloudyDay ? `día ${dayClass.type}` : `lluvia reciente (${Math.round(recentRainCheck.durationSeconds / 60)}min)`}. Omitiendo ${purpose}.`,
            action: 'SKIP',
            metadata: { localConditions, dayClass },
          }
        }
      }

      // ── 6. Pulverización innecesaria (día nublado + HR alta) ──
      // HR > 80% + día promedio < 26k lux → no pulverizar
      // TODO: Calibrar HR cuando sensor activo
      if (
        purpose === 'HUMIDIFICATION' &&
        interiorHum > THRESHOLDS.MAX_HUMIDITY_FOR_MISTING &&
        interiorTemp < 28 &&
        dayClass.avgLuxSince8am < THRESHOLDS.OVERCAST_LUX_THRESHOLD &&
        dayClass.type !== 'DESCONOCIDO'
      ) {
        return {
          shouldCancel: true,
          reason: `Ambiente fresco (HR: ${interiorHum.toFixed(0)}%, Temp: ${interiorTemp.toFixed(1)}°C, Lux prom: ${dayClass.avgLuxSince8am.toFixed(0)}). Pulverización innecesaria.`,
          action: 'SKIP',
          metadata: { localConditions, dayClass },
        }
      }

      // ── 7. Evaluación de pulverización diaria (4PM) ──
      // La pulverización se ejecuta si el promedio del día (8am-4pm) > 26k lux
      // TODO: Este umbral está calibrado para temporada seca
      if (
        purpose === 'HUMIDIFICATION' &&
        dayClass.type !== 'DESCONOCIDO' &&
        dayClass.avgLuxSince8am <= THRESHOLDS.OVERCAST_LUX_THRESHOLD
      ) {
        return {
          shouldCancel: true,
          reason: `Día ${dayClass.type} (Lux prom 8am-ahora: ${dayClass.avgLuxSince8am.toFixed(0)}). Promedio ≤ ${THRESHOLDS.OVERCAST_LUX_THRESHOLD} lux → pulverización innecesaria.`,
          action: 'SKIP',
          metadata: { dayClass },
        }
      }

      // ── 8. Protección de Fertilización/Fumigación contra Tormentas (Veto Estricto) ──
      if (purpose === 'FERTIGATION' || purpose === 'FUMIGATION') {
        const forecast = await this.getForecastConsensus()
        const recentRain4h = await this.getRecentRainAccumulation(4)

        const conditionA =
          localConditions.exterior.rain_intensity > 0 || recentRain4h.durationSeconds > 0

        // TODO: Calibrar HR cuando DHT22 esté activo. 95% es el umbral solicitado.
        const conditionB =
          dayClass.avgLuxSince8am < THRESHOLDS.OVERCAST_LUX_THRESHOLD &&
          dayClass.type !== 'DESCONOCIDO' &&
          interiorHum > 95

        const conditionC = forecast.consensusPrecipProb > 0.95

        if ((conditionA || conditionB) && conditionC) {
          return {
            shouldCancel: true,
            reason: `VETO AMBIENTAL: ${conditionA ? 'Lluvia actual/reciente' : 'Día muy nublado + HR crítica'} con Pronóstico > 95%. Protegiendo ${purpose}.`,
            action: 'SKIP',
            metadata: { forecast, dayClass, recentRain4h },
          }
        }
      }

      // ── DECISIÓN FINAL: EJECUTAR ──
      return { shouldCancel: false, action: 'EXECUTE' }
    } catch {
      Logger.inference('Error en InferenceEngine.evaluate')

      // Fail-safe diferenciado: Agroquímicos requieren confirmación si el motor falla.
      if (schedule.purpose === 'FERTIGATION' || schedule.purpose === 'FUMIGATION') {
        return {
          shouldCancel: false,
          action: 'REQUIRE_CONFIRMATION',
          reason: 'Error en motor de inferencia. Requiere validación manual.',
        }
      }

      // Las orquídeas no deben quedarse sin agua por un bug.
      return { shouldCancel: false, action: 'EXECUTE' }
    }
  }

  /**
   * Consulta el consenso de pronóstico entre OWM y Open-Meteo.
   * Usado exclusivamente para protección de fertilización (NUNCA para irrigación).
   */
  private static async getForecastConsensus(): Promise<{
    bothApisAgree: boolean
    consensusPrecipProb: number
    owmProb: number
    omProb: number
    vwc: number
  }> {
    try {
      const now = new Date()
      const hourAgo = new Date(now.getTime() - 60 * 60000)
      const hourAhead = new Date(now.getTime() + 60 * 60000)

      const forecasts = await prisma.weatherForecast.findMany({
        where: {
          timestamp: { gte: hourAgo, lte: hourAhead },
          source: { in: ['Open-Meteo', 'OpenWeatherMap'] },
        },
        orderBy: { timestamp: 'desc' },
      })

      const owm = forecasts.find((f) => f.source === 'OpenWeatherMap')
      const om = forecasts.find((f) => f.source === 'Open-Meteo')

      const owmProb = owm?.precipProb || 0
      const omProb = om?.precipProb || 0
      const bothApisAgree = owmProb >= 0.9 && omProb >= 0.9
      const consensusPrecipProb = (owmProb + omProb) / 2

      // VWC del suelo (AgroMonitoring) — se renueva cada 12h (8am/8pm)
      // Indicativo de historial reciente, no estado actual exacto
      const soil = await prisma.weatherForecast.findFirst({
        where: { source: 'AgroMonitoring', soilMoisture: { not: null } },
        orderBy: { timestamp: 'desc' },
      })

      return {
        bothApisAgree,
        consensusPrecipProb,
        owmProb,
        omProb,
        vwc: soil?.soilMoisture || 0,
      }
    } catch {
      return { bothApisAgree: false, consensusPrecipProb: 0, owmProb: 0, omProb: 0, vwc: 0 }
    }
  }

  /**
   * Obtiene la lluvia acumulada de las últimas N horas desde Postgres (RainEvent).
   * Solo cuenta eventos correctamente cerrados (endedAt IS NOT NULL).
   */
  private static async getRecentRainAccumulation(lookbackHours: number): Promise<{
    durationSeconds: number
    eventCount: number
  }> {
    const result = { durationSeconds: 0, eventCount: 0 }

    try {
      const since = new Date(Date.now() - lookbackHours * 3600000)

      const agg = await prisma.rainEvent.aggregate({
        where: {
          zone: 'EXTERIOR',
          startedAt: { gte: since },
          endedAt: { not: null },
        },
        _sum: { durationSeconds: true },
        _count: { id: true },
      })

      result.durationSeconds = agg._sum.durationSeconds ?? 0
      result.eventCount = agg._count.id ?? 0
    } catch {
      Logger.inference('No se pudo consultar lluvia acumulada de Postgres.')
    }

    return result
  }

  /**
   * Extrae la última condición física registrada en InfluxDB en los últimos 30 min.
   */
  private static async getLatestLocalConditions() {
    const result = {
      exterior: { lux: 0, rain_intensity: 0, temp: 0, hum: 0 },
      interior: { temp: 0, hum: 0, lux: 0 },
      foundExterior: false,
      foundInterior: false,
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

      for await (const row of stream) {
        // La zona determina el destino. Ambos nodos (Actuador y EMA) usan la fuente Weather_Station.
        const isExterior = row.zone === ZoneType.EXTERIOR
        const isInterior =
          !isExterior &&
          (row.zone?.toString().startsWith('Zona_') || row.zone?.toString().startsWith('ZONA_'))

        if (!foundExterior && isExterior && row.source === 'Weather_Station') {
          result.exterior.lux = Number(row.illuminance || 0)
          result.exterior.rain_intensity = Number(row.rain_intensity || 0)
          result.exterior.temp = Number(row.temperature || 0)
          result.exterior.hum = Number(row.humidity || 0)
          foundExterior = true
          result.foundExterior = true
        } else if (!foundInterior && isInterior && row.source === 'Weather_Station') {
          result.interior.temp = Number(row.temperature || 0)
          result.interior.hum = Number(row.humidity || 0)
          result.interior.lux = Number(row.illuminance || 0)
          foundInterior = true
          result.foundInterior = true
        }
      }

      if (!foundExterior || !foundInterior) {
        const missing = [!foundExterior && ZoneType.EXTERIOR, !foundInterior && 'INTERIOR']
          .filter(Boolean)
          .join(', ')

        Logger.inference(`Datos incompletos en InfluxDB (Falta: ${missing})`)
      }
    } catch {
      Logger.inference('No se pudo extraer telemetría reciente de InfluxDB.')
    }

    return result
  }
}
