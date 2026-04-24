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
export type DayType = 'EXTREMELY_SUNNY' | 'SUNNY' | 'TEMPERATE' | 'OVERCAST' | 'RAINY' | 'UNKNOWN'

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
  EXTREMELY_SUNNY: 40000, // Promedio típico de sequía → radiación sostenida
  SUNNY: 30000, // Radiación directa confirmada por MonitoringView
  TEMPERATE: 26000, // Umbral operativo del cultivador: <26k = nublado
  OVERCAST: 15000, // Luz filtrada / nube densa (MonitoringView)
  // < 15000 = RAINY (cielo cerrado, posible lluvia)
}

// TODO: Umbral de "nublado consecutivo" — ajustar con datos reales
const OVERCAST_LUX_THRESHOLD = 15000

/**
 * Clasifica el tipo de día actual basándose en datos de iluminancia acumulados.
 *
 * Solo funciona entre las 8:00 AM y las 4:00 PM (hora local).
 * Fuera de ese rango retorna UNKNOWN porque la iluminancia no es
 * representativa del estado del cielo.
 */
export async function classifyCurrentDay(): Promise<DayClassification> {
  const now = new Date()
  const currentHour = now.getHours()

  // Fuera de horario evaluable → UNKNOWN
  // No se puede clasificar el cielo por lux antes de las 8am ni después de las 4pm
  if (currentHour < 8 || currentHour >= 16) {
    return {
      type: 'UNKNOWN',
      avgLuxSince8am: 0,
      currentLux: 0,
      overcastMinutes: 0,
      evaluatedAt: now,
    }
  }

  try {
    // 1. Promedio de Lux desde las 8am hasta ahora (zona EXTERIOR)
    const today8am = new Date(now)

    today8am.setHours(8, 0, 0, 0)
    const since8amISO = today8am.toISOString()

    const avgQuery = `
      SELECT AVG(illuminance) as avg_lux
      FROM "environment_metrics"
      WHERE time >= '${since8amISO}'
      AND source = 'Weather_Station'
    `
    const avgStream = influxClient.query(avgQuery)
    let avgLux = 0

    for await (const row of avgStream) {
      if (row.avg_lux != null) avgLux = Number(row.avg_lux)
    }

    // 2. Lux actual instantáneo (último 5 min)
    const currentQuery = `
      SELECT illuminance
      FROM "environment_metrics"
      WHERE time >= now() - interval '5 minutes'
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
    let stillOvercast = true

    for await (const row of overcastStream) {
      if (!stillOvercast) break

      const lux = Number(row.illuminance || 0)

      if (lux < OVERCAST_LUX_THRESHOLD) {
        const rowTime = new Date(String(row.time))

        if (lastTime) {
          const diffMs = lastTime.getTime() - rowTime.getTime()

          overcastMinutes += diffMs / 60000
        }

        lastTime = rowTime
      } else {
        stillOvercast = false
      }
    }

    overcastMinutes = Math.round(overcastMinutes)

    // 4. Clasificar por promedio acumulado
    let type: DayType

    if (avgLux >= LUX_THRESHOLDS.EXTREMELY_SUNNY) {
      type = 'EXTREMELY_SUNNY'
    } else if (avgLux >= LUX_THRESHOLDS.SUNNY) {
      type = 'SUNNY'
    } else if (avgLux >= LUX_THRESHOLDS.TEMPERATE) {
      type = 'TEMPERATE'
    } else if (avgLux >= LUX_THRESHOLDS.OVERCAST) {
      type = 'OVERCAST'
    } else {
      type = 'RAINY'
    }

    Logger.info(
      `[ DAY CLASSIFIER ] Tipo: ${type} | Lux promedio (8am-ahora): ${avgLux.toFixed(0)} | Lux actual: ${currentLux.toFixed(0)} | Nublado consecutivo: ${overcastMinutes} min`,
    )

    return {
      type,
      avgLuxSince8am: avgLux,
      currentLux,
      overcastMinutes,
      evaluatedAt: now,
    }
  } catch (error) {
    Logger.warn('[ DAY CLASSIFIER ] Error al clasificar el día:', error)

    return {
      type: 'UNKNOWN',
      avgLuxSince8am: 0,
      currentLux: 0,
      overcastMinutes: 0,
      evaluatedAt: now,
    }
  }
}
