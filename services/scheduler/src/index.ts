import { InfluxDBClient } from '@influxdata/influxdb3-client'
import { prisma, TaskPurpose, TaskStatus, ZoneType } from '@package/database'
import cron from 'node-cron'
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

const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID_SCHEDULER || 'PristinoPlant-Scheduler'
const ACTUATOR_TOPIC = 'PristinoPlant/Actuator_Controller/irrigation/command'

// ---- Configuración InfluxDB ----
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'sensors'

// ---- Configuración de Reglas ----
const RAIN_THRESHOLD_SECONDS = 1800 // 30 minutos de lluvia acumulada cancelan el riego
const PUMP_PRIME_DELAY_SECONDS = 60 // Tiempo de cebado de bomba

// ---- IDs de los Actuadores (Hardware) ----
const PUMP = 3      // Bomba de agua
const VALVES = {
  SOURCE: {
    MAIN: 1,        // Entrada de agua principal
    TANK: 2         // Entrada de agua del tanque
  },
  LINE: {
    FOGGERS: 4,     // Salida para Nebulizadores
    FERTIGATION: 5, // Salida para Fertirriego
    SPRINKLERS: 6,  // Salida para Aspersores
    SOIL: 7         // Salida para regar el suelo
  }
}

// ---- Topología del Circuito (Lógica) ----
interface IrrigationCircuit {
  sourceId: number; // Agua de Entrada
  lineId: number;   // Línea de distribución
}

// ---- Mapa de Orquestación (Configuración)----
const TASK_CIRCUITS: Record<TaskPurpose, IrrigationCircuit> = {
  IRRIGATION: {
    sourceId: VALVES.SOURCE.MAIN,
    lineId: VALVES.LINE.SPRINKLERS
  },
  FERTIGATION: {
    sourceId: VALVES.SOURCE.TANK,
    lineId: VALVES.LINE.FERTIGATION
  },
  FUMIGATION: {
    sourceId: VALVES.SOURCE.TANK,
    lineId: VALVES.LINE.FERTIGATION
  },
  HUMIDIFICATION: {
    sourceId: VALVES.SOURCE.MAIN,
    lineId: VALVES.LINE.FOGGERS
  },
  SOIL_WETTING: {
    sourceId: VALVES.SOURCE.MAIN,
    lineId: VALVES.LINE.SOIL
  }
}

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
  info: (msg: string) => console.log(`${colors.blue}📡 [ INFO ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ [ DONE ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  warn: (msg: string) => console.warn(`${colors.yellow}⚠️ [ WARN ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  error: (msg: string, err?: any) => console.error(`${colors.red}❌ [ FAIL ]${colors.reset}${colors.white} ${msg}${colors.reset}`, err || ''),
  debug: (msg: string) => DEBUG && console.log(`${colors.green}🌵 [ TEST ]${colors.reset}${colors.white} ${msg}${colors.reset}`)
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


Logger.info(
  `\n${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Conectando a ${colors.reset}${colors.blue}${MQTT_BROKER_URL}${colors.reset}`,
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
})

mqttClient.on('connect', () => Logger.success('Conectado a Broker MQTT'))
mqttClient.on('error', (err) => Logger.error('NO pudo establecer la conexión con el cliente MQTT:', err))

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

    // Ejecutamos la consulta (retorna un generador asíncrono)
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
 * Envía un comando al Firmware
 */
function sendCommand(actuatorId: number, state: 'ON' | 'OFF', durationSeconds: number = 0, startDelay: number = 0) {
  const payload = {
    actuator: actuatorId,
    state: state,
    duration: durationSeconds,
    start_delay: startDelay
  }

  const message = JSON.stringify(payload)
  mqttClient.publish(ACTUATOR_TOPIC, message, {
    qos: 1,
    properties: {
      messageExpiryInterval: 300
    }
  });
  Logger.debug(`MQTT TX ➜ ${message}`)
}

/**
 * Ejecuta la secuencia de encendido basada en el circuito de riego definido.
 */
function executeSequence(purpose: TaskPurpose, durationMinutes: number) {
  const circuit = TASK_CIRCUITS[purpose]

  if (!circuit) {
    Logger.warn(`No existe Circuito de Riego definido para: ${purpose}`)
    return
  }

  Logger.info(`Orquestando: ${purpose} (${durationMinutes} min)`)

  const durationSec = durationMinutes * 60
  const valvesDuration = durationSec + PUMP_PRIME_DELAY_SECONDS

  // Configurar Válvulas (Fuente + Línea)
  sendCommand(circuit.sourceId, 'ON', valvesDuration, 0)
  sendCommand(circuit.lineId, 'ON', valvesDuration, 0)

  // Encender Bomba (Con delay de cebado)
  sendCommand(PUMP, 'ON', durationSec, PUMP_PRIME_DELAY_SECONDS)
}

// ---- Orquestador de tareas programadas ----
async function runTask(scheduleId: string) {
  Logger.info(`⏰ Iniciando Tarea Programada (ID: ${scheduleId})`)

  try {
    // Obtener detalles frescos de la base de datos
    const schedule = await prisma.automationSchedule.findUnique({
      where: { id: scheduleId },
      include: { fertilizationProgram: true, phytosanitaryProgram: true }
    })

    if (!schedule || !schedule.isEnabled) {
      Logger.warn('Rutina no encontrada o deshabilitada. Omitiendo.')
      return
    }

    // Crear Log de Tarea (PENDING)
    const taskLog = await prisma.taskLog.create({
      data: {
        scheduleId: schedule.id,
        purpose: schedule.purpose,
        zones: schedule.zones,
        status: TaskStatus.PENDING,
        scheduledAt: new Date(),
        duration: schedule.durationMinutes
      }
    })

    // Verificar Regla de Lluvia (Solo si es Riego o Fertirriego)
    if (schedule.purpose === 'IRRIGATION' || schedule.purpose === 'FERTIGATION') {
      // Verificamos la primera zona (Asumimos clima similar para todas por ahora)
      const rainCheck = await checkRainCondition(schedule.zones[0])

      if (rainCheck.shouldCancel) {
        Logger.warn(`🌧️ Tarea CANCELADA por lluvia (${rainCheck.duration}s acumulados)`)

        await prisma.taskLog.update({
          where: { id: taskLog.id },
          data: {
            status: TaskStatus.CANCELLED,
            notes: `Cancelado por lluvia acumulada: ${rainCheck.duration}s`
          }
        })
        return // ¡Salimos! No regamos.
      }
    }

    // Ejecutar Secuencia de Riego
    executeSequence(schedule.purpose, schedule.durationMinutes)

    // Actualizar Log (COMPLETED)
    // Nota: Es "Completed" en cuanto al envío de comandos. 
    // todo: El éxito físico real dependería de feedback del sensor de presión (Futuro).
    await prisma.taskLog.update({
      where: { id: taskLog.id },
      data: {
        status: TaskStatus.COMPLETED,
        notes: 'Comandos enviados correctamente'
      }
    })

    Logger.success(`Tarea ${schedule.name} ejecutada.`)

  } catch (error) {
    Logger.error('Fallo crítico ejecutando tarea', error)
    // Intentar registrar el fallo en BD si es posible
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

  // Programar cada rutina en node-cron
  schedules.forEach(schedule => {
    if (!cron.validate(schedule.cronTrigger)) {
      Logger.error(`Cron inválido para ${schedule.name}: ${schedule.cronTrigger}`)
      return
    }

    Logger.info(`Programando: "${schedule.name}" ➜ [${schedule.cronTrigger}]`)

    cron.schedule(schedule.cronTrigger, () => {
      runTask(schedule.id)
    }, {
      timezone: "America/Caracas"
    })
  })
}

// Arrancar
initScheduler().catch(e => Logger.error(`No se pudo iniciar el Servicio de Scheduler: ${colors.red}${e}${colors.reset}`))