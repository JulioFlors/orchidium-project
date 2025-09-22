// -----------------------------------------------------------------------------
// ORCHIDIUM-PROJECT: MQTT Ingestion Service
// descripción: Servicio persistente que se suscribe a los tópicos MQTT del
//              broker, procesa los datos y los almacena en la base de datos PostgreSQL.
// Versión: 1.5 - Formato de Log Personalizado
// Fecha: 05-09-2025
// -----------------------------------------------------------------------------
/* eslint-disable no-console */
import mqtt from 'mqtt'

import prisma from '@/lib/prisma'
import { Metric, ZoneType, EventType } from '@/prisma/client'

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
const BASE_TOPIC_PREFIX = 'PristinoPlant/Zona_A'

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
      `\n${colors.yellow}⚠️ [ADVERTENCIA] ${colors.white}Valor numérico inválido para la métrica '${metric}': "${valueStr}"${colors.reset}`,
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

  // ---- Validacion: Evitar registros duplicados para eventos de "estado" ----

  // 1. Definimos qué eventos son considerados de "estado".
  //    Estos son eventos que no cambian con frecuencia (ej: 'encendido', 'apagado').
  const stateEventTypes = [
    EventType.Irrigation_State,
    EventType.Rain_State,
    EventType.Device_Status,
  ] as const

  // 2. Creamos un "type guard". Es una función especial de TypeScript.
  //    Ayuda a TypeScript a entender que si `isStateEvent` devuelve `true`,
  //    la variable `eventType` es de un tipo más específico y seguro.
  type StateEventType = (typeof stateEventTypes)[number]
  const isStateEvent = (e: EventType): e is StateEventType => {
    return (stateEventTypes as unknown as EventType[]).includes(e)
  }

  // 3. Verificamos si el evento actual es un evento de "estado".
  //    Esta lógica solo se aplica a los eventos de estado para no saturar la DB.
  if (isStateEvent(eventType)) {
    // 4. Buscamos en la base de datos el último registro guardado
    //    para esta misma zona y este mismo tipo de evento.
    const lastEvent = await prisma.eventLog.findFirst({
      where: {
        zone: zone,
        eventType: eventType,
      },
      orderBy: {
        timestamp: 'desc', // Ordenamos por fecha para obtener el más reciente.
      },
    })

    // 5. Comparamos el valor del evento actual con el último que guardamos.
    //    Si el valor no ha cambiado (ej: el estado sigue siendo 'encendido'),
    //    no tiene sentido volver a guardarlo.
    if (lastEvent && lastEvent.value === value) {
      // Informamos en la consola que se omitió el registro y terminamos la función.
      console.log(
        `${colors.yellow}📑 [ INFO ] ${colors.reset}${colors.white}Estado sin cambios para ${colors.reset}${colors.magenta}${eventType}${colors.reset}. No se guarda el duplicado.`,
      )

      return // Detenemos la ejecución para no guardar el duplicado.
    }
  }

  // 6. Si el evento no es de "estado", o si es de "estado" pero su valor ha cambiado,
  //    procedemos a guardarlo en la base de datos.
  await prisma.eventLog.create({ data: { zone, eventType, value, topic } })

  // Finalmente, mostramos un log en la consola confirmando que se guardó el registro.
  console.log(
    `${colors.green}💾 [DB LOG] ${colors.reset}${colors.white}Registro de Evento${colors.reset}  ${colors.magenta}${eventType}: ${colors.white}${value}${colors.reset}`,
  )
}

// ---- LÓGICA PRINCIPAL DEL SERVICIO MQTT ----
console.log(
  `${colors.blue}📡 [ MQTT ] ${colors.reset}${colors.white}Conectando ${colors.reset}${colors.blue}${MQTT_BROKER_URL}${colors.reset}`,
)
const client = mqtt.connect(MQTT_BROKER_URL)

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
    `\n${colors.yellow}⚠️ [ MQTT ] ${colors.reset}${colors.white}Conexión cerrada. Intentando reconectar${colors.reset}`,
  )
})
