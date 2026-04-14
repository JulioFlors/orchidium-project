import { InfluxDBClient } from '@influxdata/influxdb3-client'
import { prisma, TaskPurpose, TaskStatus, ZoneType, CollisionGuard } from '@package/database'
import { Cron } from 'croner'
import mqtt from 'mqtt'

// ---- Cargar variables de entorno ----
// La carga de variables de entorno se gestiona externamente.
// docker-compose.yml (dentro del contenedor)
// dotenv-cli en el package.json (desarrollo local)

// ---- Debugging ----
const DEBUG = process.env.NODE_ENV !== 'production'

// ---- Configuración MQTT ----
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || process.env.MQTT_BROKER_URL_CLOUD || process.env.MQTT_BROKER_URL_SERVERLESS || process.env.MQTT_BROKER_URL_LOCAL || ''

const MQTT_USERNAME = process.env.MQTT_USERNAME || process.env.MQTT_USER_BACKEND || ''
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || process.env.MQTT_PASS_BACKEND || ''

const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || process.env.MQTT_CLIENT_ID_SCHEDULER || 'Scheduler'
const ACTUATOR_TOPIC = 'PristinoPlant/Actuator_Controller/irrigation/cmd'
const SYSTEM_CMD_TOPIC = 'PristinoPlant/Actuator_Controller/cmd'

// Add Service Status Topic for LWT and Heartbeat
const SERVICE_STATUS_TOPIC = `PristinoPlant/Services/${MQTT_CLIENT_ID}/status`

// ---- Configuración InfluxDB ----
const INFLUX_URL = process.env.INFLUX_URL || process.env.INFLUX_URL_CLOUD || process.env.INFLUX_URL_SERVERLESS || process.env.INFLUX_URL_LOCAL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || process.env.INFLUX_TOKEN_SERVERLESS
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

// ---- Configuración de Reglas ----
const RAIN_THRESHOLD_SECONDS = 1800 // 30 minutos de lluvia acumulada cancelan el riego

// ---- colors for Logs ----
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[34m',
  magenta: '\x1b[95m',
  cyan: '\x1b[96m',
  white: '\x1b[97m',
}

// ---- Sistema de Logs ----
const getLogTime = () => {
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date())
}

const Logger = {
  mqtt: (msg: string) => console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.blue} 📡 [ MQTT ]${colors.reset}${colors.white} ${msg}${colors.reset}`),

  info: (msg: string) => console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.blue} 📡 [ INFO ]${colors.reset}${colors.white} ${msg}${colors.reset}`),

  success: (msg: string) => console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.green} ✅ [ DONE ]${colors.reset}${colors.white} ${msg}${colors.reset}`),

  warn: (msg: string) => console.warn(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.yellow} ⚠️ [ WARN ]${colors.reset}${colors.white} ${msg}${colors.reset}`),

  error: (msg: string, err?: any) => console.error(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.red} ❌ [ ERROR ]${colors.reset}${colors.white} ${msg}${colors.reset}`, err || ''),

  debug: (msg: string) => DEBUG && console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.cyan} 🔎[ DEBUG ]${colors.reset}${colors.white} ${msg}${colors.reset}`),

  node: (status: 'ONLINE' | 'OFFLINE') => {
    const isOnline = status === 'ONLINE'
    const color = isOnline ? colors.green : colors.red
    const icon = isOnline ? '✅' : '❌'
    console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${color} ${icon} [ NODO ] ${status}${colors.reset}`)
  }
}

const recentEvents = new Map<string, number>()

/**
 * Registra un evento de cambio de estado de forma atómica en TaskLog y TaskEventLog.
 */
async function recordTaskEvent(taskId: string, status: TaskStatus, notes?: string, extraData: any = {}) {
  try {
    const lockKey = `${taskId}_${status}`
    const now = Date.now()
    if (recentEvents.has(lockKey) && now - (recentEvents.get(lockKey) || 0) < 2000) {
      return null
    }
    recentEvents.set(lockKey, now)

    return await prisma.$transaction(async (tx) => {
      const currentTask = await tx.taskLog.findUnique({
        where: { id: taskId },
        select: { status: true, notes: true, actualStartAt: true },
      })

      if (!currentTask) {
        Logger.warn(`Se recibió evento ${status} para tarea inexistente: ${taskId.slice(0, 8)}`)
        return null
      }

      const terminalStatuses: TaskStatus[] = [
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
        TaskStatus.EXPIRED,
        TaskStatus.SKIPPED,
      ]

      const isCurrentTerminal = terminalStatuses.includes(currentTask.status)
      const isNewTerminal = terminalStatuses.includes(status)
      const isStatusChange = currentTask.status !== status

      // 🛡️ Bloqueo de Eventos Tardíos: No permitir que eventos de "proceso" (ACK, ON) resuciten tareas terminadas
      if (isCurrentTerminal && !isNewTerminal) {
        return null
      }

      let shouldUpdateStatus = true
      if (isCurrentTerminal) {
        if (currentTask.status !== status) {
          shouldUpdateStatus = false
        }
      }

      let resultRecord: any = currentTask

      if (shouldUpdateStatus) {
        if (currentTask.status === status) {
          if (currentTask.notes === notes || status === TaskStatus.IN_PROGRESS) {
            resultRecord = await tx.taskLog.update({
              where: { id: taskId },
              data: { notes, ...extraData },
            })
          }
        } else {
          resultRecord = await tx.taskLog.update({
            where: { id: taskId },
            data: {
              status,
              notes,
              executedAt:
                status === TaskStatus.IN_PROGRESS && !currentTask.actualStartAt
                  ? new Date()
                  : undefined,
              ...extraData,
            },
          })
        }
      } else {
        // En estado terminal, solo permitimos actualizaciones sutiles (ej: duración real) sin cambiar el status.
        resultRecord = await tx.taskLog.update({
          where: { id: taskId },
          data: { notes, ...extraData },
        })
      }

      // 🛡️ Registro Atómico en la Línea de Tiempo: SOLO si hay un cambio real de estado
      if (isStatusChange) {
        await tx.taskEventLog.create({
          data: {
            taskId,
            status,
            notes: notes || `Evento: ${status}`,
          },
        })
      }

      return resultRecord
    })
  } catch (err) {
    Logger.error(`Error persistiendo evento ${status} para tarea ${taskId.slice(0, 8)}:`, err)
    return null
  }
}

// ---- Inicialización Atómica (Fail-Fast) ----
if (!INFLUX_TOKEN) {
  Logger.error('INFLUX_TOKEN no está definido. Verifique el archivo .env')
  process.exit(1)
}

/**
 * Verifica la conexión con PostgreSQL al arranque.
 */
async function checkDbConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    Logger.error('FALLO CRÍTICO: No se pudo conectar a PostgreSQL. Verifique el archivo .env', err)
    process.exit(1)
  }
}
const url = new URL(INFLUX_URL)
const isPublicCloud = url.hostname.endsWith('influxdata.com')
const isInternalHost = url.hostname === 'influxdb' || url.hostname === 'localhost'

// El SDK v3 (@influxdata/influxdb3-client) usa la API fetch internamente,
// la cual en Node.js 18+ NO obedece el parámetro transportOptions: { rejectUnauthorized }.
// Por lo tanto, relajamos la validación a nivel de proceso SIEMPRE QUE aseguremos
// que la conexión es puramente interna (red Docker o Local).
if (isInternalHost && !isPublicCloud) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN,
  database: INFLUX_BUCKET,
})

Logger.mqtt(
  `Conectando a ${colors.blue}${MQTT_BROKER_URL}${colors.reset}`,
)

// ---- Cliente MQTT ----
const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  clientId: MQTT_CLIENT_ID,
  protocolVersion: 5,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  // Opciones típicamente requeridas o recomendadas para HiveMQ Cloud
  protocol: MQTT_BROKER_URL.startsWith('mqtts') ? 'mqtts' : 'mqtt',
  rejectUnauthorized: true, // Requerido para verificar certificados públicos de HiveMQ
  servername: new URL(MQTT_BROKER_URL).hostname, // SNI: Garantiza que se envíe el hostname correcto en el handshake TLS
  will: {
    topic: SERVICE_STATUS_TOPIC,
    payload: Buffer.from('offline'),
    qos: 1,
    retain: true
  }
})

let heartbeatInterval: NodeJS.Timeout | null = null

// ---- Gestión de Reintentos de Comandos (ACK) ----
interface PendingCommand {
  topic: string
  payload: string
  attempts: number
  lastSent: number
  timer: NodeJS.Timeout | null
}

class CommandRetryManager {
  private pending = new Map<string, PendingCommand>()
  private MAX_ATTEMPTS = 20
  private RETRY_INTERVAL_MS = 60000

  track(topic: string, payload: string) {
    const key = `${topic}:${payload}`
    
    // 🔄 SMART RESET: Si ya existe un seguimiento, lo reiniciamos
    // Esto asegura que tras una reconexión, el contador vuelva a 1.
    const existing = this.pending.get(key)
    if (existing) {
      if (existing.timer) clearInterval(existing.timer)
      Logger.debug(`Sincronización del comando reiniciada: ${colors.magenta}${payload}${colors.reset}`)
    } else {
      Logger.debug(`Iniciando seguimiento de comando: ${colors.magenta}${payload}${colors.reset}`)
    }
    
    const command: PendingCommand = {
      topic,
      payload,
      attempts: 1,
      lastSent: Date.now(),
      timer: setInterval(() => this.retry(key), this.RETRY_INTERVAL_MS)
    }

    this.pending.set(key, command)
  }

  confirm(topic: string, payload: string) {
    const key = `${topic}:${payload}`
    const command = this.pending.get(key)
    
    if (command) {
      if (command.timer) clearInterval(command.timer)
      this.pending.delete(key)
      Logger.success(`Comando confirmado por el nodo: ${colors.magenta}${payload}${colors.reset}`)
    }
  }

  confirmByTaskId(taskId: string) {
    for (const [key, command] of this.pending) {
      if (command.payload.includes(taskId)) {
        if (command.timer) clearInterval(command.timer)
        this.pending.delete(key)
        Logger.debug(`El nodo confirmó ACK para la tarea (ID: ${taskId.slice(0, 8)})`)
      }
    }
  }

  clear() {
    if (this.pending.size === 0) return
    Logger.debug(`El nodo está offline, pero mantenemos ${this.pending.size} reintentos en cola para cuando regrese.`)
  }

  private retry(key: string) {
    const command = this.pending.get(key)
    if (!command) return

    // 🛡️ Pausar reintentos si el nodo está offline
    if (lastActuatorState === 'offline') {
      return 
    }

    if (command.attempts >= this.MAX_ATTEMPTS) {
      Logger.error(`Se agotaron los ${this.MAX_ATTEMPTS} intentos de entrega para: ${command.payload}`)
      if (command.timer) clearInterval(command.timer)
      this.pending.delete(key)
      return
    }

    command.attempts++
    command.lastSent = Date.now()
    
    Logger.warn(`Reintentando entrega al nodo (${command.attempts}/${this.MAX_ATTEMPTS}): ${colors.magenta}${command.payload}${colors.reset}`)
    
    mqttClient.publish(command.topic, command.payload, { qos: 1 })
  }
}

const retryManager = new CommandRetryManager()

// ---- Memoria de Estado para evitar Logs repetitivos ----
let lastActuatorState = 'unknown'
let lastRainState: string | null = null

mqttClient.on('connect', () => {
  Logger.success('Conectado a Broker MQTT')
  
  // Publicar estado del Servicio (Heartbeat/LWT)
  mqttClient.publish(SERVICE_STATUS_TOPIC, 'online', { qos: 1, retain: true })

  // Suscribirse a los tópicos de QoS de las tareas del dispositivo de Borde
  mqttClient.subscribe([
    'PristinoPlant/Actuator_Controller/cmd/received',
    'PristinoPlant/Actuator_Controller/irrigation/state',
    'PristinoPlant/Actuator_Controller/status',
    'PristinoPlant/Weather_Station/Exterior/readings',
    'PristinoPlant/Weather_Station/Exterior/rain/state',
    'PristinoPlant/Weather_Station/Exterior/rain/event',
  ], { qos: 1 })

  // ---- FRECUENCIA DE SEÑAL DE VIDA (HEARTBEAT) ----
  // Define cada cuánto tiempo Node.js le cuenta al Frontend que sigue vivo
  if (heartbeatInterval) clearInterval(heartbeatInterval)
  heartbeatInterval = setInterval(() => {
    mqttClient.publish(SERVICE_STATUS_TOPIC, 'online', { qos: 1, retain: true })
  }, 300000)
})

mqttClient.on('error', (err) => Logger.error('NO pudo establecer la conexión con el cliente MQTT:', err))

mqttClient.on('close', () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
})

// ---- Manejo Bidireccional de QoS y Tareas ---
mqttClient.on('message', async (topic, payload) => {
  try {
    const message = payload.toString().trim()

    // 1. Monitoreo de Conexión del Nodo Actuador (Con filtro de estado)
    if (topic === 'PristinoPlant/Actuator_Controller/status') {
      
      if (message === 'online' && lastActuatorState !== 'online') {
        lastActuatorState = 'online'
        Logger.node('ONLINE')

        // 🔄 RE-SINCRONIZACIÓN REACTIVA: 
        // Si el actuador se conecta (online), forzamos el estado del monitor de iluminancia correcto de inmediato.
        //Logger.info(`${colors.cyan}Sincronizando monitor de iluminancia${colors.reset}`)
        syncEcoMode()

        // Registrar en DB
        await prisma.deviceLog.create({
          data: {
            device: 'Actuator_Controller',
            status: 'ONLINE',
            notes: 'Dispositivo conectado / Heartbeat recuperado.'
          }
        }).catch(err => Logger.error('Fallo persistiendo deviceLog (ONLINE)', err))

        // Reasunción de Tareas Interrumpidas
        await resumeInterruptedTasks()
      } 
      else if (message === 'offline' && lastActuatorState !== 'offline') {
        const previousState = lastActuatorState
        lastActuatorState = 'offline'
        Logger.node('OFFLINE')

        // Registrar en DB
        await prisma.deviceLog.create({
          data: {
            device: 'Actuator_Controller',
            status: 'OFFLINE',
            notes: previousState === 'unknown' ? 'LWT: Estado inicial detectado como Offline.' : 'LWT: El dispositivo se desconectó inesperadamente.'
          }
        }).catch(err => Logger.error('Fallo persistiendo deviceLog (OFFLINE)', err))
        
        // Calcular deuda de tiempo para tareas interrumpidas
        const interruptedTasks = await prisma.taskLog.findMany({
          where: {
            status: { in: [TaskStatus.ACKNOWLEDGED, TaskStatus.IN_PROGRESS, TaskStatus.DISPATCHED] }
          }
        })

        /**
         * 🔄 HANDOFF DE RESPONSABILIDADES (Capa de Transporte -> Capa de Negocio)
         * 
         * Al detectar la desconexión, movemos las tareas activas a un estado de recuperación en DB.
         * En este punto, el RetryManager debe dejar de insistir con el comando original (viejo)
         * para evitar colisiones cuando el sistema de reasunción despache el comando nuevo (deuda).
         */
        for (const task of interruptedTasks) {
          let extraNotes = 'Interrumpida: El Nodo Actuador perdió conexión inesperadamente.'
          let addedMinutes = 0

          if (task.actualStartAt && task.status === TaskStatus.IN_PROGRESS) {
            const elapsedMs = Date.now() - new Date(task.actualStartAt).getTime()
            addedMinutes = Math.floor(elapsedMs / 60000)
            extraNotes = `Interrumpida tras ${addedMinutes} min de riego efectivo.`
          }

          // 1. Limpiamos reintentos del transporte para esta tarea (Handoff)
          retryManager.confirmByTaskId(task.id)

          // 2. Persistimos el fallo en DB para que sea recuperado por resumeInterruptedTasks()
          await recordTaskEvent(task.id, TaskStatus.FAILED, extraNotes, {
            completedMinutes: { increment: addedMinutes }
          })
        }

        if (interruptedTasks.length > 0) {
          Logger.warn(`Se pausaron ${interruptedTasks.length} tareas para su recuperación automática.`)
        }
        
        // 🛡️ OFFLINE GUARD RELAJADO: No cancelamos, permitimos que el retryManager insista.
        retryManager.clear()
      }
      return
    }

    // 2. Acuse de Recibo (ACK) emitido por el Nodo Actuador
    if (topic === 'PristinoPlant/Actuator_Controller/cmd/received') {
      try {
        const parsed = JSON.parse(message)
        const taskId = parsed.task_id

        if (taskId) {
          // El modulo leyó formalmente y la encoló.
          await recordTaskEvent(taskId, TaskStatus.ACKNOWLEDGED, 'Nodo Actuador: Comandos recibidos.')
        }
        
        // 🔄 CONFIRMACIÓN UNIVERSAL:
        // Intentamos confirmar el mensaje tanto en el canal de irrigación como en el de sistema.
        // El retryManager ignorará silenciosamente si la llave topic:payload no existe.
        retryManager.confirm(ACTUATOR_TOPIC, message)
        retryManager.confirm(SYSTEM_CMD_TOPIC, message)

      } catch (e) {
        // Si no es JSON, intentamos confirmar como comando crudo
        retryManager.confirm(SYSTEM_CMD_TOPIC, message)
      }
      return
    }

    // 3. Telemetría Funcional Física (Consolidada)
    if (topic === 'PristinoPlant/Actuator_Controller/irrigation/state') {
      let updates: Record<string, { state: string, task_id?: string }> = {}

      try {
        updates = JSON.parse(message)
      } catch (e) {
        Logger.error('Fallo parseando snapshot unificado:', e)
        return
      }


      // Procesar cada actuador/relé detectado
      for (const [name, info] of Object.entries(updates)) {
        const { state, task_id: taskId } = info

        if (state === 'ON') {
          if (taskId) {
            // Detener reintentos si ya está en progreso
            retryManager.confirmByTaskId(taskId)

           // Actualización Atómica Exacta
            await recordTaskEvent(taskId, TaskStatus.IN_PROGRESS, 'Circuito de Riego abierto.', {
              actualStartAt: new Date()
            })
          } else {
            const graceWindow = new Date(Date.now() - 20 * 60000)
            await prisma.taskLog.updateMany({
              where: { 
                status: { in: [TaskStatus.CONFIRMED, TaskStatus.FAILED] },
                scheduledAt: { gte: graceWindow }
              },
              data: { 
                status: TaskStatus.IN_PROGRESS, 
                actualStartAt: new Date(),
                notes: `Circuito abierto: ${name} (Snapshot).` 
              }
            })
          }
        }
        else if (state === 'OFF') {
        // Si viene un taskId explícito, sabemos exactamente qué tarea finalizó.
          if (taskId) {
            // 🛡️ Obtener el log de la tarea para validar estado y calcular el tiempo real
            const currentTask = await prisma.taskLog.findUnique({
              where: { id: taskId },
              select: { status: true, actualStartAt: true, duration: true, purpose: true },
            })

            let completedMinutes = currentTask?.duration || 0
            if (currentTask?.actualStartAt) {
              const elapsedMs = Date.now() - new Date(currentTask.actualStartAt).getTime()
              completedMinutes = Math.floor(elapsedMs / 60000)
            }

            const finished = await recordTaskEvent(
              taskId,
              TaskStatus.COMPLETED,
              'Circuito de Riego cerrado correctamente.',
              { completedMinutes: { set: completedMinutes } },
            )

            if (finished) {
              const purposeLabel = currentTask?.purpose || 'Tarea'
              Logger.success(`${purposeLabel} ${taskId.slice(0, 8)} FINALIZADA (${completedMinutes} min)`)
            }
          } 
          else {
            // Caso: Relé se apagó pero no recibimos task_id en el snapshot.
            // Si el relé es 'pump' (Bomba), y tenemos tareas IN_PROGRESS, reportamos el bypass.
            if (name === 'pump') {
               const hoursAgo = new Date(Date.now() - 2 * 3600000)
               const gracePeriod = new Date(Date.now() - 60000) // 1 minuto de gracia para estabilización

               const activeInDb = await prisma.taskLog.findMany({
                 where: { 
                   status: TaskStatus.IN_PROGRESS, 
                   scheduledAt: { gte: hoursAgo, lte: gracePeriod } 
                 }
               })

                if (activeInDb.length > 0) {
                  Logger.warn(`⚠️ [DESINCRONIZACIÓN] La Bomba no inició tras la ventana de sincronización (60s). Tareas afectadas: ${activeInDb.length}. Verifique Presión/Válvulas.`);
                }
            }
          }
        }
      }
      return
    }

    // 4. Detección en Tiempo Real de Estado de Lluvia (Weather Guard)
    if (topic === 'PristinoPlant/Weather_Station/Exterior/rain/state') {
      if (message === 'Raining' && lastRainState !== 'Raining') {
        Logger.warn('🌧️ [WeatherGuard] Lluvia detectada por sensores en tiempo real. Evaluación de tareas activas.')
        
        // REACCIÓN INMEDIATA: Si hay tareas en curso en zonas exteriores, pausarlas o vigilarlas.
        // (La lógica de pausa se dispara en el próximo Tick del Scheduler o aquí mismo)
      } else if (message === 'Dry' && lastRainState === 'Raining') {
        Logger.info('☀️ [WeatherGuard] Los sensores indican que la lluvia ha cesado (Cambio de estado detectado).')
      }
      lastRainState = message;
      return
    }

    // 5. Registro de Fin de Evento de Lluvia
    if (topic === 'PristinoPlant/Weather_Station/Exterior/rain/event') {
      try {
        const data = JSON.parse(message)
        Logger.success(`🌧️ [WeatherGuard] Evento de lluvia finalizado: ${Math.floor(data.duration_seconds / 60)} min | Intensidad: ${data.average_intensity_percent}%`)
      } catch (e) {
        Logger.error('Error parseando Rain Event JSON:', e)
      }
      return
    }

  } catch (error) {
    Logger.error('Error procesando QoS Message:', error)
  }
})

// ---- Lógica de Negocio (Helpers) ----

/**
 * Consulta InfluxDB para ver cuánto llovió en las últimas 24h.
 * Retorna true si se debe CANCELAR el riego.
 */
async function checkRainCondition(zone: ZoneType): Promise<{ shouldCancel: boolean, duration: number }> {
  try {
    // SQL Query para InfluxDB v3
    // Sumamos la duración de todos los eventos de lluvia en las últimas 24h
    const query = `
      SELECT SUM("duration_seconds") as total_rain
      FROM "rain_events"
      WHERE time >= now() - interval '24 hours'
      AND zone = 'EXTERIOR'
    `

    Logger.debug(`Consultando Lluvia: ${query}`)

    const stream = influxClient.query(query)
    let totalDuration = 0

    for await (const row of stream) {
      if (row.total_rain) {
        totalDuration = Number(row.total_rain)
      }
    }

    Logger.info(`Lluvia acumulada (24h) en ${zone}: ${totalDuration} segundos`)

    if (totalDuration >= RAIN_THRESHOLD_SECONDS) {
      return { shouldCancel: true, duration: totalDuration }
    }

    return { shouldCancel: false, duration: totalDuration }

  } catch (error) {
    Logger.error('Error consultando InfluxDB (Asumiendo NO Lluvia para seguridad)', error)
    return { shouldCancel: false, duration: 0 }
  }
}

/**
 * Consulta la base de datos de pronósticos (WeatherGuard) para ver si se espera lluvia inminente.
 * Retorna true si el pronóstico indica alta probabilidad (>70%).
 */
async function checkWeatherGuard(): Promise<{ shouldCancel: boolean, chance: number, time?: Date }> {
  try {
    const now = new Date()
    const horizon = new Date(now.getTime() + 3 * 3600000) // Ventana de 3 horas

    const forecast = await prisma.weatherForecast.findFirst({
      where: {
        timestamp: {
          gte: now,
          lte: horizon
        },
        precipProb: { gte: 0.7 }
      },
      orderBy: { timestamp: 'asc' }
    })

    if (forecast) {
      return { 
        shouldCancel: true, 
        chance: forecast.precipProb * 100, 
        time: forecast.timestamp 
      }
    }

    return { shouldCancel: false, chance: 0 }
  } catch (error) {
    Logger.error('Error consultando WeatherGuard (Forecast Cache)', error)
    return { shouldCancel: false, chance: 0 }
  }
}

/**
 * Envía un comando de circuito al Nodo Actuador.
 * Un solo JSON con la clave `circuit` que el ESP32 desglosará
 * en las acciones individuales de cada relé.
 */
function executeSequence(purpose: TaskPurpose, durationMinutes: number, taskId: string) {
  const durationSec = durationMinutes * 60

  const payload = {
    circuit: purpose,
    state: 'ON',
    duration: durationSec,
    task_id: taskId
  }

  const message = JSON.stringify(payload)
  mqttClient.publish(ACTUATOR_TOPIC, message, {
    qos: 1,
    retain: false, // 🛡️ Seguridad: No retener comandos operativos
    properties: {
      messageExpiryInterval: 300
    }
  })

  // Registrar para seguimiento de confirmación (Retry System)
  retryManager.track(ACTUATOR_TOPIC, message)

  Logger.info(`Despachando Circuito: ${purpose} (${durationMinutes} min) [Task: ${taskId.slice(0, 8)}]`)
  Logger.debug(`MQTT TX ➜ ${message}`)
}

/**
 * Envía un comando de sistema (eco, reset, etc) al Nodo Actuador.
 */
function executeSystemCommand(command: string) {
  mqttClient.publish(SYSTEM_CMD_TOPIC, command, {
    qos: 1,
    retain: false
  })
  Logger.info(`Comando: ${colors.magenta}${command}${colors.reset}`)
  
  // Registrar para seguimiento de confirmación (Retry System)
  retryManager.track(SYSTEM_CMD_TOPIC, command)
}

/**
 * Sincroniza el estado del monitoreo de lux basado en la hora actual.
 * Ciclo Eco: ON (05:00 - 19:00) | OFF (19:00 - 05:00)
 */
function syncEcoMode() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Caracas', 
    hour: 'numeric', 
    hour12: false 
  };
  const hourString = new Intl.DateTimeFormat('en-US', options).format(now);
  const hour = parseInt(hourString);

  // Si estamos entre las 5am y las 7pm (19h)
  if (hour >= 5 && hour < 19) {
    executeSystemCommand('lux_sampling:on');
  } else {
    executeSystemCommand('lux_sampling:off');
  }
}

// ---- Ejecutor atómico de una Tarea (TaskLog) ----
async function processTaskLog(taskLog: any) {
  try {
    // Verificar Regla de Lluvia (Solo si es Riego o Fertirriego)
    if (taskLog.purpose === 'IRRIGATION' || taskLog.purpose === 'FERTIGATION') {
      // 1. Check Reactivo: ¿Está lloviendo o llovió mucho? (Sensores)
      const rainCheck = await checkRainCondition(taskLog.zones[0])

      if (rainCheck.shouldCancel) {
        Logger.warn(`🌧️ Tarea CANCELADA por sensores de lluvia (${rainCheck.duration}s acumulados)`)

        await prisma.taskLog.update({
          where: { id: taskLog.id },
          data: {
            status: TaskStatus.CANCELLED,
            notes: `Cancelado por WeatherGuard (Sensores): ${Math.floor(rainCheck.duration / 60)} min de lluvia previa.`
          }
        })
        return
      }

      // 2. Check Proactivo: ¿Va a llover pronto? (Pronóstico API)
      const forecastCheck = await checkWeatherGuard()
      if (forecastCheck.shouldCancel) {
        const timeStr = forecastCheck.time?.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
        Logger.warn(`⛈️ Tarea CANCELADA por pronóstico: ${forecastCheck.chance}% lluvia a las ${timeStr}`)

        await prisma.taskLog.update({
          where: { id: taskLog.id },
          data: {
            status: TaskStatus.CANCELLED,
            notes: `Cancelado por WeatherGuard (Pronóstico): ${forecastCheck.chance}% prob. lluvia a las ${timeStr}.`
          }
        })
        return
      }
    }

    // Activar Secuencia del Circuito de Riego (Despachar)
    executeSequence(taskLog.purpose, taskLog.duration, taskLog.id)

    // Marcar como DISPATCHED
    await recordTaskEvent(taskLog.id, TaskStatus.DISPATCHED, 'Comandos MQTT enviados al Nodo Actuador.', {
      executedAt: new Date()
    })

    Logger.success(`Circuito de Tarea Log ${taskLog.id.slice(0, 8)} despachado.`) 

  } catch (error) {
    Logger.error('Fallo crítico ejecutando taskLog', error)
    await prisma.taskLog.update({
      where: { id: taskLog.id },
      data: {
        status: TaskStatus.FAILED,
        notes: String(error)
      }
    }).catch(err => {
      Logger.error(`Fallo secundario marcando tarea ${taskLog.id.slice(0, 8)} como FAILED tras error previo`, err)
    })
  }
}

// ---- Orquestador de rutinas programadas (AutomationSchedules) ----
async function runTask(scheduleId: string) {
  Logger.info(`⏰ Ejecutando Rutina Programada (ID: ${scheduleId.slice(0, 8)})`)

  try {
    const schedule = await prisma.automationSchedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule || !schedule.isEnabled) {
      Logger.warn('Rutina no encontrada o deshabilitada. Omitiendo.')
      return
    }

    const requiresConfirmation = schedule.purpose === 'FERTIGATION' || schedule.purpose === 'FUMIGATION'

    // Validar si choca con alguna rutina diferida o cronjob activo en la ventana de tiempo
    const collisionCheck = await CollisionGuard.checkTimeWindow(new Date(), schedule.durationMinutes)

    let initialStatus: TaskStatus = requiresConfirmation ? TaskStatus.WAITING_CONFIRMATION : TaskStatus.PENDING
    let cancelReason: string | null = null

    if (collisionCheck.hasCollision) {
      initialStatus = TaskStatus.CANCELLED
      const conflictIds = collisionCheck.conflictingTasks.map(t => t.id.split('-')[0]).join(', ')
      cancelReason = `Cancelada por CollisionGuard: solapamiento hidráulico con tarea(s): ${conflictIds}`
      Logger.warn(`⚠️ Rutina Programada Cancelada por Colisión (ID: ${scheduleId.split('-')[0]})`)
    }

    const taskLog = await prisma.taskLog.create({
      data: {
        scheduleId: schedule.id,
        purpose: schedule.purpose,
        zones: schedule.zones,
        status: initialStatus,
        source: 'ROUTINE',
        scheduledAt: new Date(),
        duration: schedule.durationMinutes,
        ...(cancelReason ? { notes: cancelReason } : {})
      }
    })

    if (collisionCheck.hasCollision) return // Salida temprana si hubo colisión

    if (requiresConfirmation) {
      Logger.warn(`⏸️ Rutina de Agroquímicos (${schedule.purpose}) en pausa WAITING_CONFIRMATION. El usuario debe liberar desde la Central.`)
      return
    }

    await processTaskLog(taskLog)

  } catch (error) {
    Logger.error('Fallo inicializando rutina programada', error)
  }
}

// ---- Motor de Polling para Tareas Diferidas (PENDING) ----
async function checkPendingTasks() {
  try {
    const now = new Date()
    const graceWindow = new Date(Date.now() - 20 * 60000)

    // 1. Ejecutar tareas PENDING dentro de la ventana de gracia (últimos 20 min)
    const activeTasks = await prisma.taskLog.findMany({
      where: {
        status: TaskStatus.PENDING, // 🔴 Se elimina TaskStatus.FAILED para evitar bucles
        scheduledAt: {
          lte: now,
          gte: graceWindow
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })

    if (activeTasks.length > 0) Logger.info(`🔍 Polling: Encontradas ${activeTasks.length} tareas pendientes.`);

    for (const task of activeTasks) {
      Logger.info(`🕒 Iniciando Tarea Diferida (ID: ${task.id.slice(0, 8)})`)
      await processTaskLog(task)
    }

    // 2. Auto-cancelar tareas expiradas (fuera de la ventana de gracia)
    // Esto incluye PENDING normales y WAITING_CONFIRMATION (recetas sin confirmación manual)
    const expired = await prisma.taskLog.updateMany({
      where: {
        status: { in: [TaskStatus.PENDING, TaskStatus.WAITING_CONFIRMATION] },
        scheduledAt: {
          lt: graceWindow
        }
      },
      data: {
        status: TaskStatus.CANCELLED,
        notes: 'Cancelada: ventana de ejecución o tiempo de confirmación expirado.'
      }
    })

    if (expired.count > 0) Logger.warn(`🗑️ ${expired.count} tarea(s) expirada(s) auto-canceladas.`)

    // 3. Auto-fallar tareas DISPATCHED sin ACK (Timeout de 5 min)
    const ackTimeout = new Date(Date.now() - 5 * 60000)
    const stuckDispatched = await prisma.taskLog.findMany({
      where: {
        status: TaskStatus.DISPATCHED,
        executedAt: { lt: ackTimeout }
      }
    })

    for (const task of stuckDispatched) {
      await recordTaskEvent(task.id, TaskStatus.FAILED, 'Timeout: El Nodo Actuador no confirmó recepción (ACK).')
    }
    if (stuckDispatched.length > 0) Logger.warn(`🧹 Polling: ${stuckDispatched.length} tarea(s) DISPATCHED sin ACK pasadas a FAILED.`)

    // 4. Auto-limpieza (Garbage Collector) con Cálculo Dinámico
    // Busca tareas ACKNOWLEDGED o IN_PROGRESS y valida `scheduledAt + duration + graceWindow`
    const potentiallyStuck = await prisma.taskLog.findMany({
      where: {
        status: { in: [TaskStatus.ACKNOWLEDGED, TaskStatus.IN_PROGRESS, TaskStatus.CONFIRMED] }
      }
    })

    let stuckCount = 0
    const nowMs = Date.now()

    for (const task of potentiallyStuck) {
      // 20 minutos de gracia adicionales a la duración de la tarea
      const expirationTime = task.scheduledAt.getTime() + (task.duration * 60000) + (20 * 60000)
      
      if (nowMs > expirationTime) {
        await recordTaskEvent(task.id, TaskStatus.FAILED, 'Tarea atascada: no se recibió telemetría de finalización a tiempo (SLA Excedido).')
        stuckCount++
      }
    }

    if (stuckCount > 0) Logger.warn(`🧹 ${stuckCount} tarea(s) atascada(s) pasadas a FAILED.`)

    // 5. Auto-Vencer tareas Interrumpidas (LWT FAILED) cuyo tiempo de recuperación caducó
    const recoveryExpired = await prisma.taskLog.findMany({
      where: {
        status: TaskStatus.FAILED,
        notes: { contains: 'Interrumpida' }
      }
    })

    let expiredCount = 0
    for (const task of recoveryExpired) {
      // Límite absoluto de vida útil de la orden: inicio programado + duración + 20m de gracia
      const absoluteExpiration = task.scheduledAt.getTime() + (task.duration * 60000) + (20 * 60000)
      
      if (nowMs > absoluteExpiration) {
        const newNotes = 'Ventana de recuperación (20 min) agotada. Tarea descartada.'
        await recordTaskEvent(task.id, TaskStatus.EXPIRED, newNotes)
        expiredCount++
      }
    }

    if (expiredCount > 0) Logger.warn(`🧹 Polling: ${expiredCount} tarea(s) interrumpidas marcadas como Vencidas permanentemente.`)

  } catch (error) {
    Logger.error('Error durante el Polling de tareas pendientes', error)
  }
}

/**
 * Busca tareas interrumpidas por fallos de conexión y las reanuda
 * si aún les queda tiempo de riego y están en la ventana de gracia.
 */
async function resumeInterruptedTasks() {
  const graceWindow = new Date(Date.now() - 20 * 60000) // 20 min de gracia
  
  const debtTasks = await prisma.taskLog.findMany({
    where: {
      status: TaskStatus.FAILED,
      notes: { contains: 'Interrumpida' },
      scheduledAt: { gte: graceWindow }
    }
  })

  for (const task of debtTasks) {
    const remainingMinutes = task.duration - task.completedMinutes

    if (remainingMinutes > 0) {
      Logger.info(`♻️ Reanudando Tarea ${task.id.slice(0, 8)}: Quedan ${remainingMinutes} min pendientes.`)
      
      // Despachar el tiempo RESTANTE
      executeSequence(task.purpose, remainingMinutes, task.id)

      // Marcar como DISPATCHED
      await recordTaskEvent(task.id, TaskStatus.DISPATCHED, `Reanudando riego: Reenviando tiempo restante (${remainingMinutes} min) tras falla de conexión.`)
    } else {
      // Si por error de cálculo ya se completó, la cerramos
      await recordTaskEvent(task.id, TaskStatus.COMPLETED, 'Cerrada por verificación de reasunción (Tiempo agotado).')
    }
  }
}

// ---- Inicialización del Servicio ----
async function initScheduler() {
  await checkDbConnection()
  Logger.info('Cargando Rutinas desde la base de datos')

  const schedules = await prisma.automationSchedule.findMany({
    where: { isEnabled: true }
  })

  if (schedules.length === 0) {
    Logger.warn('No hay rutinas activas programadas.')
  }

  schedules.forEach(schedule => {
    try {
      const job = new Cron(schedule.cronTrigger, { timezone: "America/Caracas" })
      
      Logger.info(`Programando: "${schedule.name}" ➜ [${schedule.cronTrigger}]`)

      job.schedule(() => {
        runTask(schedule.id)
      })
    } catch (e) {
      Logger.error(`Cron inválido para ${schedule.name}: ${schedule.cronTrigger}`)
    }
  })

  new Cron('* * * * *', { timezone: "America/Caracas" }, () => {
    checkPendingTasks()
  })

  // ---- SINCRONIZACIÓN DE MONITOREO: Iluminancia (Día/Noche) ----
  // Despertar sensor a las 5:30 AM
  new Cron('30 5 * * *', { timezone: "America/Caracas" }, () => {
    Logger.info('☀  Iniciando muestreo de iluminancia (Amanecer)')
    executeSystemCommand('lux_sampling:on')
  })

  // Dormir sensor a las 7:00 PM
  new Cron('* 19 * * *', { timezone: "America/Caracas" }, () => {
    Logger.info('🌙  Suspendiendo muestreo de iluminancia (Anochecer)')
    executeSystemCommand('lux_sampling:off')
  })

  // Agregación de métricas de telemetría diariamente a las 23:59
  new Cron('59 23 * * *', { timezone: "America/Caracas" }, () => {
    Logger.info('📊 Iniciando proceso de agregación de datos de Sensores.')
    import('./cron/aggregate-daily.js').then((m) => {
      m.aggregateDailyStats().catch(err => Logger.error('Fallo en aggregateDailyStats', err))
    })
  })

}

initScheduler().catch(e => Logger.error(`No se pudo iniciar el Servicio de Scheduler: ${colors.red}${e}${colors.reset}`))