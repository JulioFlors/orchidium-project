import { prisma } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'
import {
  isPhysicalRainActive,
  getPhysicalRainStatusSummary,
  hydratePhysicalState,
} from './drops-sensor-manager'

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
const tempBatches: BatchSummary[] = []
const humBatches: BatchSummary[] = []
const luxBatches: BatchSummary[] = []

let rainEventMutex = Promise.resolve()

// Helper para empujar métricas a las colas de batches deslizantes (10 min de ventana por lote)
function pushBatchMetrics(queue: BatchSummary[], values: number[], isLux = false) {
  if (values.length === 0) return
  const now = Date.now()

  const samples = values.map((val, idx) => ({
    value: val,
    timestamp: now - (values.length - 1 - idx) * 60000,
  }))

  if (queue.length > 0 && now - queue[0].timestamp < 10 * 60 * 1000) {
    // Ventana de 10 min
    queue[0].samples.push(...samples)
    // queue[0].timestamp = now // Evita el deslizamiento infinito de la ventana

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
  const physicalEffective = isPhysicalRainActive()
  const inferedEffective = inferedRainActive && !inferedRainOverridden

  return physicalEffective || inferedEffective
}

/**
 * Retorna un resumen del estado para depuración y logs.
 */
export function getRainStatusSummary() {
  const physical = getPhysicalRainStatusSummary()

  return {
    physicalActive: physical.physicalActive,
    physicalOverridden: physical.physicalOverridden,
    inferedActive: inferedRainActive,
    inferedOverridden: inferedRainOverridden,
    isCurrentlyRaining: isCurrentlyRaining(),
    openPhysicalRainEventId: physical.openPhysicalRainEventId,
    openVirtualRainEventId,
    tempBatchesLength: tempBatches.length,
    humBatchesLength: humBatches.length,
    luxBatchesLength: luxBatches.length,
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
    // 1. Hidratar el estado del sensor físico de lluvia en su propio módulo
    await hydratePhysicalState()

    // 2. Recuperar eventos inferidos huérfanos de Postgres
    const openVirtual = await prisma.rainEvent.findFirst({
      where: { zone: 'EXTERIOR', endedAt: null, isInfered: true },
      orderBy: { startedAt: 'desc' },
    })

    if (openVirtual) {
      openVirtualRainEventId = openVirtual.id
      inferedRainActive = true
      Logger.rain(`Evento virtual huérfano recuperado`)
    }

    // 3. Hidratar los batches en memoria desde InfluxDB (últimos 75 min)
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
      Logger.rain(`Hidratación inicial completa: ${tempBatches.length} lotes climáticos cargados.`)
    }
  } catch (err) {
    Logger.error('Error hidratando estado de lluvia:', err)
  }
}

/**
 * Abre un nuevo evento de lluvia inferida en Postgres protegiéndolo con mutex.
 */
async function openRainEvent(
  timestamp: Date = new Date(),
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
      const currentId = openVirtualRainEventId
      const label = 'inferido'

      if (!currentId) {
        try {
          const existing = await prisma.rainEvent.findFirst({
            where: { zone: 'EXTERIOR', endedAt: null, isInfered: true },
            orderBy: { startedAt: 'desc' },
          })

          if (existing) {
            openVirtualRainEventId = existing.id
            Logger.rain(`Evento de lluvia ${label} reanudado`)
          } else {
            const newEvent = await prisma.rainEvent.create({
              data: {
                startedAt: timestamp,
                zone: 'EXTERIOR',
                isInfered: true,
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

            openVirtualRainEventId = newEvent.id
            Logger.rain(`Evento de lluvia ${label} abierto`)
          }
        } catch (err) {
          Logger.error(`Error abriendo RainEvent ${label} en Postgres:`, err)
        }
      }
    })
    .catch((err) => {
      Logger.error('Error en Mutex de openRainEvent:', err)
    })
  await rainEventMutex
}

/**
 * Cese de un evento de lluvia inferida abierto en Postgres.
 */
async function closeRainEvent(
  reason: string,
  endTime: Date = new Date(),
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
      let eventId = openVirtualRainEventId
      const label = 'inferido'

      if (!eventId) {
        const existing = await prisma.rainEvent
          .findFirst({
            where: { zone: 'EXTERIOR', endedAt: null, isInfered: true },
            orderBy: { startedAt: 'desc' },
          })
          .catch(() => null)

        if (!existing) return
        eventId = existing.id
      }

      try {
        const event = await prisma.rainEvent.findUnique({ where: { id: eventId } })

        if (!event || event.endedAt) {
          openVirtualRainEventId = null

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
          Logger.warn('No se pudo recuperar la intensidad de lluvia de InfluxDB:', err)
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
          `Evento de lluvia ${label} cerrado (${reason}) — Duración: ${Math.round(durationSeconds / 60)} min${intensityLog}`,
        )

        lastInferedRainClosedAt = endTime.getTime()
      } catch (err) {
        Logger.error(`Error cerrando RainEvent ${label} en Postgres:`, err)
      } finally {
        openVirtualRainEventId = null
      }
    })
    .catch((err) => {
      Logger.error('Error en Mutex de closeRainEvent:', err)
    })
  await rainEventMutex
}

/**
 * Evalúa las colas de batches del motor de inferencia termodinámica de lluvia.
 */
export async function evaluateClimateInference(): Promise<void> {
  const nowMs = Date.now()

  // 1. Autogenerar batches de lux de fallback si la cola está vacía o incompleta
  while (luxBatches.length < 4) {
    const refTimestamp =
      tempBatches.length > luxBatches.length
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

    // Paso 1 — Diurno: 10 min previos a B0 / Noche: ventana de 30 min (B1-B3)
    const baseTemp1 = tempBatches[1].max
    const baseHum1 = humBatches[1].min
    const baseLux1 = luxBatches[1].max
    const dTemp1 = currentMinTemp - baseTemp1
    const dHum1 = currentMaxHum - baseHum1

    if (isDay) {
      let luxCondition = false
      let tempDropThreshold = -1.5
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
          tempBaselineAgeMinutes = 10
          tempDeltaTemp = dTemp1
          tempDeltaHum = dHum1
          dropPct = baseLux1 > 0 ? ((baseLux1 - currentMinLux) / baseLux1) * 100 : 0
          calculatedBaselineTemp = baseTemp1
          calculatedBaselineHum = baseHum1
          calculatedBaselineLux = baseLux1

          if (baseLux1 <= 10000) {
            triggerType = 'DAY_RAMA_A_OSCURO_10M'
          } else if (baseLux1 <= 15000) {
            triggerType = 'DAY_RAMA_A_NUBLADO_10M'
          } else if (baseLux1 <= 26000) {
            triggerType = isSensible
              ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_10M'
              : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_10M'
          } else {
            triggerType = isSensible
              ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_10M'
              : 'DAY_RAMA_B_SOLEADO_ROBUSTO_10M'
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

        // Ruido para tooltips
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
          tempBaselineAgeMinutes = 10
          tempDeltaTemp = currentMinTemp - tempBatches[1].max
          tempDeltaHum = currentMaxHum - humBatches[1].min
          isStagnantTriggered = true
          stagnantVarTempPre = varTempPre
          inferedBaselineVarTemp = refVarTemp
          inferedBaselineVarHum = refVarHum
          calculatedBaselineTemp = tempBatches[1].max
          calculatedBaselineHum = humBatches[1].min
          calculatedBaselineLux = 0
          triggerType = 'NIGHT_10M'
        }
      }
    }

    // Paso 2 — Diurno: 20 min previos a B0 (Solo día, saltado en noche)
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
          tempBaselineAgeMinutes = 20
          tempDeltaTemp = dTemp2
          tempDeltaHum = dHum2
          dropPct = baseLux2 > 0 ? ((baseLux2 - currentMinLux) / baseLux2) * 100 : 0
          calculatedBaselineTemp = baseTemp2
          calculatedBaselineHum = baseHum2
          calculatedBaselineLux = baseLux2

          if (baseLux2 <= 10000) {
            triggerType = 'DAY_RAMA_A_OSCURO_20M'
          } else if (baseLux2 <= 15000) {
            triggerType = 'DAY_RAMA_A_NUBLADO_20M'
          } else if (baseLux2 <= 26000) {
            triggerType = isSensible
              ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_20M'
              : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_20M'
          } else {
            triggerType = isSensible
              ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_20M'
              : 'DAY_RAMA_B_SOLEADO_ROBUSTO_20M'
          }
        }
      }
    }

    // Paso 3 — Diurno: 30 min previos a B0 (Solo día, saltado en noche)
    if (
      !triggered &&
      isDay &&
      tempBatches.length >= 4 &&
      humBatches.length >= 4 &&
      luxBatches.length >= 4
    ) {
      const baseTemp3 = tempBatches[3].max
      const baseHum3 = humBatches[3].min
      const baseLux3 = luxBatches[3].max
      const dTemp3 = currentMinTemp - baseTemp3
      const dHum3 = currentMaxHum - baseHum3

      let luxCondition = false
      let tempDropThreshold = -3.5
      let humRobust = 16.0
      let humSensitive = 14.0
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
          tempBaselineAgeMinutes = 30
          tempDeltaTemp = dTemp3
          tempDeltaHum = dHum3
          dropPct = baseLux3 > 0 ? ((baseLux3 - currentMinLux) / baseLux3) * 100 : 0
          calculatedBaselineTemp = baseTemp3
          calculatedBaselineHum = baseHum3
          calculatedBaselineLux = baseLux3

          if (baseLux3 <= 10000) {
            triggerType = 'DAY_RAMA_A_OSCURO_30M'
          } else if (baseLux3 <= 15000) {
            triggerType = 'DAY_RAMA_A_NUBLADO_30M'
          } else if (baseLux3 <= 26000) {
            triggerType = isSensible
              ? 'DAY_RAMA_C_INTERMEDIO_SENSIBLE_30M'
              : 'DAY_RAMA_C_INTERMEDIO_ROBUSTO_30M'
          } else {
            triggerType = isSensible
              ? 'DAY_RAMA_B_SOLEADO_SENSIBLE_30M'
              : 'DAY_RAMA_B_SOLEADO_ROBUSTO_30M'
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
      const dropThreshold = isDay ? -1.2 : -0.2
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
          `Lluvia Inferida [DÍA${tagMode}]: deltaHR=${tempDeltaHum.toFixed(1)}%, deltaTemp=${tempDeltaTemp.toFixed(1)}°C, Lux min actual: ${currentMinLux.toFixed(0)}lx vs baseline: ${inferedBaselineLux.toFixed(0)}lx (${dropPct.toFixed(0)}% caída).`,
        )

        await openRainEvent(
          new Date(preciseStartMs),
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
            ? `Lluvia Inferida [NOCHE - GRADIENTE ESTANCAMIENTO]: deltaTemp=${tempDeltaTemp.toFixed(1)}°C (HR: ${currentMaxHum.toFixed(1)}%), varTempPre=${stagnantVarTempPre.toFixed(2)}°C.`
            : `Lluvia Inferida [NOCHE]: deltaHR=${tempDeltaHum.toFixed(1)}%, deltaTemp=${tempDeltaTemp.toFixed(1)}°C, ventana: ${tempBaselineAgeMinutes}m.`,
        )

        await openRainEvent(
          new Date(preciseStartMs),
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

      // ── Criterios Diurnos de Cese ─────────────────────────────────────────────
      // Orden de prioridad: ☀️ Recuperación Solar → 🌤️ Recuperación Progresiva → ☁️ Variación Térmica
      if (isDay) {
        // ── ☀ RECUPERACIÓN SOLAR (Incondicional) ─────────────────────────────────
        // Todas las muestras individuales del lote de 10 min deben ser >= 26k lux.
        // El timestamp del cese es la primera muestra del lote (inicio del bloque de sol pleno).
        if (!closedByRecovery && inferedBaselineLux !== null && minLuxInRain !== null) {
          const allSamplesAbove26k =
            luxBatches[0].samples.length > 0 && luxBatches[0].samples.every((s) => s.value >= 26000)

          if (allSamplesAbove26k) {
            closedByRecovery = true

            // El cese ocurre al inicio del lote: primera muestra (la más antigua = inicio del sol pleno)
            const firstSample = luxBatches[0].samples[0]
            let preciseEndMs = firstSample ? firstSample.timestamp : nowMs

            if (preciseEndMs < inferedRainStartedAt) preciseEndMs = inferedRainStartedAt

            const endSampleT =
              tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              tempBatches[0].samples[0]
            const endSampleH =
              humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              humBatches[0].samples[0]

            const currentAverageLux = luxBatches[0].max
            const minSampleLux = Math.min(...luxBatches[0].samples.map((s) => s.value))

            Logger.rain(
              `☀️ Recuperación Solar — Sol pleno sostenido: las ${luxBatches[0].samples.length} muestras del lote >= 26k lux (mín: ${minSampleLux.toFixed(0)} lx).`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            maxHumInRain = null
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null

            await closeRainEvent(
              'SOLAR_RECOVERY',
              new Date(preciseEndMs),
              `Recuperación Solar — Sol radiante pleno y constante: las ${luxBatches[0].samples.length} muestras del lote de 10 min superan las 26k lux (mín: ${minSampleLux.toFixed(0)} lx, promedio: ${currentAverageLux.toFixed(0)} lx). Cese al inicio del lote solar.`,
              {
                temp: endSampleT ? endSampleT.value : tempBatches[0].min,
                hum: endSampleH ? endSampleH.value : humBatches[0].max,
                lux: firstSample ? firstSample.value : currentMinLux,
              },
              {
                type: 'SOLAR_RECOVERY',
                luxMax: currentAverageLux,
              },
            )
          }
        }

        // ── 🌤 RECUPERACIÓN TÉRMICA (Condicional) ────────────────────────────────
        // Umbral elástico de lux >= 15k lux + recuperación térmica >= 2°C + caída de HR >= 3%.
        // El timestamp del cese es la primera muestra del lote que satisface el lote como un todo.
        if (!closedByRecovery && inferedBaselineLux !== null && minLuxInRain !== null) {
          const preLux = inferedBaselineLux
          const minLux = minLuxInRain
          const relativeDrop = Math.min(1.0, (preLux - minLux) / preLux)
          const alpha = 1.0 - 0.65 * relativeDrop
          const luxRecoveryThreshold = minLux + alpha * (preLux - minLux)

          const currentAverageLux = luxBatches[0].max
          const currentTemp = tempBatches[0].min
          const currentHum = humBatches[0].max

          const isLuxRecovered =
            currentAverageLux >= luxRecoveryThreshold && currentAverageLux >= 15000
          const isTempRecovered = minTempInRain !== null && currentTemp >= minTempInRain + 2.0
          const isHumRecovered = maxHumInRain !== null && currentHum <= maxHumInRain - 3.0

          if (isLuxRecovered && isTempRecovered && isHumRecovered) {
            closedByRecovery = true

            // El cese ocurre al inicio del lote: la evaluación es a nivel de batch completo
            const firstSample = luxBatches[0].samples[0]
            let preciseEndMs = firstSample ? firstSample.timestamp : nowMs

            if (preciseEndMs < inferedRainStartedAt) preciseEndMs = inferedRainStartedAt

            const endSampleT =
              tempBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              tempBatches[0].samples[0]
            const endSampleH =
              humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              humBatches[0].samples[0]

            const tempRecovery = currentTemp - minTempInRain!
            const humDrop = maxHumInRain! - currentHum

            Logger.rain(
              `🌤️ Recuperación Progresiva — Lux promedio: ${currentAverageLux.toFixed(0)} lx (umbral: ${luxRecoveryThreshold.toFixed(0)} lx), +${tempRecovery.toFixed(1)}°C, -${humDrop.toFixed(1)}% HR.`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            maxHumInRain = null
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null

            await closeRainEvent(
              'PROGRESSIVE_RECOVERY',
              new Date(preciseEndMs),
              `🌤️ Recuperación Progresiva — Despeje solar con validación cruzada: iluminancia promedio ${currentAverageLux.toFixed(0)} lx (umbral elástico: ${Math.round(luxRecoveryThreshold).toLocaleString()} lx) + recuperación térmica +${tempRecovery.toFixed(1)}°C desde ${minTempInRain!.toFixed(1)}°C (umbral >= 2.0°C) + caída de humedad -${humDrop.toFixed(1)}% HR desde ${maxHumInRain!.toFixed(1)}% HR (umbral >= 3.0% HR). Cese al inicio del lote de recuperación.`,
              {
                temp: endSampleT ? endSampleT.value : currentTemp,
                hum: endSampleH ? endSampleH.value : currentHum,
                lux: firstSample ? firstSample.value : currentMinLux,
              },
              {
                type: 'PROGRESSIVE_RECOVERY',
                luxMax: currentAverageLux,
                tempRecovery,
                humVar: humDrop,
              },
            )
          }
        }
      }

      // 4. ☁️ Variación Térmica (Diurna, evaluada al final para dar prioridad a las reglas solares)
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
            `Cierre por Variación Térmica: Temp subió +${tempRecovery.toFixed(2)}°C desde el mínimo (${minTempInRain.toFixed(1)}°C).`,
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

      // 5. ☁️ Cese por Estancamiento — Día y Noche (Fallback de Última Instancia)
      // No requiere umbral de duración: el gate natural es que exista al menos 1 batch (≈10 min).
      // La 🛡️ Protección Térmica bloquea el cierre si hay enfriamiento activo en los 30 min previos.
      if (tempBatches.length >= 1 && humBatches.length >= 1) {
        const tSamples = tempBatches[0].samples
        const hSamples = humBatches[0].samples

        const firstTemp = tSamples[0]?.value ?? tempBatches[0].min
        const lastTemp = tSamples[tSamples.length - 1]?.value ?? tempBatches[0].min
        const netTempDrop = firstTemp - lastTemp
        const diffTemp = netTempDrop

        const firstHum = hSamples[0]?.value ?? humBatches[0].min
        const lastHum = hSamples[hSamples.length - 1]?.value ?? humBatches[0].max
        const netHumRise = lastHum - firstHum
        const diffHum = netHumRise

        const tempCeseThreshold =
          inferedBaselineVarTemp !== null ? Math.max(0.4, 1.2 * inferedBaselineVarTemp) : 0.4
        const humCeseThreshold =
          inferedBaselineVarHum !== null ? Math.max(1.0, 1.2 * inferedBaselineVarHum) : 1.0

        const isSaturated = humBatches[0].max >= 100.0
        const isHumStagnant = isSaturated ? true : netHumRise <= humCeseThreshold
        const isTempStagnant = netTempDrop <= tempCeseThreshold

        if (isHumStagnant && isTempStagnant) {
          let allowStagnantClose = true

          // 🛡️ Protección Térmica (Siempre 20 minutos)
          if (tempBatches.length >= 2) {
            const maxTemp20 = Math.max(tempBatches[0].max, tempBatches[1].max)
            const caidaNeta20 = maxTemp20 - tempBatches[0].min

            allowStagnantClose = caidaNeta20 <= 0.4
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
              const lastHSample = combinedHumSamples.find(
                (s) => Math.abs(s.timestamp - lastSample.timestamp) < 5000,
              )
              const lastH = lastHSample ? lastHSample.value : combinedHumSamples[0].value

              for (const tSample of combinedTempSamples) {
                const hSample = combinedHumSamples.find(
                  (s) => Math.abs(s.timestamp - tSample.timestamp) < 5000,
                )

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
              (tempBatches.length >= 2 &&
                tempBatches[1].samples.find((s) => s.timestamp === preciseEndMs)) ||
              tempBatches[0].samples[tempBatches[0].samples.length - 1]
            const endSampleH =
              humBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              (humBatches.length >= 2 &&
                humBatches[1].samples.find((s) => s.timestamp === preciseEndMs)) ||
              humBatches[0].samples[humBatches[0].samples.length - 1]
            const endSampleL =
              luxBatches[0].samples.find((s) => s.timestamp === preciseEndMs) ||
              (luxBatches.length >= 2 &&
                luxBatches[1].samples.find((s) => s.timestamp === preciseEndMs)) ||
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
              `☁️ Cese por Estancamiento: HR±${diffHum.toFixed(1)}% <= ${humCeseThreshold.toFixed(1)}%, Temp±${diffTemp.toFixed(1)}°C <= ${tempCeseThreshold.toFixed(1)}°C (últimos 10 min). Categoría: ${typeLabel}.`,
            )
            inferedRainActive = false
            inferedRainOverridden = true
            maxHumInRain = null
            inferedBaselineVarTemp = null
            inferedBaselineVarHum = null

            await closeRainEvent(
              'STAGNANT',
              new Date(preciseEndMs),
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
