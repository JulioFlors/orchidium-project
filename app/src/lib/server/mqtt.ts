import mqtt from 'mqtt'

/**
 * Envía un comando MQTT puntual y cierra la conexión.
 * Útil para acciones de servidor (API/Server Actions) que no requieren
 * una conexión persistente.
 */
export async function sendMqttCommand(topic: string, payload: string | Record<string, unknown>) {
  let brokerUrl = process.env.MQTT_BROKER_URL

  if (!brokerUrl) {
    const isVercel = !!process.env.VERCEL

    if (isVercel && process.env.NEXT_PUBLIC_MQTT_BROKER) {
      brokerUrl = `mqtts://${process.env.NEXT_PUBLIC_MQTT_BROKER}:8883`
    } else {
      brokerUrl = process.env.MQTT_BROKER_URL_CLOUD || process.env.MQTT_BROKER_URL_LOCAL
    }
  }

  if (!brokerUrl) {
    throw new Error('MQTT_BROKER_URL no configurada')
  }

  const username =
    process.env.MQTT_USERNAME ||
    process.env.MQTT_USER_BACKEND ||
    process.env.NEXT_PUBLIC_MQTT_USERNAME

  const password =
    process.env.MQTT_PASSWORD ||
    process.env.MQTT_PASS_BACKEND ||
    process.env.NEXT_PUBLIC_MQTT_PASSWORD

  const client = mqtt.connect(brokerUrl, {
    username,
    password,
    protocol: brokerUrl.startsWith('mqtts') ? 'mqtts' : 'mqtt',
    rejectUnauthorized: false,
    connectTimeout: 5000,
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.end(true)
      reject(new Error('MQTT Connection Timeout'))
    }, 10000)

    client.on('connect', () => {
      client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        clearTimeout(timeout)
        client.end(true)
        if (err) reject(err)
        else resolve(true)
      })
    })

    client.on('error', (err) => {
      clearTimeout(timeout)
      client.end(true)
      reject(err)
    })
  })
}
