import { prisma } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'

export interface BatchSummary {
  min: number
  max: number
  timestamp: number
}

interface TelemetrySample {
  lux: number
  temp: number
  hum: number
  timestamp: number
}

// ---- Estado Privado de Lluvia Física ----
let physicalRainActive = false // Si el sensor de gotas reporta "Raining"
let physicalRainOverridden = false // Veto inteligente por recuperación climática
let physicalRainStartedAt: number | null = null
let lastPhysicalVetoAt: number | null = null
let openPhysicalRainEventId: string | null = null
let physicalBaselineLux: number | null = null
let physicalBaselineTemp: number | null = null
let physicalBaselineHum: number | null = null
let physicalIsWaitingForBaselineFallback = false

// ---- Estado Privado de Lluvia Inferida ----
let inferedRainActive = false // Si la inferencia climática detecta lluvia
let inferedRainOverridden = false // Veto local de inferencia (para histéresis/cooldown)
let inferedRainStartedAt: number | null = null
let lastInferedRainClosedAt: number | null = null
let openVirtualRainEventId: string | null = null
let inferedBaselineLux: number | null = null
let inferedBaselineTemp: number | null = null
let inferedBaselineHum: number | null = null
let inferedBaselineVarTemp: number | null = null
let inferedBaselineVarHum: number | null = null
let minLuxInRain: number | null = null
let minTempInRain: number | null = null
let maxHumInRain: number | null = null

// ---- Buffers y Colas de Telemetría ----
const telemetryBuffer: TelemetrySample[] = []
const tempBatches: BatchSummary[] = []
const humBatches: BatchSummary[] = []
const luxBatches: BatchSummary[] = []

// ---- Variables del Sistema ----
let lastFirmwareHeartbeat = 0
const RAIN_ORPHAN_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutos sin señales
let rainEventMutex = Promise.resolve()

// Helper para empujar métricas a las colas de batches deslizantes (10 min de ventana por lote)
function pushBatchMetrics(queue: BatchSummary[], values: number[]) {
  if (values.length === 0) return
  const min = Math.min(...values)
  const max = Math.max(...values)
  const now = Date.now()

  // Si el lote actual tiene menos de 5 minutos, se combinan los extremos en el lote 0
  if (queue.length > 0 && now - queue[0].timestamp < 5 * 60 * 1000) {
    queue[0].min = Math.min(queue[0].min, min)
    queue[0].max = Math.max(queue[0].max, max)
    queue[0].timestamp = now
  } else {
    queue.unshift({ min, max, timestamp: now })
    if (queue.length > 6) queue.pop()
  }
}

// ---- APIs Públicas del Módulo ----

/**
 * Devuelve el estado consolidado de lluvia activa considerando los vetos de cada sistema.
 */
export function isCurrentlyRaining(): boolean {
  const physicalEffective = physicalRainActive && !physicalRainOverridden
  const inferedEffective = inferedRainActive && !inferedRainOverridden

  return physicalEffective || inferedEffective
}

/**
 * Retorna un resumen del estado para depuración y logs.
 */
export function getRainStatusSummary() {
  return {
    physicalActive,
    physicalOverridden: physicalRainOverridden,
    inferedActive: inferedRainActive,
    inferedOverridden: inferedRainOverridden,
    isCurrentlyRaining: isCurrentlyRaining(),
    openPhysicalRainEventId,
    openVirtualRainEventId,
    tempBatchesLength: tempBatches.length,
    humBatchesLength: humBatches.length,
    luxBatchesLength: luxBatches.length,
  }
}

/**
 * Actualiza la marca de tiempo de latido del firmware de la estación exterior.
 */
export function updateFirmwareHeartbeat(): void {
  lastFirmwareHeartbeat = Date.now()
}

/**
 * Registra muestras directas rápidas en el buffer para baselines del sensor físico.
 */
export function pushTelemetrySample(lux: number, temp: number, hum: number): void {
  const nowMs = Date.now()
  const lastSample = telemetryBuffer[telemetryBuffer.length - 1]

  // Limitar inserción a máximo una muestra cada 30 segundos
  if (!lastSample || nowMs - lastSample.timestamp >= 30000) {
    telemetryBuffer.push({ lux, temp, hum, timestamp: nowMs })
    if (telemetryBuffer.length > 10) telemetryBuffer.shift()
  }
}

/**
 * Encola un nuevo conjunto de lecturas agrupadas del lote de 10 min de la estación exterior.
 */
export function pushClimateBatch(
  tempValues: number[],
  humValues: number[],
  luxValues: number[],
): void {
  if (tempValues.length > 0) pushBatchMetrics(tempBatches, tempValues)
  if (humValues.length > 0) pushBatchMetrics(humBatches, humValues)
  if (luxValues.length > 0) pushBatchMetrics(luxBatches, luxValues)
}

/**
 * Hidrata el estado inicial de eventos de lluvia abiertos desde Postgres.
 */
export async function hydrateState(): Promise<void> {
  try {
    const openPhysical = await prisma.rainEvent.findFirst({
      where: { zone: 'EXTERIOR', endedAt: null, isInfered: false },
      orderBy: { startedAt: 'desc' },
    })

    if (openPhysical) {
      openPhysicalRainEventId = openPhysical.id
      physicalRainActive = true
      Logger.rain(
        `[RainManager] Evento físico huérfano recuperado (ID: ${openPhysical.id.slice(0, 8)})`,
      )
    }

    const openVirtual = await prisma.rainEvent.findFirst({
      where: { zone: 'EXTERIOR', endedAt: null, isInfered: true },
      orderBy: { startedAt: 'desc' },
    })

    if (openVirtual) {
      openVirtualRainEventId = openVirtual.id
      inferedRainActive = true
      Logger.rain(
        `[RainManager] Evento virtual huérfano recuperado (ID: ${openVirtual.id.slice(0, 8)})`,
      )
    }
  } catch (err) {
    Logger.error('[RainManager] Error hidratando estado de lluvia desde Postgres:', err)
  }
}

/**
 * Abre un nuevo evento de lluvia en Postgres protegiéndolo con mutex para evitar colisiones.
 */
async function openRainEvent(
  timestamp: Date = new Date(),
  isInfered: boolean = false,
  baselines?: {
    temp: number | null
    hum: number | null
    lux: number | null
    ageMinutes?: number | null
  },
  triggerReason?: string,
) {
  rainEventMutex = rainEventMutex
    .then(async () => {
      const currentId = isInfered ? openVirtualRainEventId : openPhysicalRainEventId
      const label = isInfered ? 'inferido' : 'físico'

      if (!currentId) {
        try {
          const existing = await prisma.rainEvent.findFirst({
            where: { zone: 'EXTERIOR', endedAt: null, isInfered },
            orderBy: { startedAt: 'desc' },
          })

          if (existing) {
            if (isInfered) {
              openVirtualRainEventId = existing.id
            } else {
              openPhysicalRainEventId = existing.id
            }
            Logger.rain(
              `[RainManager] Evento de lluvia ${label} reanudado (ID: ${existing.id.slice(0, 8)})`,
            )
          } else {
            const newEvent = await prisma.rainEvent.create({
              data: {
                startedAt: timestamp,
                zone: 'EXTERIOR',
                isInfered,
                baselineTemp: baselines?.temp ?? null,
                baselineHum: baselines?.hum ?? null,
                baselineLux: baselines?.lux ?? null,
                baselineAgeMinutes: baselines?.ageMinutes ?? null,
                triggerReason: triggerReason ?? null,
              },
            })

            if (isInfered) {
              openVirtualRainEventId = newEvent.id
            } else {
              openPhysicalRainEventId = newEvent.id
            }
            Logger.rain(
              `[RainManager] Evento de lluvia ${label} abierto (ID: ${newEvent.id.slice(0, 8)})`,
            )
          }
        } catch (err) {
          Logger.error(`[RainManager] Error abriendo RainEvent ${label} en Postgres:`, err)
        }
      }
    })
    .catch((err) => {
      Logger.error('[RainManager] Error en Mutex de openRainEvent:', err)
    })
  await rainEventMutex
}

/**
 * Cierra un evento de lluvia abierto en Postgres y calcula la duración e intensidad.
 */
async function closeRainEvent(
  reason: string,
  endTime: Date = new Date(),
  isInfered: boolean = false,
  closeReason?: string,
) {
  rainEventMutex = rainEventMutex
    .then(async () => {
      let eventId = isInfered ? openVirtualRainEventId : openPhysicalRainEventId
      const label = isInfered ? 'inferido' : 'físico'

      if (!eventId) {
        const existing = await prisma.rainEvent
          .findFirst({
            where: { zone: 'EXTERIOR', endedAt: null, isInfered },
            orderBy: { startedAt: 'desc' },
          })
          .catch(() => null)

        if (!existing) return
        eventId = existing.id
      }

      try {
        const event = await prisma.rainEvent.findUnique({ where: { id: eventId } })

        if (!event || event.endedAt) {
          if (isInfered) {
            openVirtualRainEventId = null
          } else {
            openPhysicalRainEventId = null
          }

          return
        }

        const durationSeconds = Math.round((endTime.getTime() - event.startedAt.getTime()) / 1000)

        // Consultar la intensidad de lluvia en InfluxDB
        let avgIntensity: number | null = null
        let peakIntensity: number | null = null

        try {
          const intensityQuery = `
            SELECT AVG("rain_intensity") as avg_int, MAX("rain_intensity") as peak_int 
            FROM "environment_metrics" 
            WHERE "zone" = 'EXTERIOR' 
              AND time >= '${event.startedAt.toISOString()}' 
              AND time <= '${endTime.toISOString()}'
          `
          const stream = influxClient.query(intensityQuery)

          for await (const row of stream) {
            if (row.avg_int != null) avgIntensity = Number(row.avg_int)
            if (row.peak_int != null) peakIntensity = Number(row.peak_int)
          }
        } catch (err) {
          Logger.warn(
            '[RainManager] No se pudo recuperar la intensidad de lluvia de InfluxDB:',
            err,
          )
        }

        if (!eventId) return

        await prisma.rainEvent.update({
          where: { id: eventId },
          data: {
            endedAt: endTime,
            durationSeconds,
            closedBy: reason,
            closeReason: closeReason ?? reason,
            avgIntensity,
            peakIntensity,
          },
        })

        const intensityLog = avgIntensity ? ` | Int. Promedio: ${Math.round(avgIntensity)}%` : ''

        Logger.rain(
          `[RainManager] Evento de lluvia ${label} cerrado (${reason}) — Duración: ${Math.round(durationSeconds / 60)} min${intensityLog} (ID: ${eventId.slice(0, 8)})`,
        )

        if (isInfered) {
          lastInferedRainClosedAt = endTime.getTime()
        }
      } catch (err) {
        Logger.error(`[RainManager] Error cerrando RainEvent ${label} en Postgres:`, err)
      } finally {
        if (isInfered) {
          openVirtualRainEventId = null
        } else {
          openPhysicalRainEventId = null
        }
      }
    })
    .catch((err) => {
      Logger.error('[RainManager] Error en Mutex de closeRainEvent:', err)
    })
  await rainEventMutex
}

/**
 * Procesa los cambios en el estado del sensor físico de lluvia reportados por MQTT.
 */
export async function handlePhysicalRainState(state: string, rainTimestamp: Date): Promise<void> {
  if (state === 'Raining') {
    if (physicalRainOverridden) return // Evitar reapertura si el veto de recuperación está activo

    if (!physicalRainActive) {
      Logger.rain('[RainManager] Lluvia física detectada por sensor de gotas.')
      physicalRainStartedAt = Date.now()

      // Capturar baselines pre-lluvia física desde el buffer de los últimos 45 min
      const now = Date.now()
      const freshSamples = telemetryBuffer.filter((s) => now - s.timestamp < 45 * 60 * 1000)

      if (freshSamples.length > 0) {
        physicalBaselineLux = Math.min(...freshSamples.map((s) => s.lux))
        physicalBaselineTemp = Math.min(...freshSamples.map((s) => s.temp))
        physicalBaselineHum = Math.min(...freshSamples.map((s) => s.hum))
        physicalIsWaitingForBaselineFallback = false

        Logger.debug(
          `[RainManager] Capturando Baseline Físico (Mínimo últimos 45m): ${physicalBaselineLux.toFixed(0)}lx / ${physicalBaselineTemp.toFixed(1)}°C / ${physicalBaselineHum.toFixed(1)}%. [${freshSamples.length} muestras]`,
        )
      } else {
        physicalBaselineLux = null
        physicalBaselineTemp = null
        physicalBaselineHum = null
        physicalIsWaitingForBaselineFallback = true
        Logger.warn(
          '[RainManager] Sin baseline pre-lluvia física (buffer vacío). Iniciando captura de fallback.',
        )
      }

      physicalRainOverridden = false
    }
    physicalRainActive = true
    await openRainEvent(rainTimestamp, false)
  } else if (state === 'Dry') {
    physicalRainActive = false
    physicalRainOverridden = false // Limpiar veto al secarse físicamente
    await closeRainEvent('Dry', rainTimestamp, false)
  }
}

/**
 * Watchdog para eventos físicos huérfanos por desconexión de la estación meteorológica.
 */
export async function checkRainOrphanTimeout(): Promise<void> {
  if (!physicalRainActive) return
  if (lastFirmwareHeartbeat === 0) return

  const elapsed = Date.now() - lastFirmwareHeartbeat

  if (elapsed > RAIN_ORPHAN_TIMEOUT_MS) {
    Logger.rain(
      `[RainManager] Evento físico huérfano detectado. Sin señal en ${Math.round(elapsed / 60000)}min. Finalizando.`,
    )
    physicalRainActive = false
    await closeRainEvent('ORPHAN_TIMEOUT', new Date(), false)
  }
}

/**
 * Evalúa las condiciones climáticas del sensor físico para aplicar el veto inteligente.
 */
export async function evaluatePhysicalRainVeto(
  lux: number,
  temp: number,
  hum: number,
): Promise<void> {
  const nowMs = Date.now()

  // 1. Lógica de Fallback de Baseline para Lluvia Física
  if (physicalRainActive && !physicalRainOverridden) {
    if (physicalIsWaitingForBaselineFallback && physicalRainStartedAt) {
      const elapsed = nowMs - physicalRainStartedAt

      if (elapsed < 10 * 60 * 1000) {
        if (physicalBaselineLux === null || lux > physicalBaselineLux) physicalBaselineLux = lux
        if (physicalBaselineTemp === null || temp > physicalBaselineTemp)
          physicalBaselineTemp = temp
        if (physicalBaselineHum === null || hum > physicalBaselineHum) physicalBaselineHum = hum
      } else {
        physicalIsWaitingForBaselineFallback = false
        Logger.debug(
          `[RainManager] Captura fallback física finalizada. Baseline: ${physicalBaselineLux?.toFixed(0)}lx / ${physicalBaselineTemp?.toFixed(1)}°C / ${physicalBaselineHum?.toFixed(1)}%.`,
        )
      }
    }

    // Evaluar si se debe aplicar el VETO de recuperación
    const now = new Date()
    const caracasHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Caracas',
        hour: 'numeric',
        hour12: false,
      }).format(now),
    )
    const isWindow = caracasHour >= 6 && caracasHour < 17

    if (physicalBaselineTemp !== null) {
      const luxRecovery =
        isWindow && physicalBaselineLux !== null && lux > physicalBaselineLux * 1.2
      const tempRecovery = temp > physicalBaselineTemp + 2
      const humRecovery = physicalBaselineHum !== null && hum < physicalBaselineHum - 2
      const absoluteSun = isWindow && lux > 26000

      if (luxRecovery || tempRecovery || humRecovery || absoluteSun) {
        const reason = luxRecovery
          ? `Recuperación lumínica (+${Math.round((lux / physicalBaselineLux! - 1) * 100)}%)`
          : tempRecovery
            ? `Recuperación térmica (+${(temp - physicalBaselineTemp).toFixed(1)}°C)`
            : humRecovery
              ? `Recuperación de humedad (${hum.toFixed(1)}%)`
              : 'Cielo templado diurno (>26k lux)'

        Logger.rain(
          `[RainManager] Veto físico inteligente activado: ${reason}. Baseline: ${physicalBaselineLux?.toFixed(0)}lx / ${physicalBaselineTemp.toFixed(1)}°C / ${physicalBaselineHum?.toFixed(1)}%. Actual: ${lux.toFixed(0)}lx / ${temp.toFixed(1)}°C / ${hum.toFixed(1)}%.`,
        )

        physicalRainOverridden = true
        lastPhysicalVetoAt = Date.now()
        await closeRainEvent('SCHEDULER_OVERRIDE', new Date(), false)
      }
    }
  }

  // 2. Lógica de Reversión de Veto Físico (Anti-Intermitencia)
  if (
    physicalRainOverridden &&
    physicalBaselineLux !== null &&
    physicalBaselineTemp !== null &&
    lastPhysicalVetoAt !== null
  ) {
    const timeSinceVeto = (Date.now() - lastPhysicalVetoAt) / 60000

    if (timeSinceVeto < 30) {
      const lostLux = lux < physicalBaselineLux * 1.1
      const lostTemp = temp < physicalBaselineTemp + 1
      const lostHum = physicalBaselineHum !== null && hum > physicalBaselineHum + 5

      if (lostLux || lostTemp || lostHum) {
        const reason = lostLux
          ? 'Nubes regresaron (Lux bajo)'
          : lostTemp
            ? 'Caída térmica'
            : 'Saturación de humedad'

        Logger.rain(
          `[RainManager] Reversión de veto físico: ${reason} tras ${timeSinceVeto.toFixed(1)}min. La lluvia física persiste.`,
        )
        physicalRainOverridden = false
        lastPhysicalVetoAt = null
        if (physicalRainActive) await openRainEvent(new Date(), false)
      }
    }
  }
}

/**
 * Evalúa las colas de batches del motor de inferencia termodinámica de lluvia.
 */
export async function evaluateClimateInference(): Promise<void> {
  const nowMs = Date.now()

  // 1. Hidratar las colas de batches en tiempo real directamente desde InfluxDB (para resiliencia ante reinicios y sincronización de intervalos)
  const query = `
    SELECT 
      date_bin(interval '10 minutes', time) as time_bin,
      MIN(temperature) as min_temp,
      MAX(temperature) as max_temp,
      MIN(humidity) as min_hum,
      MAX(humidity) as max_hum,
      MIN(illuminance) as min_lux,
      MAX(illuminance) as max_lux
    FROM "environment_metrics"
    WHERE "zone" = 'EXTERIOR'
      AND time >= now() - interval '65 minutes'
    GROUP BY time_bin
    ORDER BY time_bin DESC
    LIMIT 6
  `

  try {
    const stream = influxClient.query(query)
    const newTempBatches: BatchSummary[] = []
    const newHumBatches: BatchSummary[] = []
    const newLuxBatches: BatchSummary[] = []

    for await (const row of stream) {
      const minTemp = Number(row.min_temp)
      const maxTemp = Number(row.max_temp)
      const minHum = Number(row.min_hum)
      const maxHum = Number(row.max_hum)
      const minLux = Number(row.min_lux)
      const maxLux = Number(row.max_lux)
      const timeBin = new Date(row.time_bin as string)

      if (isNaN(minTemp) || isNaN(minHum) || isNaN(minLux)) continue

      const timestamp = timeBin.getTime()

      newTempBatches.push({ min: minTemp, max: maxTemp, timestamp })
      newHumBatches.push({ min: minHum, max: maxHum, timestamp })
      newLuxBatches.push({ min: minLux, max: maxLux, timestamp })
    }

    if (newTempBatches.length > 0) {
      tempBatches.splice(0, tempBatches.length, ...newTempBatches)
      humBatches.splice(0, humBatches.length, ...newHumBatches)
      luxBatches.splice(0, luxBatches.length, ...newLuxBatches)
    }
  } catch (err) {
    Logger.error('[RainManager] Error al hidratar colas de lluvia desde InfluxDB:', err)
  }

  // 2. Necesitamos al menos 3 batches en cada cola para poder evaluar derivadas
  if (tempBatches.length < 3 || humBatches.length < 3 || luxBatches.length < 3) {
    return
  }

  // 3. Extraer extremos del lote actual B0
  const currentMinTemp = tempBatches[0].min
  const currentMaxHum = humBatches[0].max
  const currentMinLux = luxBatches[0].min

  const caracasHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      hour12: false,
    }).format(new Date(tempBatches[0].timestamp)),
  )
  const isDay = caracasHour >= 8 && caracasHour < 16

  // A. Evaluar Inicio de Lluvia Inferida
  if (!inferedRainActive) {
    // Histéresis de 15 minutos tras el cese anterior
    if (lastInferedRainClosedAt !== null && nowMs - lastInferedRainClosedAt < 15 * 60 * 1000) {
      return
    }

    let triggered = false
    let tempBaselineAgeMinutes = 20
    let tempDeltaTemp = 0
    let tempDeltaHum = 0
    let dropPct = 0
    let isStagnantTriggered = false
    let stagnantVarTempPre = 0

    // Paso 1 (20 minutos para Día / Ventana de 40 minutos para Noche)
    const baseTemp1 = tempBatches[1].max
    const baseHum1 = humBatches[1].min
    const baseLux1 = luxBatches[1].max
    const dTemp1 = currentMinTemp - baseTemp1
    const dHum1 = currentMaxHum - baseHum1

    if (isDay) {
      let luxCondition = false
      let tempDropThreshold = -3.0
      let humRiseThreshold = 10.0

      if (baseLux1 <= 15000) {
        luxCondition = true
        tempDropThreshold = -1.2
        humRiseThreshold = 4.0
      } else if (baseLux1 <= 26000) {
        luxCondition = currentMinLux <= baseLux1 * 0.6
        if (currentMinLux <= 15000) {
          tempDropThreshold = -1.2
          humRiseThreshold = 4.0
        }
      } else {
        luxCondition = currentMinLux <= baseLux1 * 0.4
        if (currentMinLux <= 15000) {
          tempDropThreshold = -1.2
          humRiseThreshold = 4.0
        }
      }

      const humCondition =
        dHum1 >= humRiseThreshold || (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

      if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
        triggered = true
        tempBaselineAgeMinutes = 20
        tempDeltaTemp = dTemp1
        tempDeltaHum = dHum1
        dropPct = baseLux1 > 0 ? ((baseLux1 - currentMinLux) / baseLux1) * 100 : 0
      }
    } else {
      // NOCHE - Regla Unificada de Gradiente Dinámico
      if (tempBatches.length >= 4 && humBatches.length >= 4) {
        // 1. Ruido de referencia natural de los 3 lotes anteriores (B1, B2, B3)
        const varTemp1 = tempBatches[1].max - tempBatches[1].min
        const varTemp2 = tempBatches[2].max - tempBatches[2].min
        const varTemp3 = tempBatches[3].max - tempBatches[3].min
        const refVarTemp = Math.max(varTemp1, varTemp2, varTemp3, 0.15) // Piso instrumental DHT22

        const varHum1 = humBatches[1].max - humBatches[1].min
        const varHum2 = humBatches[2].max - humBatches[2].min
        const varHum3 = humBatches[3].max - humBatches[3].min
        const refVarHum = Math.max(varHum1, varHum2, varHum3, 0.5)

        // 2. Estabilidad de calma previa
        const maxTempPreAll = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
        const minTempPreAll = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
        const varTempPre = maxTempPreAll - minTempPreAll

        const minHumPreAll = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
        const maxHumPreAll = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
        const varHumPre = maxHumPreAll - minHumPreAll

        // 3. Deltas de choque en B0
        const currentTempDrop = maxTempPreAll - currentMinTemp
        const currentHumRise = currentMaxHum - minHumPreAll

        // --- Calibración Fina (Fórmula B Calibrada con Filtro de Rocío) ---
        // Si el aire ya venía saturado (>= 98.0% HR), el motor asume que el sensor está saturado (rocío/neblina) y eleva el piso térmico a 0.50°C.
        // Si no está saturado (< 98.0% HR), el piso es 0.35°C para registrar garúas tenues de forma dinámica.
        const tempFloor = minHumPreAll >= 98.0 ? 0.50 : 0.35

        const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.8) // Multiplicador térmico a 1.8
        const humRiseThreshold = Math.max(1.5, varHumPre * 1.6) // Multiplicador hídrico a 1.6

        const isTempDropAbrupt = currentTempDrop >= tempDropThreshold
        const isHumRiseAbrupt = currentHumRise >= humRiseThreshold
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

        if (varTempPre <= 0.6 && isTempDropAbrupt && (isHumRiseAbrupt || isPreSaturated)) {
          triggered = true
          tempBaselineAgeMinutes = 40
          tempDeltaTemp = currentMinTemp - maxTempPreAll
          tempDeltaHum = currentHumRise
          isStagnantTriggered = true
          stagnantVarTempPre = varTempPre
          inferedBaselineVarTemp = refVarTemp
          inferedBaselineVarHum = refVarHum
        }
      }
    }

    // Paso 2 (30 minutos para Día / Saltado en Noche)
    if (!triggered && isDay) {
      const baseTemp2 = tempBatches[2].max
      const baseHum2 = humBatches[2].min
      const baseLux2 = luxBatches[2].max
      const dTemp2 = currentMinTemp - baseTemp2
      const dHum2 = currentMaxHum - baseHum2

      let luxCondition = false
      let tempDropThreshold = -3.0
      let humRiseThreshold = 12.0

      if (baseLux2 <= 15000) {
        luxCondition = true
        tempDropThreshold = -1.2
        humRiseThreshold = 4.0
      } else if (baseLux2 <= 26000) {
        luxCondition = currentMinLux <= baseLux2 * 0.6
        if (currentMinLux <= 15000) {
          tempDropThreshold = -1.2
          humRiseThreshold = 4.0
        }
      } else {
        luxCondition = currentMinLux <= baseLux2 * 0.4
        if (currentMinLux <= 15000) {
          tempDropThreshold = -1.2
          humRiseThreshold = 4.0
        }
      }

      const humCondition =
        dHum2 >= humRiseThreshold || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

      if (dTemp2 <= tempDropThreshold && humCondition && luxCondition) {
        triggered = true
        tempBaselineAgeMinutes = 30
        tempDeltaTemp = dTemp2
        tempDeltaHum = dHum2
        dropPct = baseLux2 > 0 ? ((baseLux2 - currentMinLux) / baseLux2) * 100 : 0
      }
    }

    if (triggered) {
      inferedRainActive = true
      inferedRainOverridden = false
      inferedRainStartedAt = nowMs

      inferedBaselineLux = luxBatches[0].max
      inferedBaselineTemp = tempBatches[0].max
      inferedBaselineHum = humBatches[0].min

      minLuxInRain = luxBatches[0].min
      minTempInRain = tempBatches[0].min
      maxHumInRain = humBatches[0].max

      if (isDay) {
        const isPersistentlyCloudy = baseLux1 <= 10000
        const tagMode = isPersistentlyCloudy ? ' (NUBOSIDAD PERSISTENTE)' : ''

        Logger.rain(
          `[RainManager] Lluvia Inferida [DÍA${tagMode}]: deltaHR=${tempDeltaHum.toFixed(1)}%, deltaTemp=${tempDeltaTemp.toFixed(1)}°C, Lux min actual: ${currentMinLux.toFixed(0)}lx vs baseline: ${inferedBaselineLux.toFixed(0)}lx (${dropPct.toFixed(0)}% caída).`,
        )

        await openRainEvent(
          new Date(),
          true,
          {
            temp: inferedBaselineTemp,
            hum: inferedBaselineHum,
            lux: inferedBaselineLux,
            ageMinutes: 10,
          },
          `Inferencia de Día${tagMode}: Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${tempDeltaTemp.toFixed(1)}°C en ${tempBaselineAgeMinutes}m (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`,
        )
      } else {
        const rainNotes = isStagnantTriggered
          ? `Inferencia de Noche (Gradiente por Estancamiento): Caída térmica de ${tempDeltaTemp.toFixed(1)}°C tras estabilidad previa de ${stagnantVarTempPre.toFixed(2)}°C (HR: ${currentMaxHum.toFixed(1)}%) (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%)`
          : `Inferencia de Noche: Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${tempDeltaTemp.toFixed(1)}°C en ${tempBaselineAgeMinutes}m (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%)`

        Logger.rain(
          isStagnantTriggered
            ? `[RainManager] Lluvia Inferida [NOCHE - GRADIENTE ESTANCAMIENTO]: deltaTemp=${tempDeltaTemp.toFixed(1)}°C (HR: ${currentMaxHum.toFixed(1)}%), varTempPre=${stagnantVarTempPre.toFixed(2)}°C.`
            : `[RainManager] Lluvia Inferida [NOCHE]: deltaHR=${tempDeltaHum.toFixed(1)}%, deltaTemp=${tempDeltaTemp.toFixed(1)}°C, ventana: ${tempBaselineAgeMinutes}m.`,
        )

        await openRainEvent(
          new Date(),
          true,
          {
            temp: inferedBaselineTemp,
            hum: inferedBaselineHum,
            lux: inferedBaselineLux,
            ageMinutes: 10,
          },
          rainNotes,
        )
      }
    }
  } else {
    // B. Evaluar Cese de Lluvia Inferida (si ya está activa)
    if (inferedRainStartedAt !== null) {
      const durationMin = (nowMs - inferedRainStartedAt) / 60000

      // 1. Cese Dinámico por Estancamiento de Variables (15 min de duración mínima)
      if (durationMin >= 15 && tempBatches.length >= 1 && humBatches.length >= 1) {
        const diffHum = humBatches[0].max - humBatches[0].min
        const diffTemp = tempBatches[0].max - tempBatches[0].min

        const tempCeseThreshold =
          inferedBaselineVarTemp !== null ? Math.max(0.4, 1.2 * inferedBaselineVarTemp) : 0.4
        const humCeseThreshold =
          inferedBaselineVarHum !== null ? Math.max(1.0, 1.2 * inferedBaselineVarHum) : 1.0

        if (diffHum <= humCeseThreshold && diffTemp <= tempCeseThreshold) {
          Logger.rain(
            `[RainManager] Cierre por Estancamiento de Variables (15m+): Rango HR: ${diffHum.toFixed(1)}% <= ${humCeseThreshold.toFixed(1)}%, Rango Temp: ${diffTemp.toFixed(1)}°C <= ${tempCeseThreshold.toFixed(1)}°C (últimos 10 min).`,
          )
          inferedRainActive = false
          inferedRainOverridden = true
          maxHumInRain = null
          inferedBaselineVarTemp = null
          inferedBaselineVarHum = null
          await closeRainEvent(
            'STAGNANT',
            new Date(),
            true,
            `Estancamiento climático dinámico: sin fluctuación de temperatura (variación ≤ ${tempCeseThreshold.toFixed(1)}°C) ni humedad (variación ≤ ${humCeseThreshold.toFixed(1)}% HR) durante 10 minutos (dT=${diffTemp.toFixed(1)}°C <= ${tempCeseThreshold.toFixed(1)}, dH=${diffHum.toFixed(1)}% <= ${humCeseThreshold.toFixed(1)}, Temp: ${tempBatches[0].min.toFixed(1)}°C, Hum: ${humBatches[0].max.toFixed(1)}%)`,
          )

          return
        }
      }

      // Actualizar extremos en lluvia
      minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
      minTempInRain = Math.min(minTempInRain ?? currentMinTemp, currentMinTemp)
      maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

      // Criterios Diurnos de Cese
      if (isDay) {
        // 2. Recuperación Térmica e Hídrica Adaptativa (Día)
        if (
          inferedBaselineTemp !== null &&
          inferedBaselineHum !== null &&
          minTempInRain !== null &&
          maxHumInRain !== null
        ) {
          const currentTemp = tempBatches[0].min
          const currentHum = humBatches[0].max

          const tempDrop = inferedBaselineTemp - minTempInRain
          const humRise = maxHumInRain - inferedBaselineHum

          // Umbrales adaptativos: recuperar 35% de la caída y secar 15% del ascenso
          const tempThreshold = minTempInRain + Math.max(0.6, tempDrop * 0.35)
          const humThreshold = maxHumInRain - Math.max(2.0, humRise * 0.15)

          const tempRecovered = currentTemp >= tempThreshold
          const humRecovered = currentHum <= humThreshold

          if (tempRecovered && humRecovered) {
            Logger.rain(
              `[RainManager] Cierre por Recuperación Adaptativa: Temp: ${currentTemp.toFixed(1)}°C >= ${tempThreshold.toFixed(1)}°C, Hum: ${currentHum.toFixed(1)}% <= ${humThreshold.toFixed(1)}% (DropTemp=${tempDrop.toFixed(1)}°C).`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null
            await closeRainEvent(
              'BASELINE_RECOVERY',
              new Date(),
              true,
              `Cese de lluvia (térmico/hídrico): temperatura subió a ${currentTemp.toFixed(1)}°C (umbral: ${tempThreshold.toFixed(1)}°C) y humedad bajó a ${currentHum.toFixed(1)}% (umbral: ${humThreshold.toFixed(1)}% HR) (Temp: ${currentTemp.toFixed(1)}°C, Hum: ${currentHum.toFixed(1)}%)`,
            )
            maxHumInRain = null

            return
          }
        }

        // 3. Recuperación Solar Adaptativa por Despeje con VALIDACIÓN CRUZADA
        if (inferedBaselineLux !== null) {
          const preLux = inferedBaselineLux
          const minLux = minLuxInRain ?? currentMinLux
          const relativeDrop = Math.min(1.0, (preLux - minLux) / preLux)
          const alpha = 1.0 - 0.65 * relativeDrop
          const luxRecoveryThreshold = minLux + alpha * (preLux - minLux)

          const currentMaxLux = luxBatches[0].max

          // Validación cruzada: que la temperatura no esté en bajada brusca en el último lote
          const lastTempDrop = tempBatches[1].max - tempBatches[0].max // Si positivo, se está calentando o estable
          const isTempStableOrRising = lastTempDrop >= -0.2 // Permite caídas marginales del sensor

          if (currentMaxLux >= luxRecoveryThreshold && isTempStableOrRising) {
            Logger.rain(
              `[RainManager] Cierre por Recuperación Solar Cruzada: Lux max: ${currentMaxLux.toFixed(0)} lx >= ${luxRecoveryThreshold.toFixed(0)} lx (Temp estable, deltaTempLastLote=${(-lastTempDrop).toFixed(2)}°C).`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            maxHumInRain = null
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null
            await closeRainEvent(
              'SOLAR_RECOVERY',
              new Date(),
              true,
              `Despeje solar verificado: iluminancia subió a ${Math.round(currentMaxLux).toLocaleString()} lx (umbral elástico: ${Math.round(luxRecoveryThreshold).toLocaleString()} lx) acoplado a estabilidad térmica en el lote actual (Lux max: ${currentMaxLux.toFixed(0)} lx >= ${luxRecoveryThreshold.toFixed(0)} lx, Temp: ${tempBatches[0].min.toFixed(1)}°C, Hum: ${humBatches[0].max.toFixed(1)}%)`,
            )

            return
          }
        }
      }
    }
  }
}
