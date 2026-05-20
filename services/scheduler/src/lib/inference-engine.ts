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
  // TODO: [EMA INTERIOR DESHABILITADO] — El firmware weather_station/main.py aún no ha sido
  // actualizado con arquitectura robusta, y no existen datos históricos calibrados del interior.
  // Habilitar estos umbrales únicamente después de:
  //   1. Actualizar firmware weather_station a nivel de resiliencia del nodo actuador.
  //   2. Recolectar un histórico suficiente del microclima interior.
  //   3. Validar el comportamiento real contra los umbrales propuestos.
  // El umbral tentativo de saturación interior sería >= 97.9% por paridad con el exterior
  // (mismo sensor DHT22, misma física), pero requiere validación con datos reales.
  //
  // MAX_HUMIDITY_CRITICAL: 97.9,  // TODO: HR > 97.9% → skip todo lo hídrico
  // MAX_HUMIDITY_FOR_MISTING: 80, // TODO: HR > 80% + día nublado → skip HUMIDIFICATION
  // MIN_HUMIDITY_TRIGGER: 50,     // TODO: HR < 50% → raíces aéreas deshidratándose

  // Amanecer: HR natural por rocío alcanza 95-98%
  MAX_HUMIDITY_DAWN: 100, // Umbral de HR para ventana de amanecer (4:00-7:00 AM, incluye evaluación de 6AM)
  DAWN_START_HOUR: 4,
  DAWN_END_HOUR: 7,

  // Respaldo Nocturno: HR exterior sostenida (EMA Exterior, zone = EXTERIOR)
  // Usado para cancelar el riego de las 6AM cuando el sensor de lluvia físico no se activó.
  // TODO: [CALIBRACIÓN INICIAL] — Este umbral y la ventana de 60 min son valores de inicio.
  // Monitorear si genera:
  //   (a) Falsos positivos: ambiente saturado de noche sin lluvia real.
  //   (b) Falsos negativos: lluvia real sin que la HR exterior sostenga este promedio 60 min.
  // Si ocurre (b), reducir la ventana a 30-45 min en BACKUP_NOCTURNAL_LOOKBACK_MIN.
  BACKUP_NOCTURNAL_HR_THRESHOLD: 97.9, // HR promedio exterior >= 97.9% en la ventana nocturna
  BACKUP_NOCTURNAL_LOOKBACK_MIN: 120, // Ventana de búsqueda de 120 min (2 horas)

  // Correlación de lluvia por HR sostenida (minutos)
  SUSTAINED_HR_MINUTES: 20, // Mínimo de min consecutivos con HR >= umbral para cancelar
  SUSTAINED_HR_LOOKBACK_MIN: 120, // Ventana de búsqueda (2 horas)

  // Iluminancia (calibrado con observaciones de campo marzo-abril 2026)
  OVERCAST_LUX_THRESHOLD: 26000, // Promedio diario < 26k = nublado confirmado
  HEAVY_OVERCAST_LUX: 10000, // Nubosidad intensa → posible lluvia

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

      // ── 3.1: Veto Autoridad Principal — Criterio del Día Anterior (solo IRRIGATION) ──
      // Cancela el riego de aspersión de las 6AM si las condiciones de ayer fueron
      // lo suficientemente húmedas como para que el suelo aún esté humectado.
      // Se aplica solo en ventana de evaluación matutina (antes de las 7AM).
      const localHour = (now.getUTCHours() - 4 + 24) % 24

      if (purpose === 'IRRIGATION' && localHour < 7) {
        const yesterdayRain = await this.getYesterdayRainAccumulation(now)
        const yesterdayLux = await this.getYesterdayAverageLux(now)

        // Criterio A1: Lluvia >20 min acumulada ayer + promedio de lux < 26k (evapotranspiración mínima)
        const criterioA1 =
          yesterdayRain.durationSeconds >= THRESHOLDS.MIN_RAIN_FOR_IRRIGATION &&
          yesterdayLux < THRESHOLDS.OVERCAST_LUX_THRESHOLD

        // TODO: [EVALUACIÓN HISTÓRICA] El Criterio A2 (nubosidad severa sola) ha sido desactivado temporalmente para IRRIGATION.
        // Se evidenció que días muy nublados (como el 19 de mayo) pueden no tener lluvia significativa,
        // lo que provocaría sub-riego de aspersión.
        // const hadHeavyOvercast = await this.hasYesterdayHeavyOvercast60Min(now)
        // const criterioA2 = hadHeavyOvercast

        if (criterioA1) {
          const razon = `Lluvia acumulada ayer: ${Math.round(yesterdayRain.durationSeconds / 60)} min + Lux promedio: ${yesterdayLux.toFixed(0)} (< ${THRESHOLDS.OVERCAST_LUX_THRESHOLD} lux)`

          return {
            shouldCancel: true,
            reason: `VETO AUTORIDAD (día anterior): ${razon}. Riego de aspersión omitido.`,
            action: 'SKIP',
            metadata: { yesterdayRain, yesterdayLux },
          }
        }
      }

      // ── 3.2: Veto Respaldo Nocturno — HR exterior promedio >= 97.9% (solo IRRIGATION) ──
      // Mecanismo de redundancia por fallo del sensor de lluvia físico.
      // Activo en la ventana nocturna: 7:00 PM (19:00) hasta 5:59:59 AM del día siguiente.
      if (purpose === 'IRRIGATION') {
        const isNocturnalWindow = localHour >= 19 || localHour < 6

        if (isNocturnalWindow) {
          const avgExtHum = await this.getExternalRecentAverageHumidity(
            THRESHOLDS.BACKUP_NOCTURNAL_LOOKBACK_MIN,
          )

          if (avgExtHum >= THRESHOLDS.BACKUP_NOCTURNAL_HR_THRESHOLD) {
            return {
              shouldCancel: true,
              reason: `VETO RESPALDO NOCTURNO: HR exterior promedio ${avgExtHum.toFixed(1)}% ≥ ${THRESHOLDS.BACKUP_NOCTURNAL_HR_THRESHOLD}% en las últimas 2 horas (posible lluvia sin registro del sensor físico).`,
              action: 'SKIP',
              metadata: { avgExtHum },
            }
          }
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

      // TODO: [EMA INTERIOR DESHABILITADO] — Bloque de Humedad Crítica Interior.
      //
      // Este bloque evalúa la HR del sensor DHT22 interior (bajo mallasombra) para cancelar
      // tareas hídricas cuando el microclima ya está saturado.
      //
      // ESTADO: Deshabilitado. El firmware weather_station/main.py no ha sido actualizado
      // con arquitectura robusta, y no existen datos históricos calibrados del interior que
      // permitan validar los umbrales propuestos.
      //
      // CONDICIONES PARA HABILITAR:
      //   1. Actualizar firmware weather_station a nivel de resiliencia del nodo actuador.
      //   2. Recolectar un histórico real del microclima interior (DHT22 bajo mallasombra).
      //   3. Validar umbrales: tentativo >= 97.9% (paridad con EMA exterior, mismo sensor DHT22).
      //
      // CUANDO SE HABILITE, reemplazar este bloque por la lógica original:
      //
      // if (
      //   interiorHum > 0 &&
      //   (purpose === 'IRRIGATION' || purpose === 'HUMIDIFICATION' || purpose === 'SOIL_WETTING')
      // ) {
      //   const currentHour = now.getHours()
      //   const isDawn =
      //     currentHour >= THRESHOLDS.DAWN_START_HOUR && currentHour < THRESHOLDS.DAWN_END_HOUR
      //
      //   const effectiveHumThreshold = isDawn
      //     ? THRESHOLDS.MAX_HUMIDITY_DAWN
      //     : THRESHOLDS.MAX_HUMIDITY_CRITICAL  // TODO: 97.9% una vez calibrado
      //
      //   if (interiorHum > effectiveHumThreshold) {
      //     const recentRainCheck = await this.getRecentRainAccumulation(4)
      //     const rainedRecently = recentRainCheck.durationSeconds > 0
      //
      //     if (isDawn) {
      //       const sustainedHR = await this.getSustainedHighHumidity(
      //         THRESHOLDS.SUSTAINED_HR_LOOKBACK_MIN,
      //         THRESHOLDS.MAX_HUMIDITY_DAWN,
      //       )
      //       if (rainedRecently || sustainedHR.minutes >= THRESHOLDS.SUSTAINED_HR_MINUTES) {
      //         const evidencia = rainedRecently
      //           ? `lluvia real (${Math.round(recentRainCheck.durationSeconds / 60)}min)`
      //           : `HR >=${THRESHOLDS.MAX_HUMIDITY_DAWN}% sostenida por ${sustainedHR.minutes}min`
      //         return {
      //           shouldCancel: true,
      //           reason: `HR INT ${interiorHum.toFixed(0)}% (amanecer) + ${evidencia}. Omitiendo ${purpose}.`,
      //           action: 'SKIP',
      //           metadata: { localConditions, dayClass, sustainedHR },
      //         }
      //       }
      //     } else {
      //       const cloudyDay = dayClass.type === 'NUBLADO' || dayClass.type === 'LLUVIOSO'
      //       if (rainedRecently || cloudyDay) {
      //         return {
      //           shouldCancel: true,
      //           reason: `HR INT ${interiorHum.toFixed(0)}% (crítica) + ${cloudyDay ? `día ${dayClass.type}` : `lluvia reciente`}. Omitiendo ${purpose}.`,
      //           action: 'SKIP',
      //           metadata: { localConditions, dayClass },
      //         }
      //       }
      //     }
      //   }
      // }

      // ── 6. Pulverización innecesaria (día nublado + HR alta) ──
      // HR > 80% + día promedio < 26k lux → no pulverizar
      // TODO: [EMA INTERIOR] — Este umbral de HR (80%) es provisional. Calibrar con datos
      // reales del DHT22 interior cuando el firmware weather_station esté actualizado.
      const MAX_HUMIDITY_FOR_MISTING_PROVISIONAL = 80 // TODO: reemplazar con THRESHOLDS una vez calibrado

      if (
        purpose === 'HUMIDIFICATION' &&
        interiorHum > MAX_HUMIDITY_FOR_MISTING_PROVISIONAL &&
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

  /**
   * Consulta los últimos N minutos de HR en InfluxDB y calcula
   * cuántos minutos consecutivos (hacia atrás desde ahora) la HR
   * se mantuvo >= el umbral dado. Usado para distinguir rocío
   * natural de lluvia real en horario de amanecer.
   *
   * @remarks Reservado para uso futuro con el EMA Interior.
   * TODO: [EMA INTERIOR] Conectar al bloque de Humedad Crítica Interior cuando se habilite.
   */
  // @ts-expect-error -- TS6133: Método reservado para el EMA interior. Se activará cuando el firmware weather_station esté calibrado.
  private static async _getSustainedHighHumidity(
    lookbackMinutes: number,
    threshold: number,
  ): Promise<{ minutes: number }> {
    const result = { minutes: 0 }

    try {
      const query = `
        SELECT humidity, time
        FROM "environment_metrics"
        WHERE time >= now() - INTERVAL '${lookbackMinutes} minutes'
        AND source = 'Weather_Station'
        AND zone = '${ZoneType.EXTERIOR}'
        ORDER BY time DESC
      `

      const stream = influxClient.query(query)
      let lastTime: Date | null = null
      let consecutiveMinutes = 0

      for await (const row of stream) {
        const hum = Number(row.humidity || 0)

        if (hum < threshold) break // Se rompió la cadena

        // Parsear timestamp de InfluxDB de forma segura
        const rawTime = row.time
        let rowTime: Date

        if (rawTime instanceof Date) {
          rowTime = rawTime
        } else {
          const s = String(rawTime)

          rowTime = s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
        }

        if (isNaN(rowTime.getTime())) continue

        if (!lastTime) {
          // Primera iteración (dato más reciente)
          const ageMs = Date.now() - rowTime.getTime()

          consecutiveMinutes += Math.min(ageMs, 30 * 60000) / 60000
          lastTime = rowTime
        } else {
          const jumpMs = lastTime.getTime() - rowTime.getTime()

          if (jumpMs > 30 * 60000) break // Salto de datos demasiado grande
          consecutiveMinutes += jumpMs / 60000
          lastTime = rowTime
        }
      }

      result.minutes = Math.round(consecutiveMinutes)
    } catch {
      Logger.inference('Error consultando HR sostenida en InfluxDB.')
    }

    return result
  }

  /**
   * Consulta la lluvia acumulada del DÍA ANTERIOR completo (de 00:00:00 a 23:59:59).
   * Fuente: Postgres (RainEvent), zona EXTERIOR.
   * Utilizada para el Veto de Autoridad Principal de riego de las 6AM.
   */
  private static async getYesterdayRainAccumulation(
    now: Date,
  ): Promise<{ durationSeconds: number; eventCount: number }> {
    const result = { durationSeconds: 0, eventCount: 0 }

    try {
      const yesterday = new Date(now)

      yesterday.setDate(yesterday.getDate() - 1)

      const start = new Date(yesterday)

      start.setHours(0, 0, 0, 0)

      const end = new Date(yesterday)

      end.setHours(23, 59, 59, 999)

      const agg = await prisma.rainEvent.aggregate({
        where: {
          zone: 'EXTERIOR',
          startedAt: { gte: start, lte: end },
          endedAt: { not: null },
        },
        _sum: { durationSeconds: true },
        _count: { id: true },
      })

      result.durationSeconds = agg._sum.durationSeconds ?? 0
      result.eventCount = agg._count.id ?? 0
    } catch {
      Logger.inference('No se pudo consultar lluvia acumulada de ayer (Postgres).')
    }

    return result
  }

  /**
   * Consulta el promedio de iluminancia del día botánico del DÍA ANTERIOR (8:00 AM - 4:00 PM).
   * Fuente: InfluxDB, EMA Exterior (zone = EXTERIOR).
   * Utilizada para el Veto de Autoridad Principal (Criterio A1).
   */
  private static async getYesterdayAverageLux(now: Date): Promise<number> {
    try {
      const caracasYesterday = new Date(now.getTime() - 4 * 60 * 60000 - 24 * 60 * 60000)
      const start = new Date(
        Date.UTC(
          caracasYesterday.getUTCFullYear(),
          caracasYesterday.getUTCMonth(),
          caracasYesterday.getUTCDate(),
          12,
          0,
          0,
          0,
        ),
      ) // 8:00 AM Caracas = 12:00 PM UTC
      const end = new Date(
        Date.UTC(
          caracasYesterday.getUTCFullYear(),
          caracasYesterday.getUTCMonth(),
          caracasYesterday.getUTCDate(),
          20,
          0,
          0,
          0,
        ),
      ) // 4:00 PM Caracas = 8:00 PM UTC

      const query = `
        SELECT AVG(illuminance) as avg_lux, COUNT(illuminance) as count_lux
        FROM "environment_metrics"
        WHERE time >= '${start.toISOString()}' AND time <= '${end.toISOString()}'
        AND source = 'Weather_Station'
        AND zone = 'EXTERIOR'
      `
      const stream = influxClient.query(query)

      for await (const row of stream) {
        if (row.avg_lux != null && row.count_lux != null) {
          const count = Number(row.count_lux)

          if (count < 250) {
            Logger.inference(
              `Lux promedio de ayer ignorado por baja densidad de muestras (${count} < 250). Retornando default alto 999999 para evitar veto falso.`,
            )

            return 999999
          }

          return Number(row.avg_lux)
        }
      }
    } catch {
      Logger.inference('No se pudo consultar lux promedio de ayer (InfluxDB).')
    }

    return 0
  }

  /**
   * Detecta si durante el día botánico del DÍA ANTERIOR (8:00 AM - 4:00 PM)
   * hubo al menos 60 minutos continuos con lux < 10,000 (nubosidad severa / cielo cerrado).
   * Fuente: InfluxDB, EMA Exterior (zone = EXTERIOR).
   * Utilizada para el Veto de Autoridad Principal (Criterio A2).
   *
   * Implementa una ventana deslizante de 60 minutos (3,600,000 ms) recorriendo
   * los datos de forma cronológica (ASC) para encontrar el primer período donde
   * todos los puntos registrados superan la brecha de tiempo máximo de 30 min y
   * contienen al menos 50 muestras válidas.
   */
  // @ts-expect-error -- TS6133: Método reservado para análisis histórico o evaluación futura. Desactivado temporalmente para aspersión.
  private static async _hasYesterdayHeavyOvercast60Min(now: Date): Promise<boolean> {
    try {
      const caracasYesterday = new Date(now.getTime() - 4 * 60 * 60000 - 24 * 60 * 60000)
      const start = new Date(
        Date.UTC(
          caracasYesterday.getUTCFullYear(),
          caracasYesterday.getUTCMonth(),
          caracasYesterday.getUTCDate(),
          12,
          0,
          0,
          0,
        ),
      ) // 8:00 AM Caracas = 12:00 PM UTC
      const end = new Date(
        Date.UTC(
          caracasYesterday.getUTCFullYear(),
          caracasYesterday.getUTCMonth(),
          caracasYesterday.getUTCDate(),
          20,
          0,
          0,
          0,
        ),
      ) // 4:00 PM Caracas = 8:00 PM UTC

      const query = `
        SELECT illuminance, time
        FROM "environment_metrics"
        WHERE time >= '${start.toISOString()}' AND time <= '${end.toISOString()}'
        AND source = 'Weather_Station'
        AND zone = 'EXTERIOR'
        ORDER BY time ASC
      `
      const stream = influxClient.query(query)
      const readings: { t: number; lux: number }[] = []

      for await (const row of stream) {
        const lux = Number(row.illuminance || 0)
        const rawTime = row.time
        const s =
          rawTime instanceof Date ? rawTime.getTime() : Number(String(rawTime).substring(0, 13))

        if (!isNaN(s)) readings.push({ t: s, lux })
      }

      // Ventana deslizante: buscar cualquier intervalo de >= 60 min continuo con lux < 10k
      const WINDOW_MS = 60 * 60000
      const MAX_GAP_MS = 30 * 60000
      const HEAVY_LUX = 10000

      for (let i = 0; i < readings.length; i++) {
        if (readings[i].lux >= HEAVY_LUX) continue // Este punto no es pesado → saltar

        // Inicio de una posible cadena desde el punto i
        const windowStart = readings[i].t
        let prev = readings[i].t
        let valid = true
        let count = 1

        for (let j = i + 1; j < readings.length; j++) {
          const gap = readings[j].t - prev

          if (gap > MAX_GAP_MS) {
            valid = false
            break
          } // Brecha de datos → rompe cadena

          if (readings[j].lux >= HEAVY_LUX) {
            valid = false
            break
          } // Punto no pesado → rompe

          prev = readings[j].t
          count++

          if (prev - windowStart >= WINDOW_MS) {
            if (count >= 50) {
              return true // ¡Encontrado con suficiente densidad de datos!
            } else {
              break // Rompe para intentar desde la siguiente posición inicial
            }
          }
        }

        if (!valid) continue
      }
    } catch {
      Logger.inference('No se pudo consultar nubosidad severa de ayer (InfluxDB).')
    }

    return false
  }

  private static async getExternalRecentAverageHumidity(lookbackMinutes: number): Promise<number> {
    try {
      const query = `
        SELECT humidity
        FROM "environment_metrics"
        WHERE time >= now() - INTERVAL '${lookbackMinutes} minutes'
        AND source = 'Weather_Station'
        AND zone = 'EXTERIOR'
        ORDER BY time DESC
      `
      const stream = influxClient.query(query)
      let sum = 0
      let count = 0

      for await (const row of stream) {
        if (row.humidity != null) {
          sum += Number(row.humidity)
          count++
        }
      }

      if (count < 50) {
        Logger.inference(
          `Humedad exterior reciente ignorada por baja densidad de datos (${count} muestras < 50 en los últimos ${lookbackMinutes} min).`,
        )

        return 0
      }

      return sum / count
    } catch {
      Logger.inference('No se pudo consultar HR promedio exterior reciente (InfluxDB).')
    }

    return 0
  }
}
