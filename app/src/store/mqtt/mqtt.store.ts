/* eslint-disable no-console */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import mqtt, { MqttClient, IClientOptions } from 'mqtt'

import { MqttStatus } from '@/interfaces'

interface MqttState {
  client: MqttClient | null
  status: MqttStatus
  // Mapa: Tópico -> Payload (Puede ser objeto JSON parseado o string)
  messages: Record<string, unknown>
  // Set de tópicos a los que estamos suscritos (para evitar duplicados)
  subscriptions: Set<string>

  // Acciones
  connect: () => void
  disconnect: () => void
  subscribe: (topic: string) => void
  unsubscribe: (topic: string) => void
  publish: (topic: string, message: string | object) => void
}

// Configuración desde variables de entorno
const MQTT_PROTOCOL = process.env.NEXT_PUBLIC_MQTT_PROTOCOL || 'ws'
const MQTT_BROKER = process.env.NEXT_PUBLIC_MQTT_BROKER
const MQTT_PORT = process.env.NEXT_PUBLIC_MQTT_PORT

// Validamos si la configuración es válida para intentar conectar
const IS_CONFIG_VALID = Boolean(MQTT_BROKER && MQTT_PORT)

const BROKER_URL = IS_CONFIG_VALID ? `${MQTT_PROTOCOL}://${MQTT_BROKER}:${MQTT_PORT}/mqtt` : ''

const OPTIONS: IClientOptions = {
  // Deshabilitamos el keepalive explícito para evitar el error "Keepalive timeout" en consola
  // y confiamos en el transporte WebSocket/TCP o en la desconexión por error.
  keepalive: 0,
  clientId: `Orchidium-Web-${Math.random().toString(16).substring(2, 8)}`,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  // Aumentamos el periodo de reconexión para no saturar en caso de fallo
  reconnectPeriod: 5000,
  connectTimeout: 60 * 1000,
  // Credenciales obligatorias
  username: process.env.NEXT_PUBLIC_MQTT_USERNAME, // Mapeado a MQTT_USER_FRONTEND en .env
  password: process.env.NEXT_PUBLIC_MQTT_PASSWORD, // Mapeado a MQTT_PASS_FRONTEND en .env
}

export const useMqttStore = create<MqttState>()(
  devtools(
    (set, get) => ({
      client: null,
      status: 'disconnected',
      messages: {},
      subscriptions: new Set(),

      connect: () => {
        const { client, status } = get()

        // Evitar reconexiones si ya está intentando o conectado
        if (client || status === 'connected' || status === 'connecting') return

        if (!IS_CONFIG_VALID) {
          console.warn(
            '⚠️ [MQTT] Configuración incompleta. Revisa las variables de entorno (BROKER/PORT). Conexión omitida.',
          )
          set({ status: 'disconnected' })

          return
        }

        console.log(`🔌 [MQTT] Conectando a ${BROKER_URL}...`)
        set({ status: 'connecting' })

        const mqttClient = mqtt.connect(BROKER_URL, OPTIONS)

        mqttClient.on('connect', () => {
          console.log('✅ [MQTT] Conectado')
          set({ status: 'connected' })

          // Resuscribirse a tópicos previos si hubo reconexión
          const { subscriptions } = get()

          subscriptions.forEach((topic) => {
            mqttClient.subscribe(topic)
          })
        })

        mqttClient.on('reconnect', () => {
          console.log('🔄 [MQTT] Reconectando...')
          set({ status: 'reconnecting' })
        })

        mqttClient.on('error', (err: Error) => {
          console.error('❌ [MQTT] Error:', err)
          set({ status: 'error' })
        })

        mqttClient.on('offline', () => {
          console.log('⚠️ [MQTT] Offline')
          set({ status: 'disconnected' })
        })

        mqttClient.on('message', (topic: string, payload: Buffer) => {
          const payloadStr = payload.toString()
          let parsedPayload: unknown = payloadStr

          // Intento automático de parseo JSON
          try {
            if (payloadStr.startsWith('{') || payloadStr.startsWith('[')) {
              parsedPayload = JSON.parse(payloadStr)
            }
          } catch {
            // Si falla, se queda como string plano
          }

          // Actualizamos el mapa de mensajes
          set((state) => ({
            messages: {
              ...state.messages,
              [topic]: parsedPayload,
            },
          }))
        })

        set({ client: mqttClient })
      },

      disconnect: () => {
        const { client } = get()

        if (client) {
          console.log('🛑 [MQTT] Desconectando...')
          client.end()
          set({ client: null, status: 'disconnected' })
        }
      },

      subscribe: (topic) => {
        const { client, subscriptions } = get()

        // Si ya estamos suscritos, no hacemos nada
        if (subscriptions.has(topic)) return

        // Actualizamos el Set localmente
        const newSubscriptions = new Set(subscriptions)

        newSubscriptions.add(topic)
        set({ subscriptions: newSubscriptions })

        // Si hay cliente conectado, suscribimos efectivamente
        if (client && client.connected) {
          console.log(`📡 [MQTT] Suscribiendo a: ${topic}`)
          client.subscribe(topic, (err: Error | null) => {
            if (err) console.error(`❌ Error al suscribirse a ${topic}`, err)
          })
        }
      },

      unsubscribe: (topic) => {
        const { client, subscriptions } = get()

        if (subscriptions.has(topic)) {
          const newSubscriptions = new Set(subscriptions)

          newSubscriptions.delete(topic)
          set({ subscriptions: newSubscriptions })

          if (client && client.connected) {
            console.log(`🔕 [MQTT] Desuscribiendo de: ${topic}`)
            client.unsubscribe(topic)
          }
        }
      },

      publish: (topic, message) => {
        const { client } = get()

        if (client && client.connected) {
          const payload = typeof message === 'object' ? JSON.stringify(message) : message

          client.publish(topic, payload, { qos: 1 }) // QoS 1 para asegurar entrega comandos
          console.log(`📤 [MQTT] Enviado a ${topic}:`, payload)
        } else {
          console.warn('⚠️ [MQTT] No se puede publicar, cliente desconectado')
        }
      },
    }),
    { name: 'MqttStore' },
  ),
)
