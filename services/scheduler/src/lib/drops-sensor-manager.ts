import { prisma } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'

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

let lastFirmwareHeartbeat = 0
const RAIN_ORPHAN_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutos sin señales
let rainEventMutex = Promise.resolve()

// Buffer local para baselines
const telemetryBuffer: { lux: number; temp: number; hum: number; timestamp: number }[] = []

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
 * Actualiza la marca de tiempo de latido del firmware de la estación exterior.
 */
export function updateFirmwareHeartbeat(): void {
  lastFirmwareHeartbeat = Date.now()
}

/**
 * Retorna si la lluvia física está activa (y no vetada).
 */
export function isPhysicalRainActive(): boolean {
  return physicalRainActive && !physicalRainOverridden
}

/**
 * Retorna un resumen del estado físico para depuración y logs.
 */
export function getPhysicalRainStatusSummary() {
  return {
    physicalActive: physicalRainActive,
    physicalOverridden: physicalRainOverridden,
    openPhysicalRainEventId,
  }
}

/**
 * Hidrata el estado inicial de eventos de lluvia física abiertos desde Postgres.
 */
export async function hydratePhysicalState(): Promise<void> {
  try {
    const openPhysical = await prisma.rainEvent.findFirst({
      where: { zone: 'EXTERIOR', endedAt: null, isInfered: false },
      orderBy: { startedAt: 'desc' },
    })

    if (openPhysical) {
      openPhysicalRainEventId = openPhysical.id
      physicalRainActive = true
      Logger.rain(`Evento físico huérfano recuperado`)
    }
  } catch (err) {
    Logger.error('Error hidratando estado de lluvia física:', err)
  }
}

/**
 * Abre un nuevo evento de lluvia física en Postgres protegiéndolo con mutex.
 */
async function openPhysicalRainEvent(timestamp: Date = new Date()) {
  rainEventMutex = rainEventMutex
    .then(async () => {
      if (!openPhysicalRainEventId) {
        try {
          const existing = await prisma.rainEvent.findFirst({
            where: { zone: 'EXTERIOR', endedAt: null, isInfered: false },
            orderBy: { startedAt: 'desc' },
          })

          if (existing) {
            openPhysicalRainEventId = existing.id
            physicalRainActive = true
            Logger.rain(`Evento de lluvia físico reanudado`)
          } else {
            const newEvent = await prisma.rainEvent.create({
              data: {
                startedAt: timestamp,
                zone: 'EXTERIOR',
                isInfered: false,
                baselineTemp: physicalBaselineTemp ?? null,
                baselineHum: physicalBaselineHum ?? null,
                baselineLux: physicalBaselineLux ?? null,
                triggerReason: 'Sensor de gotas físico detectó lluvia',
              },
            })

            openPhysicalRainEventId = newEvent.id
            Logger.rain(`Evento de lluvia físico abierto`)
          }
        } catch (err) {
          Logger.error(`Error abriendo RainEvent físico en Postgres:`, err)
        }
      }
    })
    .catch((err) => {
      Logger.error('Error en Mutex de openPhysicalRainEvent:', err)
    })
  await rainEventMutex
}

/**
 * Cierra un evento de lluvia física abierto en Postgres y calcula la duración.
 */
async function closePhysicalRainEvent(reason: string, endTime: Date = new Date()) {
  rainEventMutex = rainEventMutex
    .then(async () => {
      let eventId = openPhysicalRainEventId

      if (!eventId) {
        const existing = await prisma.rainEvent
          .findFirst({
            where: { zone: 'EXTERIOR', endedAt: null, isInfered: false },
            orderBy: { startedAt: 'desc' },
          })
          .catch(() => null)

        if (!existing) return
        eventId = existing.id
      }

      try {
        const event = await prisma.rainEvent.findUnique({ where: { id: eventId } })

        if (!event || event.endedAt) {
          openPhysicalRainEventId = null

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
            closeReason: reason,
            avgIntensity,
            peakIntensity,
            endTemp: physicalBaselineTemp ?? null,
            endHum: physicalBaselineHum ?? null,
            endLux: physicalBaselineLux ?? null,
          },
        })

        const intensityLog = avgIntensity ? ` | Int. Promedio: ${Math.round(avgIntensity)}%` : ''

        Logger.rain(
          `Evento de lluvia físico cerrado (${reason}) — Duración: ${Math.round(durationSeconds / 60)} min${intensityLog}`,
        )
      } catch (err) {
        Logger.error(`Error cerrando RainEvent físico en Postgres:`, err)
      } finally {
        openPhysicalRainEventId = null
      }
    })
    .catch((err) => {
      Logger.error('Error en Mutex de closePhysicalRainEvent:', err)
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
      Logger.rain('Lluvia física detectada por sensor de gotas.')
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
          `Capturando Baseline Físico (Mínimo últimos 45m): ${physicalBaselineLux.toFixed(0)}lx / ${physicalBaselineTemp.toFixed(1)}°C / ${physicalBaselineHum.toFixed(1)}%. [${freshSamples.length} muestras]`,
        )
      } else {
        physicalBaselineLux = null
        physicalBaselineTemp = null
        physicalBaselineHum = null
        physicalIsWaitingForBaselineFallback = true
        Logger.warn('Sin baseline pre-lluvia física (buffer vacío). Iniciando captura de fallback.')
      }

      physicalRainOverridden = false
    }
    physicalRainActive = true
    await openPhysicalRainEvent(rainTimestamp)
  } else if (state === 'Dry') {
    physicalRainActive = false
    physicalRainOverridden = false // Limpiar veto al secarse físicamente
    await closePhysicalRainEvent('Dry', rainTimestamp)
  }
}

/**
 * Watchdog para eventos físicos huérfanos por desconexión de la estación exterior.
 */
export async function checkRainOrphanTimeout(): Promise<void> {
  if (!physicalRainActive) return
  if (lastFirmwareHeartbeat === 0) return

  const elapsed = Date.now() - lastFirmwareHeartbeat

  if (elapsed > RAIN_ORPHAN_TIMEOUT_MS) {
    Logger.rain(
      `Evento físico huérfano detectado. Sin señal en ${Math.round(elapsed / 60000)}min. Finalizando.`,
    )
    physicalRainActive = false
    await closePhysicalRainEvent('ORPHAN_TIMEOUT', new Date())
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
          `Captura fallback física finalizada. Baseline: ${physicalBaselineLux?.toFixed(0)}lx / ${physicalBaselineTemp?.toFixed(1)}°C / ${physicalBaselineHum?.toFixed(1)}%.`,
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
          `Veto físico inteligente activado: ${reason}. Baseline: ${physicalBaselineLux?.toFixed(0)}lx / ${physicalBaselineTemp.toFixed(1)}°C / ${physicalBaselineHum?.toFixed(1)}%. Actual: ${lux.toFixed(0)}lx / ${temp.toFixed(1)}°C / ${hum.toFixed(1)}%.`,
        )

        physicalRainOverridden = true
        lastPhysicalVetoAt = Date.now()
        await closePhysicalRainEvent('SCHEDULER_OVERRIDE', new Date())
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
          `Reversión de veto físico: ${reason} tras ${timeSinceVeto.toFixed(1)}min. La lluvia física persiste.`,
        )
        physicalRainOverridden = false
        lastPhysicalVetoAt = null
        if (physicalRainActive) await openPhysicalRainEvent(new Date())
      }
    }
  }
}
