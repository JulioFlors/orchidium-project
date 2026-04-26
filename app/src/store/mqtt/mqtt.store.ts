import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import mqtt, { MqttClient, IClientOptions } from 'mqtt'

import { MqttStatus } from '@/interfaces'
import { Logger } from '@/lib'

interface PendingAck {
  topic: string
  message: string | object
  timestamp: number
  retries: number
}

interface MqttState {
  client: MqttClient | null
  status: MqttStatus
  messages: Record<string, { payload: unknown; receivedAt: number }>
  subscriptions: Set<string>
  pendingAcks: Record<string, PendingAck>
  retryTimer: ReturnType<typeof setInterval> | null

  // Acciones
  connect: () => void
  disconnect: () => void
  subscribe: (topic: string) => void
  unsubscribe: (topic: string) => void
  publish: (topic: string, message: string | object, retain?: boolean) => void
  publishWithAck: (topic: string, message: string | object) => void
  clearAck: (payload: string) => void
  startRetryLoop: () => void
  stopRetryLoop: () => void
}

// Configuración desde variables de entorno
const MQTT_PROTOCOL = process.env.NEXT_PUBLIC_MQTT_PROTOCOL
const MQTT_BROKER = process.env.NEXT_PUBLIC_MQTT_BROKER
const MQTT_PORT = process.env.NEXT_PUBLIC_MQTT_PORT

// Validamos si la configuración es válida para intentar conectar
const IS_CONFIG_VALID = Boolean(MQTT_BROKER && MQTT_PORT)

const BROKER_URL = IS_CONFIG_VALID ? `${MQTT_PROTOCOL}://${MQTT_BROKER}:${MQTT_PORT}` : ''

const OPTIONS: IClientOptions = {
  keepalive: 60,
  clientId: `Orchidarium-Web-${Math.random().toString(16).substring(2, 8)}`,
  protocolId: 'MQTT',
  protocolVersion: 5,
  clean: true,
  // Aumentamos el periodo de reconexión para no saturar en caso de fallo
  reconnectPeriod: 5000,
  connectTimeout: 60 * 1000,
  username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
  password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
}

const RETRY_INTERVAL_MS = 60000 // 60 segundos entre reintentos
const MAX_RETRIES = 5 // 5 minutos de perseverancia (ajustado de 20 a 5)
const COMMAND_TTL_MS = 5 * 60 * 1000 // 5 minutos de vida absoluta

export const useMqttStore = create<MqttState>()(
  devtools(
    (set, get) => ({
      client: null,
      status: 'disconnected',
      messages: {},
      subscriptions: new Set(),
      pendingAcks: {},
      retryTimer: null,

      startRetryLoop: () => {
        const { retryTimer, stopRetryLoop } = get()

        if (retryTimer) stopRetryLoop()

        const timer = setInterval(() => {
          const { pendingAcks, client, publish } = get()

          if (!client || !client.connected) return

          const now = Date.now()
          const acksToClear: string[] = []

          Object.entries(pendingAcks).forEach(([payload, ack]) => {
            const ageMs = now - ack.timestamp

            // 1. Expiración por intentos o por tiempo absoluto (TTL)
            if (ack.retries >= MAX_RETRIES || ageMs >= COMMAND_TTL_MS) {
              const reason = ack.retries >= MAX_RETRIES ? 'intentos agotados' : 'TTL expirado'

              Logger.warn(`❌ [MQTT] Comando descartado (${reason}):`, payload)
              acksToClear.push(payload)

              return
            }

            // 2. Solo re-intentar si el tiempo ha pasado Y el cliente está realmente conectado
            if (ageMs >= RETRY_INTERVAL_MS) {
              if (client?.connected) {
                Logger.mqtt(
                  `🔄 [MQTT] Re-intentando envío (${ack.retries + 1}/${MAX_RETRIES}):`,
                  payload,
                )

                publish(ack.topic, ack.message, false)

                set((state) => ({
                  pendingAcks: {
                    ...state.pendingAcks,
                    [payload]: {
                      ...ack,
                      timestamp: now,
                      retries: ack.retries + 1,
                    },
                  },
                }))
              }
            }
          })

          if (acksToClear.length > 0) {
            set((state) => {
              const next = { ...state.pendingAcks }

              acksToClear.forEach((p) => delete next[p])

              return { pendingAcks: next }
            })
          }
        }, 2000)

        set({ retryTimer: timer })
      },

      stopRetryLoop: () => {
        const { retryTimer } = get()

        if (retryTimer) {
          clearInterval(retryTimer)
          set({ retryTimer: null })
        }
      },

      connect: () => {
        const { client, status, startRetryLoop } = get()

        // Evitar reconexiones si ya está intentando o conectado
        if (client || status === 'connected' || status === 'connecting') return

        if (!IS_CONFIG_VALID) {
          Logger.warn('⚠️ [MQTT] Configuración incompleta.')
          set({ status: 'disconnected' })

          return
        }

        Logger.info(`🔌 [MQTT] Conectando a ${BROKER_URL}`)
        set({ status: 'connecting' })

        const mqttClient = mqtt.connect(BROKER_URL, OPTIONS)

        mqttClient.on('connect', () => {
          Logger.success('✅ [MQTT] Conectado')
          set({ status: 'connected' })
          startRetryLoop()

          // Resuscribirse a tópicos previos si hubo reconexión
          const { subscriptions } = get()

          subscriptions.forEach((topic) => mqttClient.subscribe(topic))
        })

        mqttClient.on('reconnect', () => {
          set({ status: 'reconnecting' })
        })

        mqttClient.on('error', (err: Error) => {
          Logger.error('❌ [MQTT] Error:', err)
          set({ status: 'error' })
        })

        mqttClient.on('offline', () => {
          set({ status: 'disconnected' })
        })

        mqttClient.on('message', (topic, payload) => {
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

          set((state) => {
            const newMessages = {
              ...state.messages,
              [topic]: { payload: parsedPayload, receivedAt: Date.now() },
            }

            let newPendingAcks = state.pendingAcks

            if (topic.endsWith('/received')) {
              const ackKey =
                typeof parsedPayload === 'string'
                  ? parsedPayload
                  : typeof parsedPayload === 'object' &&
                      parsedPayload !== null &&
                      'cmd' in parsedPayload
                    ? String((parsedPayload as { cmd: string }).cmd)
                    : payloadStr

              if (state.pendingAcks[ackKey]) {
                Logger.success(`🎯 [MQTT] ACK Recibido:`, ackKey)
                const rest = { ...state.pendingAcks }

                delete rest[ackKey]
                newPendingAcks = rest
              }
            }

            return { messages: newMessages, pendingAcks: newPendingAcks }
          })
        })

        set({ client: mqttClient })
      },

      disconnect: () => {
        const { client, stopRetryLoop } = get()

        if (client) {
          stopRetryLoop()
          client.end()
          set({ client: null, status: 'disconnected' })
        }
      },

      subscribe: (topic) => {
        const { client, subscriptions } = get()

        if (subscriptions.has(topic)) return

        const newSubscriptions = new Set(subscriptions)

        newSubscriptions.add(topic)
        set({ subscriptions: newSubscriptions })

        if (client && client.connected) {
          client.subscribe(topic)
        }
      },

      unsubscribe: (topic) => {
        const { client, subscriptions } = get()

        if (subscriptions.has(topic)) {
          const newSubscriptions = new Set(subscriptions)

          newSubscriptions.delete(topic)
          set({ subscriptions: newSubscriptions })

          if (client && client.connected) client.unsubscribe(topic)
        }
      },

      publish: (topic, message, retain = false) => {
        const { client } = get()

        if (client && client.connected) {
          const payload = typeof message === 'object' ? JSON.stringify(message) : message

          client.publish(topic, payload, { qos: 1, retain })
        }
      },

      publishWithAck: (topic, message) => {
        const { client, publish, pendingAcks } = get()
        const payload = typeof message === 'object' ? JSON.stringify(message) : message

        // Si ya está en cola, no reiniciamos el timer ni volvemos a encolar.
        // Esto evita ráfagas de comandos idénticos durante reconexiones inestables.
        if (pendingAcks[payload]) return

        set((state) => ({
          pendingAcks: {
            ...state.pendingAcks,
            [payload]: {
              topic,
              message,
              timestamp: Date.now(),
              retries: 0,
            },
          },
        }))

        if (client && client.connected) {
          publish(topic, message, false)
        }
      },

      clearAck: (payload) => {
        set((state) => {
          const rest = { ...state.pendingAcks }

          delete rest[payload]

          return { pendingAcks: rest }
        })
      },
    }),
    { name: 'MqttStore' },
  ),
)
