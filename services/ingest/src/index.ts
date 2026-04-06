import { InfluxDBClient, Point } from '@influxdata/influxdb3-client'
import mqtt from 'mqtt'

import { prisma, ZoneType } from '@package/database'

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
    hour12: true,
  }).format(new Date())
}

const Logger = {
  mqtt: (msg: string) => console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.blue} 📡 [ MQTT ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.blue} 📡 [ INFO ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.green} ✅ [ DONE ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  warn: (msg: string) => console.warn(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.yellow} ⚠️ [ WARN ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  error: (msg: string, err?: any) => console.error(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.red} ❌ [ ERROR ]${colors.reset}${colors.white} ${msg}${colors.reset}`, err || ''),
  debug: (msg: string) => DEBUG && console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.cyan} 🔎 [ DEBUG ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  influx: (msg: string) => DEBUG && console.log(`${colors.white}[ ${getLogTime()} ]${colors.reset}${colors.green} 💾 [ INFLUX ]${colors.reset}${colors.white} ${msg}${colors.reset}`),
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

// Configuración de Seguridad para InfluxDB (Interno vs Cloud)
const url = new URL(INFLUX_URL)
const isPublicCloud = url.hostname.endsWith('influxdata.com')
const isInternalHost = url.hostname === 'influxdb' || url.hostname === 'localhost'

if (isInternalHost && !isPublicCloud) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
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
}

// ---- Global Influx Client (puntero) ----
let influxClient: InfluxDBClient;

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

async function processEnvironmentPacket(source: string, zone: ZoneType, context: string, payload: string) {
  try {
    const data = JSON.parse(payload)

    if (data.history && Array.isArray(data.history)) {
      for (const entry of data.history) {
        if (!Array.isArray(entry) || entry.length !== 2) continue
        
        const [timestamp, metrics] = entry as [number, Record<string, string | number>]
        
        // Corrección de Época: MicroPython (2000) vs Unix (1970)
        // Offset: 946684800 segundos
        const unixTimestamp = timestamp < 1000000000 ? timestamp + 946684800 : timestamp;

        const point = Point.measurement('environment_metrics')
          .setTag('source', source)
          .setTag('zone', zone)
          .setTag('context', context)
          .setTimestamp(new Date(unixTimestamp * 1000))

        if (metrics.temperature !== undefined) point.setFloatField('temperature', Number(metrics.temperature))
        if (metrics.humidity !== undefined) point.setFloatField('humidity', Number(metrics.humidity))
        if (metrics.illuminance !== undefined) point.setFloatField('illuminance', Number(metrics.illuminance))
        if (metrics.rain_intensity !== undefined) point.setFloatField('rain_intensity', Number(metrics.rain_intensity))
        if (metrics.phase !== undefined) point.setStringField('phase', String(metrics.phase))

        await writeToInflux(point)
      }
      return
    }

    const point = Point.measurement('environment_metrics')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)

    if (data.temperature !== undefined) point.setFloatField('temperature', Number(data.temperature))
    if (data.humidity !== undefined) point.setFloatField('humidity', Number(data.humidity))
    if (data.illuminance !== undefined) point.setFloatField('illuminance', Number(data.illuminance))
    if (data.rain_intensity !== undefined) point.setFloatField('rain_intensity', Number(data.rain_intensity))
    if (data.phase !== undefined) point.setStringField('phase', String(data.phase))

    await writeToInflux(point)
    Logger.debug(`💾 [ INFLUX ] Guardado Environment (${source}/${zone}): ${Object.keys(data).join(', ')}`)

  } catch (e) {
    Logger.error('Error procesando paquete de datos Ambientales (Batch/Single)', e)
  }
}

async function processRainEventPacket(source: string, zone: ZoneType, context: string, payload: string) {
  try {
    const data = JSON.parse(payload)
    const point = Point.measurement('rain_events')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setFloatField('duration_seconds', Number(data.duration_seconds))
      .setFloatField('intensity_percent', Number(data.average_intensity_percent))

    await writeToInflux(point)
    Logger.success(`🌧️ [RAIN] Evento Finalizado: ${data.duration_seconds}s | Int: ${data.average_intensity_percent}%`)
  } catch (e) {
    Logger.error('Error procesando paquete de datos de Rain Event', e)
  }
}

let lastRainState: string | null = null;

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

  // Visibilidad operativa: Anunciar cambios reales de estado de lluvia
  if (eventType === 'Rain_State') {
    if (payload === 'Raining' && lastRainState !== 'Raining') {
      Logger.warn('🌧️ [Raining] Lluvia detectada por sensores')
    } else if (payload === 'Dry' && lastRainState === 'Raining') {
      Logger.info('☀️ [Dry] Lluvia finalizada (Cambio de estado detectado)')
    }
    lastRainState = payload;
  }
}

// ---- Punto de Entrada ----
async function start() {
  // 1. Validar conexión con Base de Datos
  await checkDbConnection()

  // 2. Cliente InfluxDB v3
  influxClient = new InfluxDBClient({
    host: INFLUX_URL,
    token: INFLUX_TOKEN,
    database: INFLUX_BUCKET,
  })

  // 3. Cliente MQTT
  Logger.mqtt(`Conectando a ${colors.blue}${MQTT_BROKER_URL}${colors.reset}`)

  const client = mqtt.connect(MQTT_BROKER_URL, {
    clientId: MQTT_CLIENT_ID,
    protocolVersion: 5,
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    protocol: MQTT_BROKER_URL.startsWith('mqtts') ? 'mqtts' : 'mqtt',
    rejectUnauthorized: true,
    servername: new URL(MQTT_BROKER_URL).hostname,
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
    client.publish(SERVICE_STATUS_TOPIC, 'online', { qos: 1, retain: true })

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

  client.on('message', async (topic, payload) => {
    const messageValue = payload.toString()
    const topicParts = topic.split('/')

    if (topicParts.length <= 2) return
    const firmwareSource = topicParts[1]

    if (firmwareSource === 'Actuator_Controller') {
      if (topic.endsWith('/status')) {
        const point = Point.measurement('system_events')
          .setTag('source', firmwareSource)
          .setTag('context', 'status')
          .setTag('event_type', 'Device_Status')
          .setStringField('value', messageValue)
        await writeToInflux(point)
      }

      // Persistir paquetes de auditoría en PostgreSQL
      if (topic.endsWith('/audit')) {
        try {
          const auditPayload = JSON.parse(messageValue) as Record<string, unknown>

          for (const [category, data] of Object.entries(auditPayload)) {
            if (data && typeof data === 'object') {
              await prisma.auditSnapshot.create({
                data: {
                  device: 'actuator',
                  category,
                  data: data as object,
                },
              })
            }
          }
          Logger.debug(`📋 Auditoría persistida: ${Object.keys(auditPayload).join(', ')}`)
        } catch (e) {
          Logger.error('Error persistiendo paquete de auditoría', e)
        }
        return
      }
      
      const hasSensorData = Object.keys(TOPIC_ROUTES).some(suffix => topic.endsWith(suffix))
      if (!hasSensorData) return
    }

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

    if (firmwareSource === 'Environmental_Monitoring' || firmwareSource === 'Weather_Station') {
      const zoneSlug = topicParts[2]
      const zone = mapZoneSlugToZoneType(zoneSlug)

      if (!zone) {
        Logger.warn(`Zona desconocida: ${zoneSlug}`)
        return
      }

      const matchingSuffix = Object.keys(TOPIC_ROUTES).find(suffix => topic.endsWith(suffix))
      if (matchingSuffix) {
        const processor = TOPIC_ROUTES[matchingSuffix]
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
}

start().catch(err => {
  Logger.error('Error fatal detectado al arrancar el servicio Ingest:', err)
  process.exit(1)
})
