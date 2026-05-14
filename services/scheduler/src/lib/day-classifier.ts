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
  | 'EXTREMADAMENTE_SOLEADO'
  | 'SOLEADO'
  | 'TEMPLADO'
  | 'NUBLADO'
  | 'LLUVIOSO'
  | 'DESCONOCIDO'

export interface DayClassification {
  type: DayType
  avgLuxSince8am: number
  currentLux: number
  overcastMinutes: number // Minutos consecutivos con <15k lux recientes
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

// Umbral de "nublado consecutivo" — sincronizado con InferenceEngine
const OVERCAST_LUX_THRESHOLD = 26000

/**
 * Clasifica el tipo de día actual basándose en datos de iluminancia acumulados.
 *
 * Solo funciona entre las 8:00 AM y las 4:00 PM (hora local).
 * Fuera de ese rango retorna DESCONOCIDO porque la iluminancia no es
 * representativa del estado del cielo.
 */
export async function classifyCurrentDay(): Promise<DayClassification> {
  const now = new Date()
  const currentHour = now.getHours()

  // Determinar la ventana de evaluación
  const startEval = new Date(now)

  startEval.setHours(8, 0, 0, 0)

  const endEval = new Date(now)

  if (currentHour < 16) {
    // Si es antes de las 4pm, evaluamos hasta "ahora"
    endEval.setTime(now.getTime())
  } else {
    // Si es después de las 4pm, evaluamos el bloque completo del día (8am - 4pm)
    endEval.setHours(16, 0, 0, 0)
  }

  // Si aún no son las 8am, no hay datos representativos
  if (currentHour < 8) {
    return {
      type: 'DESCONOCIDO',
      avgLuxSince8am: 0,
      currentLux: 0,
      overcastMinutes: 0,
      evaluatedAt: now,
    }
  }

  try {
    const startISO = startEval.toISOString()
    const endISO = endEval.toISOString()

    // 1. Promedio de Lux en la ventana (8am hasta ahora o hasta las 4pm)
    const avgQuery = `
      SELECT AVG(illuminance) as avg_lux
      FROM "environment_metrics"
      WHERE time >= '${startISO}' AND time <= '${endISO}'
      AND source = 'Weather_Station'
    `
    const avgStream = influxClient.query(avgQuery)
    let avgLux = 0

    for await (const row of avgStream) {
      if (row.avg_lux != null) avgLux = Number(row.avg_lux)
    }

    // 2. Lux instantáneo (el último dato de la ventana evaluada)
    const currentQuery = `
      SELECT illuminance
      FROM "environment_metrics"
      WHERE time <= '${endISO}'
      AND time >= '${startISO}'
      AND source = 'Weather_Station'
      ORDER BY time DESC
      LIMIT 1
    `
    const currentStream = influxClient.query(currentQuery)
    let currentLux = 0

    for await (const row of currentStream) {
      if (row.illuminance != null) currentLux = Number(row.illuminance)
    }

    // 3. Minutos consecutivos recientes bajo umbral de nublado (<15k)
    // Consultamos los últimos 120 min y contamos hacia atrás desde el más reciente
    const overcastQuery = `
      SELECT illuminance, time
      FROM "environment_metrics"
      WHERE time >= now() - interval '120 minutes'
      AND source = 'Weather_Station'
      ORDER BY time DESC
    `
    const overcastStream = influxClient.query(overcastQuery)
    let overcastMinutes = 0
    let lastTime: Date | null = null

    for await (const row of overcastStream) {
      const lux = Number(row.illuminance || 0)
      const rowTime = new Date(String(row.time))

      if (!lastTime) {
        // Primera iteración (el dato más reciente)
        const ageMs = now.getTime() - rowTime.getTime()

        if (lux < OVERCAST_LUX_THRESHOLD) {
          // Sumamos el tiempo desde el dato hasta "ahora", con tope de 30 min por si el nodo se desconectó
          overcastMinutes += Math.min(ageMs, 30 * 60000) / 60000
          lastTime = rowTime
        } else {
          break
        }
      } else {
        // Siguientes iteraciones (hacia atrás en el tiempo)
        const jumpMs = lastTime.getTime() - rowTime.getTime()

        // Protección contra vacíos de datos: si el salto es > 30 min (3 batches perdidos)
        if (jumpMs > 30 * 60000) {
          break
        }

        if (lux < OVERCAST_LUX_THRESHOLD) {
          overcastMinutes += jumpMs / 60000
          lastTime = rowTime
        } else {
          break
        }
      }
    }

    overcastMinutes = Math.round(overcastMinutes)

    // 4. Clasificar por promedio acumulado
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

    Logger.dayClass(
      `Tipo: ${type} | Lux promedio (8am-ahora): ${avgLux.toFixed(0)} | Lux actual: ${currentLux.toFixed(0)} | Nublado consecutivo: ${overcastMinutes} min`,
    )

    return {
      type,
      avgLuxSince8am: avgLux,
      currentLux,
      overcastMinutes,
      evaluatedAt: now,
    }
  } catch {
    Logger.dayClass('Error al clasificar el día.')

    return {
      type: 'DESCONOCIDO',
      avgLuxSince8am: 0,
      currentLux: 0,
      overcastMinutes: 0,
      evaluatedAt: now,
    }
  }
}
