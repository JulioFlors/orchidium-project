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
    const zoneStr = tags.zone ? ` [ ${tags.zone} ]` : ''

    return `[ ${event} ] [ ${source} ] ${zoneStr} -> ${val}`
  }

  // Formato: [ Metrics ] Origen/Zona -> temp:25, hum:60...
  if (measurement === 'environment_metrics') {
    const metrics = Object.entries(fields)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ')

    const source = tags.source || 'Unknown'
    const zoneStr = tags.zone ? ` [ ${tags.zone} ]` : ''

    return `[ Metrics ] [ ${source} ] ${zoneStr} -> ${metrics}`
  }

  // Formato: [ Rain_Event ] Origen -> 300s | 85%
  if (measurement === 'rain_events') {
    const source = tags.source || 'Unknown'
    const zoneStr = tags.zone ? ` [ ${tags.zone} ]` : ''
    const dur = fields.duration_seconds || '?'
    const int = fields.intensity_percent || fields.average_intensity_percent || '?'

    return `[ Rain_Event ] [ ${source} ]${zoneStr} -> ${dur}s | ${int}%`
  }

  // Fallback compacto (sin timestamp)
  return `[ ${measurement} ] ${fieldsRaw}`
}

/**
 * Selecciona el logger semántico correcto según el tipo de medición del Point.
 * - system_events (Device_Status, Rain_State) → Logger.state
 * - rain_events (finalización de evento) → Logger.rain
 * - environment_metrics (temp, hum, lux, rain_intensity) → Logger.metric
 */
function selectLogger(point: Point): (msg: string) => void {
  const line = point.toLineProtocol() ?? ''

  if (line.startsWith('system_events')) return Logger.state
  if (line.startsWith('rain_events')) return Logger.rain
  if (line.startsWith('environment_metrics')) return Logger.metric

  return Logger.influx
}

async function writeToInflux(point: Point) {
  try {
    await influxClient.write(point)
    const log = selectLogger(point)

    log(formatPointSummary(point))
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

    // Estandarización: Usamos siempre 'data' para batches
    const batch = data.data

    if (batch && Array.isArray(batch)) {
      // 🕵️ Lógica de Backtracking (Reconstrucción Temporal)
      // Si el nodo no tiene sincronización NTP, usamos sus timestamps como referencia relativa.
      // Asumimos que el último elemento del batch es el más reciente y se acaba de enviar.
      const lastEntry = batch[batch.length - 1]
      let lastNodeUnix = 0

      if (Array.isArray(lastEntry) && lastEntry.length === 2) {
        lastNodeUnix = Number(lastEntry[0])
      } else if (typeof lastEntry === 'object' && lastEntry !== null) {
        lastNodeUnix = Math.floor(Date.now() / 1000)
      }

      // Normalización de Época inicial para el cálculo del offset
      if (lastNodeUnix < 1000000000) lastNodeUnix += 946684800

      // Si el tiempo del nodo es basura (< 2025), calculamos el desplazamiento (offset)
      const isBasura = lastNodeUnix < 1735689600
      const serverNow = Math.floor(Date.now() / 1000)
      const backtrackingOffset = isBasura ? serverNow - lastNodeUnix : 0

      if (isBasura && batch.length > 0) {
        Logger.warn(
          `[ INFL ] [ ${source} ] Hora desincronizada detectada. Aplicando Backtracking (+${backtrackingOffset}s) a ${batch.length} muestras.`,
        )
      }

      for (const entry of batch) {
        // Soporta formatos: [timestamp, metrics] o { ...metrics }
        let unixTimestamp: number
        let metrics: Record<string, string | number>

        if (Array.isArray(entry) && entry.length === 2) {
          // Formato [ts, {m}]
          unixTimestamp = Number(entry[0])
          metrics = entry[1] as Record<string, string | number>
        } else if (typeof entry === 'object' && entry !== null) {
          // Formato { ... }
          unixTimestamp = Math.floor(Date.now() / 1000)
          metrics = entry as Record<string, string | number>
        } else {
          continue
        }

        // Corrección de Época: MicroPython (2000) vs Unix (1970)
        if (unixTimestamp < 1000000000) {
          unixTimestamp += 946684800
        }

        // 🛡️ Aplicación de Backtracking
        // Si el tiempo era basura, le sumamos el offset para traerlo al "presente"
        // manteniendo la distancia relativa entre las muestras del batch.
        unixTimestamp += backtrackingOffset

        const point = Point.measurement('environment_metrics')
          .setTag('source', source)
          .setTag('zone', zone)
          .setTag('context', context)
          .setTimestamp(new Date(unixTimestamp * 1000))

        // Mapeo Directo (Estandarización Estricta)
        const t = metrics.temperature
        const h = metrics.humidity
        const l = metrics.illuminance
        const r = metrics.rain_intensity

        if (t !== undefined) point.setFloatField('temperature', Number(t))
        if (h !== undefined) point.setFloatField('humidity', Number(h))
        if (l !== undefined) point.setFloatField('illuminance', Number(l))
        if (r !== undefined) point.setFloatField('rain_intensity', Number(r))
        if (metrics.phase !== undefined) point.setStringField('phase', String(metrics.phase))

        await writeToInflux(point)
      }

      return
    }

    // Procesamiento de mensaje único
    const point = Point.measurement('environment_metrics')
      .setTag('source', source)
      .setTag('zone', zone)
      .setTag('context', context)
      .setTimestamp(new Date())

    const t = data.temperature
    const h = data.humidity
    const l = data.illuminance
    const r = data.rain_intensity

    if (t !== undefined) point.setFloatField('temperature', Number(t))
    if (h !== undefined) point.setFloatField('humidity', Number(h))
    if (l !== undefined) point.setFloatField('illuminance', Number(l))
    if (r !== undefined) point.setFloatField('rain_intensity', Number(r))
    if (data.phase !== undefined) point.setStringField('phase', String(data.phase))

    await writeToInflux(point)
  } catch (e) {
    Logger.error('Error procesando paquete de datos Ambientales', e)
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
      let unixTimestamp = rawTimestamp < 1000000000 ? rawTimestamp + 946684800 : rawTimestamp

      // 🛡️ Sanity Check: Si es basura (< 2025), usar ahora.
      if (unixTimestamp < 1735689600) {
        unixTimestamp = Math.floor(Date.now() / 1000)
      }

      point.setTimestamp(new Date(unixTimestamp * 1000))
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
      let unixTimestamp = rawTimestamp < 1000000000 ? rawTimestamp + 946684800 : rawTimestamp

      // 🛡️ Sanity Check: Si es basura (< 2025), usar ahora.
      if (unixTimestamp < 1735689600) {
        unixTimestamp = Math.floor(Date.now() / 1000)
      }

      point.setTimestamp(new Date(unixTimestamp * 1000))
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

    if (firmwareSource === 'Weather_Station') {
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
