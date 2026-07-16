import mqtt from 'mqtt'

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://vps.sisparrow.com:1883'

async function main() {
  console.log(`Connecting to MQTT broker at: ${MQTT_BROKER_URL}...`)
  const client = mqtt.connect(MQTT_BROKER_URL, {
    connectTimeout: 5000,
    reconnectPeriod: 1000,
  })

  client.on('connect', () => {
    console.log('Connected! Subscribing to PristinoPlant/Weather_Station/# ...')
    client.subscribe('PristinoPlant/Weather_Station/#')
  })

  client.on('message', (topic, payload) => {
    console.log(`[MQTT] Topic: "${topic}" | Payload: ${payload.toString().substring(0, 100)}`)
  })

  console.log('Listening for 45 seconds...')
  await new Promise((resolve) => setTimeout(resolve, 45000))

  console.log('Disconnecting...')
  client.end()
}

main().catch(console.error)
