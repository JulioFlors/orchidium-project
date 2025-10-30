// -----------------------------------------------------------------------------
// ORCHIDIUM-PROJECT: MQTT Ingestion Service
// descripción: Servicio persistente que se suscribe a los tópicos MQTT del
//              broker, procesa los datos y los almacena en la base de datos PostgreSQL.
// Versión: 1.5 - Formato de Log Personalizado
// Fecha: 05-09-2025
// -----------------------------------------------------------------------------
/* eslint-disable no-console */
import mqtt from 'mqtt'
import dotenv from 'dotenv'

import { prisma, Metric, ZoneType, EventType } from '@package/database'

// ---- Cargar variables de entorno ----
dotenv.config({ path: '../../.env' })

// ---- Utilidades de Logging Estilizado ----
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

// ---- INICIALIZACIÓN ----
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || 'Servicio de adquisición de datos MQTT de pristinoplant'
const BASE_TOPIC_PREFIX = 'PristinoPlant'

// ---- MAPEOS DE TÓPICOS A MODELOS DE DATOS ----
const topicToMetricMap = new Map<string, Metric>([
  ['temperature', Metric.Temperature],
  ['humidity', Metric.Humidity],
  ['light_intensity', Metric.Light_intensity],
  ['intensity_percent', Metric.Rain_intensity_percent],
])
const topicToEventMap = new Map<string, EventType>([
  [`${BASE_TOPIC_PREFIX}/irrigation/state`, EventType.Irrigation_State],
  [`${BASE_TOPIC_PREFIX}/rain/state`, EventType.Rain_State],
  [`${BASE_TOPIC_PREFIX}/rain/duration_seconds`, EventType.Rain_Duration],
  [`${BASE_TOPIC_PREFIX}/status`, EventType.Device_Status],
])

// ---- FUNCIONES DE AYUDA PARA LA BASE DE DATOS ----
async function saveSensorReading(
  topic: string,
  zoneSlug: string,
  metric: Metric,
  valueStr: string,
) {
  const value = parseFloat(valueStr)

  if (isNaN(value)) {
    console.warn(
      `\n${colors.yellow}⚠️  [ MQTT ] ${colors.white}Valor numérico inválido para la métrica '${metric}': "${valueStr}"${colors.reset}`,
    )

    return
  }
  const zone = `Zona_${zoneSlug.split('_')[1].toUpperCase()}` as ZoneType

  await prisma.sensorReading.create({ data: { zone, topic, metric, value } })

  // Formato de log para lecturas de sensor
  console.log(
    `${colors.green}💾 [DB LOG]${colors.reset} ${colors.white}Lectura de Sensor${colors.reset}  ${colors.magenta}/ ${zone} / ${metric}${colors.reset}`,
  )
}

async function saveEventLog(topic: string, zoneSlug: string, eventType: EventType, value: string) {
  const zone = `Zona_${zoneSlug.split('_')[1].toUpperCase()}` as ZoneType

  // Lista de tipos de evento que representan un "estado" y deben ser validados
  const stateEventTypes: EventType[] = [
    EventType.Irrigation_State,
    EventType.Rain_State,
    EventType.Device_Status,
  ]

  // Si el evento es de tipo "estado", aplicamos la lógica anti-duplicados
  if (stateEventTypes.includes(eventType)) {
    const lastEvent = await prisma.eventLog.findFirst({
      where: { zone, eventType },
      orderBy: { timestamp: 'desc' },
    })

    // Si encontramos un evento anterior y su valor es idéntico al nuevo, lo ignoramos.
    if (lastEvent && lastEvent.value === value) {
      // Informamos en la consola que se omitió el registro y terminamos la función.
      console.log(
        `${colors.yellow}📑 [ INFO ] ${colors.reset}${colors.white}Estado sin cambios para ${colors.reset}${colors.magenta}${eventType}${colors.reset}. No se guarda el duplicado.`,
      )

      return;
    }
  }

  // Si es un evento que no es de estado (ej. Rain_Duration) o si el estado ha cambiado, lo guardamos.
  await prisma.eventLog.create({ data: { zone, eventType, value, topic } })

  // Muestra que se guardó el registro.
  console.log(
    `${colors.green}💾 [DB LOG] ${colors.reset}${colors.white}Registro de Evento${colors.reset}  ${colors.magenta}${eventType}: ${colors.white}${value}${colors.reset}`,
  )
}

// ---- LÓGICA PRINCIPAL DEL SERVICIO MQTT ----
console.log(
  `${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Conectando ${colors.reset}${colors.blue}${MQTT_BROKER_URL}${colors.reset}`,
)
const client = mqtt.connect(MQTT_BROKER_URL, {
  clientId: MQTT_CLIENT_ID,
})

client.on('connect', () => {
  console.log(
    `${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Conexión establecida${colors.reset}`,
  )
  const topicToSubscribe = `${BASE_TOPIC_PREFIX}/#`

  client.subscribe(topicToSubscribe, (err) => {
    if (!err) {
      console.log(
        `${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Suscrito al árbol de tópicos ${colors.reset}${colors.blue}${topicToSubscribe}${colors.reset}`,
      )
    } else {
      console.error(
        `\n${colors.red}❌ [ MQTT ] ${colors.reset}${colors.white}No se pudo realizar la Suscripción: ${colors.reset}${colors.red}${err}${colors.reset}`,
      )
    }
  })
})

client.on('message', async (topic, payload) => {
  const messageValue = payload.toString()

  // Formato de log para mensajes recibidos
  console.log(
    `\n${colors.green}📡 [ MQTT ] ${colors.reset}${colors.white}Tópico:  ${colors.reset}${colors.yellow}${topic}${colors.reset}`,
  )
  console.log(
    `${colors.yellow}            Mensaje: ${colors.reset}${colors.white}${messageValue}${colors.reset}\n`,
  )

  try {
    const topicParts = topic.split('/')

    if (topicParts.length < 3) return
    const zoneSlug = topicParts[1]
    const finalPart = topicParts[topicParts.length - 1]

    const eventType = topicToEventMap.get(topic)

    if (eventType) {
      await saveEventLog(topic, zoneSlug, eventType, messageValue)

      return
    }

    const metric = topicToMetricMap.get(finalPart)

    if (metric) {
      await saveSensorReading(topic, zoneSlug, metric, messageValue)

      return
    }
  } catch (error) {
    console.error(
      `\n${colors.red}❌ [ MQTT ] ${colors.reset}${colors.white}No se pudo procesar el Tópico: ${colors.reset}${colors.red}${error}${colors.reset}`,
    )
  }
})

client.on('error', (error) => {
  console.error(
    `\n${colors.red}❌ [ MQTT ] ${colors.reset}${colors.white}Error del Cliente: ${colors.reset}${colors.red}${error}${colors.reset}`,
  )
})

client.on('close', () => {
  console.log(
    `\n${colors.yellow}⚠️  [ MQTT ] ${colors.reset}${colors.white}Conexión fallida: Reconectando${colors.reset}`,
  )
})
