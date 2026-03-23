// -----------------------------------------------------------------------------
// ORCHIDIUM-PROJECT: MQTT Ingestion Service
// Descripción: Servicio persistente que se suscribe a los tópicos MQTT del broker, procesa los datos y los almacena en InfluxDB
// Versión: v0.9 - Logger Unificado
// Fecha: 29-11-2025
// -----------------------------------------------------------------------------

import { InfluxDBClient, Point } from '@influxdata/influxdb3-client'
import mqtt from 'mqtt'

import { ZoneType } from '@package/database'

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

const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || process.env.MQTT_CLIENT_ID_INGEST || 'Ingest'
const BASE_TOPIC_PREFIX = 'PristinoPlant'

// Service Status Topic for LWT and Heartbeat
const SERVICE_STATUS_TOPIC = `PristinoPlant/Services/${MQTT_CLIENT_ID}/status`

// ---- Configuración InfluxDB ----
const INFLUX_URL = process.env.INFLUX_URL || process.env.INFLUX_URL_CLOUD || process.env.INFLUX_URL_SERVERLESS || process.env.INFLUX_URL_LOCAL || ''
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || process.env.INFLUX_TOKEN_SERVERLESS || ''
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

// ---- Colores para Logs ----
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
  error: (msg: string, err?: unknown) => console.error(`${colors.red}❌ [ ERROR ]${colors.reset}${colors.white} ${msg}${colors.reset}`, err || ''),
  debug: (msg: string) => DEBUG && console.log(`${colors.green}🔎 [ DEBUG ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  influx: (msg: string) => DEBUG && console.log(`${colors.green}💾 [ INFLUX ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
}

// ---- Definición de tipo estándar  ----
type PacketProcessor = (
  source: string,
  zone: ZoneType,
  context: string,
  payload: string
) => Promise<void>

// ---- Mapa de rutas (Routing map) ----
// Define qué hacer según el sufijo del tópico
const TOPIC_ROUTES: Record<string, PacketProcessor> = {
  // Coincidencia directa de argumentos
  '/readings': processEnvironmentPacket,
  '/rain/event': processRainEventPacket,

  // Necesitamos inyectar el 5to argumento (eventType)
  '/status': (s, z, c, p) => processZoneStateEvent(s, z, c, p, 'Device_Status'),
  '/rain/state': (s, z, c, p) => processZoneStateEvent(s, z, c, p, 'Rain_State'),
  '/irrigation/state': (s, z, c, p) => processZoneStateEvent(s, z, c, p, 'Irrigation_State'),
}

// ---- Utils ---- 
function mapZoneSlugToZoneType(zoneSlug: string): ZoneType | undefined {
  if (zoneSlug === 'Actuator_Controller') return undefined

  // Normalizar a Mayúsculas (Para coincidir con ZoneType)
  const zoneType = zoneSlug.toUpperCase() as ZoneType
  return Object.values(ZoneType).includes(zoneType) ? zoneType : undefined
}

// ---- Escritura en InfluxDB ----
async function writeToInflux(point: Point) {
  try {
    await influxClient.write(point)
    Logger.influx(`Guardado: ${point.toLineProtocol()}`)
  } catch (e) {
    Logger.error('Error al guardar en InfluxDB', e)
  }
}

// ---- Procesadores de Paquetes JSON ----
// Cada función es responsable de parsear el payload y escribir en InfluxDB

async function processEnvironmentPacket(source: string, zone: ZoneType, context: string, payload: string) {
  try {
    const data = JSON.parse(payload)

    // Creamos un Punto de InfluxDB
    const point = Point.measurement('environment_metrics')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)

    // Agregamos los campos si existen
    if (data.temperature !== undefined) point.setFloatField('temperature', Number(data.temperature))
    if (data.humidity !== undefined) point.setFloatField('humidity', Number(data.humidity))
    if (data.light_intensity !== undefined) point.setFloatField('light_intensity', Number(data.light_intensity))

    await writeToInflux(point)

  } catch (e) {
    Logger.error('Error procesando paquete de datos Ambientales', e)
  }
}

async function processRainEventPacket(source: string, zone: ZoneType, context: string, payload: string) {
  try {
    const data = JSON.parse(payload)

    // Creamos un Punto de InfluxDB
    const point = Point.measurement('rain_events')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setFloatField('duration_seconds', Number(data.duration_seconds))
      .setFloatField('intensity_percent', Number(data.average_intensity_percent))

    await writeToInflux(point)

    Logger.info('🌧️ Evento de lluvia registrado')

  } catch (e) {
    Logger.error('Error procesando paquete de datos de Rain Event', e)
  }
}

async function processZoneStateEvent(
  source: string,
  zone: ZoneType,
  context: string,
  payload: string,
  eventType: string
) {
  const point = Point.measurement('system_events')
    .setTag('source', source)
    .setTag('zone', zone)
    .setTag('context', context)
    .setTag('event_type', eventType)
    .setStringField('value', payload)

  await writeToInflux(point)
}

// ---- Validación Crítica ----
if (!INFLUX_TOKEN) {
  Logger.error('INFLUX_TOKEN no está definido. Abortando.')
  process.exit(1)
}

// Cliente InfluxDB v3
const url = new URL(INFLUX_URL)
const isPublicCloud = url.hostname.endsWith('influxdata.com')
const isInternalHost = url.hostname === 'influxdb' || url.hostname === 'localhost'

const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN,
  database: INFLUX_BUCKET,
  // Configuracion inteligente de seguridad TLS:
  // 1. Si es Cloud oficial (InfluxData) -> Validar TLS estrictamente (true).
  // 2. Si es Host interno Docker (influxdb) -> Permitir cert autofirmado (false).
  // 3. Por defecto (VPS con dominio propio o desconocido) -> Validar TLS (true).
  transportOptions: {
    rejectUnauthorized: isPublicCloud ? true : (isInternalHost ? false : true)
  }
})

Logger.mqtt(`Conectando a ${colors.blue}${MQTT_BROKER_URL}${colors.reset}`)

// ---- Cliente MQTT ----
const client = mqtt.connect(MQTT_BROKER_URL, {
  clientId: MQTT_CLIENT_ID,
  protocolVersion: 5,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  // Opciones típicamente requeridas o recomendadas para HiveMQ Cloud
  protocol: MQTT_BROKER_URL.startsWith('mqtts') ? 'mqtts' : 'mqtt',
  rejectUnauthorized: true,
  servername: new URL(MQTT_BROKER_URL).hostname, // SNI: Garantiza que se envíe el hostname correcto en el handshake TLS
  will: {
    topic: SERVICE_STATUS_TOPIC,
    payload: Buffer.from('offline'),
    qos: 1,
    retain: true
  }
})

let heartbeatInterval: NodeJS.Timeout | null = null

client.on('connect', () => {
  Logger.success('Conectado a Broker MQTT')

  // Publicar estado de vida apenas conectamos
  client.publish(SERVICE_STATUS_TOPIC, 'online', { qos: 1, retain: true })

  // ---- FRECUENCIA DE SEÑAL DE VIDA (HEARTBEAT) ----
  // Define cada cuánto tiempo Node.js le cuenta al Frontend que sigue vivo
  // Configurado a 5 minutos (300,000 ms) para evitar sobrecarga en la UI de React.
  if (heartbeatInterval) clearInterval(heartbeatInterval)
  heartbeatInterval = setInterval(() => {
    client.publish(SERVICE_STATUS_TOPIC, 'online', { qos: 1, retain: true })
  }, 300000)

  const topicToSubscribe = `${BASE_TOPIC_PREFIX}/#`

  client.subscribe(topicToSubscribe, (err) => {
    if (!err) {
      Logger.mqtt(`Suscrito al árbol de tópicos ${colors.blue}${topicToSubscribe}${colors.reset}`)
    } else {
      Logger.error(`Error de suscripción MQTT: ${err}`)
    }
  })
})

// ---- El core del Enrutamiento ----
client.on('message', async (topic, payload) => {
  const messageValue = payload.toString()
  const topicParts = topic.split('/')

  if (topicParts.length <= 2) return

  // 'Environmental_Monitoring' o 'Actuator_Controller'
  const firmwareSource = topicParts[1]

  // Registrar el status (online/offline) del Nodo Actuador en InfluxDB para auditoría.
  // Los comandos y telemetría de riego son exclusivos del Scheduler — no se procesan aquí.
  if (firmwareSource === 'Actuator_Controller') {
    if (topic.endsWith('/status')) {
      const point = Point.measurement('system_events')
        .setTag('source', firmwareSource)
        .setTag('context', 'status')
        .setTag('event_type', 'Device_Status')
        .setStringField('value', messageValue)

      await writeToInflux(point)
    }
    return
  }

  // Registrar el status de los servicios backend (Scheduler, Ingest) para auditoría.
  // Tópico: PristinoPlant/Services/{ServiceName}/status → "online"/"offline"
  if (topicParts[1] === 'Services') {
    if (topic.endsWith('/status')) {
      const serviceName = topicParts[2] || 'Unknown'
      const point = Point.measurement('system_events')
        .setTag('source', 'Services')
        .setTag('context', 'status')
        .setTag('event_type', 'Service_Status')
        .setTag('service_name', serviceName)
        .setStringField('value', messageValue)

      await writeToInflux(point)
    }
    return
  }

  // Lógica para Sensores Ambientales
  if (firmwareSource === 'Environmental_Monitoring') {
    const zoneSlug = topicParts[2]
    const zone = mapZoneSlugToZoneType(zoneSlug)

    if (!zone) {
      Logger.warn(`Zona desconocida: ${zoneSlug}`)
      return
    }

    const matchingSuffix = Object.keys(TOPIC_ROUTES).find(suffix => topic.endsWith(suffix))

    if (matchingSuffix) {
      const processor = TOPIC_ROUTES[matchingSuffix]

      // Limpiamos el sufijo para el contexto (ej: "/readings" -> "readings")
      const context = matchingSuffix.replace(/^\//, '')

      await processor(firmwareSource, zone, context, messageValue)

    } else {
      Logger.warn(`No hay ruta definida para el tópico: ${topic}`)
    }
  }
})

client.on('error', (error) => {
  Logger.error('Error en el cliente MQTT', error)
})

client.on('close', () => {
  Logger.warn('Conexión MQTT perdida')
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
})
