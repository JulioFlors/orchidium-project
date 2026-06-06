import { Logger } from './logger'
import { influxClient } from './influx'

/**
 * Convierte timestamps crudos de InfluxDB (nanosegundos o milisegundos) a Date válido.
 * InfluxDB puede retornar timestamps como BigInt en nanosegundos (19+ dígitos)
 * o como milisegundos (13 dígitos). Esta función normaliza ambos formatos.
 */
function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

/**
 * Verifica si una fecha (hora local) cae estrictamente dentro del rango botánico:
 * de 8:00:00 AM a 4:00:59 PM (inclusive en ambos extremos).
 *
 * Utilizada para filtrar lecturas de lux que quedan fuera de la ventana de luz
 * solar representativa del día botánico y que podrían acumular minutos erróneos
 * de nubosidad durante el amanecer, anochecer o la madrugada.
 */
function isWithinBotanicalHours(date: Date): boolean {
  const localHour = (date.getUTCHours() - 4 + 24) % 24
  const min = date.getUTCMinutes()
  const sec = date.getUTCSeconds()

  const secondsSinceMidnight = localHour * 3600 + min * 60 + sec
  const startSec = 8 * 3600 // 08:00:00
  const endSec = 16 * 3600 + 59 // 16:00:59

  return secondsSinceMidnight >= startSec && secondsSinceMidnight <= endSec
}

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
  overcastMinutes: number // Minutos consecutivos con <26k lux recientes
  overcastHeavyMinutes: number // Minutos consecutivos con <10k lux (nubosidad intensa → posible lluvia)
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

// Umbral de nubosidad intensa para correlación de lluvia (≤10k lux entre 8am-4pm)
const HEAVY_OVERCAST_LUX_THRESHOLD = 10000

/**
 * Clasifica el tipo de día actual basándose en datos de iluminancia acumulados.
 *
 * Solo funciona entre las 8:00 AM y las 4:00 PM (hora local).
 * Fuera de ese rango retorna DESCONOCIDO porque la iluminancia no es
 * representativa del estado del cielo.
 */
export async function classifyCurrentDay(): Promise<DayClassification> {
  const now = new Date()
  const currentCaracasHour = (now.getUTCHours() - 4 + 24) % 24

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
      AND source = 'Weather_Station'
      AND zone = 'EXTERIOR'
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
      Logger.dayClass(
        `Clasificación abortada: baja densidad de muestras (${countLux} muestras registradas de ${Math.round(elapsedMinutes)} min transcurridos, requerido: ${minRequiredSamples}).`,
      )

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
        AND source = 'Weather_Station'
        AND zone = 'EXTERIOR'
        AND illuminance IS NOT NULL
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
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString()
    const overcastQuery = `
      SELECT illuminance, time
      FROM "environment_metrics"
      WHERE time >= '${twoHoursAgo}'
      AND source = 'Weather_Station'
      AND zone = 'EXTERIOR'
      ORDER BY time DESC
    `
    const overcastStream = influxClient.query(overcastQuery)
    let overcastMinutes = 0
    let overcastHeavyMinutes = 0
    let lastTime: Date | null = null
    let lastTimeHeavy: Date | null = null
    let heavyBroken = false // Rompe la cadena de nubosidad intensa (<10k)
    let standardBroken = false // Rompe la cadena de nubosidad estándar (10k-26k)

    for await (const row of overcastStream) {
      const lux = Number(row.illuminance || 0)
      const rowTime = rowTimeToDate(row.time)

      // Protección contra timestamps inválidos de InfluxDB
      if (isNaN(rowTime.getTime())) continue

      // Filtro de horario botánico estricto (8:00:00 AM – 4:00:59 PM)
      // Las lecturas fuera de este rango no son representativas del estado del cielo
      // y podrían acumular minutos erróneos durante el amanecer o atardecer.
      if (!isWithinBotanicalHours(rowTime)) {
        heavyBroken = true
        standardBroken = true
        continue
      }

      // ── Nubosidad estándar (<=26k lux) ──
      if (!standardBroken) {
        if (lux <= OVERCAST_LUX_THRESHOLD) {
          if (!lastTime) {
            // Primera muestra: sumamos tiempo desde el dato hasta "ahora"
            const ageMs = now.getTime() - rowTime.getTime()

            overcastMinutes += Math.min(ageMs, 30 * 60000) / 60000
            lastTime = rowTime
          } else {
            const jumpMs = lastTime.getTime() - rowTime.getTime()

            if (jumpMs > 30 * 60000) {
              standardBroken = true
            } else {
              overcastMinutes += jumpMs / 60000
              lastTime = rowTime
            }
          }
        } else {
          standardBroken = true
        }
      }

      // ── Nubosidad intensa (<10k lux) ──
      if (!heavyBroken) {
        if (lux < HEAVY_OVERCAST_LUX_THRESHOLD) {
          if (!lastTimeHeavy) {
            // Primera muestra: sumamos tiempo desde el dato hasta "ahora"
            const ageMs = now.getTime() - rowTime.getTime()

            overcastHeavyMinutes += Math.min(ageMs, 30 * 60000) / 60000
            lastTimeHeavy = rowTime
          } else {
            const jumpMs = lastTimeHeavy.getTime() - rowTime.getTime()

            if (jumpMs > 30 * 60000) {
              heavyBroken = true
            } else {
              overcastHeavyMinutes += jumpMs / 60000
              lastTimeHeavy = rowTime
            }
          }
        } else {
          heavyBroken = true
        }
      }

      // Optimización: si ambas cadenas están rotas, no hay necesidad de seguir iterando
      if (heavyBroken && standardBroken) break
    }

    overcastMinutes = Math.round(overcastMinutes)
    overcastHeavyMinutes = Math.round(overcastHeavyMinutes)

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
      `Tipo: ${type} | Lux promedio (8am-ahora): ${avgLux.toFixed(0)} | Lux actual: ${currentLux.toFixed(0)} | <= 26k lux -> Nublado: ${overcastMinutes}min | <= 10k lux -> Nubes Grises: ${overcastHeavyMinutes}min`,
    )

    return {
      type,
      avgLuxSince8am: avgLux,
      currentLux,
      overcastMinutes,
      overcastHeavyMinutes,
      evaluatedAt: now,
    }
  } catch (error) {
    Logger.dayClass(
      `Error al clasificar el día: ${error instanceof Error ? error.message : String(error)}`,
    )

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
