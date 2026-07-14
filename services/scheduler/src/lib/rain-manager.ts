import { prisma } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'

export interface Sample {
  value: number
  timestamp: number
}

export interface BatchSummary {
  min: number
  max: number
  timestamp: number
  samples: Sample[]
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
function pushBatchMetrics(queue: BatchSummary[], values: number[], isLux = false) {
  if (values.length === 0) return
  const now = Date.now()

  const samples = values.map((val, idx) => ({
    value: val,
    timestamp: now - (values.length - 1 - idx) * 60000,
  }))

  if (queue.length > 0 && now - queue[0].timestamp < 5 * 60 * 1000) {
    queue[0].samples.push(...samples)
    queue[0].timestamp = now

    const allValues = queue[0].samples.map((s) => s.value)

    if (isLux) {
      const sortedAsc = [...allValues].sort((a, b) => a - b)
      const low5 = sortedAsc.slice(0, Math.min(5, sortedAsc.length))

      queue[0].min = low5.reduce((sum, val) => sum + val, 0) / low5.length
      queue[0].max = allValues.reduce((sum, val) => sum + val, 0) / allValues.length
    } else {
      queue[0].min = Math.min(...allValues)
      queue[0].max = Math.max(...allValues)
    }
  } else {
    let min = Math.min(...values)
    let max = Math.max(...values)

    if (isLux && values.length > 0) {
      const sortedAsc = [...values].sort((a, b) => a - b)
      const low5 = sortedAsc.slice(0, Math.min(5, sortedAsc.length))

      min = low5.reduce((sum, val) => sum + val, 0) / low5.length
      max = values.reduce((sum, val) => sum + val, 0) / values.length
    }

    queue.unshift({ min, max, timestamp: now, samples })
    if (queue.length > 6) queue.pop()
  }
}

// ---- Helpers de Protección por Gradiente (Pendiente Rápida) ----

export function getHumGradientMetrics(samples: Sample[]): { max1m: number; max2m: number } {
  if (samples.length < 2) return { max1m: 0, max2m: 0 }
  let max1m = 0
  let max2m = 0

  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp)

  for (let i = 1; i < sorted.length; i++) {
    const timeDiff1m = sorted[i].timestamp - sorted[i - 1].timestamp
    if (timeDiff1m <= 90000) {
      const diff = sorted[i].value - sorted[i - 1].value
      if (diff > max1m) max1m = diff
    }

    if (i >= 2) {
      const timeDiff2m = sorted[i].timestamp - sorted[i - 2].timestamp
      if (timeDiff2m <= 150000) {
        const diff2 = sorted[i].value - sorted[i - 2].value
        if (diff2 > max2m) max2m = diff2
      }
    }
  }

  return { max1m, max2m }
}

export function getTempGradientMetrics(samples: Sample[]): { maxDrop1m: number } {
  if (samples.length < 2) return { maxDrop1m: 0 }
  let maxDrop1m = 0

  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp)

  for (let i = 1; i < sorted.length; i++) {
    const timeDiff1m = sorted[i].timestamp - sorted[i - 1].timestamp
    if (timeDiff1m <= 90000) {
      const diff = sorted[i].value - sorted[i - 1].value
      if (diff < maxDrop1m) maxDrop1m = diff
    }
  }

  return { maxDrop1m }
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
    physicalActive: physicalRainActive,
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
  if (luxValues.length > 0) pushBatchMetrics(luxBatches, luxValues, true)
}

/**
 * Determina si una marca de tiempo corresponde al horario diurno de Caracas (7:00 AM a 6:00 PM VET).
 */
export function isDaytime(timestampMs: number): boolean {
  const date = new Date(timestampMs)
  const caracasHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      hour12: false,
    }).format(date),
  )
  return caracasHour >= 7 && caracasHour < 18
}

/**
 * Hidrata el estado inicial de eventos de lluvia abiertos desde Postgres.
 */
export async function hydrateState(): Promise<void> {
  try {
    // 1. Recuperar eventos huérfanos de Postgres
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

    // 2. Hidratar los batches en memoria desde InfluxDB (últimos 75 min)
    const BATCH_MS = 10 * 60 * 1000
    const query = `
      SELECT time, temperature, humidity, illuminance
      FROM "environment_metrics"
      WHERE "zone" = 'EXTERIOR'
        AND time >= now() - INTERVAL '75 minutes'
      ORDER BY time ASC
    `
    const stream = influxClient.query(query)
    const bins: { [binStartMs: number]: { temp: Sample[]; hum: Sample[]; lux: Sample[] } } = {}

    for await (const row of stream) {
      const tDate = rowTimeToDate(row.time)
      const tMs = tDate.getTime()
      const binStartMs = Math.floor(tMs / BATCH_MS) * BATCH_MS

      if (!bins[binStartMs]) {
        bins[binStartMs] = { temp: [], hum: [], lux: [] }
      }

      if (row.temperature != null) {
        const tVal = Number(row.temperature)
        if (tVal > 5.0 && tVal < 55.0) {
          bins[binStartMs].temp.push({ value: tVal, timestamp: tMs })
        }
      }
      if (row.humidity != null) {
        const hVal = Number(row.humidity)
        if (hVal > 10.0 && hVal <= 100.0) {
          bins[binStartMs].hum.push({ value: hVal, timestamp: tMs })
        }
      }
      if (row.illuminance != null) {
        const lVal = Number(row.illuminance)
        if (lVal >= 0) {
          bins[binStartMs].lux.push({ value: lVal, timestamp: tMs })
        }
      } else {
        const sampleHour = (tDate.getUTCHours() - 4 + 24) % 24
        if (sampleHour >= 19 || sampleHour < 5) {
          bins[binStartMs].lux.push({ value: 0, timestamp: tMs })
        }
      }
    }

    const sortedBins = Object.keys(bins)
      .map(Number)
      .sort((a, b) => b - a)

    const newTempBatches: BatchSummary[] = []
    const newHumBatches: BatchSummary[] = []
    const newLuxBatches: BatchSummary[] = []

    for (const binStartMs of sortedBins) {
      const bData = bins[binStartMs]
      const sampleHour = (new Date(binStartMs).getUTCHours() - 4 + 24) % 24
      const isSolar = sampleHour >= 5 && sampleHour < 19
      const hasLux = bData.lux.length >= 5 || !isSolar

      if (bData.temp.length >= 5 && bData.hum.length >= 5 && hasLux) {
        if (bData.lux.length < 5) {
          bData.lux = Array(5).fill({ value: 0, timestamp: binStartMs })
        }
        const tempVals = bData.temp.map((s) => s.value)
        const humVals = bData.hum.map((s) => s.value)
        const luxVals = bData.lux.map((s) => s.value)

        newTempBatches.push({
          min: Math.min(...tempVals),
          max: Math.max(...tempVals),
          timestamp: binStartMs,
          samples: bData.temp,
        })
        newHumBatches.push({
          min: Math.min(...humVals),
          max: Math.max(...humVals),
          timestamp: binStartMs,
          samples: bData.hum,
        })
        const sortedLuxAsc = [...luxVals].sort((a, b) => a - b)
        const low5Lux = sortedLuxAsc.slice(0, Math.min(5, sortedLuxAsc.length))
        const minLuxAvg = low5Lux.reduce((sum, val) => sum + val, 0) / low5Lux.length

        const sortedLuxDesc = [...luxVals].sort((a, b) => b - a)
        const high5Lux = sortedLuxDesc.slice(0, Math.min(5, sortedLuxDesc.length))
        const maxLuxAvg = high5Lux.reduce((sum, val) => sum + val, 0) / high5Lux.length

        newLuxBatches.push({
          min: minLuxAvg,
          max: maxLuxAvg,
          timestamp: binStartMs,
          samples: bData.lux,
        })
      }
    }

    if (newTempBatches.length > 0) {
      tempBatches.splice(0, tempBatches.length, ...newTempBatches)
      humBatches.splice(0, humBatches.length, ...newHumBatches)
      luxBatches.splice(0, luxBatches.length, ...newLuxBatches)
      Logger.rain(`[RainManager] Hidratación inicial completa: ${tempBatches.length} lotes climáticos cargados.`)
    }
  } catch (err) {
    Logger.error('[RainManager] Error hidratando estado de lluvia:', err)
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
  startMetrics?: {
    temp: number | null
    hum: number | null
    lux: number | null
  },
  triggerData?: {
    type: string | null
    tempDrop: number | null
    humRise: number | null
    luxDropPct: number | null
  },
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
                startTemp: startMetrics?.temp ?? null,
                startHum: startMetrics?.hum ?? null,
                startLux: startMetrics?.lux ?? null,
                triggerType: triggerData?.type ?? null,
                triggerTempDrop: triggerData?.tempDrop ?? null,
                triggerHumRise: triggerData?.humRise ?? null,
                triggerLuxDropPct: triggerData?.luxDropPct ?? null,
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
  endMetrics?: {
    temp: number | null
    hum: number | null
    lux: number | null
  },
  closeData?: {
    type: string | null
    minTemp?: number | null
    tempRecovery?: number | null
    tempVar?: number | null
    humVar?: number | null
    luxMax?: number | null
  },
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
            endTemp: endMetrics?.temp ?? null,
            endHum: endMetrics?.hum ?? null,
            endLux: endMetrics?.lux ?? null,
            closeType: closeData?.type ?? null,
            closeMinTemp: closeData?.minTemp ?? null,
            closeTempRecovery: closeData?.tempRecovery ?? null,
            closeTempVar: closeData?.tempVar ?? null,
            closeHumVar: closeData?.humVar ?? null,
            closeLuxMax: closeData?.luxMax ?? null,
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

  // 1. Autogenerar batches de lux de fallback si la cola está vacía o incompleta (ej: de noche o por fallo de hidratación)
  // para evitar TypeError en accesos directos a luxBatches[0] y bloqueos de retorno temprano.
  while (luxBatches.length < 4) {
    const refTimestamp = tempBatches.length > luxBatches.length
      ? tempBatches[luxBatches.length].timestamp
      : nowMs - luxBatches.length * 10 * 60 * 1000

    luxBatches.push({
      min: 0,
      max: 0,
      timestamp: refTimestamp,
      samples: Array(10).fill({ value: 0, timestamp: refTimestamp }),
    })
  }

  // 2. Necesitamos al menos 3 batches en temp y hum para poder evaluar derivadas
  if (tempBatches.length < 3 || humBatches.length < 3) {
    return
  }

  // 3. Extraer extremos del lote actual B0
  const currentMinTemp = tempBatches[0].min
  const currentMaxHum = humBatches[0].max
  const currentMinLux = luxBatches[0].min

  const isDay = isDaytime(tempBatches[0].timestamp)

  // Durante el día, sí requerimos que haya un lote de lux real válido para las reglas diurnas.
  // Si todos los samples son 0, significa que la cola de lux sigue siendo ficticia (sensor offline o atascado en 0 lx de día).
  if (isDay && luxBatches[0].max === 0 && luxBatches[0].samples.every((s) => s.value === 0)) {
    return
  }

  // A. Evaluar Inicio de Lluvia Inferida
  if (!inferedRainActive) {
    // Histéresis de 10 minutos tras el cese anterior
    if (lastInferedRainClosedAt !== null && nowMs - lastInferedRainClosedAt < 10 * 60 * 1000) {
      return
    }

    // Regla de Seguridad Física: No inferir lluvia bajo sol radiante constante
    if (currentMinLux >= 26000) {
      return
    }

    let triggered = false
    let tempBaselineAgeMinutes = 20
    let tempDeltaTemp = 0
    let tempDeltaHum = 0
    let dropPct = 0
    let isStagnantTriggered = false
    let stagnantVarTempPre = 0
    let calculatedBaselineTemp: number | null = null
    let calculatedBaselineHum: number | null = null
    let calculatedBaselineLux: number | null = null
    let triggerType: string | null = null

    // Paso 1 (20 minutos para Día / Ventana de 40 minutos para Noche)
    const baseTemp1 = tempBatches[1].max
    const baseHum1 = humBatches[1].min
    const baseLux1 = luxBatches[1].max
    const dTemp1 = currentMinTemp - baseTemp1
    const dHum1 = currentMaxHum - baseHum1

    if (isDay) {
      let luxCondition = false
      let tempDropThreshold = -3.0
      let humRobust = 12.0
      let humSensitive = 12.0
      let isSensible = false

      if (baseLux1 <= 15000) {
        // Rama A (Cielo muy nublado: <= 15 klx)
        luxCondition = true
        tempDropThreshold = -1.5
        humRobust = 12.0
        humSensitive = 10.0
      } else if (baseLux1 <= 26000) {
        // Rama C (Cielo intermedio: 15 klx < Lux <= 26 klx)
        luxCondition = currentMinLux <= baseLux1 * 0.6
        if (currentMinLux <= 15000) {
          isSensible = true
          tempDropThreshold = -1.5
          humRobust = 10.0
          humSensitive = 8.0
        }
      } else {
        // Rama B (Cielo soleado: > 26 klx)
        luxCondition = currentMinLux <= baseLux1 * 0.4
        if (currentMinLux <= 15000) {
          isSensible = true
          tempDropThreshold = -2.0
          humRobust = 10.0
          humSensitive = 8.0
        }
      }

      const humCondition =
        dHum1 >= humSensitive || (baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0)

      if (dTemp1 <= tempDropThreshold && humCondition && luxCondition) {
        let passesGradient = true
        const isPreSaturated = baseHum1 >= 90.0 && baseHum1 <= 95.0 && currentMaxHum >= 98.0

        if (dHum1 < humRobust && !isPreSaturated) {
          const hSlopes = getHumGradientMetrics(humBatches[0].samples)
          const tSlopes = getTempGradientMetrics(tempBatches[0].samples)
          const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
          const hasSteepTemp = tSlopes.maxDrop1m <= -0.5
          passesGradient = hasSteepHum || hasSteepTemp
        }

        if (passesGradient) {
          triggered = true
          tempBaselineAgeMinutes = 20
          tempDeltaTemp = dTemp1
          tempDeltaHum = dHum1
          dropPct = baseLux1 > 0 ? ((baseLux1 - currentMinLux) / baseLux1) * 100 : 0
          calculatedBaselineTemp = baseTemp1
          calculatedBaselineHum = baseHum1
          calculatedBaselineLux = baseLux1

          if (baseLux1 <= 10000) {
            triggerType = 'DAY_RAMA_A_OSCURO_20M'
          } else if (baseLux1 <= 15000) {
            triggerType = 'DAY_RAMA_A_NUBLADO_20M'
          } else if (baseLux1 <= 26000) {
            triggerType = isSensible ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_20M' : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_20M'
          } else {
            triggerType = isSensible ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_20M' : 'DAY_RAMA_B_SOLEADO_ROBUSTO_20M'
          }
        }
      }
    } else {
      // NOCHE - Regla Unificada de Gradiente Dinámico
      if (tempBatches.length >= 4 && humBatches.length >= 4) {
        // Calma previa (Lotes 1, 2, 3)
        const maxTempPre = Math.max(tempBatches[1].max, tempBatches[2].max, tempBatches[3].max)
        const minTempPre = Math.min(tempBatches[1].min, tempBatches[2].min, tempBatches[3].min)
        const varTempPre = maxTempPre - minTempPre

        const minHumPre = Math.min(humBatches[1].min, humBatches[2].min, humBatches[3].min)
        const maxHumPre = Math.max(humBatches[1].max, humBatches[2].max, humBatches[3].max)
        const varHumPre = maxHumPre - minHumPre

        // Bloque actual (Lotes 0, 1, 2)
        const maxTempCur = Math.max(tempBatches[0].max, tempBatches[1].max, tempBatches[2].max)
        const minTempCur = Math.min(tempBatches[0].min, tempBatches[1].min, tempBatches[2].min)
        const varTempCur = maxTempCur - minTempCur

        const minHumCur = Math.min(humBatches[0].min, humBatches[1].min, humBatches[2].min)
        const maxHumCur = Math.max(humBatches[0].max, humBatches[1].max, humBatches[2].max)
        const varHumCur = maxHumCur - minHumCur

        // Ruido para tooltips (máxima variación local en un lote individual)
        const varTemp1 = tempBatches[1].max - tempBatches[1].min
        const varTemp2 = tempBatches[2].max - tempBatches[2].min
        const varTemp3 = tempBatches[3].max - tempBatches[3].min
        const refVarTemp = Math.max(varTemp1, varTemp2, varTemp3, 0.15)

        const varHum1 = humBatches[1].max - humBatches[1].min
        const varHum2 = humBatches[2].max - humBatches[2].min
        const varHum3 = humBatches[3].max - humBatches[3].min
        const refVarHum = Math.max(varHum1, varHum2, varHum3, 0.5)

        const tempFloor = minHumPre >= 98.0 ? 0.8 : 0.7
        const tempDropThreshold = Math.max(tempFloor, varTempPre * 1.6)
        const humRiseThreshold = Math.max(3.0, varHumPre * 1.4)

        // Dirección y tendencias
        const trendTemp = tempBatches[0].min - tempBatches[2].max
        const isTempFalling = trendTemp < -0.1

        const trendHum = humBatches[0].max - humBatches[2].min
        const isHumRising = trendHum > 0.5

        const trendLux = luxBatches[0].max - luxBatches[1].max
        const isLuxRising = trendLux > 50 && luxBatches[0].min > 0

        const isTempDropAbrupt = varTempCur >= tempDropThreshold && isTempFalling
        const isHumRiseAbrupt = varHumCur >= humRiseThreshold && isHumRising
        const isPreSaturated = currentMaxHum >= 98.0 || humBatches[1].min >= 95.0

        if (isTempDropAbrupt && (isHumRiseAbrupt || (isPreSaturated && !isLuxRising))) {
          triggered = true
          tempBaselineAgeMinutes = 20
          tempDeltaTemp = currentMinTemp - tempBatches[1].max
          tempDeltaHum = currentMaxHum - humBatches[1].min
          isStagnantTriggered = true
          stagnantVarTempPre = varTempPre
          inferedBaselineVarTemp = refVarTemp
          inferedBaselineVarHum = refVarHum
          calculatedBaselineTemp = tempBatches[1].max
          calculatedBaselineHum = humBatches[1].min
          calculatedBaselineLux = 0
          triggerType = 'NIGHT_20M'
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
      let humRobust = 14.0
      let humSensitive = 14.0
      let isSensible = false

      if (baseLux2 <= 15000) {
        // Rama A (Cielo muy nublado: <= 15 klx)
        luxCondition = true
        tempDropThreshold = -2.5
        humRobust = 14.0
        humSensitive = 12.0
      } else if (baseLux2 <= 26000) {
        // Rama C (Cielo intermedio: 15 klx < Lux <= 26 klx)
        luxCondition = currentMinLux <= baseLux2 * 0.6
        if (currentMinLux <= 15000) {
          isSensible = true
          tempDropThreshold = -2.5
          humRobust = 12.0
          humSensitive = 10.0
        }
      } else {
        // Rama B (Cielo soleado: > 26 klx)
        luxCondition = currentMinLux <= baseLux2 * 0.4
        if (currentMinLux <= 15000) {
          isSensible = true
          tempDropThreshold = -3.0
          humRobust = 12.0
          humSensitive = 10.0
        }
      }

      const humCondition =
        dHum2 >= humSensitive || (baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0)

      if (dTemp2 <= tempDropThreshold && humCondition && luxCondition) {
        let passesGradient = true
        const isPreSaturated = baseHum2 >= 88.0 && baseHum2 <= 95.0 && currentMaxHum >= 98.0

        if (dHum2 < humRobust && !isPreSaturated) {
          const hSlopes = getHumGradientMetrics(humBatches[0].samples)
          const tSlopes = getTempGradientMetrics(tempBatches[0].samples)
          const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
          const hasSteepTemp = tSlopes.maxDrop1m <= -0.5
          passesGradient = hasSteepHum || hasSteepTemp
        }

        if (passesGradient) {
          triggered = true
          tempBaselineAgeMinutes = 30
          tempDeltaTemp = dTemp2
          tempDeltaHum = dHum2
          dropPct = baseLux2 > 0 ? ((baseLux2 - currentMinLux) / baseLux2) * 100 : 0
          calculatedBaselineTemp = baseTemp2
          calculatedBaselineHum = baseHum2
          calculatedBaselineLux = baseLux2

          if (baseLux2 <= 10000) {
            triggerType = 'DAY_RAMA_A_OSCURO_30M'
          } else if (baseLux2 <= 15000) {
            triggerType = 'DAY_RAMA_A_NUBLADO_30M'
          } else if (baseLux2 <= 26000) {
            triggerType = isSensible ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_30M' : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_30M'
          } else {
            triggerType = isSensible ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_30M' : 'DAY_RAMA_B_SOLEADO_ROBUSTO_30M'
          }
        }
      }
    }

    // Paso 3 (40 minutos para Día / Saltado en Noche)
    if (!triggered && isDay && tempBatches.length >= 4 && humBatches.length >= 4 && luxBatches.length >= 4) {
      const baseTemp3 = tempBatches[3].max
      const baseHum3 = humBatches[3].min
      const baseLux3 = luxBatches[3].max
      const dTemp3 = currentMinTemp - baseTemp3
      const dHum3 = currentMaxHum - baseHum3

      let luxCondition = false
      let tempDropThreshold = -4.0
      let humRobust = 18.0
      let humSensitive = 18.0
      let isSensible = false

      if (baseLux3 <= 15000) {
        // Rama A (Cielo muy nublado: <= 15 klx)
        luxCondition = true
        tempDropThreshold = -3.5
        humRobust = 16.0
        humSensitive = 14.0
      } else if (baseLux3 <= 26000) {
        // Rama C (Cielo intermedio: 15 klx < Lux <= 26 klx)
        luxCondition = currentMinLux <= baseLux3 * 0.6
        if (currentMinLux <= 15000) {
          isSensible = true
          tempDropThreshold = -3.5
          humRobust = 14.0
          humSensitive = 12.0
        }
      } else {
        // Rama B (Cielo soleado: > 26 klx)
        luxCondition = currentMinLux <= baseLux3 * 0.4
        if (currentMinLux <= 15000) {
          isSensible = true
          tempDropThreshold = -4.0
          humRobust = 14.0
          humSensitive = 12.0
        }
      }

      const humCondition =
        dHum3 >= humSensitive || (baseHum3 >= 86.0 && baseHum3 <= 95.0 && currentMaxHum >= 98.0)

      if (dTemp3 <= tempDropThreshold && humCondition && luxCondition) {
        let passesGradient = true
        const isPreSaturated = baseHum3 >= 86.0 && baseHum3 <= 95.0 && currentMaxHum >= 98.0

        if (dHum3 < humRobust && !isPreSaturated) {
          const hSlopes = getHumGradientMetrics(humBatches[0].samples)
          const tSlopes = getTempGradientMetrics(tempBatches[0].samples)
          const hasSteepHum = hSlopes.max1m >= 1.8 || hSlopes.max2m >= 2.5
          const hasSteepTemp = tSlopes.maxDrop1m <= -0.5
          passesGradient = hasSteepHum || hasSteepTemp
        }

        if (passesGradient) {
          triggered = true
          tempBaselineAgeMinutes = 40
          tempDeltaTemp = dTemp3
          tempDeltaHum = dHum3
          dropPct = baseLux3 > 0 ? ((baseLux3 - currentMinLux) / baseLux3) * 100 : 0
          calculatedBaselineTemp = baseTemp3
          calculatedBaselineHum = baseHum3
          calculatedBaselineLux = baseLux3

          if (baseLux3 <= 10000) {
            triggerType = 'DAY_RAMA_A_OSCURO_40M'
          } else if (baseLux3 <= 15000) {
            triggerType = 'DAY_RAMA_A_NUBLADO_40M'
          } else if (baseLux3 <= 26000) {
            triggerType = isSensible ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_40M' : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_40M'
          } else {
            triggerType = isSensible ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_40M' : 'DAY_RAMA_B_SOLEADO_ROBUSTO_40M'
          }
        }
      }
    }

    if (triggered) {
      inferedRainActive = true
      inferedRainOverridden = false

      inferedBaselineLux = calculatedBaselineLux ?? luxBatches[0].max
      inferedBaselineTemp = calculatedBaselineTemp ?? tempBatches[0].max
      inferedBaselineHum = calculatedBaselineHum ?? humBatches[0].min

      let preciseStartMs = nowMs
      const baselineT = calculatedBaselineTemp ?? tempBatches[1]?.max ?? inferedBaselineTemp
      const samplesT = tempBatches[0].samples
      // Estimación retrospectiva del inicio preciso de lluvia:
      // De día busca caída térmica de -1.2°C; de noche se ajusta a -0.20°C para absorber inercia del sensor.
      const dropThreshold = isDay ? -1.2 : -0.20
      const matchingSample = samplesT.find((s) => s.value - baselineT <= dropThreshold)

      if (matchingSample) {
        preciseStartMs = matchingSample.timestamp
      } else {
        const minSample = samplesT.reduce((min, s) => (s.value < min.value ? s : min), samplesT[0])

        if (minSample) preciseStartMs = minSample.timestamp
      }

      inferedRainStartedAt = preciseStartMs

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
          new Date(preciseStartMs),
          true,
          {
            temp: inferedBaselineTemp,
            hum: inferedBaselineHum,
            lux: inferedBaselineLux,
            ageMinutes: tempBaselineAgeMinutes,
          },
          `Inferencia de Día${tagMode}: Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${tempDeltaTemp.toFixed(1)}°C en ${tempBaselineAgeMinutes}m (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`,
          {
            temp: currentMinTemp,
            hum: currentMaxHum,
            lux: currentMinLux,
          },
          {
            type: triggerType,
            tempDrop: tempDeltaTemp,
            humRise: tempDeltaHum,
            luxDropPct: dropPct,
          },
        )
      } else {
        const rainNotes = isStagnantTriggered
          ? `Inferencia de Noche (Gradiente por Estancamiento): Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${Math.abs(tempDeltaTemp).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%)`
          : `Inferencia de Noche: Incremento de +${tempDeltaHum.toFixed(1)}% HR y caída térmica de ${Math.abs(tempDeltaTemp).toFixed(1)}°C (Temp: ${currentMinTemp.toFixed(1)}°C, Hum: ${currentMaxHum.toFixed(1)}%)`

        Logger.rain(
          isStagnantTriggered
            ? `[RainManager] Lluvia Inferida [NOCHE - GRADIENTE ESTANCAMIENTO]: deltaTemp=${tempDeltaTemp.toFixed(1)}°C (HR: ${currentMaxHum.toFixed(1)}%), varTempPre=${stagnantVarTempPre.toFixed(2)}°C.`
            : `[RainManager] Lluvia Inferida [NOCHE]: deltaHR=${tempDeltaHum.toFixed(1)}%, deltaTemp=${tempDeltaTemp.toFixed(1)}°C, ventana: ${tempBaselineAgeMinutes}m.`,
        )

        await openRainEvent(
          new Date(preciseStartMs),
          true,
          {
            temp: inferedBaselineTemp,
            hum: inferedBaselineHum,
            lux: inferedBaselineLux,
            ageMinutes: tempBaselineAgeMinutes,
          },
          rainNotes,
          {
            temp: currentMinTemp,
            hum: currentMaxHum,
            lux: currentMinLux,
          },
          {
            type: triggerType,
            tempDrop: tempDeltaTemp,
            humRise: tempDeltaHum,
            luxDropPct: 0,
          },
        )
      }
    }
  } else {
    // B. Evaluar Cese de Lluvia Inferida (si ya está activa)
    if (inferedRainStartedAt !== null) {
      const durationMin = (nowMs - inferedRainStartedAt) / 60000

      // 1. Actualizar extremos en lluvia primero
      minLuxInRain = Math.min(minLuxInRain ?? currentMinLux, currentMinLux)
      minTempInRain = Math.min(minTempInRain ?? currentMinTemp, currentMinTemp)
      maxHumInRain = Math.max(maxHumInRain ?? currentMaxHum, currentMaxHum)

      let closedByRecovery = false

      // Criterios Diurnos de Cese (Prioridad Principal)
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

          const tempThreshold = minTempInRain + Math.max(0.6, tempDrop * 0.35)
          const humThreshold = maxHumInRain - Math.max(2.0, humRise * 0.15)

          const tempRecovered = currentTemp >= tempThreshold
          const humRecovered = currentHum <= humThreshold

          if (tempRecovered && humRecovered) {
            closedByRecovery = true
            let preciseEndMs = nowMs
            const matchingEndSample = tempBatches[0].samples.find((s) => s.value >= tempThreshold)

            if (matchingEndSample) {
              preciseEndMs = matchingEndSample.timestamp
            } else {
              const lastSample = tempBatches[0].samples[tempBatches[0].samples.length - 1]

              if (lastSample) preciseEndMs = lastSample.timestamp
            }

            const endSampleT =
              tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              tempBatches[0].samples[tempBatches[0].samples.length - 1]
            const endSampleH =
              humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              humBatches[0].samples[humBatches[0].samples.length - 1]
            const endSampleL =
              luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              luxBatches[0].samples[luxBatches[0].samples.length - 1]

            Logger.rain(
              `[RainManager] Cierre por Recuperación Adaptativa: Temp: ${currentTemp.toFixed(1)}°C >= ${tempThreshold.toFixed(1)}°C, Hum: ${currentHum.toFixed(1)}% <= ${humThreshold.toFixed(1)}% (DropTemp=${tempDrop.toFixed(1)}°C).`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null
            await closeRainEvent(
              'BASELINE_RECOVERY',
              new Date(preciseEndMs),
              true,
              `Cese de lluvia (térmico/hídrico): temperatura subió a ${currentTemp.toFixed(1)}°C (umbral: ${tempThreshold.toFixed(1)}°C) y humedad bajó a ${currentHum.toFixed(1)}% (umbral: ${humThreshold.toFixed(1)}% HR) (Temp: ${currentTemp.toFixed(1)}°C, Hum: ${currentHum.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`,
              {
                temp: endSampleT ? endSampleT.value : currentTemp,
                hum: endSampleH ? endSampleH.value : currentHum,
                lux: endSampleL ? endSampleL.value : currentMinLux,
              },
              {
                type: 'BASELINE_RECOVERY',
                minTemp: minTempInRain,
                tempRecovery: (endSampleT ? endSampleT.value : currentTemp) - minTempInRain,
                humVar: maxHumInRain - (endSampleH ? endSampleH.value : currentHum),
              },
            )
            maxHumInRain = null
          }
        }

        // 3. Recuperación Solar Adaptativa por Despeje con VALIDACIÓN CRUZADA
        if (!closedByRecovery && inferedBaselineLux !== null && minLuxInRain !== null) {
          const preLux = inferedBaselineLux
          const minLux = minLuxInRain
          const relativeDrop = Math.min(1.0, (preLux - minLux) / preLux)
          const alpha = 1.0 - 0.65 * relativeDrop
          const luxRecoveryThreshold = minLux + alpha * (preLux - minLux)

          const currentMaxLux = luxBatches[0].max

          const lastTempDrop = tempBatches[1].max - tempBatches[0].max
          const isTempStableOrRising = lastTempDrop <= 0.2

          const isUnconditionalSolar = currentMaxLux >= 26000
          const isConditionalSolar =
            currentMaxLux >= luxRecoveryThreshold && isTempStableOrRising && currentMaxLux >= 15000

          if (isUnconditionalSolar || isConditionalSolar) {
            closedByRecovery = true
            let preciseEndMs = nowMs
            const targetThreshold = isUnconditionalSolar ? 26000 : luxRecoveryThreshold
            const matchingEndSample = luxBatches[0].samples.find((s) => s.value >= targetThreshold)

            if (matchingEndSample) {
              preciseEndMs = matchingEndSample.timestamp
            } else {
              const lastSample = luxBatches[0].samples[luxBatches[0].samples.length - 1]

              if (lastSample) preciseEndMs = lastSample.timestamp
            }

            if (preciseEndMs < inferedRainStartedAt) {
              preciseEndMs = inferedRainStartedAt
            }

            const endSampleT =
              tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              tempBatches[0].samples[tempBatches[0].samples.length - 1]
            const endSampleH =
              humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              humBatches[0].samples[humBatches[0].samples.length - 1]
            const endSampleL =
              luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              luxBatches[0].samples[luxBatches[0].samples.length - 1]

            Logger.rain(
              `[RainManager] Cierre por Recuperación Solar Cruzada: Lux max: ${currentMaxLux.toFixed(0)} lx (Uncond=${isUnconditionalSolar}, Cond=${isConditionalSolar}).`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            maxHumInRain = null
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null

            const closeReasonText = isUnconditionalSolar
              ? `SOLAR_RECOVERY (Sol radiante pleno >= 26k lx, Lux max: ${currentMaxLux.toFixed(0)} lx)`
              : `Despeje solar verificado: iluminancia subió a ${Math.round(currentMaxLux).toLocaleString()} lx (umbral elástico: ${Math.round(luxRecoveryThreshold).toLocaleString()} lx) acoplado a estabilidad térmica en el lote actual (Lux max: ${currentMaxLux.toFixed(0)} lx >= ${luxRecoveryThreshold.toFixed(0)} lx, Temp: ${tempBatches[0].min.toFixed(1)}°C, Hum: ${tempBatches[0].max.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`

            await closeRainEvent(
              'SOLAR_RECOVERY',
              new Date(preciseEndMs),
              true,
              closeReasonText,
              {
                temp: endSampleT ? endSampleT.value : tempBatches[0].min,
                hum: endSampleH ? endSampleH.value : tempBatches[0].max,
                lux: endSampleL ? endSampleL.value : currentMinLux,
              },
              {
                type: 'SOLAR_RECOVERY',
                luxMax: currentMaxLux,
              },
            )
          }
        }
      }

      // 4. Cese por Variación Térmica Diurna (Cese de Lluvia Intermitente)
      if (!closedByRecovery && isDay && minTempInRain !== null) {
        const currentTemp = tempBatches[0].min
        const tempRecovery = currentTemp - minTempInRain

        if (tempRecovery >= 0.6) {
          closedByRecovery = true
          let preciseEndMs = nowMs
          const matchingEndSample = tempBatches[0].samples.find(
            (s) => s.value >= minTempInRain! + 0.6,
          )

          if (matchingEndSample) {
            preciseEndMs = matchingEndSample.timestamp
          } else {
            const lastSample = tempBatches[0].samples[tempBatches[0].samples.length - 1]

            if (lastSample) preciseEndMs = lastSample.timestamp
          }

          if (preciseEndMs < inferedRainStartedAt) {
            preciseEndMs = inferedRainStartedAt
          }

          const endSampleT =
            tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
            tempBatches[0].samples[tempBatches[0].samples.length - 1]
          const endSampleH =
            humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
            humBatches[0].samples[humBatches[0].samples.length - 1]
          const endSampleL =
            luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
            luxBatches[0].samples[luxBatches[0].samples.length - 1]

          Logger.rain(
            `[RainManager] Cierre por Variación Térmica: Temp subió +${tempRecovery.toFixed(2)}°C desde el mínimo (${minTempInRain.toFixed(1)}°C).`,
          )
          inferedRainActive = false
          inferedRainOverridden = true
          maxHumInRain = null
          inferedBaselineVarTemp = null
          inferedBaselineVarHum = null

          const closeReasonText = `🌡️ Cese de Lluvia Intermitente (Variación Térmica): la temperatura se recuperó +${tempRecovery.toFixed(2)}°C (Temp: ${currentTemp.toFixed(1)}°C vs mínimo en lluvia: ${minTempInRain.toFixed(1)}°C, Hum: ${tempBatches[0].max.toFixed(1)}% HR, Lux: ${currentMinLux.toFixed(0)} lx)`

          await closeRainEvent(
            'THERMAL_VARIATION',
            new Date(preciseEndMs),
            true,
            closeReasonText,
            {
              temp: endSampleT ? endSampleT.value : currentTemp,
              hum: endSampleH ? endSampleH.value : tempBatches[0].max,
              lux: endSampleL ? endSampleL.value : currentMinLux,
            },
            {
              type: 'THERMAL_VARIATION',
              minTemp: minTempInRain,
              tempRecovery: tempRecovery,
            },
          )
        }
      }

      if (closedByRecovery) return

      // 5. Cese Dinámico por Estancamiento de Variables (Fallback de Última Instancia)
      if (durationMin >= 15 && tempBatches.length >= 1 && humBatches.length >= 1) {
        const diffHum = humBatches[0].max - humBatches[0].min
        const diffTemp = tempBatches[0].max - tempBatches[0].min

        const tempCeseThreshold =
          inferedBaselineVarTemp !== null ? Math.max(0.4, 1.2 * inferedBaselineVarTemp) : 0.4
        const humCeseThreshold =
          inferedBaselineVarHum !== null ? Math.max(1.0, 1.2 * inferedBaselineVarHum) : 1.0

        const isSaturated = humBatches[0].max >= 100.0
        const isHumStagnant = isSaturated ? true : diffHum <= humCeseThreshold

        if (isHumStagnant && diffTemp <= tempCeseThreshold) {
          let allowStagnantClose = true

          // Guardia Térmica Unificada (B0 a B4 si saturado, B0 a B2 de lo contrario)
          if (isDay) {
            if (isSaturated) {
              if (tempBatches.length >= 5) {
                const maxTemp50 = Math.max(
                  tempBatches[0].max,
                  tempBatches[1].max,
                  tempBatches[2].max,
                  tempBatches[3].max,
                  tempBatches[4].max,
                )
                const caidaNeta50 = maxTemp50 - tempBatches[0].min

                allowStagnantClose = caidaNeta50 <= 0.4
              } else if (tempBatches.length >= 4) {
                const maxTemp40 = Math.max(
                  tempBatches[0].max,
                  tempBatches[1].max,
                  tempBatches[2].max,
                  tempBatches[3].max,
                )
                const caidaNeta40 = maxTemp40 - tempBatches[0].min

                allowStagnantClose = caidaNeta40 <= 0.4
              } else if (tempBatches.length >= 3) {
                const maxTemp30 = Math.max(
                  tempBatches[0].max,
                  tempBatches[1].max,
                  tempBatches[2].max,
                )
                const caidaNeta30 = maxTemp30 - tempBatches[0].min

                allowStagnantClose = caidaNeta30 <= 0.4
              } else if (tempBatches.length >= 2) {
                const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)
                const caidaNeta20 = maxTemp20 - tempBatches[0].min

                allowStagnantClose = caidaNeta20 <= 0.4
              }
            } else {
              if (tempBatches.length >= 3) {
                const maxTemp30 = Math.max(
                  tempBatches[0].max,
                  tempBatches[1].max,
                  tempBatches[2].max,
                )
                const caidaNeta30 = maxTemp30 - tempBatches[0].min

                allowStagnantClose = caidaNeta30 <= 0.4
              } else if (tempBatches.length >= 2) {
                const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)
                const caidaNeta20 = maxTemp20 - tempBatches[0].min

                allowStagnantClose = caidaNeta20 <= 0.4
              }
            }
          }

          if (allowStagnantClose) {
            let preciseEndMs = nowMs

            const combinedTempSamples: Sample[] = []
            const combinedHumSamples: Sample[] = []

            if (tempBatches.length >= 1) combinedTempSamples.push(...tempBatches[0].samples)
            if (tempBatches.length >= 2) combinedTempSamples.push(...tempBatches[1].samples)

            if (humBatches.length >= 1) combinedHumSamples.push(...humBatches[0].samples)
            if (humBatches.length >= 2) combinedHumSamples.push(...humBatches[1].samples)

            combinedTempSamples.sort((a, b) => b.timestamp - a.timestamp)
            combinedHumSamples.sort((a, b) => b.timestamp - a.timestamp)

            if (combinedTempSamples.length > 0 && combinedHumSamples.length > 0) {
              const lastSample = combinedTempSamples[0]
              preciseEndMs = lastSample.timestamp

              const lastT = lastSample.value
              const lastHSample = combinedHumSamples.find((s) => Math.abs(s.timestamp - lastSample.timestamp) < 5000)
              const lastH = lastHSample ? lastHSample.value : combinedHumSamples[0].value

              for (const tSample of combinedTempSamples) {
                const hSample = combinedHumSamples.find((s) => Math.abs(s.timestamp - tSample.timestamp) < 5000)
                if (hSample) {
                  const diffT = Math.abs(tSample.value - lastT)
                  const diffH = Math.abs(hSample.value - lastH)

                  if (diffT <= 0.15 && diffH <= 0.5) {
                    preciseEndMs = tSample.timestamp
                  } else {
                    break
                  }
                }
              }
            }

            const endSampleT =
              tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              (tempBatches.length >= 2 && tempBatches[1].samples.find((s) => s.timestamp === preciseEndMs)) ||
              tempBatches[0].samples[tempBatches[0].samples.length - 1]
            const endSampleH =
              humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              (humBatches.length >= 2 && humBatches[1].samples.find((s) => s.timestamp === preciseEndMs)) ||
              humBatches[0].samples[humBatches[0].samples.length - 1]
            const endSampleL =
              luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              (luxBatches.length >= 2 && luxBatches[1].samples.find((s) => s.timestamp === preciseEndMs)) ||
              luxBatches[0].samples[luxBatches[0].samples.length - 1]

            const isSustained = durationMin >= 60
            const typeLabel = isSustained
              ? 'Lluvia Intermitente'
              : 'Estancamiento climático dinámico'

            const hours = Math.floor(durationMin / 60)
            const minutes = Math.round(durationMin % 60)
            const durationStr =
              hours > 0 ? (minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`) : `${minutes}min`

            const closeReasonText = isSustained
              ? isDay
                ? `☀️ Cese de Lluvia Intermitente (Estancamiento): estabilidad climática alcanzada tras lluvia prolongada (duración: ${durationStr}). Sin variación significativa de temperatura (variación ≤ ${tempCeseThreshold.toFixed(1)}°C) ni humedad (variación ≤ ${humCeseThreshold.toFixed(1)}% HR) durante 10 minutos (dT=${diffTemp.toFixed(1)}°C, dH=${diffHum.toFixed(1)}% HR, Temp: ${endSampleT.value.toFixed(1)}°C, Hum: ${endSampleH.value.toFixed(1)}% HR).`
                : `☁️ Cese de Lluvia Intermitente (Estancamiento Nocturno): estabilidad climática alcanzada tras lluvia prolongada (duración: ${durationStr}). Sin variación significativa de temperatura (variación ≤ ${tempCeseThreshold.toFixed(1)}°C) ni humedad (variación ≤ ${humCeseThreshold.toFixed(1)}% HR) durante 10 minutos (dT=${diffTemp.toFixed(1)}°C, dH=${diffHum.toFixed(1)}% HR, Temp: ${endSampleT.value.toFixed(1)}°C, Hum: ${endSampleH.value.toFixed(1)}% HR).`
              : `Estancamiento climático dinámico: sin fluctuación de temperatura (variación ≤ ${tempCeseThreshold.toFixed(1)}°C) ni humedad (variación ≤ ${humCeseThreshold.toFixed(1)}% HR) durante 10 minutos (dT=${diffTemp.toFixed(1)}°C, dH=${diffHum.toFixed(1)}% HR, Temp: ${tempBatches[0].min.toFixed(1)}°C, Hum: ${tempBatches[0].max.toFixed(1)}%, Lux: ${currentMinLux.toFixed(0)} lx)`

            Logger.rain(
              `[RainManager] Cierre por Estancamiento de Variables (15m+): Rango HR: ${diffHum.toFixed(1)}% <= ${humCeseThreshold.toFixed(1)}%, Rango Temp: ${diffTemp.toFixed(1)}°C <= ${tempCeseThreshold.toFixed(1)}°C (últimos 10 min). Categoría: ${typeLabel}.`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            maxHumInRain = null
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null

            await closeRainEvent(
              'STAGNANT',
              new Date(preciseEndMs),
              true,
              closeReasonText,
              {
                temp: endSampleT ? endSampleT.value : currentMinTemp,
                hum: endSampleH ? endSampleH.value : currentMaxHum,
                lux: endSampleL ? endSampleL.value : currentMinLux,
              },
              {
                type: isDay ? 'STAGNANT_DAY' : 'STAGNANT_NIGHT',
                tempVar: diffTemp,
                humVar: diffHum,
              },
            )

            // Si fue lluvia sostenida prolongada, actualizamos el triggerReason en Postgres
            if (isSustained && openVirtualRainEventId) {
              try {
                const currentEvent = await prisma.rainEvent.findUnique({
                  where: { id: openVirtualRainEventId },
                })
                const originalReason = currentEvent?.triggerReason || ''
                const newReason = originalReason.startsWith('Lluvia Intermitente')
                  ? originalReason
                  : `Lluvia Intermitente: ${originalReason}`

                await prisma.rainEvent.update({
                  where: { id: openVirtualRainEventId },
                  data: { triggerReason: newReason },
                })
              } catch {
                // Silencioso
              }
            }

            return
          }
        }
      }
    }
  }
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) return new Date(s)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}
