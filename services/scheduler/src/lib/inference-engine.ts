import {
  prisma,
  TaskStatus,
  AutomationSchedule,
  ZoneType,
  TaskSource,
  TaskPurpose,
} from '@package/database'

import { Logger, formatCaracasDateTime } from './logger'
import { classifyCurrentDay } from './day-classifier'
import { influxClient } from './influx'

/**
 * Umbrales Botánicos (Orquídeas Epífitas Tropicales - Cattleya).
 *
 * NOTA: Los umbrales de HR (90%, 80%) son tentativos. No se dispone
 * de datos calibrados del sensor DHT22 interior (aún no activado).
 * Se dejaron TODO: en cada regla que depende de esta calibración.
 */
/**
 * LEYENDA Y SISTEMA DE CONSTANTES DEL MOTOR DE INFERENCIA CLIMÁTICA
 *
 * Este objeto centraliza todos los parámetros operativos y biológicos calibrados
 * para el orquideario en Ciudad Guayana, Venezuela.
 */
const THRESHOLDS = {
  // ==========================================
  // 1. UMBRALES DE LLUVIA ACUMULADA (Postgres)
  // ==========================================
  /** Lluvia acumulada requerida en 24h para cancelar el riego de aspersión (segundos) */
  MIN_RAIN_DURATION_IRRIGATION_24H: 1200, // 20 min
  /** Lluvia acumulada requerida en 4h para cancelar la humectación de suelo (segundos) */
  MIN_RAIN_DURATION_SOIL_WETTING_4H: 1200, // 20 min
  /** Ventana de análisis de lluvia para el riego de aspersión (horas) */
  RAIN_LOOKBACK_IRRIGATION_HOURS: 24,
  /** Ventana de análisis de lluvia para la humectación del suelo (horas) */
  RAIN_LOOKBACK_SOIL_WETTING_HOURS: 4,
  /** Ventana de análisis de lluvia para la nebulización (horas) */
  RAIN_LOOKBACK_HUMIDIFICATION_HOURS: 8,

  // ==========================================
  // 2. REGLA DE HUMEDAD DIARIA SOSTENIDA (Lluvia Persistente)
  // ==========================================
  /** Límite de horas (bloques de 1h) saturadas hoy para activar veto general */
  VETO_DAILY_SATURATED_HOURS_LIMIT: 6,
  /** Umbral de humedad para considerar un bloque de 1h como saturado */
  HUMIDITY_SATURATION_THRESHOLD: 98.0, // >= 98%
  /** Umbral de humedad diurna promedio de 4h para veto de saturación hídrica (sin sesgo) */
  DIURNAL_SATURATION_THRESHOLD: 85.0, // >= 85%
  /** Mínimo de muestras válidas requeridas en un bloque de 1h */
  MIN_SAMPLES_PER_HOUR_BLOCK: 5,

  // ==========================================
  // 3. UMBRALES DE ILUMINANCIA Y RADIACIÓN (DayClassifier)
  // ==========================================
  /** Promedio de lux diario a partir de 8:00 AM para considerar el día templado/soleado */
  SUNNY_DAY_LUX_THRESHOLD: 26000,
  /** Umbral de nubosidad severa (posible lluvia) */
  HEAVY_OVERCAST_LUX_THRESHOLD: 10000,

  // ==========================================
  // 4. UMBRALES DINÁMICOS DE HUMEDAD RELATIVA (EMA Interior / ZONA_A)
  // ==========================================
  // --- Ventana de 3 Horas (Humedad Crítica para Humectación, Nebulización y Fitosanitarias) ---
  /** Ventana retrospectiva de análisis para el veto por humedad de 3 horas (minutos) */
  LOOKBACK_MINUTES_3H: 180,
  /** Umbral de veto de 3h en día nublado/lluvioso (microclima saturado) */
  HUMIDITY_VETO_3H_CLOUDY: 95.0,
  /** Umbral de veto de 3h en día templado/soleado (sensibilidad alta por transpiración activa) */
  HUMIDITY_VETO_3H_SUNNY: 88.0,

  // --- Ventana de 4 Horas (Humedad y Temperatura para Humectación y Fitosanitarias) ---
  /** Ventana retrospectiva de análisis para el veto por humedad de 4 horas (minutos) */
  LOOKBACK_MINUTES_4H: 240,
  /** Umbral de veto de 4h en día nublado/lluvioso */
  HUMIDITY_VETO_4H_CLOUDY: 91.0,
  /** Umbral de veto de 4h en día templado/soleado */
  HUMIDITY_VETO_4H_SUNNY: 85.0,
  /** Temperatura promedio mínima en 4h bajo la cual se pueden cancelar las tareas (evitando shock por frío y exceso hídrico) */
  TEMPERATURE_MIN_VETO_4H: 30.0, // <= 30.0°C

  // ==========================================
  // 5. VENTANAS BIOLÓGICAS Y SEGURIDAD NOCTURNA
  // ==========================================
  /** Ventana de rocío / amanecer: humedad máxima tolerada */
  MAX_HUMIDITY_DAWN: 100.0,
  /** Hora de inicio de la ventana de amanecer (local) */
  DAWN_START_HOUR: 4,
  /** Hora de fin de la ventana de amanecer (local) */
  DAWN_END_HOUR: 7,
  /** Ventana retrospectiva para veto de respaldo nocturno (minutos) */
  BACKUP_NOCTURNAL_LOOKBACK_MIN: 180, // 3h
  /** Umbral de humedad exterior promedio nocturna para veto de respaldo (redundancia física de lluvia) */
  BACKUP_NOCTURNAL_HR_THRESHOLD: 98.0,

  // ==========================================
  // 6. CONTROL OPERATIVO DE ACTUADORES
  // ==========================================
  /** Duración máxima de la nebulización para evitar goteo sobre las hojas (minutos) */
  MAX_NEBULIZATION_DURATION_MINUTES: 3,
  /** Duración estándar de riego de aspersión matutino (minutos) */
  IRRIGATION_DURATION_MINUTES: 15,
  /** Umbral de humedad provisional para misting en nebulización de las 4PM */
  MISTING_HUMIDITY_PROVISIONAL_THRESHOLD: 80.0,
  /** Temperatura mínima interior provisional para misting de las 4PM */
  MISTING_TEMPERATURE_PROVISIONAL_MIN: 28.0, // < 28°C no se nebuliza

  // ==========================================
  // 7. PROTECCIÓN DE AGROQUÍMICOS (Fumigación y Fertilización)
  // ==========================================
  /** Probabilidad de lluvia en pronóstico (consenso APIs) para veto estricto */
  FORECAST_PRECIPITATION_PROBABILITY_LIMIT: 0.95,
  /** Lluvia acumulada reciente en 4h que veta agroquímicos (segundos) */
  AGROCHEMICAL_RAIN_LOOKBACK_LIMIT_4H: 14400, // 4 horas en segundos
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

      const purpose = schedule.purpose

      // ── 1.B: Veto Riego Interdiario (solo IRRIGATION) ──
      if (purpose === 'IRRIGATION') {
        const yesterday = new Date(now)

        yesterday.setDate(yesterday.getDate() - 1)
        const regadoAyer = await this.checkRiegoCompleto(yesterday)

        if (regadoAyer) {
          const startYesterday = new Date(yesterday)

          startYesterday.setHours(0, 0, 0, 0)
          const endYesterday = new Date(yesterday)

          endYesterday.setHours(23, 59, 59, 999)

          const yesterdayAsp = await prisma.taskLog.aggregate({
            where: {
              purpose: TaskPurpose.IRRIGATION,
              status: TaskStatus.COMPLETED,
              scheduledAt: { gte: startYesterday, lte: endYesterday },
            },
            _sum: { duration: true },
          })
          const aspMins = yesterdayAsp._sum.duration ?? 0

          const rainEventsYesterday = await prisma.rainEvent.findMany({
            where: {
              zone: 'EXTERIOR',
              startedAt: { gte: startYesterday, lte: endYesterday },
            },
            select: { isInfered: true, durationSeconds: true },
          })
          const totalRainSec = rainEventsYesterday.reduce(
            (acc, curr) => acc + (curr.durationSeconds ?? 0),
            0,
          )
          const rainMins = Math.round(totalRainSec / 60)

          let vetoReason = ''

          if (rainMins >= 20) {
            const hasInfered = rainEventsYesterday.some((e) => e.isInfered)

            vetoReason = `Motor de inferencia.\nRiego interdiario estricto.\nAyer se registró un evento de Lluvia${hasInfered ? ' inferida' : ''}.`
          } else if (aspMins >= 15) {
            vetoReason = `Motor de inferencia.\nRiego interdiario estricto.\nAyer se completó riego por aspersión.`
          } else {
            vetoReason = `Motor de inferencia.\nRiego interdiario estricto.\nAyer se registró un riego completo.`
          }

          return {
            shouldCancel: true,
            reason: vetoReason,
            action: 'SKIP',
            metadata: { regadoAyer },
          }
        }
      }

      // ── 2. Obtener Telemetría Real + Clasificación del Día ──
      const localConditions = await this.getLatestLocalConditions()
      const dayClass = await classifyCurrentDay()

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

      // ── 3. HARD BLOCK: Lluvia Real / Inferida en Curso (Evento Activo en Postgres) ──
      const openRainEvent = await prisma.rainEvent.findFirst({
        where: { zone: 'EXTERIOR', endedAt: null },
      })
      const currentlyRaining = !!openRainEvent

      Logger.inference(`Evaluando: ${schedule.name} (${purpose})`)
      Logger.inference(
        `HR: ${interiorHum.toFixed(0)}% | Temp: ${interiorTemp.toFixed(1)}°C | Día: ${dayClass.type}`,
      )
      Logger.inference(
        `Datos: ${dataUsed} | Lluvia en curso (DB): ${currentlyRaining ? 'SÍ' : 'NO'}`,
      )

      if (currentlyRaining) {
        const rainNotes = openRainEvent?.isInfered
          ? 'Evento de lluvia inferida en curso.'
          : 'Evento de lluvia en curso.'

        return {
          shouldCancel: true,
          reason: rainNotes,
          action: 'SKIP',
          metadata: { openRainEventId: openRainEvent?.id },
        }
      }

      // ── 3.A: Umbrales Dinámicos según Radiación Solar (Lux promedio desde 8:00 AM) ──
      const isSunnyOrTemperate = dayClass.avgLuxSince8am >= THRESHOLDS.SUNNY_DAY_LUX_THRESHOLD
      const THRESHOLD_3H = isSunnyOrTemperate
        ? THRESHOLDS.HUMIDITY_VETO_3H_SUNNY
        : THRESHOLDS.HUMIDITY_VETO_3H_CLOUDY
      const THRESHOLD_4H = isSunnyOrTemperate
        ? THRESHOLDS.HUMIDITY_VETO_4H_SUNNY
        : THRESHOLDS.HUMIDITY_VETO_4H_CLOUDY

      // ── 3.B: Veto por Saturación Hídrica (Promedio >= 85.0% en las últimas 4h) ──
      if (
        purpose === 'HUMIDIFICATION' ||
        purpose === 'SOIL_WETTING' ||
        purpose === 'FUMIGATION' ||
        purpose === 'FERTIGATION'
      ) {
        const satResult = await this.checkSaturacionHidrica(now, 4)

        if (satResult.isSaturated) {
          const sensorText = satResult.dataUsed === 'INT' ? 'Interior' : 'Exterior'
          const realHum =
            satResult.avgHum != null
              ? Math.round(satResult.avgHum)
              : THRESHOLDS.DIURNAL_SATURATION_THRESHOLD

          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nEstacion Meteorologica ${sensorText}.\nSaturación hídrica.\n4h promedio HR ${realHum}% ≥ ${THRESHOLDS.DIURNAL_SATURATION_THRESHOLD}%`,
            action: 'SKIP',
            metadata: {
              windowHours: 4,
              threshold: THRESHOLDS.DIURNAL_SATURATION_THRESHOLD,
              avgHum: satResult.avgHum,
              dataUsed: satResult.dataUsed,
            },
          }
        }
      }

      // ── 3.1: Veto Autoridad Principal — Criterio del Día Anterior (solo IRRIGATION) ──
      const localHour = (now.getUTCHours() - 4 + 24) % 24

      if (purpose === 'IRRIGATION' && localHour < 7) {
        const yesterdayRain = await this.getYesterdayRainAccumulation(now)
        const yesterdayLux = await this.getYesterdayAverageLux(now)

        const criterioA1 =
          yesterdayRain.durationSeconds >= THRESHOLDS.MIN_RAIN_DURATION_IRRIGATION_24H &&
          yesterdayLux < THRESHOLDS.SUNNY_DAY_LUX_THRESHOLD

        if (criterioA1) {
          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nVeto autoridad (dia anterior).\nLluvia ayer: ${Math.round(yesterdayRain.durationSeconds / 60)} min | Lux prom: ${formatLux(yesterdayLux)} < ${formatLux(THRESHOLDS.SUNNY_DAY_LUX_THRESHOLD)}`,
            action: 'SKIP',
            metadata: { yesterdayRain, yesterdayLux },
          }
        }
      }

      // ── 3.2: Veto Respaldo Nocturno — HR exterior promedio >= 98.0% (segmentos de 1h en las últimas 6 horas) (solo IRRIGATION) ──
      if (purpose === 'IRRIGATION') {
        const checkNocturnalBackup = true

        if (checkNocturnalBackup) {
          const saturatedBlocks = await this.getNocturnalSaturatedBlocks(6)

          if (saturatedBlocks >= 6) {
            return {
              shouldCancel: true,
              reason: `Motor de inferencia.\nEstacion Meteorologica Exterior.\nVeto respaldo nocturno (6h).\n6h continuas con HR prom ≥ ${THRESHOLDS.HUMIDITY_SATURATION_THRESHOLD}%`,
              action: 'SKIP',
              metadata: { saturatedBlocks },
            }
          }
        }
      }

      // ── 3.3: Veto Humedad Crítica Interior (3h) — (solo HUMIDIFICATION) ──
      if (purpose === 'HUMIDIFICATION') {
        const avgIntHum = await this.getInteriorRecentAverageHumidity(
          THRESHOLDS.LOOKBACK_MINUTES_3H,
        )

        if (avgIntHum >= THRESHOLD_3H) {
          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nEstacion Meteorologica Interior.\nVeto humedad interior (3h).\nPromedio 3h ZONA_A ${avgIntHum.toFixed(1)}% ≥ ${THRESHOLD_3H}%`,
            action: 'SKIP',
            metadata: { avgIntHum, threshold3h: THRESHOLD_3H },
          }
        }
      }

      // ── 3.4: Veto Acumulado de 4h (Humedad/Temperatura) — (solo SOIL_WETTING y FUMIGATION) ──
      if (purpose === 'SOIL_WETTING' || purpose === 'FUMIGATION' || purpose === 'FERTIGATION') {
        const lookbackMin = THRESHOLDS.LOOKBACK_MINUTES_4H

        let humData = await this.getRecentAverageHumidity(lookbackMin, 'ZONA_A')
        let tempData = await this.getRecentAverageTemperature(lookbackMin, 'ZONA_A')
        let dataUsed = 'INT'

        if (humData.count < 25 || tempData.count < 25) {
          humData = await this.getRecentAverageHumidity(lookbackMin, 'EXTERIOR')
          tempData = await this.getRecentAverageTemperature(lookbackMin, 'EXTERIOR')
          dataUsed = 'EXT'
        }

        const avgHum = humData.average
        const avgTemp = tempData.average

        Logger.inference(`Regla 4h para ${purpose} [${dataUsed}]:`)
        Logger.inference(`HR Prom: ${avgHum.toFixed(1)}% | Temp Prom: ${avgTemp.toFixed(1)}°C`)

        if (avgHum >= THRESHOLD_4H) {
          const sensorText = dataUsed === 'INT' ? 'Interior' : 'Exterior'

          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nEstacion Meteorologica ${sensorText}.\nSaturación hídrica.\n4h promedio HR ${Math.round(avgHum)}% ≥ ${THRESHOLD_4H}%`,
            action: 'SKIP',
            metadata: { avgHum, threshold4h: THRESHOLD_4H, dataUsed },
          }
        }

        if (avgTemp <= THRESHOLDS.TEMPERATURE_MIN_VETO_4H && avgHum >= 80.0) {
          const sensorText = dataUsed === 'INT' ? 'Interior' : 'Exterior'

          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nEstacion Meteorologica ${sensorText}.\nTemp promedio ${avgTemp.toFixed(1)}°C ≤ ${THRESHOLDS.TEMPERATURE_MIN_VETO_4H}°C\nHR promedio ${avgHum.toFixed(1)}% ≥ 80.0%`,
            action: 'SKIP',
            metadata: {
              avgTemp,
              thresholdTemp: THRESHOLDS.TEMPERATURE_MIN_VETO_4H,
              avgHum,
              humidityCoupledThreshold: 80.0,
              dataUsed,
            },
          }
        }
      }

      // ── 4. Lluvia Acumulada → IRRIGATION (lookback 24h) ──
      if (purpose === 'IRRIGATION') {
        const recentRain = await this.getRecentRainAccumulation(
          THRESHOLDS.RAIN_LOOKBACK_IRRIGATION_HOURS,
        )

        if (recentRain.durationSeconds >= THRESHOLDS.MIN_RAIN_DURATION_IRRIGATION_24H) {
          return {
            shouldCancel: true,
            reason: `Lluvia acumulada: ${Math.round(recentRain.durationSeconds / 60)} min en las últimas ${THRESHOLDS.RAIN_LOOKBACK_IRRIGATION_HOURS}h.`,
            action: 'SKIP',
            metadata: { recentRain },
          }
        }
      }

      // ── 4.1 Lluvia Acumulada → SOIL_WETTING (lookback 4h) ──
      if (purpose === 'SOIL_WETTING') {
        const recentRain = await this.getRecentRainAccumulation(
          THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING_HOURS,
        )

        if (recentRain.durationSeconds >= 1200) {
          const startLookback = new Date(
            now.getTime() - THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING_HOURS * 60 * 60 * 1000,
          )
          const lastEvent = await prisma.rainEvent.findFirst({
            where: {
              zone: 'EXTERIOR',
              startedAt: { gte: startLookback },
            },
            orderBy: { startedAt: 'desc' },
          })

          let timeText = `${THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING_HOURS}h`

          if (lastEvent) {
            const diffMin = Math.round((now.getTime() - lastEvent.startedAt.getTime()) / 60000)

            if (diffMin < 60) {
              timeText = `${diffMin} min`
            } else {
              const hrs = Math.floor(diffMin / 60)
              const mins = diffMin % 60

              timeText = mins === 0 ? `${hrs}h` : `${hrs}h ${mins}min`
            }
          }
          const label = lastEvent?.isInfered ? 'Lluvia inferida' : 'Lluvia'

          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nEvento de ${label} registrado hace ${timeText}`,
            action: 'SKIP',
            metadata: { recentRain, lastEvent },
          }
        }
      }

      // ── 4.2 Lluvia Acumulada → HUMIDIFICATION (lookback 8h) ──
      if (purpose === 'HUMIDIFICATION') {
        const recentRain = await this.getRecentRainAccumulation(
          THRESHOLDS.RAIN_LOOKBACK_HUMIDIFICATION_HOURS,
        )

        if (recentRain.durationSeconds >= 1200) {
          const startLookback = new Date(
            now.getTime() - THRESHOLDS.RAIN_LOOKBACK_HUMIDIFICATION_HOURS * 60 * 60 * 1000,
          )
          const lastEvent = await prisma.rainEvent.findFirst({
            where: {
              zone: 'EXTERIOR',
              startedAt: { gte: startLookback },
            },
            orderBy: { startedAt: 'desc' },
          })

          let timeText = `${THRESHOLDS.RAIN_LOOKBACK_HUMIDIFICATION_HOURS}h`

          if (lastEvent) {
            const diffMin = Math.round((now.getTime() - lastEvent.startedAt.getTime()) / 60000)

            if (diffMin < 60) {
              timeText = `${diffMin} min`
            } else {
              const hrs = Math.floor(diffMin / 60)
              const mins = diffMin % 60

              timeText = mins === 0 ? `${hrs}h` : `${hrs}h ${mins}min`
            }
          }
          const label = lastEvent?.isInfered ? 'Lluvia inferida' : 'Lluvia'

          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nEvento de ${label} registrado hace ${timeText}`,
            action: 'SKIP',
            metadata: { recentRain, lastEvent },
          }
        }
      }

      // ── 6. Pulverización innecesaria (día fresco/nublado + HR alta) ──
      if (
        purpose === 'HUMIDIFICATION' &&
        interiorHum > THRESHOLDS.MISTING_HUMIDITY_PROVISIONAL_THRESHOLD &&
        interiorTemp < THRESHOLDS.MISTING_TEMPERATURE_PROVISIONAL_MIN &&
        dayClass.avgLuxSince8am < THRESHOLDS.SUNNY_DAY_LUX_THRESHOLD &&
        dayClass.type !== 'DESCONOCIDO'
      ) {
        return {
          shouldCancel: true,
          reason: `Motor de inferencia.\nEstacion Meteorologica Interior.\nAmbiente fresco.\nHR: ${interiorHum.toFixed(0)}% | Temp: ${interiorTemp.toFixed(1)}°C | Lux: ${formatLux(dayClass.avgLuxSince8am)}`,
          action: 'SKIP',
          metadata: { localConditions, dayClass },
        }
      }

      // ── 7. Evaluación de pulverización diaria (4PM) ──
      if (
        purpose === 'HUMIDIFICATION' &&
        dayClass.type !== 'DESCONOCIDO' &&
        dayClass.avgLuxSince8am <= THRESHOLDS.SUNNY_DAY_LUX_THRESHOLD
      ) {
        return {
          shouldCancel: true,
          reason: `Motor de inferencia.\nEstacion Meteorologica Exterior.\nDia ${dayClass.type}.\nLux prom 8am-ahora: ${formatLux(dayClass.avgLuxSince8am)} ≤ ${formatLux(THRESHOLDS.SUNNY_DAY_LUX_THRESHOLD)}`,
          action: 'SKIP',
          metadata: { dayClass },
        }
      }

      // ── 8. Protección de Fertilización/Fumigación contra Tormentas (Veto Estricto) ──
      if (purpose === 'FERTIGATION' || purpose === 'FUMIGATION') {
        const forecast = await this.getForecastConsensus()
        const recentRain4h = await this.getRecentRainAccumulation(
          THRESHOLDS.RAIN_LOOKBACK_SOIL_WETTING_HOURS,
        )

        const conditionA =
          localConditions.exterior.rain_intensity > 0 || recentRain4h.durationSeconds > 0

        const conditionB =
          dayClass.avgLuxSince8am < THRESHOLDS.SUNNY_DAY_LUX_THRESHOLD &&
          dayClass.type !== 'DESCONOCIDO' &&
          interiorHum > THRESHOLDS.HUMIDITY_VETO_3H_CLOUDY

        const conditionC =
          forecast.consensusPrecipProb > THRESHOLDS.FORECAST_PRECIPITATION_PROBABILITY_LIMIT

        if ((conditionA || conditionB) && conditionC) {
          const detailStr = conditionA ? 'Lluvia actual/reciente' : 'Día muy nublado + HR crítica'
          const limitPercent = (THRESHOLDS.FORECAST_PRECIPITATION_PROBABILITY_LIMIT * 100).toFixed(
            0,
          )

          return {
            shouldCancel: true,
            reason: `Motor de inferencia.\nVeto ambiental.\n${detailStr}.\nPronóstico > ${limitPercent}%`,
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

  /**
   * Consulta el promedio de humedad en un intervalo de tiempo específico (start a end) para una zona dada.
   * Fuente: InfluxDB.
   */
  private static async getAverageHumidityInWindow(
    start: Date,
    end: Date,
    zone: 'ZONA_A' | 'EXTERIOR',
  ): Promise<{ average: number; count: number }> {
    try {
      const query = `
        SELECT humidity
        FROM "environment_metrics"
        WHERE time >= '${start.toISOString()}' AND time <= '${end.toISOString()}'
          AND source = 'Weather_Station'
          AND zone = '${zone}'
          AND humidity IS NOT NULL
          AND humidity >= 5.0 AND humidity <= 100.0
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

      return {
        average: count > 0 ? sum / count : 0,
        count,
      }
    } catch {
      Logger.inference(
        `Error al consultar HR promedio para ${zone} en ventana ${start.toISOString()} - ${end.toISOString()}.`,
      )

      return { average: 0, count: 0 }
    }
  }

  private static async checkSaturacionHidrica(
    now: Date,
    windowHours = 4,
  ): Promise<{ isSaturated: boolean; avgHum?: number; dataUsed?: 'INT' | 'EXT' }> {
    try {
      const end = new Date(now)
      const start = new Date(now.getTime() - windowHours * 60 * 60 * 1000)

      const intRes = await this.getAverageHumidityInWindow(start, end, 'ZONA_A')
      const extRes = await this.getAverageHumidityInWindow(start, end, 'EXTERIOR')

      const hasDataInt = intRes.count > 0
      const hasDataExt = extRes.count > 0

      if (!hasDataInt && !hasDataExt) return { isSaturated: false }

      const intAvg = hasDataInt ? intRes.average : 0
      const extAvg = hasDataExt ? extRes.average : 0

      // Si cualquiera de los dos promedios (interior o exterior) es >= DIURNAL_SATURATION_THRESHOLD, se considera saturado
      const isIntSaturated = hasDataInt && intAvg >= THRESHOLDS.DIURNAL_SATURATION_THRESHOLD
      const isExtSaturated = hasDataExt && extAvg >= THRESHOLDS.DIURNAL_SATURATION_THRESHOLD

      if (isIntSaturated) {
        return { isSaturated: true, avgHum: intAvg, dataUsed: 'INT' }
      }
      if (isExtSaturated) {
        return { isSaturated: true, avgHum: extAvg, dataUsed: 'EXT' }
      }

      return { isSaturated: false }
    } catch (err) {
      Logger.error('Error al evaluar la saturación hídrica:', err)

      return { isSaturated: false }
    }
  }

  /**
   * Divide las últimas N horas retrospectivas en bloques de 1 hora.
   * Cuenta cuántos de estos bloques tuvieron humedad exterior promedio >= 98.0%.
   * Usado para el veto de respaldo nocturno de 6h.
   */
  private static async getNocturnalSaturatedBlocks(lookbackHours: number = 6): Promise<number> {
    try {
      const now = new Date()
      const blocks: { start: Date; end: Date }[] = []

      for (let i = 0; i < lookbackHours; i++) {
        const blockStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000)
        const blockEnd = new Date(now.getTime() - i * 60 * 60 * 1000)

        blocks.push({
          start: blockStart,
          end: blockEnd,
        })
      }

      const promises = blocks.map(async (block) => {
        const extRes = await this.getAverageHumidityInWindow(block.start, block.end, 'EXTERIOR')

        return (
          extRes.count >= THRESHOLDS.MIN_SAMPLES_PER_HOUR_BLOCK &&
          extRes.average >= THRESHOLDS.HUMIDITY_SATURATION_THRESHOLD
        )
      })

      const results = await Promise.all(promises)
      const saturatedCount = results.filter(Boolean).length

      Logger.inference(
        `Humedad Nocturna Sostenida: ${saturatedCount} bloques de 1h saturados (>=${THRESHOLDS.HUMIDITY_SATURATION_THRESHOLD}%) en las últimas ${lookbackHours}h.`,
      )

      return saturatedCount
    } catch (err) {
      Logger.error('Error al calcular los bloques de humedad nocturna sostenida:', err)

      return 0
    }
  }

  private static async getRecentAverageHumidity(
    lookbackMinutes: number,
    zone: 'ZONA_A' | 'EXTERIOR',
  ): Promise<{ average: number; count: number }> {
    try {
      const query = `
        SELECT humidity
        FROM "environment_metrics"
        WHERE time >= now() - INTERVAL '${lookbackMinutes} minutes'
          AND source = 'Weather_Station'
          AND zone = '${zone}'
          AND humidity IS NOT NULL
          AND humidity >= 5.0 AND humidity <= 100.0
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

      return {
        average: count > 0 ? sum / count : 0,
        count,
      }
    } catch {
      Logger.inference(`Error al consultar HR promedio para ${zone}.`)

      return { average: 0, count: 0 }
    }
  }

  private static async getRecentAverageTemperature(
    lookbackMinutes: number,
    zone: 'ZONA_A' | 'EXTERIOR',
  ): Promise<{ average: number; count: number }> {
    try {
      const query = `
        SELECT temperature
        FROM "environment_metrics"
        WHERE time >= now() - INTERVAL '${lookbackMinutes} minutes'
          AND source = 'Weather_Station'
          AND zone = '${zone}'
          AND temperature IS NOT NULL
          AND temperature >= 0.0 AND temperature <= 60.0
        ORDER BY time DESC
      `
      const stream = influxClient.query(query)
      let sum = 0
      let count = 0

      for await (const row of stream) {
        if (row.temperature != null) {
          sum += Number(row.temperature)
          count++
        }
      }

      return {
        average: count > 0 ? sum / count : 0,
        count,
      }
    } catch {
      Logger.inference(`Error al consultar temperatura promedio para ${zone}.`)

      return { average: 0, count: 0 }
    }
  }

  private static async getInteriorRecentAverageHumidity(lookbackMinutes: number): Promise<number> {
    const res = await this.getRecentAverageHumidity(lookbackMinutes, 'ZONA_A')

    if (res.count < 25) {
      Logger.inference(
        `Humedad interior reciente ignorada por baja densidad de datos (${res.count} muestras < 25 en los últimos ${lookbackMinutes} min).`,
      )

      return 0
    }

    return res.average
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
    // Para evitar desfases por UTC/LocalTime, construimos la fecha basándonos en los componentes de Caracas (UTC-4)
    // 6:00 AM de Caracas equivale a las 10:00 AM UTC.
    const target = new Date(from.getTime())

    target.setDate(target.getDate() + daysAhead)
    target.setUTCHours(10, 0, 0, 0)

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
          `Ya existe tarea de aspersión diferida para ${formatCaracasDateTime(scheduledAt)}. No se crea duplicado.`,
        )

        return
      }

      const cleanReason = reason.replace('[ DAILY RULES ] ', '')

      const newTask = await prisma.taskLog.create({
        data: {
          scheduledAt,
          status: TaskStatus.PENDING,
          source: TaskSource.INFERENCE,
          purpose: TaskPurpose.IRRIGATION,
          zones: [ZoneType.ZONA_A],
          duration: 15,
          notes: cleanReason,
        },
      })

      await prisma.taskEventLog.create({
        data: {
          taskId: newTask.id,
          status: TaskStatus.PENDING,
          notes: cleanReason,
        },
      })

      Logger.inference(
        `Tarea de aspersión diferida creada para ${formatCaracasDateTime(scheduledAt)}.`,
      )
    } catch (err) {
      Logger.error('Error creando aspersión diferida:', err)
    }
  }

  public static async evaluateDailyRules(): Promise<void> {
    try {
      const now = new Date()
      const state = await this.getOrInitSchedulerState()

      // A las 12:05 AM, evaluamos el día que acaba de terminar (ayer)
      const evalDate = new Date(now)

      evalDate.setDate(evalDate.getDate() - 1)

      const prevEvalDate = new Date(now)

      prevEvalDate.setDate(prevEvalDate.getDate() - 2)

      const targetDate = new Date(now) // Hoy (el día que está iniciando, el riego es a las 6:00 AM)

      const regadoEvalDate = await this.checkRiegoCompleto(evalDate)

      // ---- 1. Transición y Lógica de Estados ----
      if (state === 'STANDARD_CRON') {
        const startPrevEval = new Date(prevEvalDate)

        startPrevEval.setHours(0, 0, 0, 0)
        const endEval = new Date(evalDate)

        endEval.setHours(23, 59, 59, 999)

        // Si se canceló alguna aspersión por clima/lluvia ayer o anteayer, cambiamos de estado
        const cancelledTasks = await prisma.taskLog.findFirst({
          where: {
            purpose: TaskPurpose.IRRIGATION,
            status: TaskStatus.CANCELLED,
            scheduledAt: { gte: startPrevEval, lte: endEval },
            notes: { contains: 'VETO' },
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
        const rainEval = await this.getRainAccumulationForDate(evalDate)
        const rainPrevEval = await this.getRainAccumulationForDate(prevEvalDate)

        if (
          rainEval.durationSeconds >= THRESHOLDS.MIN_RAIN_DURATION_IRRIGATION_24H &&
          rainPrevEval.durationSeconds >= THRESHOLDS.MIN_RAIN_DURATION_IRRIGATION_24H
        ) {
          Logger.cron(
            `Lluvia >= ${Math.round(THRESHOLDS.MIN_RAIN_DURATION_IRRIGATION_24H / 60)} min registrada por 2 días consecutivos. Activando RAIN_SUSPENSION.`,
          )
          await this.updateSchedulerState('RAIN_SUSPENSION')

          return
        }

        // Reset por Riego Doble: ayer y anteayer aspersión completada >= IRRIGATION_DURATION_MINUTES min en cada día
        const startEval = new Date(evalDate)

        startEval.setHours(0, 0, 0, 0)
        const endEval = new Date(evalDate)

        endEval.setHours(23, 59, 59, 999)

        const startPrevEval = new Date(prevEvalDate)

        startPrevEval.setHours(0, 0, 0, 0)
        const endPrevEval = new Date(prevEvalDate)

        endPrevEval.setHours(23, 59, 59, 999)

        const aspEval = await prisma.taskLog.aggregate({
          where: {
            purpose: TaskPurpose.IRRIGATION,
            status: TaskStatus.COMPLETED,
            scheduledAt: { gte: startEval, lte: endEval },
          },
          _sum: { duration: true },
        })
        const aspPrevEval = await prisma.taskLog.aggregate({
          where: {
            purpose: TaskPurpose.IRRIGATION,
            status: TaskStatus.COMPLETED,
            scheduledAt: { gte: startPrevEval, lte: endPrevEval },
          },
          _sum: { duration: true },
        })

        if (
          (aspEval._sum.duration ?? 0) >= THRESHOLDS.IRRIGATION_DURATION_MINUTES &&
          (aspPrevEval._sum.duration ?? 0) >= THRESHOLDS.IRRIGATION_DURATION_MINUTES
        ) {
          Logger.cron(
            'Intervención manual de riego doble detectada (2 días seguidos de aspersión). Reseteando a STANDARD_CRON.',
          )
          await this.updateSchedulerState('STANDARD_CRON')

          return
        }

        // Reglas de alternancia
        if (regadoEvalDate) {
          Logger.cron(
            'Ayer hubo riego completo. Cancelando preventivamente riego diferido de hoy para mantener alternancia.',
          )
          const target6am = this.getNext6am(targetDate, 0) // Hoy a las 6:00 AM
          const startOfSlot = new Date(target6am.getTime() - 30 * 60000)
          const endOfSlot = new Date(target6am.getTime() + 30 * 60000)

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
                  '[ MÁQUINA ESTADOS ] Cancelado preventivamente: Riego completo detectado ayer.',
              },
            })
            Logger.cron(
              `Tarea diferida del ${formatCaracasDateTime(target6am)} cancelada preventivamente.`,
            )
          }
        } else {
          // No se regó ayer, evaluar si reprogramamos para hoy
          const rainEval = await this.getRainAccumulationForDate(evalDate)
          const avgLuxEval = await this.getTodayAverageLux(evalDate)
          const dayClassEval = await classifyCurrentDay(evalDate)

          const isDryAndSunny =
            rainEval.eventCount === 0 &&
            avgLuxEval > 13000 &&
            dayClassEval.type !== 'NUBLADO' &&
            dayClassEval.type !== 'LLUVIOSO'

          if (isDryAndSunny) {
            Logger.cron(
              `Ayer no se regó pero el clima fue seco/soleado (Lux prom: ${avgLuxEval.toFixed(0)}). Reprogramando riego diferido para hoy a las 6:00 AM.`,
            )
            await this.createDeferredIrrigation(
              this.getNext6am(targetDate, 0),
              'Motor de inferencia.\nRiego interdiario.',
            )
          } else {
            Logger.cron(
              `Ayer no se regó y el día fue nublado extremo o lluvioso. Suspendiendo reprogramación de hoy.`,
            )
          }
        }
      }

      if (updatedState === 'RAIN_SUSPENSION') {
        const rainEval = await this.getRainAccumulationForDate(evalDate)
        const avgLuxEval = await this.getTodayAverageLux(evalDate)
        const isSoleado =
          avgLuxEval > 20000 &&
          rainEval.durationSeconds < THRESHOLDS.MIN_RAIN_DURATION_IRRIGATION_24H

        if (isSoleado) {
          Logger.cron(
            'Clima seco y soleado restablecido ayer. Saliendo de RAIN_SUSPENSION. Reactivando y agendando aspersión diferida para hoy.',
          )
          await this.updateSchedulerState('STANDARD_CRON')
          await this.createDeferredIrrigation(
            this.getNext6am(targetDate, 0),
            'Motor de inferencia.\nRiego interdiario.',
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
