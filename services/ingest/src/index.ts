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

// Fidelidad total: sin filtros de validación de iluminancia.
// El sensor reporta lo que lee. El backend de Next.js ignora campos ausentes (null).

// ---- Escritura en InfluxDB ----

/**
 * Formatea un punto de InfluxDB para una salida de log ultra-compacta.
 */
function formatPointSummary(point: Point): string {
  const line = point.toLineProtocol()

  if (!line) return ''

  const parts = line.split(' ')

  if (parts.length < 2) return line

  const header = parts[0] // measurement,tag1=v1...
  const fieldsRaw = parts[1] // f1=v1,f2=v2...

  const headerParts = header.split(',')
  const measurement = headerParts[0]
  const tags: Record<string, string> = {}

  headerParts.slice(1).forEach((t) => {
    const [k, v] = t.split('=')

    if (k && v) tags[k] = v
  })

  const fields: Record<string, string> = {}

  fieldsRaw.split(',').forEach((f) => {
    const [k, v] = f.split('=')

    if (k && v) fields[k] = v
  })

  // Formato: [ Evento ] Origen -> Valor
  if (measurement === 'system_events') {
    const val = fields.value?.replace(/"/g, '') || '?'
    const event = tags.event_type || 'Event'
    const source = tags.source || 'Unknown'

    return `[ ${event} ] ${source} -> ${val}`
  }

  // Formato: [ Metrics ] Origen/Zona -> temp:25, hum:60...
  if (measurement === 'environment_metrics') {
    const metrics = Object.entries(fields)
      .map(([k, v]) => {
        const short =
          k === 'temperature'
            ? 'temp'
            : k === 'humidity'
              ? 'hum'
              : k === 'illuminance'
                ? 'lux'
                : k === 'rain_intensity'
                  ? 'rain'
                  : k

        return `${short}:${v}`
      })
      .join(', ')

    const source = tags.source || 'Unknown'
    const zone = tags.zone ? `/${tags.zone}` : ''

    return `[ Metrics ] ${source}${zone} -> ${metrics}`
  }

  // Formato: [ Rain_Event ] Origen -> 300s | 85%
  if (measurement === 'rain_events') {
    const source = tags.source || 'Unknown'
    const dur = fields.duration_seconds || '?'
    const int = fields.intensity_percent || fields.average_intensity_percent || '?'

    return `[ Rain_Event ] ${source} -> ${dur}s | ${int}%`
  }

  // Fallback compacto (sin timestamp)
  return `[ ${measurement} ] ${fieldsRaw}`
}

async function writeToInflux(point: Point) {
  try {
    await influxClient.write(point)
    Logger.influx(formatPointSummary(point))
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

    // Si el nodo envía un timestamp sincronizado (NTP), lo usamos.
    if (data.timestamp) {
      const rawTimestamp = Number(data.timestamp)
      // Corrección de Época: MicroPython (2000) vs Unix (1970)
      const unixTimestamp = rawTimestamp < 1000000000 ? rawTimestamp + 946684800 : rawTimestamp

      // 1735689600 = 1 de enero de 2025
      if (unixTimestamp > 1735689600) {
        point.setTimestamp(new Date(unixTimestamp * 1000))
      }
    }

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
  let value = payload
  let timestamp: number | undefined

  // Intento de parseo si es JSON
  if (payload.trim().startsWith('{')) {
    try {
      const data = JSON.parse(payload)

      value = data.state || data.value || payload
      timestamp = data.timestamp
    } catch {
      // Si falla, tratar como string plano
    }
  }

  // Visibilidad operativa: Anunciar cambios reales de estado de lluvia
  if (eventType === 'Rain_State') {
    // Solo persistir si el estado cambió (evitar spam de heartbeats)
    if (!hasStateChanged(source, zone, eventType, value)) return

    const point = Point.measurement('system_events')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setTag('event_type', eventType)
      .setStringField('value', value)

    // Aplicar timestamp si viene en el JSON (con normalización de época)
    if (timestamp) {
      const rawTimestamp = Number(timestamp)
      const unixTimestamp = rawTimestamp < 1000000000 ? rawTimestamp + 946684800 : rawTimestamp

      if (unixTimestamp > 1735689600) {
        point.setTimestamp(new Date(unixTimestamp * 1000))
      }
    }

    await writeToInflux(point)
    Logger.success(`[ ${eventType} ] ${source}/${zone} -> ${value}`)
  } else {
    // Otros eventos de estado (Device_Status, etc.)
    // El estado del dispositivo SIEMPRE se persiste para permitir hidratación SSR
    const isDeviceStatus = eventType === 'Device_Status'

    if (!isDeviceStatus && !hasStateChanged(source, zone, eventType, value)) return

    const point = Point.measurement('system_events')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setTag('event_type', eventType)
      .setStringField('value', value)

    await writeToInflux(point)
    Logger.info(`[ ${eventType} ] ${source}/${zone} -> ${value}`)
  }
}
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
      // Ignorar fallos de identidad del servidor en hosts internos
      rejectUnauthorized: isPublicCloud ? true : !isInternalHost,
      checkServerIdentity: () => undefined,
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

  client.on('message', async (topic, payload, packet) => {
    // Ignorar mensajes retenidos (retained).
    // Ingest solo procesa telemetría en tiempo real para evitar duplicados o estados falsos al arrancar.
    if (packet.retain) return

    const messageValue = payload.toString()
    const topicParts = topic.split('/')

    if (topicParts.length <= 2) return
    const firmwareSource = topicParts[1]

    if (firmwareSource === 'Actuator_Controller') {
      // Manejo de Reinicio Físico (Boot)
      if (topic.endsWith('/status/boot')) {
        Logger.warn(`[ BOOT ] Nodo reiniciado: ${firmwareSource}.`)

        // Limpiar solo las claves de este nodo (no nuclear)
        for (const key of stateCache.keys()) {
          if (key.startsWith(`${firmwareSource}:`)) {
            stateCache.delete(key)
          }
        }

        // Persistir el BOOT como un latido 'online' para hidratación SSR
        const point = Point.measurement('system_events')
          .setTag('source', firmwareSource)
          .setTag('context', 'status')
          .setTag('event_type', 'Device_Status')
          .setStringField('value', 'online')

        await writeToInflux(point)

        return
      }

      if (topic.endsWith('/status')) {
        // Persistimos siempre el status para Actuator_Controller para permitir hidratación SSR
        const isDeviceStatus = true

        if (
          isDeviceStatus ||
          hasStateChanged(firmwareSource, undefined, 'Device_Status', messageValue)
        ) {
          const point = Point.measurement('system_events')
            .setTag('source', firmwareSource)
            .setTag('context', 'status')
            .setTag('event_type', 'Device_Status')
            .setStringField('value', messageValue)

          await writeToInflux(point)

          // LWT: registramos el la desconexion del nodo `offline`.
          if (messageValue === 'offline') {
            Logger.warn(`[ LWT ] ${firmwareSource} Desconectado.`)
          }
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

      // Manejo de BOOT para sensores
      if (topic.endsWith('/status/boot')) {
        Logger.warn(`[ BOOT ] Nodo sensor reiniciado: ${firmwareSource}/${zoneSlug}.`)

        // Limpiar solo las claves de este nodo (no nuclear)
        for (const key of stateCache.keys()) {
          if (key.startsWith(`${firmwareSource}:`)) {
            stateCache.delete(key)
          }
        }

        const point = Point.measurement('system_events')
          .setTag('source', firmwareSource)
          .setTag('zone', zone)
          .setTag('context', 'status')
          .setTag('event_type', 'Device_Status')
          .setStringField('value', 'online')

        await writeToInflux(point)

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
