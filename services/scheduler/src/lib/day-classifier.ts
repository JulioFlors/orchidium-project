import { Logger } from './logger'
import { influxClient } from './influx'

/**
 * Clasificador de Día — Calibrado con datos reales del orquideario.
 *
 * Fuente de calibración: MonitoringView.tsx climate() + observaciones de campo:
 * - < 15k lux: Luz Indirecta / Nube densa
 * - < 26k lux: Nublado (umbral operativo del cultivador)
 * - < 30k lux: Transición rápida sol/nube (no se sostiene)
 * - 30k-60k lux: Soleado (radiación directa)
 * - 60k-75k lux: Extremo (no se sostiene toda la tarde)
 * - > 75k lux: Peligro (picos < 10 min)
 *
 * Rango de evaluación: 8:00 AM — 4:00 PM (hora local).
 * Promedio de temporada seca (marzo/abril): > 40k lux.
 * Día nublado confirmado: promedio < 26k lux.
 */
export type DayType =
  'EXTREMADAMENTE_SOLEADO' | 'SOLEADO' | 'TEMPLADO' | 'NUBLADO' | 'LLUVIOSO' | 'DESCONOCIDO'

export interface DayClassification {
  type: DayType
  avgLuxSince8am: number
  currentLux: number
  overcastMinutes: number // Preservado para retrocompatibilidad (fijo en 0)
  overcastHeavyMinutes: number // Preservado para retrocompatibilidad (fijo en 0)
  evaluatedAt: Date
}

// Umbrales calibrados con observaciones de campo (marzo-abril 2026)
// TODO: Recalibrar cuando haya datos de temporada de lluvia (mayo+)
const LUX_THRESHOLDS = {
  EXTREMADAMENTE_SOLEADO: 40000, // Promedio típico de sequía → radiación sostenida
  SOLEADO: 30000, // Radiación directa confirmada por MonitoringView
  TEMPLADO: 26000, // Umbral operativo del cultivador: <26k = nublado
  NUBLADO: 15000, // Luz filtrada / nube densa (MonitoringView)
  // < 15000 = LLUVIOSO (cielo cerrado, posible lluvia)
}

/**
 * Clasifica el tipo de día actual basándose en datos de iluminancia acumulados.
 *
 * Solo funciona entre las 8:00 AM y las 4:00 PM (hora local).
 * Fuera de ese rango retorna DESCONOCIDO porque la iluminancia no es
 * representativa del estado del cielo.
 */
export async function classifyCurrentDay(
  targetDate?: Date,
  silent = false,
): Promise<DayClassification> {
  const now = targetDate ? new Date(targetDate) : new Date()
  const currentCaracasHour = targetDate ? 17 : (now.getUTCHours() - 4 + 24) % 24

  // Determinar la ventana de evaluación usando la fecha en Caracas local
  const caracasTime = new Date(now.getTime() - 4 * 60 * 60000)
  const startEval = new Date(
    Date.UTC(
      caracasTime.getUTCFullYear(),
      caracasTime.getUTCMonth(),
      caracasTime.getUTCDate(),
      12,
      0,
      0,
      0,
    ),
  ) // 8:00 AM Caracas = 12:00 PM UTC

  const endEval = new Date(now)

  if (currentCaracasHour < 16) {
    // Si es antes de las 4pm, evaluamos hasta "ahora"
    endEval.setTime(now.getTime())
  } else {
    // Si es después de las 4pm, evaluamos el bloque completo del día (8am - 4pm)
    endEval.setTime(
      Date.UTC(
        caracasTime.getUTCFullYear(),
        caracasTime.getUTCMonth(),
        caracasTime.getUTCDate(),
        20,
        0,
        0,
        0,
      ),
    ) // 4:00 PM Caracas = 8:00 PM UTC
  }

  // Si aún no son las 8am en Caracas, no hay datos representativos
  if (currentCaracasHour < 8) {
    return {
      type: 'DESCONOCIDO',
      avgLuxSince8am: 0,
      currentLux: 0,
      overcastMinutes: 0,
      overcastHeavyMinutes: 0,
      evaluatedAt: now,
    }
  }

  try {
    const startISO = startEval.toISOString()
    const endISO = endEval.toISOString()

    // 1. Promedio de Lux en la ventana (8am hasta ahora o hasta las 4pm)
    const avgQuery = `
      SELECT AVG(illuminance) as avg_lux, COUNT(illuminance) as count_lux
      FROM "environment_metrics"
      WHERE time >= '${startISO}' AND time <= '${endISO}'
        AND "zone" = 'EXTERIOR'
    `
    const avgStream = influxClient.query(avgQuery)
    let avgLux = 0
    let countLux = 0

    for await (const row of avgStream) {
      if (row.avg_lux != null) avgLux = Number(row.avg_lux)
      if (row.count_lux != null) countLux = Number(row.count_lux)
    }

    // Validación de densidad temporal en tiempo real
    const elapsedMinutes = Math.min((endEval.getTime() - startEval.getTime()) / 60000, 480)
    const minRequiredSamples = Math.max(10, Math.floor(elapsedMinutes * 0.3))

    if (countLux < minRequiredSamples) {
      if (!silent) {
        Logger.dayClass(
          `Clasificación abortada: baja densidad de muestras (${countLux} muestras registradas de ${Math.round(elapsedMinutes)} min transcurridos, requerido: ${minRequiredSamples}).`,
        )
      }

      return {
        type: 'DESCONOCIDO',
        avgLuxSince8am: 0,
        currentLux: 0,
        overcastMinutes: 0,
        overcastHeavyMinutes: 0,
        evaluatedAt: now,
      }
    }

    // 2. Lux instantáneo (el último dato de la ventana evaluada)
    const fifteenMinutesAgo = new Date(endEval.getTime() - 15 * 60 * 1000).toISOString()
    const currentQuery = `
      SELECT illuminance
      FROM "environment_metrics"
      WHERE time <= '${endISO}'
        AND time >= '${fifteenMinutesAgo}'
        AND "zone" = 'EXTERIOR'
        AND illuminance IS NOT NULL
      ORDER BY time DESC
      LIMIT 1
    `
    const currentStream = influxClient.query(currentQuery)
    let currentLux = 0

    for await (const row of currentStream) {
      if (row.illuminance != null) currentLux = Number(row.illuminance)
    }

    // 3. Clasificar por promedio acumulado
    let type: DayType

    if (avgLux >= LUX_THRESHOLDS.EXTREMADAMENTE_SOLEADO) {
      type = 'EXTREMADAMENTE_SOLEADO'
    } else if (avgLux >= LUX_THRESHOLDS.SOLEADO) {
      type = 'SOLEADO'
    } else if (avgLux >= LUX_THRESHOLDS.TEMPLADO) {
      type = 'TEMPLADO'
    } else if (avgLux >= LUX_THRESHOLDS.NUBLADO) {
      type = 'NUBLADO'
    } else {
      type = 'LLUVIOSO'
    }

    if (!silent) {
      Logger.dayClass(
        `Día: ${type} (Avg: ${avgLux.toFixed(0)} lx, Act: ${currentLux.toFixed(0)} lx)`,
      )
    }

    return {
      type,
      avgLuxSince8am: avgLux,
      currentLux,
      overcastMinutes: 0,
      overcastHeavyMinutes: 0,
      evaluatedAt: now,
    }
  } catch (error) {
    if (!silent) {
      Logger.dayClass(
        `Error al clasificar el día: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    return {
      type: 'DESCONOCIDO',
      avgLuxSince8am: 0,
      currentLux: 0,
      overcastMinutes: 0,
      overcastHeavyMinutes: 0,
      evaluatedAt: now,
    }
  }
}
