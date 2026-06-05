import {
  prisma,
  TaskStatus,
  AutomationSchedule,
  ZoneType,
  TaskSource,
  TaskPurpose,
} from '@package/database'

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

  // Humedad Crítica Interior (EMA Interior, ZONA_A)
  // Veto absoluto de HUMIDIFICATION y SOIL_WETTING si el promedio de 3h es >= 95%
  MAX_HUMIDITY_CRITICAL_INTERIOR: 95.0,
  INTERIOR_HUMIDITY_LOOKBACK_MIN: 180, // 3 horas (180 minutos)

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
  BACKUP_NOCTURNAL_HR_THRESHOLD: 98.0, // HR promedio exterior >= 98.0%
  BACKUP_NOCTURNAL_LOOKBACK_MIN: 180, // Ventana de búsqueda de 180 min (3 horas)

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
          source: TaskSource.MANUAL,
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

      // ── 3.2: Veto Respaldo Nocturno — HR exterior promedio >= 98.0% (solo IRRIGATION) ──
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
              reason: `VETO RESPALDO NOCTURNO: HR exterior promedio ${avgExtHum.toFixed(1)}% ≥ ${THRESHOLDS.BACKUP_NOCTURNAL_HR_THRESHOLD}% en las últimas 3 horas (posible lluvia sin registro del sensor físico).`,
              action: 'SKIP',
              metadata: { avgExtHum },
            }
          }
        }
      }

      // ── 3.3: Veto Humedad Crítica Interior — HR interior promedio >= 95% (solo HUMIDIFICATION y SOIL_WETTING) ──
      if (purpose === 'HUMIDIFICATION' || purpose === 'SOIL_WETTING') {
        const avgIntHum = await this.getInteriorRecentAverageHumidity(
          THRESHOLDS.INTERIOR_HUMIDITY_LOOKBACK_MIN,
        )

        if (avgIntHum >= THRESHOLDS.MAX_HUMIDITY_CRITICAL_INTERIOR) {
          return {
            shouldCancel: true,
            reason: `VETO HUMEDAD INTERIOR: Promedio 3h de ZONA_A (${avgIntHum.toFixed(1)}%) ≥ ${THRESHOLDS.MAX_HUMIDITY_CRITICAL_INTERIOR}% (Evitando exceso hídrico).`,
            action: 'SKIP',
            metadata: { avgIntHum },
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

      let extLux: number | null = null
      let extRain: number | null = null
      let extTemp: number | null = null
      let extHum: number | null = null

      let intTemp: number | null = null
      let intHum: number | null = null
      let intLux: number | null = null

      for await (const row of stream) {
        // La zona determina el destino. Ambos nodos (Actuador y EMA) usan la fuente Weather_Station.
        const isExterior = row.zone === ZoneType.EXTERIOR
        const isInterior =
          !isExterior &&
          (row.zone?.toString().startsWith('Zona_') || row.zone?.toString().startsWith('ZONA_'))

        if (isExterior && row.source === 'Weather_Station') {
          if (extLux === null && row.illuminance != null) {
            extLux = Number(row.illuminance)
          }
          if (extRain === null && row.rain_intensity != null) {
            extRain = Number(row.rain_intensity)
          }
          if (extTemp === null && row.temperature != null) {
            extTemp = Number(row.temperature)
          }
          if (extHum === null && row.humidity != null) {
            extHum = Number(row.humidity)
          }
        } else if (isInterior && row.source === 'Weather_Station') {
          if (intTemp === null && row.temperature != null) {
            intTemp = Number(row.temperature)
          }
          if (intHum === null && row.humidity != null) {
            intHum = Number(row.humidity)
          }
          if (intLux === null && row.illuminance != null) {
            intLux = Number(row.illuminance)
          }
        }
      }

      if (extLux !== null || extRain !== null || extTemp !== null || extHum !== null) {
        result.exterior.lux = extLux ?? 0
        result.exterior.rain_intensity = extRain ?? 0
        result.exterior.temp = extTemp ?? 0
        result.exterior.hum = extHum ?? 0
        result.foundExterior = true
      }

      if (intTemp !== null || intHum !== null || intLux !== null) {
        result.interior.temp = intTemp ?? 0
        result.interior.hum = intHum ?? 0
        result.interior.lux = intLux ?? 0
        result.foundInterior = true
      }

      if (!result.foundExterior || !result.foundInterior) {
        const missing = [
          !result.foundExterior && ZoneType.EXTERIOR,
          !result.foundInterior && 'INTERIOR',
        ]
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

  private static async getInteriorRecentAverageHumidity(lookbackMinutes: number): Promise<number> {
    try {
      const query = `
        SELECT humidity
        FROM "environment_metrics"
        WHERE time >= now() - INTERVAL '${lookbackMinutes} minutes'
        AND source = 'Weather_Station'
        AND zone = 'ZONA_A'
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

      if (count < 25) {
        // El EMA puede estar durmiendo o tener menor densidad
        Logger.inference(
          `Humedad interior reciente ignorada por baja densidad de datos (${count} muestras < 25 en los últimos ${lookbackMinutes} min).`,
        )

        return 0
      }

      return sum / count
    } catch {
      Logger.inference('No se pudo consultar HR promedio interior reciente (InfluxDB).')
    }

    return 0
  }

  public static async getOrInitSchedulerState(): Promise<string> {
    try {
      const record = await prisma.schedulerState.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      if (record) {
        return record.state
      }
      const newRecord = await prisma.schedulerState.create({
        data: {
          state: 'STANDARD_CRON',
          lastEvaluation: new Date(),
        },
      })

      return newRecord.state
    } catch (err) {
      Logger.error('Error al inicializar SchedulerState:', err)

      return 'STANDARD_CRON'
    }
  }

  public static async updateSchedulerState(newState: string): Promise<void> {
    try {
      const record = await prisma.schedulerState.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      if (record) {
        await prisma.schedulerState.update({
          where: { id: record.id },
          data: {
            state: newState,
            lastEvaluation: new Date(),
          },
        })
      } else {
        await prisma.schedulerState.create({
          data: {
            state: newState,
            lastEvaluation: new Date(),
          },
        })
      }
      Logger.cron(`Máquina de estados del scheduler transiciona a: ${newState}`)
    } catch (err) {
      Logger.error(`Error transicionando estado a ${newState}:`, err)
    }
  }

  private static async getRainAccumulationForDate(
    date: Date,
  ): Promise<{ durationSeconds: number; eventCount: number }> {
    const result = { durationSeconds: 0, eventCount: 0 }

    try {
      const start = new Date(date)

      start.setHours(0, 0, 0, 0)

      const end = new Date(date)

      end.setHours(23, 59, 59, 999)

      const agg = await prisma.rainEvent.aggregate({
        where: {
          zone: 'EXTERIOR',
          startedAt: { gte: start, lte: end },
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

  public static async checkRiegoCompleto(date: Date): Promise<boolean> {
    try {
      const start = new Date(date)

      start.setHours(0, 0, 0, 0)
      const end = new Date(date)

      end.setHours(23, 59, 59, 999)

      // 1. Aspersión completada en ese día (IRRIGATION, COMPLETED)
      const aggTask = await prisma.taskLog.aggregate({
        where: {
          purpose: TaskPurpose.IRRIGATION,
          status: TaskStatus.COMPLETED,
          scheduledAt: { gte: start, lte: end },
        },
        _sum: { duration: true },
      })
      const aspSeconds = (aggTask._sum.duration ?? 0) * 60

      // 2. Lluvia acumulada en ese día
      const rain = await this.getRainAccumulationForDate(date)

      return aspSeconds >= 900 || rain.durationSeconds >= 1200 // Aspersión >= 15m (900s) o Lluvia >= 20m (1200s)
    } catch {
      return false
    }
  }

  private static async getTodayAverageLux(now: Date): Promise<number> {
    try {
      const caracasToday = new Date(now.getTime() - 4 * 60 * 60000)
      const start = new Date(
        Date.UTC(
          caracasToday.getUTCFullYear(),
          caracasToday.getUTCMonth(),
          caracasToday.getUTCDate(),
          12,
          0,
          0,
          0,
        ),
      ) // 8:00 AM Caracas = 12:00 PM UTC
      const end = new Date(
        Date.UTC(
          caracasToday.getUTCFullYear(),
          caracasToday.getUTCMonth(),
          caracasToday.getUTCDate(),
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

          if (count < 100) return 0

          return Number(row.avg_lux)
        }
      }
    } catch {
      Logger.inference('No se pudo consultar promedio de luxes de hoy (InfluxDB).')
    }

    return 0
  }

  private static getNext6am(from: Date, daysAhead: number): Date {
    const target = new Date(from)

    target.setDate(target.getDate() + daysAhead)
    target.setHours(6, 0, 0, 0)

    return target
  }

  private static async createDeferredIrrigation(scheduledAt: Date, reason: string): Promise<void> {
    try {
      const startOfSlot = new Date(scheduledAt.getTime() - 30 * 60000)
      const endOfSlot = new Date(scheduledAt.getTime() + 30 * 60000)

      const existing = await prisma.taskLog.findFirst({
        where: {
          purpose: TaskPurpose.IRRIGATION,
          source: { in: [TaskSource.INFERENCE, TaskSource.ROUTINE] },
          scheduledAt: { gte: startOfSlot, lte: endOfSlot },
          status: { in: [TaskStatus.PENDING, TaskStatus.CONFIRMED] },
        },
      })

      if (existing) {
        Logger.inference(
          `Ya existe tarea de aspersión diferida para ${scheduledAt.toLocaleString()}. No se crea duplicado.`,
        )

        return
      }

      await prisma.taskLog.create({
        data: {
          scheduledAt,
          status: TaskStatus.PENDING,
          source: TaskSource.INFERENCE,
          purpose: TaskPurpose.IRRIGATION,
          zones: [ZoneType.ZONA_A, ZoneType.ZONA_B, ZoneType.ZONA_C, ZoneType.ZONA_D],
          duration: 15,
          notes: `[ DAILY RULES ] ${reason}`,
        },
      })

      Logger.inference(`Tarea de aspersión diferida creada para ${scheduledAt.toLocaleString()}.`)
    } catch (err) {
      Logger.error('Error creando aspersión diferida:', err)
    }
  }

  public static async evaluateDailyRules(): Promise<void> {
    try {
      const now = new Date()
      const state = await this.getOrInitSchedulerState()

      const today = new Date(now)
      const yesterday = new Date(now)

      yesterday.setDate(yesterday.getDate() - 1)
      const dayBefore = new Date(now)

      dayBefore.setDate(dayBefore.getDate() - 2)

      const regadoHoy = await this.checkRiegoCompleto(today)
      const regadoAyer = await this.checkRiegoCompleto(yesterday)
      const regadoAnteayer = await this.checkRiegoCompleto(dayBefore)

      // ---- 1. Límite de Emergencia (3 días sin riego completo) ----
      if (!regadoHoy && !regadoAyer && !regadoAnteayer) {
        Logger.cron('Límite de Emergencia: 3 días consecutivos sin riego completo detectado.')

        // Exclusión 1: Lluvia acumulada en las últimas 24h >= 20 min (1200s)
        const rain24h = await this.getRecentRainAccumulation(24)
        const rainExclusion = rain24h.durationSeconds >= 1200

        // Exclusión 2: Promedio de 3h de humedad >= 98% en exterior o interior
        const avgExtHum3h = await this.getExternalRecentAverageHumidity(180)
        const avgIntHum3h = await this.getInteriorRecentAverageHumidity(180)
        const humExclusion = avgExtHum3h >= 98.0 || avgIntHum3h >= 98.0

        if (rainExclusion || humExclusion) {
          Logger.cron(
            `Límite de Emergencia ANULADO por exclusión hídrica: Lluvia 24h: ${Math.round(rain24h.durationSeconds / 60)}m, Promedio Hum Exterior 3h: ${avgExtHum3h.toFixed(1)}%, Interior 3h: ${avgIntHum3h.toFixed(1)}%.`,
          )
        } else {
          Logger.cron(
            'Programando Riego Diferido de Emergencia (15 min) para mañana a las 6:00 AM.',
          )
          await this.createDeferredIrrigation(
            this.getNext6am(now, 1),
            'Riego diferido de emergencia por límite de 3 días secos.',
          )
        }
      }

      // ---- 2. Transición y Lógica de Estados ----
      if (state === 'STANDARD_CRON') {
        const startYesterday = new Date(yesterday)

        startYesterday.setHours(0, 0, 0, 0)
        const endToday = new Date(today)

        endToday.setHours(23, 59, 59, 999)

        // Si se canceló alguna aspersión por clima/lluvia hoy o ayer, cambiamos de estado
        const cancelledTasks = await prisma.taskLog.findFirst({
          where: {
            purpose: TaskPurpose.IRRIGATION,
            status: TaskStatus.CANCELLED,
            scheduledAt: { gte: startYesterday, lte: endToday },
            notes: { contains: 'VETO' }, // o simplemente cancelada por clima
          },
        })

        if (cancelledTasks) {
          Logger.cron(
            'Se detectó cancelación de riego por clima/lluvia. Activando DIFERIDO_SCHEDULER.',
          )
          await this.updateSchedulerState('DIFERIDO_SCHEDULER')
        }
      }

      const updatedState = await this.getOrInitSchedulerState()

      if (updatedState === 'DIFERIDO_SCHEDULER') {
        // Lluvia por 2 días consecutivos -> RAIN_SUSPENSION
        const rainToday = await this.getRainAccumulationForDate(today)
        const rainYesterday = await this.getRainAccumulationForDate(yesterday)

        if (rainToday.durationSeconds >= 1200 && rainYesterday.durationSeconds >= 1200) {
          Logger.cron(
            'Lluvia >= 20 min registrada por 2 días consecutivos. Activando RAIN_SUSPENSION.',
          )
          await this.updateSchedulerState('RAIN_SUSPENSION')

          return
        }

        // Reset por Riego Doble: hoy y ayer aspersión completada >= 15 min en cada día
        const startToday = new Date(today)

        startToday.setHours(0, 0, 0, 0)
        const endToday = new Date(today)

        endToday.setHours(23, 59, 59, 999)
        const startYesterday = new Date(yesterday)

        startYesterday.setHours(0, 0, 0, 0)
        const endYesterday = new Date(yesterday)

        endYesterday.setHours(23, 59, 59, 999)

        const aspToday = await prisma.taskLog.aggregate({
          where: {
            purpose: TaskPurpose.IRRIGATION,
            status: TaskStatus.COMPLETED,
            scheduledAt: { gte: startToday, lte: endToday },
          },
          _sum: { duration: true },
        })
        const aspYesterday = await prisma.taskLog.aggregate({
          where: {
            purpose: TaskPurpose.IRRIGATION,
            status: TaskStatus.COMPLETED,
            scheduledAt: { gte: startYesterday, lte: endYesterday },
          },
          _sum: { duration: true },
        })

        if ((aspToday._sum.duration ?? 0) >= 15 && (aspYesterday._sum.duration ?? 0) >= 15) {
          Logger.cron(
            'Intervención manual de riego doble detectada (2 días seguidos de aspersión). Reseteando a STANDARD_CRON.',
          )
          await this.updateSchedulerState('STANDARD_CRON')

          return
        }

        // Reglas de alternancia
        if (regadoHoy) {
          Logger.cron(
            'Hoy hubo riego completo. Cancelando preventivamente riego diferido de mañana para mantener alternancia.',
          )
          const tomorrow6am = this.getNext6am(now, 1)
          const startOfSlot = new Date(tomorrow6am.getTime() - 30 * 60000)
          const endOfSlot = new Date(tomorrow6am.getTime() + 30 * 60000)

          const existing = await prisma.taskLog.findFirst({
            where: {
              purpose: TaskPurpose.IRRIGATION,
              scheduledAt: { gte: startOfSlot, lte: endOfSlot },
              status: { in: [TaskStatus.PENDING, TaskStatus.CONFIRMED] },
            },
          })

          if (existing) {
            await prisma.taskLog.update({
              where: { id: existing.id },
              data: {
                status: TaskStatus.CANCELLED,
                notes:
                  '[ MÁQUINA ESTADOS ] Cancelado preventivamente: Riego completo detectado hoy.',
              },
            })
            Logger.cron(
              `Tarea diferida del ${tomorrow6am.toLocaleString()} cancelada preventivamente.`,
            )
          }
        } else {
          // No se regó hoy, evaluar si reprogramamos para mañana
          const rainToday = await this.getRainAccumulationForDate(today)
          const avgLuxToday = await this.getTodayAverageLux(now)
          const dayClass = await classifyCurrentDay()

          const isDryAndSunny =
            rainToday.durationSeconds < 1200 &&
            avgLuxToday > 13000 &&
            dayClass.type !== 'OVERCAST' &&
            dayClass.type !== 'RAINY'

          if (isDryAndSunny) {
            Logger.cron(
              `Hoy no se regó pero el clima fue seco/soleado (Lux prom: ${avgLuxToday.toFixed(0)}). Reprogramando riego diferido para mañana a las 6:00 AM.`,
            )
            await this.createDeferredIrrigation(
              this.getNext6am(now, 1),
              'Reprogramación interdiaria: Hoy fue seco/soleado sin riego.',
            )
          } else {
            Logger.cron(
              `Hoy no se regó y el día fue nublado extremo o lluvioso. Suspendiendo reprogramación de mañana.`,
            )
          }
        }
      }

      if (updatedState === 'RAIN_SUSPENSION') {
        const rainToday = await this.getRainAccumulationForDate(today)
        const avgLuxToday = await this.getTodayAverageLux(now)
        const isSoleado = avgLuxToday > 20000 && rainToday.durationSeconds < 1200

        if (isSoleado) {
          Logger.cron(
            'Clima seco y soleado restablecido. Saliendo de RAIN_SUSPENSION. Reactivando y agendando aspersión diferida para mañana.',
          )
          await this.updateSchedulerState('STANDARD_CRON')
          await this.createDeferredIrrigation(
            this.getNext6am(now, 1),
            'Reactivación tras suspensión por lluvias: Primer día soleado.',
          )
        } else {
          Logger.cron('Clima sigue húmedo/nublado. Manteniendo RAIN_SUSPENSION.')
        }
      }
    } catch (error) {
      Logger.error('Error en la evaluación diaria de la máquina de estados:', error)
    }
  }
}
