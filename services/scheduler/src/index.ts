import { prisma, TaskStatus, CollisionGuard, ZoneType, DeviceStatus } from '@package/database'
import { Cron } from 'croner'

import { Logger, colors } from './lib/logger'
import { InferenceEngine } from './lib/inference-engine'
import {
  mqttClient,
  irrigationRetryManager,
  systemRetryManager,
  emaManager,
  syncNodeSampling,
  resetSamplingState,
  executeSystemCommand,
  MQTT_BROKER_URL,
} from './lib/mqtt-handler'
import {
  cleanupExpiredTasks,
  preScheduleAgrochemicals,
  processAuthorizedTasks,
  processPostponedTasks,
  processTaskLog,
  recordTaskEvent,
  resumeInterruptedTasks,
} from './lib/task-manager'
import { processDay } from './lib/telemetry-processor'
import { influxClient } from './lib/influx'

// ---- Configuración de Reglas ----

async function init() {
  console.log() // Espacio en blanco
  Logger.info('🚀 Iniciando Servicio Scheduler (PristinoPlant)')

  const pgReady = await waitForPostgres()

  if (!pgReady) {
    Logger.error('FALLO CRÍTICO: No se pudo conectar a PostgreSQL.')
    process.exit(1)
  }

  const mqttReady = await waitForMosquitto()

  if (!mqttReady) {
    Logger.error('FALLO CRÍTICO: No se pudo conectar al Broker MQTT.')
    process.exit(1)
  }

  // 1. Cargar y programar rutinas primero (Prioridad estética)
  await initScheduler()

  // 2. Iniciar escucha de eventos MQTT
  setupMqttHandlers()
}

/**
 * Atenta contra la base de datos hasta que responda.
 */
async function waitForPostgres(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`

      return true
    } catch {
      if (i === 0) Logger.warn('Esperando a PostgreSQL')
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  return false
}

/**
 * Espera a que el Broker MQTT esté accesible.
 */
async function waitForMosquitto(retries = 15) {
  const url = new URL(MQTT_BROKER_URL)
  const host = url.hostname
  const port = parseInt(url.port) || 1883

  for (let i = 0; i < retries; i++) {
    if (mqttClient.connected) return true

    if (i === 0) Logger.warn(`Esperando a Mosquitto en ${host}:${port}`)
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  return mqttClient.connected
}

// ---- Gestión de Estado Local ----
let lastRainState: 'Raining' | 'Dry' = 'Dry'
let lastFirmwareHeartbeat: number = Date.now()
let lastSyncTimestamp: number = 0
let openRainEventId: string | null = null // ID del RainEvent abierto en Postgres

// ---- Sincronización de Clima (DHT22) ----
let climateSyncTimer: NodeJS.Timeout | null = null
let climateSyncAttempts = 0
const CLIMATE_SYNC_MAX_RETRIES = 6 // 6 × 5min = 30min

// Buffers para validación inteligente de lluvia (Humedad Residual)
const telemetryBuffer: { lux: number; temp: number; hum: number; timestamp: number }[] = []
let baselineLux: number | null = null
let baselineTemp: number | null = null
let baselineHum: number | null = null
let isRainOverridden = false
let rainStartedAt: number | null = null
let lastVetoAt: number | null = null
let isWaitingForBaselineFallback = false

/**
 * Devuelve el estado actual de lluvia considerando el veto por humedad residual.
 */
export function isCurrentlyRaining(): boolean {
  return lastRainState === 'Raining' && !isRainOverridden
}

/**
 * Abre un nuevo evento de lluvia en PostgreSQL o reanuda uno existente.
 */
async function openRainEvent(timestamp: Date = new Date()) {
  if (!openRainEventId) {
    try {
      const existing = await prisma.rainEvent.findFirst({
        where: { zone: 'EXTERIOR', endedAt: null },
        orderBy: { startedAt: 'desc' },
      })

      if (existing) {
        openRainEventId = existing.id
        Logger.rain(`Evento de lluvia reanudado (ID: ${existing.id.slice(0, 8)})`)
      } else {
        const newEvent = await prisma.rainEvent.create({
          data: { startedAt: timestamp, zone: 'EXTERIOR' },
        })

        openRainEventId = newEvent.id
        Logger.rain(`Evento de lluvia abierto (ID: ${newEvent.id.slice(0, 8)})`)
      }
    } catch (err) {
      Logger.error('Error abriendo RainEvent en Postgres:', err)
    }
  }
}

/**
 * Cierra el evento de lluvia abierto en Postgres y calcula la duración.
 * @param reason Motivo de cierre: "Dry", "ORPHAN_TIMEOUT", "REBOOT", "SCHEDULER_OVERRIDE"
 * @param endTime Timestamp de cierre (por defecto: ahora)
 */
async function closeRainEvent(reason: string, endTime: Date = new Date()) {
  if (!openRainEventId) {
    // Buscar en DB por si el Scheduler se reinició con un evento huérfano
    const existing = await prisma.rainEvent
      .findFirst({
        where: { zone: 'EXTERIOR', endedAt: null },
        orderBy: { startedAt: 'desc' },
      })
      .catch(() => null)

    if (!existing) return
    openRainEventId = existing.id
  }

  try {
    const event = await prisma.rainEvent.findUnique({ where: { id: openRainEventId } })

    if (!event || event.endedAt) {
      openRainEventId = null

      return
    }

    const durationSeconds = Math.round((endTime.getTime() - event.startedAt.getTime()) / 1000)

    // Consultar intensidad en InfluxDB
    let avgIntensity: number | null = null
    let peakIntensity: number | null = null

    try {
      const intensityQuery = `
        SELECT MEAN(rain_intensity) as avg_int, MAX(rain_intensity) as peak_int 
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

    if (!openRainEventId) return

    await prisma.rainEvent.update({
      where: { id: openRainEventId },
      data: {
        endedAt: endTime,
        durationSeconds,
        closedBy: reason,
        avgIntensity,
        peakIntensity,
      },
    })

    const intensityLog = avgIntensity ? ` | Int. Promedio: ${Math.round(avgIntensity)}%` : ''

    Logger.rain(
      `Evento de lluvia cerrado (${reason}) — Duración: ${Math.round(durationSeconds / 60)} min${intensityLog} (ID: ${openRainEventId.slice(0, 8)})`,
    )
  } catch (err) {
    Logger.error('Error cerrando RainEvent en Postgres:', err)
  } finally {
    openRainEventId = null
  }
}

// Timeout para eventos de lluvia huérfanos (10 minutos sin señales de vida)
const RAIN_ORPHAN_TIMEOUT_MS = 10 * 60 * 1000

function setupMqttHandlers() {
  const subscribe = () => {
    mqttClient.subscribe(
      [
        'PristinoPlant/Actuator_Controller/cmd/received',
        'PristinoPlant/Actuator_Controller/irrigation/state',
        'PristinoPlant/Actuator_Controller/status',
        'PristinoPlant/Actuator_Controller/status/boot',
        'PristinoPlant/Weather_Station/EXTERIOR/climate/sync',
        'PristinoPlant/Weather_Station/Exterior/readings',
        'PristinoPlant/Weather_Station/Exterior/rain/state',
        'PristinoPlant/Weather_Station/ZONA_A/status',
        'PristinoPlant/Weather_Station/ZONA_A/readings',
        'PristinoPlant/Weather_Station/ZONA_A/cmd/received',
      ],
      { qos: 1 },
    )
  }

  let isFirstConnection = true
  const onConnect = () => {
    if (isFirstConnection) {
      Logger.success('Conectado a Broker MQTT')
      isFirstConnection = false
    }
    subscribe()
  }

  mqttClient.on('connect', onConnect)
  if (mqttClient.connected) onConnect()

  mqttClient.on('message', async (topic, payload) => {
    try {
      const message = payload.toString().trim()
      const previousHeartbeat = lastFirmwareHeartbeat

      // Heartbeat: cualquier mensaje del firmware actualiza el timestamp general
      // Se actualizará lastFirmwareHeartbeat al final de este handler.

      // 1. Monitoreo de Conexión del Nodo Actuador
      if (topic === 'PristinoPlant/Actuator_Controller/status') {
        if (message === 'online') {
          if (irrigationRetryManager.connectionState === 'online') {
            lastFirmwareHeartbeat = Date.now()

            return
          }

          await handleNodeSync(false, previousHeartbeat)
        } else if (
          message === 'lwt_disconnect' &&
          irrigationRetryManager.connectionState !== 'offline'
        ) {
          // LWT automático del broker: el nodo desapareció sin avisar
          await handleNodeOffline(
            'El dispositivo se desconectó inesperadamente (Fallo de red o energía).',
            'BROKER',
          )
        } else if (message === 'offline' && irrigationRetryManager.connectionState !== 'offline') {
          // Desconexión limpia publicada por shutdown() en el firmware
          await handleNodeOffline(
            'Dispositivo desconectado limpiamente (Reinicio seguro solicitado).',
            'NODE',
          )
        } else if (message === 'rebooting') {
          await handleNodeOffline('Reinicio seguro solicitado por el sistema o el usuario.', 'NODE')
        }

        return
      }

      // 1.5 Detección de Reinicio Rápido (Boot Explícito)
      if (topic === 'PristinoPlant/Actuator_Controller/status/boot') {
        irrigationRetryManager.setStabilizing()
        systemRetryManager.setStabilizing()
        // Nota: lastFirmwareHeartbeat (línea 139) ya actualizó el timestamp de este mensaje.

        // No forzamos un offline previo, saltamos directamente al sync
        // para que evalúe si es un REBOOT o una sesión nueva.
        await handleNodeSync(true, previousHeartbeat)

        return
      }

      // 1.9 Nodo EMA (Weather Station ZONA_A) — Heartbeat de conectividad
      if (topic === 'PristinoPlant/Weather_Station/ZONA_A/status') {
        if (message === 'online') {
          emaManager.setStabilizing()
          // Registrar conexión en logs de dispositivo
          await prisma.deviceLog.create({
            data: {
              device: 'Weather_Station_ZONA_A',
              status: 'ONLINE',
              notes: 'Estación EMA: Conexión establecida.',
            },
          })
          // Sincronizar muestreo (Amanecer/Anochecer)
          syncNodeSampling()
        } else if (message === 'lwt_disconnect' || message === 'offline') {
          emaManager.setOffline()
          await prisma.deviceLog.create({
            data: {
              device: 'Weather_Station_ZONA_A',
              status: 'OFFLINE',
              notes:
                message === 'lwt_disconnect'
                  ? 'Estación EMA: Desconexión inesperada.'
                  : 'Estación EMA: Desconexión limpia.',
            },
          })
        }

        return
      }

      // 2. Acuse de Recibo (ACK)
      if (
        topic === 'PristinoPlant/Actuator_Controller/cmd/received' ||
        topic === 'PristinoPlant/Weather_Station/ZONA_A/cmd/received'
      ) {
        try {
          const parsed = JSON.parse(message)
          const taskId = parsed.task_id
          const isActuator = topic.includes('Actuator')
          const nodeName = isActuator ? 'Nodo Actuador' : 'Estación EMA'

          if (taskId) {
            const task = await recordTaskEvent(
              taskId,
              TaskStatus.ACKNOWLEDGED,
              `${nodeName}: Comandos recibidos.`,
            )

            let confirmation = null

            if (isActuator) {
              confirmation = irrigationRetryManager.confirmByTaskId(taskId)
              systemRetryManager.confirm(taskId)
            } else {
              confirmation = emaManager.confirm(taskId)
            }

            if (task) {
              const durationSec = task.duration * 60
              let attemptInfo = ''

              // Usamos el conteo de intentos relativo a la ventana disponible al momento del despacho
              if (confirmation && confirmation.attempts > 1) {
                attemptInfo = `[ Attempt ${confirmation.attempts}/${confirmation.sessionTotalAttempts} ] `
              }

              Logger.task(
                `${attemptInfo}Despacho confirmado — Task ${task.id.slice(0, 8)} | ${durationSec}s.`,
              )
            }
          } else {
            if (isActuator) {
              irrigationRetryManager.confirmByTaskId(message)
              systemRetryManager.confirm(message)
            } else {
              emaManager.confirm(message)
            }
          }
        } catch {
          if (topic.includes('Actuator')) {
            irrigationRetryManager.confirmByTaskId(message)
            systemRetryManager.confirm(message)
          } else {
            emaManager.confirm(message)
          }
        }

        return
      }

      // 3. Telemetría Funcional Física
      if (topic === 'PristinoPlant/Actuator_Controller/irrigation/state') {
        let updates: Record<string, { state: string; task_id?: string }> = {}

        try {
          updates = JSON.parse(message)
        } catch {
          return
        }

        for (const [, info] of Object.entries(updates)) {
          const { state, task_id: taskId } = info

          if (state === 'ON' && taskId) {
            irrigationRetryManager.confirmByTaskId(taskId)
            systemRetryManager.confirm(taskId)
            await recordTaskEvent(taskId, TaskStatus.IN_PROGRESS, 'Circuito de Riego abierto.', {
              actualStartAt: new Date(),
            })
          } else if (state === 'OFF' && taskId) {
            const currentTask = await prisma.taskLog.findUnique({
              where: { id: taskId },
              select: {
                status: true,
                actualStartAt: true,
                duration: true,
                purpose: true,
                notes: true,
              },
            })

            let completedMinutes = currentTask?.duration || 0

            if (currentTask?.actualStartAt) {
              const elapsedMs = Date.now() - new Date(currentTask.actualStartAt).getTime()

              completedMinutes = Math.floor(elapsedMs / 60000)
            }

            const isAtomicCancel = currentTask?.notes?.includes('[ATOMIC_CANCEL]')
            const nextStatus = isAtomicCancel ? TaskStatus.CANCELLED : TaskStatus.COMPLETED
            const finalNotes = isAtomicCancel
              ? currentTask?.notes?.replace('[ATOMIC_CANCEL] ', '') ||
                'Cancelación confirmada por el nodo.'
              : 'Circuito de Riego cerrado correctamente.'

            const finished = await recordTaskEvent(taskId, nextStatus, finalNotes, {
              completedMinutes: { set: completedMinutes },
            })

            if (finished) {
              Logger.task(
                `${currentTask?.purpose || 'Tarea'} ${taskId.slice(0, 8)} FINALIZADA (${completedMinutes} min)`,
              )
            }
          }
        }

        return
      }

      // 3.4 Respuesta de Sincronización de Clima (DHT22)
      if (topic === 'PristinoPlant/Weather_Station/EXTERIOR/climate/sync') {
        if (message.startsWith('{')) {
          try {
            const data = JSON.parse(message)

            Logger.info(
              `DHT22: ${colors.yellow}🌡️ ${data.temp}°C${colors.reset}, ${colors.blue}💧 ${data.hum}%${colors.reset}`,
            )
          } catch {
            /* ignore */
          }

          if (climateSyncTimer) {
            clearInterval(climateSyncTimer)
            climateSyncTimer = null
          }
          climateSyncAttempts = 0
        } else {
          Logger.warn(
            `🌡️  DHT22 reportó fallo en sincronización: ${message}. Reintentando en 5min.`,
          )
          startClimateSyncRetry()
        }

        return
      }

      // 3.5 Lecturas Ambientales (Validación de Lluvia / Humedad Residual)
      if (topic === 'PristinoPlant/Weather_Station/Exterior/readings') {
        try {
          const data = JSON.parse(message)
          const lux = Number(data.illuminance || 0)
          const temp = Number(data.temperature || 0)
          const hum = Number(data.humidity || 0)

          if (lastRainState === 'Dry') {
            telemetryBuffer.push({ lux, temp, hum, timestamp: Date.now() })
            if (telemetryBuffer.length > 10) telemetryBuffer.shift()
          }

          if (lastRainState === 'Raining' && !isRainOverridden) {
            // Lógica de Fallback de Baseline (si no hubo datos pre-lluvia)
            if (isWaitingForBaselineFallback && rainStartedAt) {
              const elapsed = Date.now() - rainStartedAt

              if (elapsed < 10 * 60 * 1000) {
                // Capturamos el MÁXIMO durante la lluvia como baseline de emergencia
                if (baselineLux === null || lux > baselineLux) baselineLux = lux
                if (baselineTemp === null || temp > baselineTemp) baselineTemp = temp
                if (baselineHum === null || hum > baselineHum) baselineHum = hum
              } else {
                isWaitingForBaselineFallback = false
                Logger.debug(
                  `Captura de fallback finalizada. Baseline: ${baselineLux?.toFixed(0)}lx / ${baselineTemp?.toFixed(1)}°C / ${baselineHum?.toFixed(1)}%.`,
                )
              }
            }

            // Si está lloviendo y no hemos vetado aún, evaluamos recuperación inteligente
            const now = new Date()
            const options: Intl.DateTimeFormatOptions = {
              timeZone: 'America/Caracas',
              hour: 'numeric',
              hour12: false,
            }
            const caracasHour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now))

            // Ventana operativa: 6:00 AM - 5:00 PM
            const isWindow = caracasHour >= 6 && caracasHour < 17

            if (baselineTemp !== null) {
              const luxRecovery = isWindow && baselineLux !== null && lux > baselineLux * 1.2
              const tempRecovery = temp > baselineTemp + 2
              const humRecovery = baselineHum !== null && hum < baselineHum - 2 // Desaturación detectada
              const absoluteSun = isWindow && lux > 26000

              if (luxRecovery || tempRecovery || humRecovery || absoluteSun) {
                const reason = luxRecovery
                  ? `Recuperación lumínica (+${Math.round((lux / baselineLux! - 1) * 100)}% vs mín.)`
                  : tempRecovery
                    ? `Recuperación térmica (+${(temp - baselineTemp).toFixed(1)}°C vs mín.)`
                    : humRecovery
                      ? `Recuperación de humedad (${hum.toFixed(1)}% vs mín.)`
                      : 'Cielo Templado detectado (>26k lux)'

                Logger.rain(
                  `Veto de lluvia inteligente: ${reason}. Baseline: ${baselineLux?.toFixed(0)}lx / ${baselineTemp.toFixed(1)}°C / ${baselineHum?.toFixed(1)}%. Actual: ${lux.toFixed(0)}lx / ${temp.toFixed(1)}°C / ${hum.toFixed(1)}%.`,
                )

                isRainOverridden = true
                lastVetoAt = Date.now()
                await closeRainEvent('SCHEDULER_OVERRIDE')
              }
            }
          }

          // --- Lógica de Reversión de Veto (Anti-Intermitencia) ---
          // Si el veto está activo pero las condiciones vuelven a ser "de lluvia", lo anulamos.
          // Solo permitimos la re-apertura en un plazo de 30 minutos tras el veto,
          // ya que el baseline original se vuelve obsoleto después de ese tiempo.
          if (
            isRainOverridden &&
            baselineLux !== null &&
            baselineTemp !== null &&
            lastVetoAt !== null
          ) {
            const timeSinceVeto = (Date.now() - lastVetoAt) / 60000
            const isWindowValid = timeSinceVeto < 30 // Ventana de 30 minutos

            if (isWindowValid) {
              const lostLux = lux < baselineLux * 1.1 // Regresó a la oscuridad
              const lostTemp = temp < baselineTemp + 1 // Regresó al frío
              const lostHum = baselineHum !== null && hum > baselineHum + 5 // Regresó a la humedad

              if (lostLux || lostTemp || lostHum) {
                const reason = lostLux
                  ? 'Nubes regresaron (Lux bajo)'
                  : lostTemp
                    ? 'Baja térmica'
                    : 'Saturación de humedad'

                Logger.rain(
                  `Anulando veto: ${reason} tras ${timeSinceVeto.toFixed(1)}min. La lluvia parece haber vuelto.`,
                )
                isRainOverridden = false
                lastVetoAt = null
                // Si el sensor físico sigue marcando Raining, re-abrimos el evento
                if (lastRainState === 'Raining') {
                  await openRainEvent()
                }
              }
            } else {
              // Si pasaron más de 30 min, el veto es permanente para este ciclo
              // ya que el baseline no es confiable. El evento solo cerrará cuando el firmware diga Dry.
            }
          }
        } catch {
          /* ignore */
        }
      }

      // 4. Detección y Persistencia de Lluvia
      if (topic === 'PristinoPlant/Weather_Station/Exterior/rain/state') {
        let state = message
        let rainTimestamp: Date = new Date()

        if (message.startsWith('{')) {
          try {
            const parsed = JSON.parse(message)

            state = parsed.state || message
            if (parsed.timestamp) rainTimestamp = new Date(parsed.timestamp * 1000)
          } catch {
            /* ignore */
          }
        }

        lastFirmwareHeartbeat = Date.now()

        if (state === 'Raining') {
          if (isRainOverridden) return // Evitar reapertura si el veto está activo

          if (lastRainState !== 'Raining') {
            Logger.rain('Lluvia detectada por sensores en tiempo real.')
            rainStartedAt = Date.now()

            // Capturar baseline justo antes de que empiece a llover
            // Usamos el valor MÍNIMO de los últimos 10 minutos (sin promedios)
            const now = Date.now()
            const freshSamples = telemetryBuffer.filter((s) => now - s.timestamp < 10 * 60 * 1000)

            if (freshSamples.length > 0) {
              baselineLux = Math.min(...freshSamples.map((s) => s.lux))
              baselineTemp = Math.min(...freshSamples.map((s) => s.temp))
              baselineHum = Math.min(...freshSamples.map((s) => s.hum))
              isWaitingForBaselineFallback = false

              Logger.debug(
                `Capturando Baseline de lluvia (Mínimo últimos 10m): ${baselineLux.toFixed(0)}lx / ${baselineTemp.toFixed(1)}°C / ${baselineHum.toFixed(1)}%. [${freshSamples.length} muestras]`,
              )
            } else {
              // Fallback: Si no hay buffer, activamos captura del máximo durante los primeros 10 min de lluvia
              baselineLux = null
              baselineTemp = null
              baselineHum = null
              isWaitingForBaselineFallback = true
              Logger.warn(
                'Sin baseline pre-lluvia (buffer vacío o antiguo). Iniciando captura de fallback (Máximo en lluvia).',
              )
            }

            isRainOverridden = false
          }
          lastRainState = 'Raining'

          // Abrir o reutilizar evento de lluvia en Postgres
          await openRainEvent(rainTimestamp)
        } else if (state === 'Dry') {
          lastRainState = 'Dry'
          isRainOverridden = false // Limpiar veto al recibir confirmación física de secado
          await closeRainEvent('Dry', rainTimestamp)
        }

        return
      }

      // Actualizar el latido al final del procesamiento exitoso
      if (
        topic.startsWith('PristinoPlant/Actuator_Controller/') ||
        topic.startsWith('PristinoPlant/Weather_Station/')
      ) {
        lastFirmwareHeartbeat = Date.now()
      }
    } catch (error: Error | unknown) {
      Logger.error('Error procesando QoS Message:', error)
    }
  })
}

/**
 * Verifica si un evento de lluvia ha quedado huérfano (firmware desconectado).
 * Si han pasado más de 10 minutos sin señales del firmware durante un evento Raining,
 * se da el evento por terminado.
 */
async function checkRainOrphanTimeout() {
  if (lastRainState !== 'Raining') return

  const elapsed = Date.now() - lastFirmwareHeartbeat

  if (elapsed > RAIN_ORPHAN_TIMEOUT_MS) {
    Logger.rain(
      `Evento huérfano detectado. Sin señales del firmware en ${Math.round(elapsed / 60000)}min. Dando por terminado.`,
    )
    lastRainState = 'Dry'
    // Cerrar el evento en Postgres con el motivo ORPHAN_TIMEOUT
    await closeRainEvent('ORPHAN_TIMEOUT')
  }
}

/**
 * Gestiona la desconexión del nodo y la limpieza de tareas interrumpidas.
 */
async function handleNodeOffline(reason: string, origin: 'BROKER' | 'NODE' | 'SCHEDULER') {
  if (irrigationRetryManager.connectionState === 'offline') return

  irrigationRetryManager.setOffline()
  systemRetryManager.setOffline()
  Logger.node('OFFLINE', origin)
  resetSamplingState()

  // 1. Registro en el Historial (Postgres)
  await prisma.deviceLog
    .create({
      data: {
        device: 'Actuator_Controller',
        status: 'OFFLINE',
        notes: `[${origin}] ${reason}`,
      },
    })
    .catch((err) => Logger.error('Fallo persistiendo deviceLog (OFFLINE)', err))

  // 2. Gestionar tareas que estaban en ejecución
  const interruptedTasks = await prisma.taskLog.findMany({
    where: {
      status: {
        in: [TaskStatus.ACKNOWLEDGED, TaskStatus.IN_PROGRESS, TaskStatus.DISPATCHED],
      },
    },
  })

  for (const task of interruptedTasks) {
    irrigationRetryManager.confirmByTaskId(task.id)
    systemRetryManager.confirm(task.id)

    let extraNotes: string
    let addedMinutes = 0
    let targetStatus: TaskStatus = TaskStatus.FAILED

    if (task.actualStartAt && task.status === TaskStatus.IN_PROGRESS) {
      // Tarea que ya inició: calculamos tiempo ejecutado
      const elapsedMs = Date.now() - new Date(task.actualStartAt).getTime()
      const elapsedMinutes = Math.floor(elapsedMs / 60000)

      if (elapsedMinutes >= task.duration) {
        // [Auto-Completado]: Si ya pasó el tiempo programado, cerramos la tarea
        addedMinutes = Math.max(0, task.duration - (task.completedMinutes || 0))
        extraNotes = 'Riego completado (Confirmación de cierre tardía).'
        targetStatus = TaskStatus.COMPLETED
      } else {
        addedMinutes = elapsedMinutes
        extraNotes = `Interrumpida tras ${addedMinutes} min de riego efectivo.`
        targetStatus = TaskStatus.FAILED
      }
    } else {
      // Tarea que nunca llegó a ejecutarse (DISPATCHED o ACKNOWLEDGED sin inicio)
      extraNotes = 'El Nodo Actuador No Responde.'
    }

    await recordTaskEvent(task.id, targetStatus, extraNotes, {
      completedMinutes: { increment: addedMinutes },
    })
  }

  if (interruptedTasks.length > 0) {
    const isSingle = interruptedTasks.length === 1
    const taskText = isSingle ? 'tarea' : 'tareas'
    const actionText = isSingle ? 'pausó' : 'pausaron'
    const nameInfo = isSingle ? ` (${interruptedTasks[0].purpose})` : ''

    Logger.warn(
      `Se ${actionText} ${interruptedTasks.length} ${taskText}${nameInfo} para su recuperación automática.`,
    )
  }

  irrigationRetryManager.clear()
}

/**
 * Orquesta la sincronización completa del nodo tras una reconexión o reinicio.
 * Implementa un bloqueo de 5 segundos para evitar ráfagas redundantes.
 */
async function handleNodeSync(isBoot: boolean = false, previousHeartbeat: number = Date.now()) {
  const now = Date.now()
  const timeSinceLastSync = now - lastSyncTimestamp

  // Si ya sincronizamos hace menos de 5 segundos, ignoramos la redundancia
  if (timeSinceLastSync < 5000) {
    if (isBoot) {
      Logger.debug('Boot redundante detectado. Ignorando sincronización duplicada.')
    }

    return
  }

  // Determinamos la semántica del mensaje ONLINE
  let notes = 'Dispositivo conectado / Heartbeat recuperado.'
  let statusToSave: DeviceStatus = 'ONLINE'

  if (isBoot) {
    // Usamos el latido previo capturado al inicio del mensaje para la validación
    const timeSinceLastHeartbeat = now - previousHeartbeat

    // Si ha pasado más de 15 minutos desde el último heartbeat exitoso,
    // asumimos que el dispositivo estuvo apagado (o en ciclo de reconexión fallida)
    // y es una sesión nueva — se registra como ONLINE, no como REBOOT.
    if (timeSinceLastHeartbeat > 15 * 60 * 1000) {
      notes = 'Controlador Conectado (Sesión nueva tras inactividad prolongada).'
      statusToSave = 'ONLINE'
    } else {
      notes = 'Reinicio del controlador.'
      statusToSave = 'REBOOT'
    }
  }

  lastSyncTimestamp = now

  // Marcamos estado tanto en consola como en Influx/Historial
  if (statusToSave === 'REBOOT') {
    Logger.node('REBOOT')
  } else {
    Logger.node('ONLINE')
  }

  if (irrigationRetryManager.connectionState !== 'online' || statusToSave === 'REBOOT') {
    await prisma.deviceLog
      .create({
        data: {
          device: 'Actuator_Controller',
          status: statusToSave,
          notes: notes,
        },
      })
      .catch((err) => Logger.error('Fallo persistiendo deviceLog (ONLINE/REBOOT)', err))
  }

  // Asegurar que el secuenciador transicione a modo estabilización (online)
  // Esto evita que latidos posteriores disparen eventos ONLINE duplicados.
  if (irrigationRetryManager.connectionState === 'offline') {
    irrigationRetryManager.setStabilizing()
    systemRetryManager.setStabilizing()
  }

  // Si es un REBOOT en caliente, el hardware apagó los pines.
  // Por ende, cualquier tarea que estuviera ejecutándose fue interrumpida de facto.
  if (statusToSave === 'REBOOT') {
    const interruptedTasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [TaskStatus.ACKNOWLEDGED, TaskStatus.IN_PROGRESS, TaskStatus.DISPATCHED],
        },
      },
    })

    for (const task of interruptedTasks) {
      irrigationRetryManager.confirmByTaskId(task.id)
      systemRetryManager.confirm(task.id)

      let extraNotes: string
      let addedMinutes = 0
      let targetStatus: TaskStatus = TaskStatus.FAILED

      if (task.actualStartAt && task.status === TaskStatus.IN_PROGRESS) {
        const elapsedMs = Date.now() - new Date(task.actualStartAt).getTime()
        const elapsedMinutes = Math.floor(elapsedMs / 60000)

        if (elapsedMinutes >= task.duration) {
          addedMinutes = Math.max(0, task.duration - (task.completedMinutes || 0))
          extraNotes = 'Riego completado (Confirmación de cierre tardía).'
          targetStatus = TaskStatus.COMPLETED
        } else {
          addedMinutes = elapsedMinutes
          extraNotes = `Interrumpida tras ${addedMinutes} min de riego efectivo.`
          targetStatus = TaskStatus.FAILED
        }
      } else {
        // Tarea que nunca llegó a ejecutarse (DISPATCHED o ACKNOWLEDGED sin inicio)
        extraNotes = 'El Nodo Actuador No Responde.'
      }

      await recordTaskEvent(task.id, targetStatus, extraNotes, {
        completedMinutes: { increment: addedMinutes },
      })
    }

    if (interruptedTasks.length > 0) {
      const isSingle = interruptedTasks.length === 1
      const taskText = isSingle ? 'tarea activa' : 'tareas activas'
      const actionText = isSingle ? 'pausó' : 'pausaron'

      Logger.warn(`Se ${actionText} ${interruptedTasks.length} ${taskText} debido al reinicio.`)
    }
  }

  // El secuenciador ya está en modo STABILIZING (60s) gracias al caller de boot
  resetSamplingState()
  syncNodeSampling(undefined, true)
  requestClimateSync()
  await processPostponedTasks()
}

/**
 * Envía comando sync_climate al nodo actuador.
 */
function requestClimateSync() {
  executeSystemCommand('sync_climate', true)
}

/**
 * Programa reintentos de sync_climate cada 5min hasta recibir datos válidos.
 */
function startClimateSyncRetry() {
  if (climateSyncTimer) return // Ya hay retry activo

  climateSyncTimer = setInterval(
    () => {
      climateSyncAttempts++

      if (climateSyncAttempts > CLIMATE_SYNC_MAX_RETRIES) {
        Logger.warn(
          `🌡️  DHT22: Máximo de reintentos alcanzado (${CLIMATE_SYNC_MAX_RETRIES}). Esperando próximo boot.`,
        )
        if (climateSyncTimer) clearInterval(climateSyncTimer)
        climateSyncTimer = null

        return
      }

      Logger.info(
        `🌡️  DHT22: Reintento de sincronización (${climateSyncAttempts}/${CLIMATE_SYNC_MAX_RETRIES})`,
      )
      requestClimateSync()
    },
    5 * 60 * 1000,
  )
}

// ---- Lógica de Rutinas (Crons) ----
async function initScheduler() {
  await waitForPostgres()

  // 0. Limpieza de tareas interrumpidas (Solo al arrancar el scheduler)
  await resumeInterruptedTasks()

  // Verificación periódica de inactividad de nodos y eventos (cada 15s)
  setInterval(checkRainOrphanTimeout, 60_000)

  // Cron de limpieza de tareas expiradas (Ventana de 20 min / 24h agroquímicos)
  new Cron('*/5 * * * *', { timezone: 'America/Caracas' }, async () => {
    await cleanupExpiredTasks()
  })

  // Cron de Pre-Agendamiento de Agroquímicos (12h antes)
  new Cron('0 * * * *', { timezone: 'America/Caracas' }, async () => {
    await preScheduleAgrochemicals()
  })

  // Poller de Tareas Autorizadas (cada 1 min)
  new Cron('* * * * *', { timezone: 'America/Caracas' }, async () => {
    await processAuthorizedTasks()
  })

  // Poller de Tareas Pendientes Diferidas (cada 1 min)
  // Asegura que las tareas manuales programadas para el futuro se ejecuten puntualmente.
  new Cron('* * * * *', { timezone: 'America/Caracas' }, async () => {
    await processPostponedTasks()
  })

  // Cron para sincronizar muestreo de iluminancia (Amanecer 4:59am / Anochecer 7:01pm)
  new Cron('59 4 * * *', { timezone: 'America/Caracas' }, () => {
    syncNodeSampling('on')
  })
  new Cron('1 19 * * *', { timezone: 'America/Caracas' }, () => {
    syncNodeSampling('off')
  })

  // Cron de Mantenimiento de Filtros (Lunes y Jueves 8:00 AM)
  new Cron('0 8 * * 1,4', { timezone: 'America/Caracas' }, async () => {
    try {
      await prisma.notification.create({
        data: {
          type: 'MAINTENANCE_REMINDER',
          title: 'Mantenimiento de Filtros',
          description: 'Recordatorio periódico: Limpiar filtros del sistema de riego.',
          priority: 'NORMAL',
        },
      })
      Logger.cron('Notificación de mantenimiento de filtros generada.')
    } catch (error) {
      Logger.error('Error generando notificación de mantenimiento:', error)
    }
  })

  // Cron de cierre oficial diario (Media noche 12:01 AM)
  new Cron('1 0 * * *', { timezone: 'America/Caracas' }, async () => {
    try {
      Logger.telemetry('Procesando Telemetría de las Estaciones Meteorológicas.')
      const yesterday = new Date()

      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      await processDay(ZoneType.EXTERIOR, yesterday)
      await processDay(ZoneType.ZONA_A, yesterday)
      Logger.telemetry('Cierre diario completado.')
    } catch (error) {
      Logger.error('Error en cierre diario:', error)
    }
  })

  Logger.cron('Cargando Rutinas desde la base de datos.')

  const schedules = await prisma.automationSchedule.findMany({
    where: { isEnabled: true },
  })

  schedules.forEach((schedule) => {
    Logger.cron(`Programando: "${schedule.name}" ➜ [${schedule.cronTrigger}]`)
    new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' }, () => {
      runTask(schedule.id)
    })
  })
}

async function runTask(scheduleId: string) {
  Logger.cron(`Ejecutando Rutina Programada (ID: ${scheduleId.slice(0, 8)})`)

  try {
    const schedule = await prisma.automationSchedule.findUnique({
      where: { id: scheduleId },
    })

    if (!schedule || !schedule.isEnabled) return

    if (irrigationRetryManager.connectionState !== 'online') {
      Logger.cron(`Rutina POSTERGADA: ${schedule.name}. Motivo: Nodo Actuador OFFLINE.`)

      await prisma.taskLog.create({
        data: {
          scheduleId: schedule.id,
          purpose: schedule.purpose,
          zones: schedule.zones,
          status: TaskStatus.PENDING,
          source: 'ROUTINE',
          scheduledAt: new Date(),
          duration: schedule.durationMinutes,
          notes: 'Nodo Actuador no está conectado. Esperando reconexión',
          events: {
            create: {
              status: TaskStatus.PENDING,
              notes: 'Nodo Actuador OFFLINE: Esperando reconexión para ejecutar.',
            },
          },
        },
      })

      return
    }

    // 1. Evaluar si la rutina debe proceder mediante el Motor de Inferencia
    const inference = await InferenceEngine.evaluate(schedule)

    // [🛡️ IDEMPOTENCIA]: Verificar si ya existe una ejecución (real o cancelada) para esta ventana horaria
    // Evita que tareas canceladas manualmente "resuciten" o que se dupliquen ejecuciones por lag del cron.
    const existingTask = await prisma.taskLog.findFirst({
      where: {
        scheduleId: schedule.id,
        scheduledAt: {
          gte: new Date(Date.now() - 10 * 60000), // Ventana de 10 min
          lte: new Date(Date.now() + 10 * 60000),
        },
      },
    })

    if (existingTask) {
      if (existingTask.status === TaskStatus.CANCELLED) {
        Logger.cron(
          `"${schedule.name}" fue cancelada previamente por el usuario. Respetando decisión.`,
        )

        return
      }

      if (schedule.purpose !== 'FERTIGATION' && schedule.purpose !== 'FUMIGATION') {
        Logger.cron(`Ya existe una ejecución para "${schedule.name}". Saltando.`)

        return
      }
      // Para agroquímicos, el código de abajo ya maneja el taskLog existente.
    }

    // Lógica especial para Agroquímicos
    if (schedule.purpose === 'FERTIGATION' || schedule.purpose === 'FUMIGATION') {
      // Buscar si ya existe una tarea pre-agendada
      const taskLog = await prisma.taskLog.findFirst({
        where: {
          scheduleId: schedule.id,
          scheduledAt: {
            gte: new Date(Date.now() - 60000), // Ventana de 1min para el trigger exacto
            lte: new Date(Date.now() + 60000),
          },
        },
      })

      // Si no existe (por algún motivo falló el pre-scheduler), crearla ahora
      if (!taskLog) {
        const nextOccurrence = new Date(Date.now() + 12 * 60 * 60 * 1000)
        const task = await prisma.taskLog.create({
          data: {
            scheduleId: schedule.id,
            purpose: schedule.purpose,
            zones: schedule.zones,
            status: TaskStatus.WAITING_CONFIRMATION,
            source: 'ROUTINE',
            scheduledAt: nextOccurrence,
            duration: schedule.durationMinutes,
            notes: 'Tarea pre-agendada para confirmación (12h de antelación).',
          },
        })

        // Crear notificación de confirmación
        await prisma.notification.create({
          data: {
            type: 'AGROCHEMICAL_CONFIRM',
            title: 'Confirmación de Agroquímicos',
            description: `Se requiere preparar el tanque para la rutina: ${schedule.name} programada para el ${nextOccurrence.toLocaleTimeString('es-VE')}`,
            taskId: task.id,
            priority: 'HIGH',
          },
        })

        Logger.agro(
          `Pre-agendada rutina "${schedule.name}" para el ${nextOccurrence.toLocaleString('es-VE')}`,
        )
      }

      // Si está en WAITING_CONFIRMATION, NO se ejecuta. Se queda esperando 24h.
      if (taskLog && taskLog.status === TaskStatus.WAITING_CONFIRMATION) {
        Logger.agro(`Tarea ${taskLog.id.slice(0, 8)} (${schedule.name}) en espera de confirmación.`)

        return
      }

      // Si ya está AUTHORIZED (por confirmación manual anticipada), procesar con Veto ambiental
      if (taskLog && taskLog.status === TaskStatus.AUTHORIZED) {
        if (inference.shouldCancel) {
          Logger.agro(`VETO AMBIENTAL aplicado a tarea autorizada: ${inference.reason}`)
          await recordTaskEvent(taskLog.id, TaskStatus.CANCELLED, inference.reason)

          return
        }
        await processTaskLog(taskLog)

        return
      }

      return
    }

    // Lógica estándar para otras tareas (IRRIGATION, etc.)
    if (inference.shouldCancel) {
      Logger.inference(`Rutina CANCELADA: ${schedule.name}. Motivo: ${inference.reason}`)

      if (inference.reason && !inference.reason.includes('Cancelación manual')) {
        await prisma.taskLog.create({
          data: {
            scheduleId: schedule.id,
            purpose: schedule.purpose,
            zones: schedule.zones,
            status: TaskStatus.CANCELLED,
            source: 'ROUTINE',
            scheduledAt: new Date(),
            duration: schedule.durationMinutes,
            notes: inference.reason,
            events: {
              create: {
                status: TaskStatus.CANCELLED,
                notes: `Cancelado por el motor de inferencia: ${inference.reason}`,
              },
            },
          },
        })
      }

      return
    }

    const collisionCheck = await CollisionGuard.checkTimeWindow(
      new Date(),
      schedule.durationMinutes,
    )

    if (collisionCheck.hasCollision) {
      const conflictIds = collisionCheck.conflictingTasks
        .map((t) => (t as { id: string }).id.split('-')[0])
        .join(', ')

      await prisma.taskLog.create({
        data: {
          scheduleId: schedule.id,
          purpose: schedule.purpose,
          zones: schedule.zones,
          status: TaskStatus.CANCELLED,
          source: 'ROUTINE',
          scheduledAt: new Date(),
          duration: schedule.durationMinutes,
          notes: `Cancelada por CollisionGuard: solapamiento con: ${conflictIds}`,
        },
      })
      Logger.warn(`⚠️ Rutina Cancelada por Colisión: ${schedule.name}`)

      return
    }

    const taskLog = await prisma.taskLog.create({
      data: {
        scheduleId: schedule.id,
        purpose: schedule.purpose,
        zones: schedule.zones,
        status: TaskStatus.PENDING,
        source: 'ROUTINE',
        scheduledAt: new Date(),
        duration: schedule.durationMinutes,
      },
    })

    await processTaskLog(taskLog)
  } catch (error: Error | unknown) {
    Logger.error('Error en runTask:', error)
  }
}

init()
