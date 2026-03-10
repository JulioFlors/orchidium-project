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
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || process.env.MQTT_BROKER_URL_CLOUD || process.env.MQTT_BROKER_URL_LOCAL || ''

const MQTT_USERNAME = process.env.MQTT_USERNAME || process.env.MQTT_USER_BACKEND || ''
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || process.env.MQTT_PASS_BACKEND || ''

const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || process.env.MQTT_CLIENT_ID_SCHEDULER || 'Scheduler'
const ACTUATOR_TOPIC = 'PristinoPlant/Actuator_Controller/irrigation/cmd'

// Add Service Status Topic for LWT and Heartbeat
const SERVICE_STATUS_TOPIC = `PristinoPlant/Services/${MQTT_CLIENT_ID}/status`

// ---- Configuración InfluxDB ----
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
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
  white: '\x1b[97m',
}

// ---- Sistema de Logs ----
const Logger = {
  mqtt: (msg: string) => console.log(`${colors.blue}📡 [ MQTT ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}📡 [ INFO ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ [ DONE ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  warn: (msg: string) => console.warn(`${colors.yellow}⚠️ [ WARN ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  error: (msg: string, err?: any) => console.error(`${colors.red}❌ [ ERROR ]${colors.reset}${colors.white} ${msg}${colors.reset}`, err || ''),
  debug: (msg: string) => DEBUG && console.log(`${colors.green}🔎 [ DEBUG ]${colors.reset}${colors.white} ${msg}${colors.reset}`)
}

// ---- Cliente InfluxDB v3 ----
if (!INFLUX_TOKEN) {
  Logger.error('INFLUX_TOKEN no esta definido')
  process.exit(1)
}
const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN,
  database: INFLUX_BUCKET
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
    'PristinoPlant/Actuator_Controller/irrigation/cmd/received',
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
        Logger.success('Nodo Actuador: ONLINE')
      } 
      else if (message === 'offline' && lastActuatorState !== 'offline') {
        lastActuatorState = 'offline'
        Logger.warn('Nodo Actuador: OFFLINE')
        
        // Fallar tareas confirmadas / En Progreso ya que cortarán abruptamente.
        // El ESP32 las retomará solo si revive dentro de la ventana de gracia.
        const affectedTasks = await prisma.taskLog.updateMany({
          where: {
            status: { in: [TaskStatus.CONFIRMED, TaskStatus.IN_PROGRESS] }
          },
          data: {
            status: TaskStatus.FAILED,
            notes: 'El Nodo Actuador perdió conexión durante una ventana crítica.'
          }
        })
        if (affectedTasks.count > 0) Logger.warn(`Se cancelaron ${affectedTasks.count} tareas debido al corte.`)
      }
      return
    }

    // 2. Acuse de Recibo (ACK) emitido por el Nodo Actuador
    if (topic === 'PristinoPlant/Actuator_Controller/irrigation/cmd/received') {
      const parsed = JSON.parse(message)
      const taskId = parsed.task_id

      if (taskId) {
        // Encontramos una tarea registrada. El modulo leyó formalmente y la encoló.
        await prisma.taskLog.update({
          where: { id: taskId },
          data: { status: TaskStatus.CONFIRMED, notes: 'Comandos recibidos y encolados por el Nodo Actuador.' }
        }).catch(() => null)
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
           await prisma.taskLog.updateMany({
             where: { id: taskId, status: { in: [TaskStatus.CONFIRMED, TaskStatus.FAILED] } },
             data: { status: TaskStatus.IN_PROGRESS, notes: 'Circuito de Riego abierto.' }
           })
        } else {
           // Soporte Legado
           const graceWindow = new Date(Date.now() - 20 * 60000)
           await prisma.taskLog.updateMany({
             where: { 
               status: { in: [TaskStatus.CONFIRMED, TaskStatus.FAILED] },
               scheduledAt: { gte: graceWindow }
             },
             data: { status: TaskStatus.IN_PROGRESS, notes: 'Circuito de Riego abierto (Legado).' }
           })
        }
      }
      else if (state === 'OFF') {
        // Si viene un taskId explícito, sabemos exactamente qué tarea finalizó 
        // y no dependemos de si es la bomba de agua o no (ej nebulizadores / suelo).
        if (taskId) {
           const finished = await prisma.taskLog.updateMany({
             where: { id: taskId, status: TaskStatus.IN_PROGRESS },
             data: { status: TaskStatus.COMPLETED, notes: 'Circuito de Riego cerrado.' }
           })
           if (finished.count > 0) Logger.success(`Tarea ${taskId.slice(0, 8)} COMPLETED`)
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

    // Marcar como CONFIRMED para sacarlo del polling (que solo busca PENDING)
    // El ACK del hardware sobreescribirá con notas específicas vía MQTT
    await prisma.taskLog.update({
      where: { id: taskLog.id },
      data: {
        status: TaskStatus.CONFIRMED,
        notes: 'Comandos del Circuito de Riego despachados vía MQTT. Esperando confirmación del Nodo Actuador.',
        executedAt: new Date()
      }
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
    const graceWindow = new Date(Date.now() - 15 * 60000)

    // 1. Ejecutar tareas PENDING dentro de la ventana de gracia (últimos 15 min)
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

    // 3. Auto-limpieza (Garbage Collector) con Cálculo Dinámico
    // Busca tareas CONFIRMED o IN_PROGRESS y valida `scheduledAt + duration + graceWindow`
    const potentiallyStuck = await prisma.taskLog.findMany({
      where: {
        status: { in: [TaskStatus.CONFIRMED, TaskStatus.IN_PROGRESS] }
      }
    })

    let stuckCount = 0
    const nowMs = Date.now()

    for (const task of potentiallyStuck) {
      // 20 minutos de gracia adicionales a la duración de la tarea
      const expirationTime = task.scheduledAt.getTime() + (task.duration * 60000) + (20 * 60000)
      
      if (nowMs > expirationTime) {
        await prisma.taskLog.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.FAILED,
            notes: 'Tarea atascada: no se recibió telemetría de finalización a tiempo.'
          }
        })
        stuckCount++
      }
    }

    if (stuckCount > 0) Logger.warn(`🧹 ${stuckCount} tarea(s) atascada(s) pasadas a FAILED.`)

  } catch (error) {
    Logger.error('Error durante el Polling de tareas pendientes', error)
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