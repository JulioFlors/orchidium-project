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
  isLuxSamplingActive,
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

// Acumulador de telemetría post-boot: recoge las métricas de los 3 batches
// independientes (illuminance, temperature, humidity) que llegan como mensajes
// separados al mismo tópico EXTERIOR/readings.
interface BootTelemetryAccumulator {
  nodeName: string
  lux: number | null
  temp: number | null
  hum: number | null
  bootAt: number // Timestamp del boot para ventana temporal
  timer: NodeJS.Timeout | null // Timer de fallback (loguea aunque falten métricas)
}
let bootAccumulator: BootTelemetryAccumulator | null = null
let isSystemReady = false // Solo true tras recibir la primera telemetría post-boot

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
const CLIMATE_SYNC_AGGRESSIVE_RETRIES = 6 // Fase agresiva: 6 × 5min = 30min
const CLIMATE_SYNC_PASSIVE_INTERVAL_MS = 15 * 60 * 1000 // Fase pasiva: cada 15min
let climateSyncPhase: 'idle' | 'aggressive' | 'passive' = 'idle'

// ---- Watchdog Resiliente Sensores ----
let dht22Present = false
let dht22Alive = false
let illuminancePresent = false
let illuminanceAlive = false
let lastClimateBatchAt = Date.now()
let lastLuxBatchAt = Date.now()

// Buffers para validación inteligente de lluvia (Humedad Residual)
const telemetryBuffer: { lux: number; temp: number; hum: number; timestamp: number }[] = []
let baselineLux: number | null = null
let baselineTemp: number | null = null
let baselineHum: number | null = null
let isRainOverridden = false
let rainStartedAt: number | null = null
let lastVetoAt: number | null = null
let isWaitingForBaselineFallback = false
let lastSentRainInterval: 'INTERVAL_BURST' | 'INTERVAL_NORMAL' | null = null

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
      // SQL de InfluxDB v3 (DataFusion) requiere AVG en lugar de MEAN.
      // Calculamos agregación directa global para todo el rango del evento (sin GROUP BY).
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

/**
 * Loguea el snapshot de arranque con los datos acumulados de los batches post-boot.
 * Se invoca cuando se reciben todas las métricas o cuando expira la ventana de 5s.
 */
function flushBootLog() {
  if (!bootAccumulator) return

  if (bootAccumulator.timer) {
    clearTimeout(bootAccumulator.timer)
  }

  const nodeName = bootAccumulator.nodeName

  // Imprimir conexión del nodo
  Logger.node(nodeName)

  // 1. Iluminancia
  if (bootAccumulator.lux !== null) {
    Logger.info(
      `Iluminancia: ${colors.yellow}${bootAccumulator.lux.toFixed(0)} lx${colors.reset}`,
      '☀️',
    )
  } else if (!isLuxSamplingActive()) {
    Logger.info(`Iluminancia: ${colors.dim}Muestreo Suspendido (Anochecer)${colors.reset}`, '🌙')
  } else {
    Logger.info(`Iluminancia: ${colors.red}No detectada en batch inicial${colors.reset}`, '⚠️')
  }

  // 2. Clima
  if (bootAccumulator.temp !== null && bootAccumulator.hum !== null) {
    Logger.info(
      `Clima: ${colors.yellow}${bootAccumulator.temp.toFixed(1)}°C${colors.reset} / ${colors.blue}${bootAccumulator.hum.toFixed(1)}%${colors.reset}`,
      '🌡️',
    )
  } else {
    Logger.info(
      `Clima: ${colors.red}Fallo de inicialización en hardware detectado${colors.reset}`,
      '⚠️',
    )
  }

  // 3. Sensor de Lluvia
  Logger.info(
    `Sensor Lluvia: ${lastRainState === 'Raining' ? colors.blue : colors.yellow}${lastRainState}${colors.reset}`,
    '🌧️',
  )

  bootAccumulator = null

  if (!isSystemReady) {
    isSystemReady = true
  }
}

function setupMqttHandlers() {
  const subscribe = () => {
    mqttClient.subscribe(
      [
        'PristinoPlant/Actuator_Controller/cmd/received',
        'PristinoPlant/Actuator_Controller/irrigation/state',
        'PristinoPlant/Actuator_Controller/status',
        'PristinoPlant/Actuator_Controller/status/boot',
        'PristinoPlant/Weather_Station/EXTERIOR/readings',
        'PristinoPlant/Weather_Station/EXTERIOR/rain/state',
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

      // 1.5 Detección de Reinicio del Nodo Actuador
      if (topic === 'PristinoPlant/Actuator_Controller/status/boot') {
        irrigationRetryManager.setStabilizing()
        systemRetryManager.setStabilizing()
        // Nota: lastFirmwareHeartbeat ya actualizó el timestamp de este mensaje.

        // Inicializamos presencia y salud como falsos al reiniciar.
        // La presencia real de cada sensor se confirmará cuando lleguen los primeros
        // batches al tópico EXTERIOR/readings (publicados justo después del /boot).
        dht22Present = false
        dht22Alive = false
        illuminancePresent = false
        illuminanceAlive = false
        lastClimateBatchAt = Date.now()
        lastLuxBatchAt = Date.now()

        // 🚀 INICIALIZACIÓN SÍNCRONA PRE-AWAIT (Evita condición de carrera)
        isSystemReady = false
        if (bootAccumulator?.timer) clearTimeout(bootAccumulator.timer)
        bootAccumulator = {
          nodeName: 'Weather Station Exterior',
          lux: null,
          temp: null,
          hum: null,
          bootAt: Date.now(),
          timer: setTimeout(() => flushBootLog(), 30000), // Ajustado a 30s
        }

        // No forzamos un offline previo, saltamos directamente al sync
        // para que evalúe si es un REBOOT o una sesión nueva.
        await handleNodeSync(true, previousHeartbeat)

        return
      }

      // 1.9 Nodo EMA (Weather Station ZONA_A) — Heartbeat de conectividad
      if (topic === 'PristinoPlant/Weather_Station/ZONA_A/status') {
        if (message === 'online') {
          emaManager.setStabilizing()
          Logger.node('Weather Station Orquideario')
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
          Logger.node('OFFLINE', message === 'lwt_disconnect' ? 'BROKER' : 'NODE')
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

      // 3.5 Lecturas Ambientales (Validación de Lluvia / Humedad Residual - Soporte Batch + Accumulator Nnativo)
      if (topic === 'PristinoPlant/Weather_Station/EXTERIOR/readings') {
        try {
          const data = JSON.parse(message) as {
            data?: [number, { temperature?: number; humidity?: number; illuminance?: number }][]
            temperature?: number
            humidity?: number
            illuminance?: number
          }

          let lux: number | null = null
          let temp: number | null = null
          let hum: number | null = null

          let hasTemp = false
          let hasHum = false
          let hasLux = false

          // Caso A: Formato Batch unificado emitido por flush_telemetry_batches_async()
          if (data.data && Array.isArray(data.data)) {
            // El buffer del firmware almacena cronológicamente. El último es el más reciente (Last Value).
            for (const entry of data.data) {
              const metrics = entry[1]

              if (metrics.temperature !== undefined) {
                temp = Number(metrics.temperature)
                hasTemp = true
              }
              if (metrics.humidity !== undefined) {
                hum = Number(metrics.humidity)
                hasHum = true
              }
              if (metrics.illuminance !== undefined) {
                lux = Number(metrics.illuminance)
                hasLux = true
              }
            }
          } else {
            // Caso B: Fallback para mantener compatibilidad con mensajes planos directos (Legacy / Otros Nodos)
            if (data.temperature !== undefined) {
              temp = Number(data.temperature)
              hasTemp = true
            }
            if (data.humidity !== undefined) {
              hum = Number(data.humidity)
              hasHum = true
            }
            if (data.illuminance !== undefined) {
              lux = Number(data.illuminance)
              hasLux = true
            }
          }

          // Activamos la presencia real en el Watchdog basados en los campos extraídos del lote
          if (hasTemp || hasHum) {
            dht22Present = true
            dht22Alive = true
            lastClimateBatchAt = Date.now()
          }

          if (hasLux) {
            illuminancePresent = true
            illuminanceAlive = true
            lastLuxBatchAt = Date.now()

            if (lux !== null) {
              const now = new Date()
              const caracasHour = parseInt(
                new Intl.DateTimeFormat('en-US', {
                  timeZone: 'America/Caracas',
                  hour: 'numeric',
                  hour12: false,
                }).format(now),
              )

              let targetInterval: 'INTERVAL_BURST' | 'INTERVAL_NORMAL' = 'INTERVAL_NORMAL'

              if (caracasHour >= 8 && caracasHour < 16) {
                if (lux <= 10000) {
                  targetInterval = 'INTERVAL_BURST' // Ráfaga a 1 min si está oscuro
                } else {
                  targetInterval = 'INTERVAL_NORMAL' // Restablecer a 10 min si está claro
                }
              } else {
                targetInterval = 'INTERVAL_NORMAL' // Fuera de ventana 8am-4pm, siempre 10 min
              }

              if (lastSentRainInterval !== targetInterval) {
                lastSentRainInterval = targetInterval
                Logger.rain(
                  `Ajustando intervalo de chequeo de lluvia a ${targetInterval === 'INTERVAL_BURST' ? '1 minuto (Ráfaga)' : '10 minutos (Vigía)'} por iluminancia (${lux.toFixed(0)} lx) a las ${caracasHour}h Caracas.`,
                )
                executeSystemCommand(targetInterval, true)
              }
            }
          }

          // 🚀 [PRESERVADO]: Mecanismo reactivo de acumulación post-boot.
          // Captura las variables del lote actual e hidrata el acumulador sin importar el orden de llegada.
          if (typeof bootAccumulator !== 'undefined' && bootAccumulator) {
            if (hasLux && lux !== null) bootAccumulator.lux = lux
            if (hasTemp && temp !== null) bootAccumulator.temp = temp
            if (hasHum && hum !== null) bootAccumulator.hum = hum

            // Si ya recolectamos las métricas requeridas, flusheamos el log inmediatamente sin esperar el timeout
            const isLuxRequired = isLuxSamplingActive()
            const allPresent =
              (!isLuxRequired || bootAccumulator.lux !== null) &&
              bootAccumulator.temp !== null &&
              bootAccumulator.hum !== null

            if (allPresent) flushBootLog()
          }

          clearSyncTimerIfHealthy()

          if (lastRainState === 'Dry' && lux !== null && temp !== null && hum !== null) {
            telemetryBuffer.push({ lux, temp, hum, timestamp: Date.now() })
            if (telemetryBuffer.length > 10) telemetryBuffer.shift()
          }

          if (
            lastRainState === 'Raining' &&
            !isRainOverridden &&
            lux !== null &&
            temp !== null &&
            hum !== null
          ) {
            // Lógica de Fallback de Baseline (si no hubo datos pre-lluvia)
            if (isWaitingForBaselineFallback && rainStartedAt) {
              const elapsed = Date.now() - rainStartedAt

              if (elapsed < 10 * 60 * 1000) {
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

          // Lógica de Reversión de Veto (Anti-Intermitencia)
          if (
            isRainOverridden &&
            baselineLux !== null &&
            baselineTemp !== null &&
            lastVetoAt !== null &&
            lux !== null &&
            temp !== null &&
            hum !== null
          ) {
            const timeSinceVeto = (Date.now() - lastVetoAt) / 60000

            if (timeSinceVeto < 30) {
              const lostLux = lux < baselineLux * 1.1
              const lostTemp = temp < baselineTemp + 1
              const lostHum = baselineHum !== null && hum > baselineHum + 5

              if (lostLux || lostTemp || lostHum) {
                const reason = lostLux
                  ? 'Nubes regresaron (Lux bajo)'
                  : lostTemp
                    ? 'Baja térmica'
                    : 'Saturación de humedad'

                Logger.rain(
                  `Anulando veto: ${reason} tras ${timeSinceVeto.toFixed(1)}min. La lluvia ha vuelto.`,
                )
                isRainOverridden = false
                lastVetoAt = null
                if (lastRainState === 'Raining') await openRainEvent()
              }
            }
          }
        } catch (err) {
          Logger.error('Error parseando batch de lecturas en el Scheduler:', err)
        }

        return
      }

      // 4. Detección y Persistencia de Lluvia
      if (topic === 'PristinoPlant/Weather_Station/EXTERIOR/rain/state') {
        let state = message
        let rainTimestamp: Date = new Date()

        if (message.startsWith('{')) {
          try {
            interface RainPayload {
              state?: string
              timestamp?: number
            }
            const parsed = JSON.parse(message) as RainPayload

            state = parsed.state || message
            if (parsed.timestamp) {
              const rawTimestamp = Number(parsed.timestamp)
              // Corrección de época: MicroPython (2000) vs Unix (1970)
              const unixTimestamp =
                rawTimestamp < 1000000000 ? rawTimestamp + 946684800 : rawTimestamp

              const ts = unixTimestamp * 1000
              const diffMs = Math.abs(Date.now() - ts)

              // Si el timestamp corregido difiere por más de 24 horas o es anterior a 2025, se descarta.
              if (diffMs < 24 * 60 * 60 * 1000 && unixTimestamp > 1735689600) {
                rainTimestamp = new Date(ts)
              } else {
                Logger.warn(
                  `Timestamp de lluvia desincronizado del firmware (${new Date(ts).toISOString()}). Usando hora del servidor.`,
                )
              }
            }
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
 * Watchdog Pasivo de Sensores Ambientales:
 * Si el nodo está ONLINE, pero no hemos recibido lecturas del DHT22 (o BH1750 cuando está activo)
 * en 25 minutos (ventana de tolerancia que cubre 2 batches perdidos tras la inicialización),
 * declaramos al sensor MUERTO y solicitamos una resincronización reactiva (sync_climate).
 * Nota crítica: El Relay 8 siempre permanece encendido para alimentar los sensores y el pluviómetro.
 */
function checkSensorsHealth() {
  if (irrigationRetryManager.connectionState !== 'online') return

  const now = Date.now()
  const timeSinceLastClimate = now - lastClimateBatchAt
  const timeSinceLastLux = now - lastLuxBatchAt

  let triggered = false

  if (dht22Alive && timeSinceLastClimate > 25 * 60 * 1000) {
    dht22Alive = false
    triggered = true
    Logger.warn(
      `🌡️  Watchdog DHT22: Se detectó silencio de datos climáticos durante ${Math.round(timeSinceLastClimate / 60000)} minutos. Declarando sensor degradado.`,
    )
  }

  if (illuminanceAlive && isLuxSamplingActive() && timeSinceLastLux > 25 * 60 * 1000) {
    illuminanceAlive = false
    triggered = true
    Logger.warn(
      `☀️  Watchdog BH1750: Se detectó silencio de datos de iluminancia durante ${Math.round(timeSinceLastLux / 60000)} minutos. Declarando sensor degradado.`,
    )
  }

  if (triggered) {
    Logger.warn('Iniciando ciclo de recuperación de sensores ambientales (Hard Reset).')
    requestClimateSync()
    startClimateSyncRetry()
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

  // Al arrancar (boot), nos aseguramos de limpiar cualquier temporizador previo
  if (isBoot) {
    if (climateSyncTimer) {
      clearInterval(climateSyncTimer)
      climateSyncTimer = null
    }
    climateSyncAttempts = 0
    climateSyncPhase = 'idle'
  }

  await processPostponedTasks()
}

/**
 * Limpia el temporizador de resincronización si todos los sensores presentes están vivos y sanos.
 */
function clearSyncTimerIfHealthy() {
  const climateHealthy = !dht22Present || dht22Alive
  const luxHealthy = !illuminancePresent || !isLuxSamplingActive() || illuminanceAlive

  if (climateHealthy && luxHealthy) {
    if (climateSyncTimer) {
      clearInterval(climateSyncTimer)
      climateSyncTimer = null
      if (climateSyncPhase !== 'idle') {
        Logger.info(
          `🌡️  Watchdog: Todos los sensores activos reportaron éxito. Sincronización recuperada desde fase ${climateSyncPhase} (${climateSyncAttempts} intentos).`,
        )
      }
    }
    climateSyncAttempts = 0
    climateSyncPhase = 'idle'
  }
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
  climateSyncPhase = 'aggressive'

  climateSyncTimer = setInterval(
    () => {
      climateSyncAttempts++

      if (climateSyncAttempts > CLIMATE_SYNC_AGGRESSIVE_RETRIES) {
        // Transición a modo pasivo (sin rendirse)
        if (climateSyncTimer) clearInterval(climateSyncTimer)
        climateSyncPhase = 'passive'
        Logger.warn(
          `🌡️  DHT22: Fase agresiva agotada (${CLIMATE_SYNC_AGGRESSIVE_RETRIES} intentos). Entrando en modo pasivo (cada 15min).`,
        )
        climateSyncTimer = setInterval(() => {
          Logger.info('🌡️  DHT22: Reintento pasivo de sincronización.')
          requestClimateSync()
        }, CLIMATE_SYNC_PASSIVE_INTERVAL_MS)

        return
      }

      Logger.info(
        `🌡️  DHT22: Reintento agresivo (${climateSyncAttempts}/${CLIMATE_SYNC_AGGRESSIVE_RETRIES})`,
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
  setInterval(checkSensorsHealth, 60_000)

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

    if (!isSystemReady) {
      Logger.cron(`Rutina POSTERGADA: ${schedule.name}. Motivo: Nodo Actuador inicializándose.`)

      await prisma.taskLog.create({
        data: {
          scheduleId: schedule.id,
          purpose: schedule.purpose,
          zones: schedule.zones,
          status: TaskStatus.PENDING,
          source: 'ROUTINE',
          scheduledAt: new Date(),
          duration: schedule.durationMinutes,
          notes: 'Nodo Actuador inicializándose.',
          events: {
            create: {
              status: TaskStatus.PENDING,
              notes: 'Estabilizando Nodo Actuador tras reinicio.',
            },
          },
        },
      })

      return
    }

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
