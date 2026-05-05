import { prisma, TaskStatus, AutomationSchedule } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'
import { classifyCurrentDay } from './day-classifier'

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
  RAIN_LOOKBACK_IRRIGATION: 12, // Lluvia acumulada en 12h → aplica a IRRIGATION
  RAIN_LOOKBACK_SOIL_WETTING: 4, // Lluvia acumulada en 4h → aplica a SOIL_WETTING

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
const FALLBACK_OFFSETS = {
  TEMP: -2.0, // Estimación inicial: El orquideario suele estar más fresco
  HUM: 8.0, // Estimación inicial: Mayor retención por riego y masa foliar
}

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

      // Lógica de Fallback de Emergencia:
      // // TODO: En ausencia de datos de INTERIOR, se utilizan datos de EXTERIOR
      // aplicando una compensación estática PRELIMINAR. Este método es un marcador
      // de posición hasta que se implemente una inferencia basada en correlación histórica.
      const isFallback = !localConditions.foundInterior

      const interiorHum = isFallback
        ? Math.min(99, localConditions.exterior.hum + FALLBACK_OFFSETS.HUM)
        : localConditions.interior.hum

      const interiorTemp = isFallback
        ? localConditions.exterior.temp + FALLBACK_OFFSETS.TEMP
        : localConditions.interior.temp

      const dataUsed = isFallback ? 'EXTERIOR (Fallback Preliminar)' : 'INTERIOR'

      Logger.info(
        `[ INFERENCE ] Evaluando "${schedule.name}" (${purpose}) → HR: ${interiorHum.toFixed(0)}% | Temp: ${interiorTemp.toFixed(1)}°C | Día: ${dayClass.type} | Datos: ${dataUsed}`,
      )

      // ── 3. HARD BLOCK: Lluvia Real en Curso ──
      // Si está lloviendo AHORA → no ejecutar ninguna tarea hídrica
      if (localConditions.exterior.rain_intensity && localConditions.exterior.rain_intensity > 0) {
        return {
          shouldCancel: true,
          reason: `Está lloviendo ahora (sensor de lluvia activo). Intensidad: ${localConditions.exterior.rain_intensity}.`,
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

      // ── 4.1 Lluvia Acumulada → SOIL_WETTING (>20min en 4h) ──
      if (purpose === 'SOIL_WETTING') {
        const recentRain = await this.getRecentRainAccumulation(
          THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING,
        )

        if (recentRain.durationSeconds >= THRESHOLDS.MIN_RAIN_FOR_SOIL_WETTING) {
          return {
            shouldCancel: true,
            reason: `Lluvia acumulada: ${Math.round(recentRain.durationSeconds / 60)} min en las últimas ${THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING}h.`,
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
            reason: `HR ${dataUsed.toLowerCase()} ${interiorHum.toFixed(0)}% (crítica) + ${cloudyDay ? `día ${dayClass.type}` : `lluvia reciente (${Math.round(recentRainCheck.durationSeconds / 60)}min)`}. Omitiendo ${purpose}.`,
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
          dayClass.avgLuxSince8am < 20000 && dayClass.type !== 'DESCONOCIDO' && interiorHum > 95

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
    } catch (error) {
      Logger.error('Error en InferenceEngine.evaluate:', error)

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
   * Obtiene la lluvia acumulada de las últimas N horas desde InfluxDB (rain_events).
   */
  private static async getRecentRainAccumulation(lookbackHours: number): Promise<{
    durationSeconds: number
    eventCount: number
  }> {
    const result = { durationSeconds: 0, eventCount: 0 }

    try {
      const query = `
        SELECT 
          SUM("duration_seconds") as total_rain,
          COUNT(*) as event_count
        FROM "rain_events"
        WHERE time >= now() - interval '${lookbackHours} hours'
        AND zone = 'EXTERIOR'
      `
      const stream = influxClient.query(query)

      for await (const row of stream) {
        if (row.total_rain) result.durationSeconds = Number(row.total_rain)
        if (row.event_count) result.eventCount = Number(row.event_count)
      }
    } catch (error) {
      Logger.warn('No se pudo consultar lluvia acumulada de InfluxDB.', error)
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
        if (!foundExterior && row.source === 'Weather_Station') {
          result.exterior.lux = Number(row.illuminance || 0)
          result.exterior.rain_intensity = Number(row.rain_intensity || 0)
          result.exterior.temp = Number(row.temperature || 0)
          result.exterior.hum = Number(row.humidity || 0)
          foundExterior = true
          result.foundExterior = true
        } else if (!foundInterior && row.source === 'Environmental_Monitoring') {
          result.interior.temp = Number(row.temperature || 0)
          result.interior.hum = Number(row.humidity || 0)
          result.interior.lux = Number(row.illuminance || 0)
          foundInterior = true
          result.foundInterior = true
        }
      }

      if (!foundExterior || !foundInterior) {
        const missing = [!foundExterior && 'EXTERIOR', !foundInterior && 'INTERIOR']
          .filter(Boolean)
          .join(', ')

        Logger.warn(`[ INFERENCE ] Datos incompletos en InfluxDB (Falta: ${missing})`)
      }
    } catch (error) {
      Logger.error(
        'No se pudo extraer telemetría reciente de InfluxDB para el motor de inferencia.',
        error,
      )
    }

    return result
  }
}
