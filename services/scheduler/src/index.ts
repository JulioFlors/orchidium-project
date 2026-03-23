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

  debug: (msg: string) => DEBUG && console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.cyan} 🔎 [ DEBUG ]${colors.reset}${colors.white} ${msg}${colors.reset}`),

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
    // 🛡️ [Anti-Ráfagas / Debounce]
    // Evita la duplicación concurrente provocada por múltiples relés de un mismo circuito
    // encendiéndose y enviando MQTT exactamente al mismo milisegundo.
    const lockKey = `${taskId}_${status}`
    const now = Date.now()
    if (recentEvents.has(lockKey) && (now - recentEvents.get(lockKey)!) < 2000) {
      return null
    }
    recentEvents.set(lockKey, now)

    return await prisma.$transaction(async (tx) => {
      // Comprobación de Idempotencia: ¿Ya estamos en ese estado?
      const currentTask = await tx.taskLog.findUnique({
        where: { id: taskId },
        select: { status: true, notes: true }
      })

      // Si el estado es exactamente el mismo, evaluamos si la semántica (notas) cambió.
      // Si la nota es idéntica (ej. varios IN_PROGRESS de válvulas), omitimos el duplicado visual.
      if (currentTask?.status === status) {
        if (currentTask.notes === notes || status === TaskStatus.IN_PROGRESS) {
          // Actualizamos el Log Principal silenciosamente (ej. para acumular minutos)
          return await tx.taskLog.update({
            where: { id: taskId },
            data: {
              notes,
              ...extraData
            }
          })
        }
      }

      // 1. Actualizar el log principal
      const updated = await tx.taskLog.update({
        where: { id: taskId },
        data: {
          status,
          notes,
          ...extraData
        }
      })

      // 2. Crear la entrada en la bitácora de eventos para el Timeline
      await tx.taskEventLog.create({
        data: {
          taskId,
          status,
          notes
        }
      })

      return updated
    })
  } catch (err) {
    Logger.error(`Error persistiendo evento ${status} para tarea ${taskId.slice(0, 8)}:`, err)
    return null
  }
}

// ---- Cliente InfluxDB v3 ----
if (!INFLUX_TOKEN) {
  Logger.error('INFLUX_TOKEN no esta definido')
  process.exit(1)
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

// ---- Memoria de Estado para evitar Logs repetitivos ----
let lastActuatorState = 'unknown'

mqttClient.on('connect', () => {
  Logger.success('Conectado a Broker MQTT')

  // Publicar estado de vida apenas conectamos
  mqttClient.publish(SERVICE_STATUS_TOPIC, 'online', { qos: 1, retain: true })

  // Suscribirse a los tópicos de QoS de las tareas del dispositivo de Borde
  mqttClient.subscribe([
    'PristinoPlant/Actuator_Controller/cmd/received',
    'PristinoPlant/Actuator_Controller/irrigation/state/#',
    'PristinoPlant/Actuator_Controller/status'
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

        for (const task of interruptedTasks) {
          let extraNotes = 'El Nodo Actuador perdió conexión durante una ventana crítica.'
          let addedMinutes = 0

          if (task.actualStartAt && task.status === TaskStatus.IN_PROGRESS) {
            const elapsedMs = Date.now() - new Date(task.actualStartAt).getTime()
            addedMinutes = Math.floor(elapsedMs / 60000)
            extraNotes = `Interrumpida tras ${addedMinutes} min de riego efectivo.`
          }

          await recordTaskEvent(task.id, TaskStatus.FAILED, extraNotes, {
            completedMinutes: { increment: addedMinutes }
          })
        }

        if (interruptedTasks.length > 0) {
          Logger.warn(`Se marcaron ${interruptedTasks.length} tareas como INTERRUMPIDAS debido a la desconexión del Nodo Actuador.`)
        }
      }
      return
    }

    // 2. Acuse de Recibo (ACK) emitido por el Nodo Actuador
    if (topic === 'PristinoPlant/Actuator_Controller/cmd/received') {
      const parsed = JSON.parse(message)
      const taskId = parsed.task_id

      if (taskId) {
        // El modulo leyó formalmente y la encoló.
        await recordTaskEvent(taskId, TaskStatus.ACKNOWLEDGED, 'Comandos recibidos y encolados por el Nodo Actuador.')
      }
      return
    }

    // 3. Telemetría Funcional Física (Los relés del Circuito de Riego cambiaron de estado)
    if (topic.startsWith('PristinoPlant/Actuator_Controller/irrigation/state/')) {
      let state = message
      let taskId = ''

      // Intentamos parsear por si es JSON nuevo (Sincronía Transaccional)
      try {
        const parsed = JSON.parse(message)
        state = parsed.state || message
        taskId = parsed.task_id || ''
      } catch {
        // Formato legado de texto plano
      }

      if (state === 'ON') {
        if (taskId) {
           // Actualización Atómica Exacta
           await recordTaskEvent(taskId, TaskStatus.IN_PROGRESS, 'Circuito de Riego abierto.', {
             actualStartAt: new Date()
           })
        } else {
           // Soporte Legado
           const graceWindow = new Date(Date.now() - 20 * 60000)
           await prisma.taskLog.updateMany({
             where: { 
               status: { in: [TaskStatus.CONFIRMED, TaskStatus.FAILED] },
               scheduledAt: { gte: graceWindow }
             },
             data: { 
               status: TaskStatus.IN_PROGRESS, 
               actualStartAt: new Date(),
               notes: 'Circuito de Riego abierto (Legado).' 
             }
           })
        }
      }
      else if (state === 'OFF') {
        // Si viene un taskId explícito, sabemos exactamente qué tarea finalizó 
        // y no dependemos de si es la bomba de agua o no (ej nebulizadores / suelo).
        if (taskId) {
           // Obtener el log de la tarea para calcular el tiempo real ejecutado
           const currentTask = await prisma.taskLog.findUnique({
             where: { id: taskId },
             select: { actualStartAt: true, duration: true }
           })

           let completedMinutes = currentTask?.duration || 0
           if (currentTask?.actualStartAt) {
             const elapsedMs = Date.now() - new Date(currentTask.actualStartAt).getTime()
             completedMinutes = Math.floor(elapsedMs / 60000)
           }

           const finished = await recordTaskEvent(taskId, TaskStatus.COMPLETED, 'Circuito de Riego cerrado.', {
             completedMinutes: { set: completedMinutes }
           })
           if (finished) Logger.success(`Tarea ${taskId.slice(0, 8)} COMPLETED (${completedMinutes} min)`)
        } else {
           // Soporte Legado: La bomba es el último eslabón en apagarse, certifica el fin del circuito.
           // Ocurre solamente si el ESP32 no manda Task ID.
           if (topic.endsWith('/pump')) {
             const hoursAgo = new Date(Date.now() - 2 * 3600000)
             const finished = await prisma.taskLog.updateMany({
               where: { 
                 status: TaskStatus.IN_PROGRESS,
                 scheduledAt: { gte: hoursAgo }
               },
               data: { status: TaskStatus.COMPLETED, notes: 'Circuito de Riego cerrado (Legado).' }
             })
             if (finished.count > 0) Logger.success('Tareas catalogadas con éxito (Legado)')
           }
        }
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
      AND zone = '${zone}'
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
    properties: {
      messageExpiryInterval: 300
    }
  })

  Logger.info(`Despachando Circuito: ${purpose} (${durationMinutes} min) [Task: ${taskId.slice(0, 8)}]`)
  Logger.debug(`MQTT TX ➜ ${message}`)
}

// ---- Ejecutor atómico de una Tarea (TaskLog) ----
async function processTaskLog(taskLog: any) {
  try {
    // Verificar Regla de Lluvia (Solo si es Riego o Fertirriego)
    if (taskLog.purpose === 'IRRIGATION' || taskLog.purpose === 'FERTIGATION') {
      const rainCheck = await checkRainCondition(taskLog.zones[0])

      if (rainCheck.shouldCancel) {
        Logger.warn(`🌧️ Tarea CANCELADA por lluvia (${rainCheck.duration}s acumulados)`)

        await prisma.taskLog.update({
          where: { id: taskLog.id },
          data: {
            status: TaskStatus.CANCELLED,
            notes: `Cancelado por lluvia acumulada: ${rainCheck.duration}s`
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
    }).catch()
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
        ...(cancelReason ? { cancellationReason: cancelReason } : {})
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

    // 2. Auto-cancelar tareas PENDING expiradas (fuera de la ventana de gracia)
    const expired = await prisma.taskLog.updateMany({
      where: {
        status: TaskStatus.PENDING, // 🔴 Se elimina TaskStatus.FAILED
        scheduledAt: {
          lt: graceWindow
        }
      },
      data: {
        status: TaskStatus.CANCELLED,
        notes: 'Cancelada: ventana de ejecución expirada.'
      }
    })

    if (expired.count > 0) Logger.warn(`🗑️ ${expired.count} tarea(s) expirada(s) auto-canceladas.`)

    // 3. Auto-fallar tareas DISPATCHED sin ACK (Timeout de 2 min)
    const ackTimeout = new Date(Date.now() - 2 * 60000)
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
}

initScheduler().catch(e => Logger.error(`No se pudo iniciar el Servicio de Scheduler: ${colors.red}${e}${colors.reset}`))