import mqtt from 'mqtt'
import { InfluxDBClient, Point } from '@influxdata/influxdb3-client'
import { prisma, ZoneType } from '@package/database'

import { Logger } from './lib/logger'

// ---- Cargar variables de entorno ----
// La carga de variables de entorno se gestiona externamente.
// docker-compose.yml (dentro del contenedor)
// dotenv-cli en el package.json (desarrollo local)

// ---- Configuración MQTT ----
const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL ||
  process.env.MQTT_BROKER_URL_CLOUD ||
  process.env.MQTT_BROKER_URL_SERVERLESS ||
  process.env.MQTT_BROKER_URL_LOCAL ||
  ''

const MQTT_USERNAME = process.env.MQTT_USERNAME || process.env.MQTT_USER_BACKEND || ''
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || process.env.MQTT_PASS_BACKEND || ''

const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || process.env.MQTT_CLIENT_ID_INGEST || 'Ingest'
const BASE_TOPIC_PREFIX = 'PristinoPlant'

// ---- Configuración InfluxDB ----
const INFLUX_URL =
  process.env.INFLUX_URL ||
  process.env.INFLUX_URL_CLOUD ||
  process.env.INFLUX_URL_SERVERLESS ||
  process.env.INFLUX_URL_LOCAL ||
  ''
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || process.env.INFLUX_TOKEN_SERVERLESS || ''
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
}

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

// ---- Definición de tipo estándar  ----
type PacketProcessor = (
  source: string,
  zone: ZoneType,
  context: string,
  payload: string,
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
let influxClient: InfluxDBClient

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

async function processEnvironmentPacket(
  source: string,
  zone: ZoneType,
  context: string,
  payload: string,
) {
  try {
    const data = JSON.parse(payload)

    if (data.history && Array.isArray(data.history)) {
      for (const entry of data.history) {
        if (!Array.isArray(entry) || entry.length !== 2) continue

        const [timestamp, metrics] = entry as [number, Record<string, string | number>]

        // Corrección de Época: MicroPython (2000) vs Unix (1970)
        // Offset: 946684800 segundos
        const unixTimestamp = timestamp < 1000000000 ? timestamp + 946684800 : timestamp

        const point = Point.measurement('environment_metrics')
          .setTag('source', source)
          .setTag('zone', zone)
          .setTag('context', context)
          .setTimestamp(new Date(unixTimestamp * 1000))

        if (metrics.temperature !== undefined)
          point.setFloatField('temperature', Number(metrics.temperature))
        if (metrics.humidity !== undefined)
          point.setFloatField('humidity', Number(metrics.humidity))
        if (metrics.illuminance !== undefined)
          point.setFloatField('illuminance', Number(metrics.illuminance))
        if (metrics.rain_intensity !== undefined)
          point.setFloatField('rain_intensity', Number(metrics.rain_intensity))
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
    if (data.rain_intensity !== undefined)
      point.setFloatField('rain_intensity', Number(data.rain_intensity))
    if (data.phase !== undefined) point.setStringField('phase', String(data.phase))

    await writeToInflux(point)
    Logger.debug(
      `💾 [ INFLUX ] Guardado Environment (${source}/${zone}): ${Object.keys(data).join(', ')}`,
    )
  } catch (e) {
    Logger.error('Error procesando paquete de datos Ambientales (Batch/Single)', e)
  }
}

async function processRainEventPacket(
  source: string,
  zone: ZoneType,
  context: string,
  payload: string,
) {
  try {
    const data = JSON.parse(payload)
    const point = Point.measurement('rain_events')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setFloatField('duration_seconds', Number(data.duration_seconds))
      .setFloatField('intensity_percent', Number(data.average_intensity_percent))

    await writeToInflux(point)
    Logger.success(
      `🌧️ [RAIN] Evento Finalizado: ${data.duration_seconds}s | Int: ${data.average_intensity_percent}%`,
    )
  } catch (e) {
    Logger.error('Error procesando paquete de datos de Rain Event', e)
  }
}

// ---- Gestión de Estado (Deduplicación) ----
const stateCache = new Map<string, string>()

/**
 * Determina si un evento de estado debe persistirse (solo si cambió).
 */
function hasStateChanged(
  source: string,
  zone: string | undefined,
  eventType: string,
  value: string,
): boolean {
  const key = `${source}:${zone || 'global'}:${eventType}`
  const lastValue = stateCache.get(key)

  if (lastValue === value) return false

  stateCache.set(key, value)

  return true
}
async function processZoneStateEvent(
  source: string,
  zone: ZoneType,
  context: string,
  payload: string,
  eventType: string,
) {
  // Visibilidad operativa: Anunciar cambios reales de estado de lluvia
  if (eventType === 'Rain_State') {
    const key = `${source}:${zone || 'global'}:${eventType}`
    const previousValue = stateCache.get(key)

    // Solo persistir si el estado cambió (evitar spam de heartbeats)
    if (!hasStateChanged(source, zone, eventType, payload)) return

    const point = Point.measurement('system_events')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setTag('event_type', eventType)
      .setStringField('value', payload)

    await writeToInflux(point)

    if (payload === 'Raining') {
      Logger.warn('🌧️ [Raining] Lluvia detectada por sensores')
    } else if (payload === 'Dry' && previousValue === 'Raining') {
      Logger.info('☀️ [Dry] Lluvia finalizada (Cambio de estado detectado)')
    }
  } else {
    // Para otros eventos (Device_Status, etc.)
    if (!hasStateChanged(source, zone, eventType, payload)) return

    const point = Point.measurement('system_events')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setTag('event_type', eventType)
      .setStringField('value', payload)

    await writeToInflux(point)
  }
}

// ---- Punto de Entrada ----
async function start() {
  // 1. Validar conexión con Base de Datos
  await checkDbConnection()

  // 2. Cliente InfluxDB v3
  const url = new URL(INFLUX_URL)
  const isPublicCloud = url.hostname.endsWith('influxdata.com')
  const isInternalHost = url.hostname === 'influxdb' || url.hostname === 'localhost'

  influxClient = new InfluxDBClient({
    host: INFLUX_URL,
    token: INFLUX_TOKEN,
    database: INFLUX_BUCKET,
    transportOptions: {
      rejectUnauthorized: isPublicCloud ? true : !isInternalHost,
    },
  })

  // 3. Cliente MQTT
  console.log() // Espacio en blanco tras conexiones base
  Logger.mqtt(`Conectando a ${colors.blue}${MQTT_BROKER_URL}${colors.reset}`)

  const client = mqtt.connect(MQTT_BROKER_URL, {
    clientId: MQTT_CLIENT_ID,
    protocolVersion: 5,
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    protocol: MQTT_BROKER_URL.startsWith('mqtts') ? 'mqtts' : 'mqtt',
    rejectUnauthorized: true,
    servername: new URL(MQTT_BROKER_URL).hostname,
  })

  client.on('connect', () => {
    Logger.success('Conectado a Broker MQTT')

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
        // Solo persistir si el estado cambió
        if (hasStateChanged(firmwareSource, undefined, 'Device_Status', messageValue)) {
          const point = Point.measurement('system_events')
            .setTag('source', firmwareSource)
            .setTag('context', 'status')
            .setTag('event_type', 'Device_Status')
            .setStringField('value', messageValue)

          await writeToInflux(point)
        }
      }

      const hasSensorData = Object.keys(TOPIC_ROUTES).some((suffix) => topic.endsWith(suffix))

      if (!hasSensorData) return
    }

    if (firmwareSource === 'Environmental_Monitoring' || firmwareSource === 'Weather_Station') {
      const zoneSlug = topicParts[2]
      const zone = mapZoneSlugToZoneType(zoneSlug)

      if (!zone) {
        Logger.warn(`Zona desconocida: ${zoneSlug}`)

        return
      }

      const matchingSuffix = Object.keys(TOPIC_ROUTES).find((suffix) => topic.endsWith(suffix))

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
  })
}

start().catch((err) => {
  Logger.error('Error fatal detectado al arrancar el servicio Ingest:', err)
  process.exit(1)
})
