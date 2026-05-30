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
  executeEmaCommand,
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
// separados al mismo tópico de readings.
interface BootTelemetryAccumulator {
  nodeName: string
  lux: number | null
  temp: number | null
  hum: number | null
  bootAt: number // Timestamp del boot para ventana temporal
  timer: NodeJS.Timeout | null // Timer de fallback (loguea aunque falten métricas)
}
const bootAccumulators = new Map<string, BootTelemetryAccumulator>()
let isSystemReady = false // Solo true tras recibir la primera telemetría post-boot
let lastEmaHeartbeat: number = 0

const emaAuditState = {
  requested: {
    lux: false,
    wifi: false,
    ram: false,
    temp: false,
    hum: false,
  },
  active: {
    lux: false,
    wifi: false,
    ram: false,
    temp: false,
    hum: false,
  },
  lux_hw: true,
  temp_hw: true,
  hum_hw: true,
  rain_hw: false,
}

async function init() {
  console.log() // Espacio en blanco

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
let lastFirmwareHeartbeat: number = 0
let isEmaSleeping = false
let lastSyncTimestamp: number = 0
let lastTimeSyncSent: number = 0
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
let lastSentRainInterval: 'INTERVAL_BURST' | 'INTERVAL_NORMAL' = 'INTERVAL_NORMAL'
let lastKnownLux: number | null = null

/**
 * Devuelve el estado actual de lluvia considerando el veto por humedad residual.
 */
export function isCurrentlyRaining(): boolean {
  return lastRainState === 'Raining' && !isRainOverridden
}

let rainEventMutex = Promise.resolve()

/**
 * Abre un nuevo evento de lluvia en PostgreSQL o reanuda uno existente.
 */
async function openRainEvent(timestamp: Date = new Date()) {
  rainEventMutex = rainEventMutex
    .then(async () => {
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
    })
    .catch((err) => {
      Logger.error('Error en Mutex de openRainEvent:', err)
    })
  await rainEventMutex
}

/**
 * Cierra el evento de lluvia abierto en Postgres y calcula la duración.
 * @param reason Motivo de cierre: "Dry", "ORPHAN_TIMEOUT", "REBOOT", "SCHEDULER_OVERRIDE"
 * @param endTime Timestamp de cierre (por defecto: ahora)
 */
async function closeRainEvent(reason: string, endTime: Date = new Date()) {
  rainEventMutex = rainEventMutex
    .then(async () => {
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
    })
    .catch((err) => {
      Logger.error('Error en Mutex de closeRainEvent:', err)
    })
  await rainEventMutex
}

// Timeout para eventos de lluvia huérfanos (10 minutos sin señales de vida)
const RAIN_ORPHAN_TIMEOUT_MS = 10 * 60 * 1000

/**
 * Loguea el snapshot de arranque con los datos acumulados de los batches post-boot.
 * Se invoca cuando se reciben todas las métricas o cuando expira la ventana de 5s.
 */
function flushBootLog(nodeSource: string) {
  const accumulator = bootAccumulators.get(nodeSource)

  if (!accumulator) return

  if (accumulator.timer) {
    clearTimeout(accumulator.timer)
  }

  // Imprimir conexión del nodo
  Logger.node(nodeSource, nodeSource)

  let hasInitFailure = false

  // 1. Iluminancia
  if (accumulator.lux !== null) {
    Logger.info(
      `Iluminancia: ${colors.yellow}${accumulator.lux.toFixed(0)} lx${colors.reset}`,
      '☀️',
    )
  } else if (!isLuxSamplingActive()) {
    Logger.info(`Iluminancia: ${colors.dim}Muestreo Suspendido (Anochecer)${colors.reset}`, '🌙')
  } else {
    Logger.info(`Iluminancia: ${colors.red}No se detecto el sensor BH1750${colors.reset}`, '⚠️')
    hasInitFailure = true
  }

  // 2. Clima
  if (accumulator.temp !== null && accumulator.hum !== null) {
    Logger.info(
      `Clima: ${colors.yellow}${accumulator.temp.toFixed(1)}°C${colors.reset} / ${colors.blue}${accumulator.hum.toFixed(1)}%${colors.reset}`,
      '🌡️',
    )
  } else {
    Logger.info(`Clima: ${colors.red}No se detecto el sensor DHT22${colors.reset}`, '⚠️')
    hasInitFailure = true
  }

  if (hasInitFailure) {
    if (nodeSource === 'Weather Station Orquideario') {
      executeEmaCommand('sync_climate')
    } else {
      requestClimateSync()
      startClimateSyncRetry()
    }
  }

  // 3. Sensor de Lluvia (excluido en el EMA)
  if (nodeSource !== 'Weather Station Orquideario') {
    Logger.info(
      `Sensor Lluvia: ${lastRainState === 'Raining' ? colors.blue : colors.yellow}${lastRainState}${colors.reset}`,
      '🌧️',
    )
  }

  bootAccumulators.delete(nodeSource)

  // Sincronizar muestreo (Amanecer/Anochecer) de iluminancia al finalizar el flush del boot
  // Garantiza que el Nodo EMA ya esté escuchando comandos tras vaciar sus telemetrías
  if (nodeSource === 'Weather Station Orquideario') {
    syncNodeSampling(undefined, true, 'ema')

    // Sincronizar auditorías solicitadas que aún no están activas en el nodo
    for (const key of Object.keys(emaAuditState.requested) as Array<
      keyof typeof emaAuditState.requested
    >) {
      if (emaAuditState.requested[key] === true && emaAuditState.active[key] === false) {
        Logger.info(`Sincronizando auditoría pendiente '${key}' tras boot del EMA`, '⚡')
        executeEmaCommand(`audit_${key}_on`, true)
      }
    }

    checkAndSleepEma()
  }

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
        'PristinoPlant/Weather_Station/EXTERIOR/readings',
        'PristinoPlant/Weather_Station/EXTERIOR/rain/state',
        'PristinoPlant/Weather_Station/ZONA_A/status',
        'PristinoPlant/Weather_Station/ZONA_A/readings',
        'PristinoPlant/Weather_Station/ZONA_A/cmd/received',
        'PristinoPlant/Weather_Station/ZONA_A/cmd/request',
        'PristinoPlant/Weather_Station/ZONA_A/audit/state',
        'PristinoPlant/Weather_Station/ZONA_A/audit/end',
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

  mqttClient.on('message', async (topic, payload, packet) => {
    // Ignorar mensajes retenidos (retained).
    // El scheduler solo procesa telemetría y comandos en tiempo real para evitar duplicados o estados falsos al arrancar.
    if (packet && packet.retain) return

    try {
      const message = payload.toString().trim()
      const previousHeartbeat = lastFirmwareHeartbeat

      // Heartbeat: cualquier mensaje del firmware actualiza el timestamp general
      // Se actualizará lastFirmwareHeartbeat al final de este handler.

      // 1. Monitoreo de Conexión del Nodo Actuador
      if (topic === 'PristinoPlant/Actuator_Controller/status') {
        if (message === 'ping') {
          lastFirmwareHeartbeat = Date.now()
          if (irrigationRetryManager.connectionState === 'offline') {
            await handleNodeSync('ping', previousHeartbeat)
          } else if (irrigationRetryManager.connectionState === 'none') {
            // El scheduler acaba de iniciar y el nodo ya estaba operando.
            // Transicionamos a READY de inmediato sin estabilización ni sincronización redundante.
            irrigationRetryManager.setReady()
            systemRetryManager.setReady()
            await handleNodeSync('ping', previousHeartbeat)
          }

          return
        }

        if (message === 'online' || message === 'reboot') {
          const timeSinceLastHeartbeat = Date.now() - previousHeartbeat
          const isFreshSession = previousHeartbeat === 0 || timeSinceLastHeartbeat > 15 * 60 * 1000

          if (message === 'online' || isFreshSession) {
            dht22Present = false
            dht22Alive = false
            illuminancePresent = false
            illuminanceAlive = false
          }
          lastClimateBatchAt = Date.now()
          lastLuxBatchAt = Date.now()

          if (message === 'online') {
            irrigationRetryManager.setStabilizing()
            systemRetryManager.setStabilizing()
            isSystemReady = false
          }

          const prev = bootAccumulators.get('Weather Station Exterior')

          if (prev?.timer) clearTimeout(prev.timer)
          bootAccumulators.set('Weather Station Exterior', {
            nodeName: 'Weather Station Exterior',
            lux: null,
            temp: null,
            hum: null,
            bootAt: Date.now(),
            timer: setTimeout(() => flushBootLog('Weather Station Exterior'), 30000), // Preservado a 30s
          })

          if (message === 'online') {
            await handleNodeSync('online', previousHeartbeat)

            return
          }

          // Para reboot
          if (!isFreshSession && irrigationRetryManager.connectionState === 'online') {
            lastFirmwareHeartbeat = Date.now()
          }

          if (irrigationRetryManager.connectionState === 'none') {
            if (!isFreshSession) {
              irrigationRetryManager.setReady()
              systemRetryManager.setReady()
            } else {
              irrigationRetryManager.setStabilizing()
              systemRetryManager.setStabilizing()
            }
          }

          await handleNodeSync('reboot', previousHeartbeat)
        } else if (
          (message === 'lwt_disconnect' || message === 'offline') &&
          irrigationRetryManager.connectionState !== 'offline'
        ) {
          // LWT automático del broker o desconexión limpia del nodo
          await handleNodeOffline(
            message === 'lwt_disconnect' ? 'Desconexión inesperada' : 'Desconexión voluntaria',
            message === 'lwt_disconnect' ? 'BROKER' : 'NODE',
          )
        }

        return
      }

      // 1.9 Nodo EMA (Weather Station ZONA_A) — Heartbeat de conectividad
      if (topic === 'PristinoPlant/Weather_Station/ZONA_A/status') {
        const previousEmaHeartbeat = lastEmaHeartbeat

        lastEmaHeartbeat = Date.now()

        if (message === 'ping') {
          if (emaManager.connectionState === 'offline') {
            await handleEmaSync('ONLINE')
          } else if (emaManager.connectionState === 'none') {
            emaManager.setReady()
            await handleEmaSync('ONLINE')
          }

          return
        }

        if (message === 'reboot' || message === 'online') {
          const timeSinceLastHeartbeat = Date.now() - previousEmaHeartbeat
          const isFreshSession =
            previousEmaHeartbeat === 0 || timeSinceLastHeartbeat > 15 * 60 * 1000

          let statusToSave: DeviceStatus

          if (message === 'online') {
            statusToSave = 'ONLINE'
          } else {
            // reboot
            if (isFreshSession) {
              statusToSave = 'ONLINE'
            } else {
              statusToSave = 'REBOOT'
            }
          }

          // Reiniciamos el estado físico active del EMA en memoria al conectar, pero PRESERVAMOS requested
          for (const key of Object.keys(emaAuditState.active) as Array<
            keyof typeof emaAuditState.active
          >) {
            emaAuditState.active[key] = false
          }
          // Publicamos el estado inicial en MQTT
          mqttClient.publish(
            'PristinoPlant/Weather_Station/ZONA_A/audit/state',
            JSON.stringify(emaAuditState),
            { retain: true, qos: 1 },
          )

          if (
            statusToSave === 'REBOOT' &&
            emaManager.connectionState === 'online' &&
            !isEmaSleeping
          ) {
            // Si es un reboot en caliente, de todas formas inicializamos el bootAccumulator
            // para evaluar que tras la reconexión MQTT los sensores funcionen correctamente.
            const prev = bootAccumulators.get('Weather Station Orquideario')

            if (prev?.timer) clearTimeout(prev.timer)
            bootAccumulators.set('Weather Station Orquideario', {
              nodeName: 'Weather Station Orquideario',
              lux: null,
              temp: null,
              hum: null,
              bootAt: Date.now(),
              timer: setTimeout(() => flushBootLog('Weather Station Orquideario'), 30000), // Ventana de 30s
            })

            return
          }

          if (emaManager.connectionState === 'none') {
            if (statusToSave === 'REBOOT') {
              emaManager.setReady()
            } else {
              emaManager.setStabilizing()
            }
          }

          // Inicializar presencia en boot o reconexión del EMA
          const prev = bootAccumulators.get('Weather Station Orquideario')

          if (prev?.timer) clearTimeout(prev.timer)
          bootAccumulators.set('Weather Station Orquideario', {
            nodeName: 'Weather Station Orquideario',
            lux: null,
            temp: null,
            hum: null,
            bootAt: Date.now(),
            timer: setTimeout(() => flushBootLog('Weather Station Orquideario'), 30000), // Ventana de 30s
          })

          await handleEmaSync(statusToSave)
        } else if (message === 'sleep') {
          Logger.node('SLEEP', 'Weather Station Orquideario')
          isEmaSleeping = true
          emaManager.setOffline()

          // Limpiar todo el estado de auditorías al entrar en sleep
          for (const key of Object.keys(emaAuditState.requested) as Array<
            keyof typeof emaAuditState.requested
          >) {
            emaAuditState.requested[key] = false
            emaAuditState.active[key] = false
          }
          mqttClient.publish(
            'PristinoPlant/Weather_Station/ZONA_A/audit/state',
            JSON.stringify(emaAuditState),
            { retain: true, qos: 1 },
          )

          await prisma.deviceLog
            .create({
              data: {
                device: 'Weather_Station_ZONA_A',
                status: 'SLEEP',
                notes: 'Suspendido',
              },
            })
            .catch((err) => Logger.error('Fallo persistiendo deviceLog (SLEEP)', err))
        } else if (message === 'lwt_disconnect' || message === 'offline') {
          if (isEmaSleeping) {
            // Ignorar señales de desconexión lwt si el nodo se durmió limpiamente
            return
          }
          emaManager.setOffline()
          Logger.node(
            'OFFLINE',
            `Weather Station Orquideario (${message === 'lwt_disconnect' ? 'BROKER' : 'NODE'})`,
          )

          // Limpiar todo el estado de auditorías al quedar offline
          for (const key of Object.keys(emaAuditState.requested) as Array<
            keyof typeof emaAuditState.requested
          >) {
            emaAuditState.requested[key] = false
            emaAuditState.active[key] = false
          }
          mqttClient.publish(
            'PristinoPlant/Weather_Station/ZONA_A/audit/state',
            JSON.stringify(emaAuditState),
            { retain: true, qos: 1 },
          )

          await prisma.deviceLog
            .create({
              data: {
                device: 'Weather_Station_ZONA_A',
                status: 'OFFLINE',
                notes:
                  message === 'lwt_disconnect'
                    ? 'Desconexión inesperada'
                    : 'Desconexión voluntaria',
              },
            })
            .catch((err) => Logger.error('Fallo persistiendo deviceLog (OFFLINE)', err))
        }

        return
      }

      // 1.10 Comandos encolados del Frontend hacia el Nodo EMA
      if (topic === 'PristinoPlant/Weather_Station/ZONA_A/cmd/request') {
        const cmdStr = message.trim()

        Logger.mqtt(`Petición de comando desde UI: ${cmdStr}`, 'Nodo EMA')

        // Proxy ACK inmediato a la UI
        mqttClient.publish('PristinoPlant/Weather_Station/ZONA_A/cmd/received', cmdStr, { qos: 1 })

        if (cmdStr.startsWith('audit_')) {
          const isOn = cmdStr.endsWith('_on')
          const isOff = cmdStr.endsWith('_off')
          const category = isOn
            ? (cmdStr.slice(6, -3) as keyof typeof emaAuditState.requested)
            : isOff
              ? (cmdStr.slice(6, -4) as keyof typeof emaAuditState.requested)
              : null

          if (category && category in emaAuditState.requested) {
            if (isOn) {
              emaAuditState.requested[category] = true
              mqttClient.publish(
                'PristinoPlant/Weather_Station/ZONA_A/audit/state',
                JSON.stringify(emaAuditState),
                { retain: true, qos: 1 },
              )
              executeEmaCommand(cmdStr, true)
            } else if (isOff) {
              emaAuditState.requested[category] = false
              mqttClient.publish(
                'PristinoPlant/Weather_Station/ZONA_A/audit/state',
                JSON.stringify(emaAuditState),
                { retain: true, qos: 1 },
              )
              emaManager.removeByTaskId(`audit_${category}_on`)
              executeEmaCommand(cmdStr, true)
            }
          }
        } else {
          executeEmaCommand(cmdStr, true)
        }

        return
      }

      // 1.11 Procesar reportes de estado físico de auditoría del EMA
      if (topic === 'PristinoPlant/Weather_Station/ZONA_A/audit/state') {
        try {
          const parsed = JSON.parse(message)

          if (parsed.requested || parsed.active) return

          for (const key of ['lux', 'wifi', 'ram', 'temp', 'hum'] as const) {
            const isPhysicallyActive = parsed[key] === true

            emaAuditState.active[key] = isPhysicallyActive
            if (!isPhysicallyActive) {
              emaAuditState.requested[key] = false
            }
          }

          if (parsed.lux_hw !== undefined) emaAuditState.lux_hw = parsed.lux_hw
          if (parsed.temp_hw !== undefined) emaAuditState.temp_hw = parsed.temp_hw
          if (parsed.hum_hw !== undefined) emaAuditState.hum_hw = parsed.hum_hw
          if (parsed.rain_hw !== undefined) emaAuditState.rain_hw = parsed.rain_hw

          mqttClient.publish(
            'PristinoPlant/Weather_Station/ZONA_A/audit/state',
            JSON.stringify(emaAuditState),
            { retain: true, qos: 1 },
          )

          checkAndSleepEma()
        } catch (err) {
          Logger.error('Error parseando audit/state de EMA:', err)
        }

        return
      }

      // 2. Acuse de Recibo (ACK)
      if (
        topic === 'PristinoPlant/Actuator_Controller/cmd/received' ||
        topic === 'PristinoPlant/Weather_Station/ZONA_A/cmd/received'
      ) {
        const isActuator = topic.includes('Actuator')
        const nodeName = isActuator ? 'Nodo Actuador' : 'Nodo EMA'

        try {
          const parsed = JSON.parse(message)
          const taskId = parsed.task_id

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
          if (isActuator) {
            irrigationRetryManager.confirmByTaskId(message)
            systemRetryManager.confirm(message)
          } else {
            emaManager.confirm(message)
          }
        }

        if (!isActuator) {
          if (message !== 'sleep') {
            checkAndSleepEma()
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
      if (
        topic === 'PristinoPlant/Weather_Station/EXTERIOR/readings' ||
        topic === 'PristinoPlant/Weather_Station/ZONA_A/readings'
      ) {
        const isEma = topic === 'PristinoPlant/Weather_Station/ZONA_A/readings'
        const nodeName = isEma ? 'Weather Station Orquideario' : 'Weather Station Exterior'

        if (isEma) {
          lastEmaHeartbeat = Date.now()
          sendCaracasTimeToEma()
        }

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

          // Lógica específica para el Nodo Exterior (Validación de Lluvia / Watchdog)
          if (!isEma) {
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
                lastKnownLux = lux // Guardar último valor conocido

                const now = new Date()
                const caracasHour = parseInt(
                  new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/Caracas',
                    hour: 'numeric',
                    hour12: false,
                  }).format(now),
                )

                const isInBurstWindow = caracasHour >= 8 && caracasHour < 16
                const isBurstLux = lux <= 10000

                if (isInBurstWindow && isBurstLux) {
                  // Debe ir a ráfaga
                  if (lastSentRainInterval !== 'INTERVAL_BURST') {
                    lastSentRainInterval = 'INTERVAL_BURST'
                    Logger.rain(
                      `Ajustando intervalo de chequeo de lluvia a 1 minuto (Ráfaga) por iluminancia (${lux.toFixed(0)} lx) a las ${caracasHour}h.`,
                    )
                    executeSystemCommand('INTERVAL_BURST', true)
                  }
                } else {
                  // Debe ir a normal, pero ÚNICAMENTE si previamente lo habíamos cambiado a BURST
                  if (lastSentRainInterval === 'INTERVAL_BURST') {
                    lastSentRainInterval = 'INTERVAL_NORMAL'
                    const reason = !isInBurstWindow
                      ? `fin de ventana horaria (hora: ${caracasHour}h)`
                      : `iluminancia recuperada (${lux.toFixed(0)} lx)`

                    Logger.rain(
                      `Restableciendo intervalo de chequeo de lluvia a 5 minutos (Vigía) por ${reason}.`,
                    )
                    executeSystemCommand('INTERVAL_NORMAL', true)
                  }
                }
              }
            }
          }

          // 🚀 [PRESERVADO]: Mecanismo reactivo de acumulación post-boot.
          // Captura las variables del lote actual e hidrata el acumulador sin importar el orden de llegada.
          const accumulator = bootAccumulators.get(nodeName)

          if (accumulator) {
            if (hasLux && lux !== null) accumulator.lux = lux
            if (hasTemp && temp !== null) accumulator.temp = temp
            if (hasHum && hum !== null) accumulator.hum = hum

            // Si ya recolectamos las métricas requeridas, flusheamos el log inmediatamente sin esperar el timeout
            const isLuxRequired = isLuxSamplingActive()
            const allPresent =
              (!isLuxRequired || accumulator.lux !== null) &&
              accumulator.temp !== null &&
              accumulator.hum !== null

            if (allPresent) flushBootLog(nodeName)
          }

          if (!isEma) {
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

              const diffMs = Math.abs(Date.now() - unixTimestamp * 1000)

              // Si el timestamp corregido difiere por más de 24 horas o es anterior a 2025, se descarta.
              if (diffMs < 24 * 60 * 60 * 1000 && unixTimestamp > 1735689600) {
                rainTimestamp = new Date(unixTimestamp * 1000)
              } else {
                // Silenciado: Timestamp de lluvia desincronizado del firmware. Usando hora del servidor.
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
      if (topic.startsWith('PristinoPlant/Actuator_Controller/') || topic.includes('/EXTERIOR/')) {
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
  if (lastFirmwareHeartbeat === 0) return

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
 * Control de Suspensión Inteligente para el Nodo EMA:
 * Apaga la radio WiFi y duerme el dispositivo si no tiene comandos encolados
 * ni auditorías solicitadas o activas pendientes, evitando mantener la radio encendida.
 */
function checkAndSleepEma() {
  if (isEmaSleeping || emaManager.connectionState === 'offline') return

  const pendingCount = emaManager.getPendingCommandsCount()
  const hasRequestedAudits = Object.values(emaAuditState.requested).some((v) => v === true)
  const hasActiveAudits = Object.values(emaAuditState.active).some((v) => v === true)
  const isBooting = bootAccumulators.has('Weather Station Orquideario')

  if (pendingCount === 0 && !hasRequestedAudits && !hasActiveAudits && !isBooting) {
    executeEmaCommand('sleep', true)
  }
}

/**
 * Watchdog de inactividad de la Estación EMA:
 * Si el nodo está registrado como online/sleep pero no hemos recibido telemetrías
 * ni estados en 30 minutos (ventana de tolerancia que cubre el ciclo de sleep de 20min),
 * lo forzamos a OFFLINE e inhabilitamos las toolcards del frontend.
 */
async function checkEmaHeartbeat() {
  if (lastEmaHeartbeat === 0) return
  if (emaManager.connectionState === 'offline' && !isEmaSleeping) return

  const elapsed = Date.now() - lastEmaHeartbeat

  if (elapsed > 30 * 60 * 1000) {
    Logger.node('OFFLINE', 'Weather Station Orquideario (Watchdog Timeout)')
    emaManager.setOffline()
    isEmaSleeping = false

    // Sincronizar el estado de auditorías a inactivo
    for (const key of Object.keys(emaAuditState.requested) as Array<
      keyof typeof emaAuditState.requested
    >) {
      emaAuditState.requested[key] = false
      emaAuditState.active[key] = false
    }

    // Publicar estado de auditoría vacío a MQTT
    mqttClient.publish(
      'PristinoPlant/Weather_Station/ZONA_A/audit/state',
      JSON.stringify(emaAuditState),
      { retain: true, qos: 1 },
    )

    // Persistir estado offline en DB
    await prisma.deviceLog
      .create({
        data: {
          device: 'Weather_Station_ZONA_A',
          status: 'OFFLINE',
          notes: 'Watchdog: Sin señales de vida durante 30 minutos (Offline)',
        },
      })
      .catch((err) => Logger.error('Fallo persistiendo deviceLog para EMA (Watchdog OFFLINE)', err))

    // Publicar estado offline en canal de status
    mqttClient.publish('PristinoPlant/Weather_Station/ZONA_A/status', 'offline', {
      retain: true,
      qos: 1,
    })
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
      `Watchdog DHT22: sin datos durante ${Math.round(timeSinceLastClimate / 60000)} minutos.`,
    )
  }

  if (illuminanceAlive && isLuxSamplingActive() && timeSinceLastLux > 25 * 60 * 1000) {
    illuminanceAlive = false
    triggered = true
    Logger.warn(
      `Watchdog BH1750:sin datos durante ${Math.round(timeSinceLastLux / 60000)} minutos.`,
    )
  }

  if (triggered) {
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
        notes: reason,
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
async function handleNodeSync(
  message: 'online' | 'reboot' | 'ping',
  previousHeartbeat: number = 0,
) {
  const now = Date.now()
  const timeSinceLastSync = now - lastSyncTimestamp

  // Si ya sincronizamos hace menos de 5 segundos, ignoramos la redundancia
  if (timeSinceLastSync < 5000) {
    if (message !== 'ping') {
      Logger.debug('Boot redundante detectado. Ignorando sincronización duplicada.')
    }

    return
  }

  const timeSinceLastHeartbeat = now - previousHeartbeat
  const isFreshSession = previousHeartbeat === 0 || timeSinceLastHeartbeat > 15 * 60 * 1000

  let notes = 'Conectado'
  let statusToSave: DeviceStatus

  if (message === 'online') {
    statusToSave = 'ONLINE'
    notes = 'Conectado'
  } else if (message === 'reboot') {
    if (isFreshSession) {
      statusToSave = 'ONLINE'
      notes = 'Nueva sesión'
    } else {
      statusToSave = 'REBOOT'
      notes = 'Reinicio'
    }
  } else {
    // ping
    statusToSave = 'ONLINE'
    notes = 'Conectado (Ping)'
  }

  lastSyncTimestamp = now

  // Marcamos estado tanto en consola como en Influx/Historial
  if (statusToSave === 'REBOOT') {
    Logger.node('REBOOT', 'Actuator_Controller')
  } else {
    Logger.node('ONLINE', 'Actuator_Controller')
  }

  if (
    irrigationRetryManager.connectionState !== 'online' ||
    statusToSave === 'REBOOT' ||
    message !== 'ping'
  ) {
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
    if (statusToSave === 'ONLINE') {
      irrigationRetryManager.setStabilizing()
      systemRetryManager.setStabilizing()
    } else {
      irrigationRetryManager.setReady()
      systemRetryManager.setReady()
    }
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

  const shouldSync = statusToSave === 'ONLINE'

  if (shouldSync) {
    // El secuenciador ya está en modo STABILIZING (60s) gracias al caller de boot
    resetSamplingState()
    syncNodeSampling(undefined, true)

    // Al reconectarse o reiniciarse el nodo, asumimos que se inicializa en INTERVAL_NORMAL.
    lastSentRainInterval = 'INTERVAL_NORMAL'

    // Si las condiciones de ráfaga ya están dadas en este momento (según la última iluminancia conocida),
    // forzamos al nodo a entrar a modo ráfaga de forma inmediata.
    if (lastKnownLux !== null) {
      const now = new Date()
      const caracasHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Caracas',
          hour: 'numeric',
          hour12: false,
        }).format(now),
      )

      if (caracasHour >= 8 && caracasHour < 16 && lastKnownLux <= 10000) {
        lastSentRainInterval = 'INTERVAL_BURST'
        Logger.rain(
          `Nodo reconectado/reiniciado. Forzando intervalo de chequeo de lluvia a 1 minuto (Ráfaga) por iluminancia previa (${lastKnownLux.toFixed(0)} lx) a las ${caracasHour}h.`,
        )
        executeSystemCommand('INTERVAL_BURST', true)
      }
    }
  }

  // Al arrancar (boot), nos aseguramos de limpiar cualquier temporizador previo
  if (message === 'online' || (message === 'reboot' && isFreshSession)) {
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
 * Envía un comando con la hora local actual de Caracas para sincronizar el RTC del EMA.
 */
function sendCaracasTimeToEma(): void {
  const nowMs = Date.now()
  if (nowMs - lastTimeSyncSent < 30000) {
    return
  }
  lastTimeSyncSent = nowMs

  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now)

    const getPart = (type: Intl.DateTimeFormatPartTypes): number => {
      const found = parts.find((p) => p.type === type)

      return found ? parseInt(found.value, 10) : 0
    }

    const year = getPart('year')
    const month = getPart('month')
    const day = getPart('day')
    const hour = getPart('hour')
    const minute = getPart('minute')
    const second = getPart('second')

    const jsDay = now.getDay()
    const weekday = jsDay === 0 ? 6 : jsDay - 1

    const payload = JSON.stringify({
      time: [year, month, day, weekday, hour, minute, second, 0],
    })

    executeEmaCommand(payload, false)
    Logger.mqtt(`Sincronización horaria enviada al EMA: ${payload}`, 'Nodo EMA')
  } catch (error) {
    Logger.error('Error enviando sincronización horaria al EMA:', error)
  }
}

/**
 * Orquesta la sincronización completa de la Estación EMA tras reconexión o reinicio.
 */
async function handleEmaSync(statusToSave: DeviceStatus) {
  isEmaSleeping = false
  emaManager.setReady()

  const notes = statusToSave === 'REBOOT' ? 'Reinicio' : 'Conectado'

  Logger.node(statusToSave, 'Weather Station Orquideario')

  await prisma.deviceLog
    .create({
      data: {
        device: 'Weather_Station_ZONA_A',
        status: statusToSave,
        notes: notes,
      },
    })
    .catch((err) => Logger.error('Fallo persistiendo deviceLog para EMA', err))

  // Sincronizar el reloj del EMA
  sendCaracasTimeToEma()
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
        Logger.info(`Watchdog: Sensores Sincronizados.`)
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
          `${colors.yellow}DHT22${colors.reset}: Fase agresiva agotada (${CLIMATE_SYNC_AGGRESSIVE_RETRIES} intentos). Entrando en modo pasivo (cada 15min).`,
        )
        climateSyncTimer = setInterval(() => {
          Logger.info(`${colors.yellow}DHT22${colors.reset}: Reintento pasivo de sincronización.`)
          requestClimateSync()
        }, CLIMATE_SYNC_PASSIVE_INTERVAL_MS)

        return
      }

      Logger.info(
        `${colors.yellow}DHT22${colors.reset}: Reintento agresivo (${climateSyncAttempts}/${CLIMATE_SYNC_AGGRESSIVE_RETRIES})`,
      )
      requestClimateSync()
    },
    5 * 60 * 1000,
  )
}

/**
 * Verifica si faltan estadísticas de telemetría para los últimos N días
 * y las procesa de manera retroactiva de forma automática y silenciosa.
 */
async function checkAndRecoverMissingStats(daysToLookBack = 7) {
  try {
    const zones = [ZoneType.EXTERIOR, ZoneType.ZONA_A]
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    let processedCount = 0

    for (let i = 1; i <= daysToLookBack; i++) {
      const targetDate = new Date(today)

      targetDate.setDate(today.getDate() - i)

      for (const zone of zones) {
        // Comprobamos si ya existe el registro único para esa fecha y zona
        const exists = await prisma.dailyEnvironmentStat.findUnique({
          where: {
            date_zone: {
              date: targetDate,
              zone,
            },
          },
        })

        // Si no existe, recuperamos el procesamiento del día de forma silenciosa
        if (!exists) {
          const success = await processDay(zone, targetDate, false, true)

          if (success) {
            processedCount++
          }
        }
      }
    }

    if (processedCount > 0) {
      Logger.info(`📊 Se procesaron ${processedCount} días de telemetría faltante`)
    }
  } catch (error) {
    Logger.error('Fallo el procesamiento retroactivo de telemetría', error)
  }
}

// ---- Lógica de Rutinas (Crons) ----
async function initScheduler() {
  await waitForPostgres()

  // 0. Limpieza de tareas interrumpidas (Solo al arrancar el scheduler)
  await resumeInterruptedTasks()

  // 0.1. Verificación retroactiva de estadísticas diarias (últimos 7 días)
  await checkAndRecoverMissingStats()

  // Verificación periódica de inactividad de nodos y eventos (cada 15s)
  setInterval(checkRainOrphanTimeout, 60_000)
  setInterval(checkSensorsHealth, 60_000)
  setInterval(checkEmaHeartbeat, 60_000)

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

    if (!schedule) {
      Logger.error(
        `Rutina con ID ${scheduleId} no encontrada en la base de datos (desincronización de memoria del scheduler).`,
      )

      return
    }

    if (!schedule.isEnabled) return

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

    if (!irrigationRetryManager.isReady) {
      const isOffline = irrigationRetryManager.connectionState !== 'online'
      const reason = isOffline
        ? 'Nodo Actuador OFFLINE.'
        : 'Estabilizando Nodo Actuador tras reinicio.'

      Logger.cron(`Rutina POSTERGADA: ${schedule.name}. Motivo: ${reason}`)

      await prisma.taskLog.create({
        data: {
          scheduleId: schedule.id,
          purpose: schedule.purpose,
          zones: schedule.zones,
          status: TaskStatus.PENDING,
          source: 'ROUTINE',
          scheduledAt: new Date(),
          duration: schedule.durationMinutes,
          notes: isOffline
            ? 'Nodo Actuador no está conectado. Esperando reconexión'
            : 'Estabilizando Nodo Actuador tras reinicio.',
          events: {
            create: {
              status: TaskStatus.PENDING,
              notes: isOffline
                ? 'Nodo Actuador OFFLINE: Esperando reconexión para ejecutar.'
                : 'Estabilizando Nodo Actuador tras reinicio.',
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
