// -----------------------------------------------------------------------------
// ORCHIDIUM-PROJECT: MQTT Ingestion Service
// Descripción: Servicio persistente que se suscribe a los tópicos MQTT del broker, procesa los datos y los almacena en InfluxDB
// Versión: v0.8 - InfluxDBClient
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
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID_INGEST || 'PristinoPlant-Ingest'
const BASE_TOPIC_PREFIX = 'PristinoPlant'

// ---- Configuración InfluxDB ----
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'sensors'

if (!INFLUX_TOKEN) {
  console.error('❌ ERROR CRÍTICO: INFLUX_TOKEN no está definido.')
  process.exit(1)
}

// Cliente InfluxDB v3
const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN,
  database: INFLUX_BUCKET
})

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
  debug: (...args: any[]) => DEBUG && console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  info: (...args: any[]) => console.log(...args)
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
    Logger.debug(`${colors.green}💾 [INFLUX] ${colors.reset}${colors.white}Guardado: ${colors.reset}${colors.green}${point.toLineProtocol()}${colors.reset}`)
  } catch (e) {
    Logger.error(`${colors.red}❌ [INFLUX] ${colors.reset}${colors.white}Error al guardar: ${colors.reset}${colors.red}${e}${colors.reset}`)
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
    Logger.error(`${colors.red}❌ [ JSON ] ${colors.reset}${colors.white}ERROR procesando paquete de datos Ambientales: ${colors.reset}${colors.red}${e}${colors.reset}`)
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

    Logger.info(`${colors.blue}🌧️ [LLUVIA] ${colors.reset}${colors.white}Evento registrado${colors.reset}`)

  } catch (e) {
    Logger.error(`${colors.red}❌ [ JSON ] ${colors.reset}${colors.white}ERROR procesando paquete de datos de Rain Event: ${colors.reset}${colors.red}${e}${colors.reset}`)
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

// ---- Cliente MQTT ----
Logger.info(
  `\n${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Conectando ${colors.reset}${colors.blue}${MQTT_BROKER_URL}${colors.reset}`,
)

const client = mqtt.connect(MQTT_BROKER_URL, {
  clientId: MQTT_CLIENT_ID,
})

client.on('connect', () => {
  Logger.info(
    `${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Conexión establecida${colors.reset}`,
  )
  const topicToSubscribe = `${BASE_TOPIC_PREFIX}/#`

  client.subscribe(topicToSubscribe, (err) => {
    if (!err) {
      Logger.debug(
        `${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Suscrito al árbol de tópicos ${colors.reset}${colors.blue}${topicToSubscribe}${colors.reset}`,
      )
    }
    else {
      Logger.error(
        `\n${colors.red}❌ [ MQTT ] ${colors.reset}${colors.white}Error de suscripción: ${colors.reset}${colors.red}${err}${colors.reset}`,
      )
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

  if (firmwareSource === 'Actuator_Controller') return

  // Lógica para Sensores Ambientales
  if (firmwareSource === 'Environmental_Monitoring') {
    const zoneSlug = topicParts[2]
    const zone = mapZoneSlugToZoneType(zoneSlug)

    if (!zone) {
      Logger.warn(`\n${colors.yellow}⚠️ [ JSON ] ${colors.reset}${colors.white}Zona desconocida: ${zoneSlug}${colors.reset}`)
      return
    }

    const matchingSuffix = Object.keys(TOPIC_ROUTES).find(suffix => topic.endsWith(suffix))

    if (matchingSuffix) {
      const processor = TOPIC_ROUTES[matchingSuffix]

      // Limpiamos el sufijo para el contexto (ej: "/readings" -> "readings")
      const context = matchingSuffix.replace(/^\//, '')

      await processor(firmwareSource, zone, context, messageValue)

    } else {
      Logger.warn(`${colors.yellow}⚠️ [MQTT] ${colors.reset}${colors.white}No hay ruta definida para el tópico: ${colors.reset}${colors.yellow}${topic}${colors.reset}`)
    }
  }
})

client.on('error', (error) => {
  Logger.error(
    `\n${colors.red}❌ [ MQTT ] ${colors.reset}${colors.white}Error: ${colors.reset}${colors.red}${error}${colors.reset}`,
  )
})

client.on('close', () => {
  Logger.info(
    `\n${colors.yellow}⚠️ [ MQTT ] ${colors.reset}${colors.white}Conexión perdida${colors.reset}`,
  )
})
