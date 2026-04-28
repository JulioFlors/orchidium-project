import mqtt from 'mqtt'
import { TaskPurpose } from '@package/database'

import { Logger } from './logger'

// ---- Configuración MQTT ----
export const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL ||
  process.env.MQTT_BROKER_URL_CLOUD ||
  process.env.MQTT_BROKER_URL_LOCAL ||
  ''
const MQTT_USERNAME = process.env.MQTT_USERNAME || process.env.MQTT_USER_BACKEND || ''
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || process.env.MQTT_PASS_BACKEND || ''

export const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || 'Scheduler'

export const ACTUATOR_TOPIC = 'PristinoPlant/Actuator_Controller/irrigation/cmd'

export const SYSTEM_CMD_TOPIC = 'PristinoPlant/Actuator_Controller/cmd'

const colors = {
  reset: '\x1b[0m',
  magenta: '\x1b[95m',
}

// ---- Cliente MQTT ----
export const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  clientId: MQTT_CLIENT_ID,
  protocolVersion: 5,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  protocol: MQTT_BROKER_URL.startsWith('mqtts') ? 'mqtts' : 'mqtt',
  rejectUnauthorized: true,
  servername: new URL(MQTT_BROKER_URL).hostname,
})

// ---- Gestión de Reintentos de Comandos (ACK) ----
interface PendingCommand {
  topic: string
  payload: string
  attempts: number
  lastSent: number
  scheduledAt: number
  timer: NodeJS.Timeout | null
  isPersistent?: boolean
}

class CommandRetryManager {
  private pending = new Map<string, PendingCommand>()
  private onFailure?: (taskId: string, notes?: string) => Promise<void>
  public lastActuatorState = 'unknown'
  setOnFailure(callback: (taskId: string, notes?: string) => Promise<void>) {
    this.onFailure = callback
  }

  track(
    topic: string,
    payload: string,
    scheduledAt: Date = new Date(),
    isPersistent: boolean = false,
  ) {
    const key = `${topic}:${payload}`
    const existing = this.pending.get(key)

    if (existing) {
      // Si ya existe, no reiniciamos el contador de intentos ni el timer,
      // simplemente dejamos que siga su curso. Esto evita spam al reconectar.
      return
    }

    const command: PendingCommand = {
      topic,
      payload,
      attempts: 1,
      lastSent: Date.now(),
      scheduledAt: scheduledAt.getTime(),
      timer: setInterval(() => this.retry(key), 60000),
      isPersistent,
    }

    this.pending.set(key, command)
  }

  confirm(topic: string, payload: string) {
    const key = `${topic}:${payload}`
    const command = this.pending.get(key)

    if (command) {
      if (command.timer) clearInterval(command.timer)
      this.pending.delete(key)
      Logger.success(`Comando confirmado por el nodo: ${colors.magenta}${payload}${colors.reset}`)
    }
  }

  confirmByTaskId(taskId: string) {
    for (const [key, command] of this.pending) {
      if (command.payload.includes(taskId)) {
        if (command.timer) clearInterval(command.timer)
        this.pending.delete(key)
        Logger.debug(`El nodo confirmó ACK para la tarea (ID: ${taskId.slice(0, 8)})`)
      }
    }
  }

  clear() {
    if (this.pending.size === 0) return
    const isSingle = this.pending.size === 1
    const retryText = isSingle ? 'reintento' : 'reintentos'

    Logger.debug(
      `El nodo está offline, pero mantenemos ${this.pending.size} ${retryText} en cola para cuando regrese.`,
    )
  }

  private retry(key: string) {
    const command = this.pending.get(key)

    if (!command) return

    if (this.lastActuatorState === 'offline') return

    const now = Date.now()
    const ageMs = now - command.scheduledAt

    // 1. Expiración de Ventana (20 min) - Ignorada si es persistente
    if (!command.isPersistent && ageMs > 20 * 60 * 1000) {
      Logger.error(`Ventana de oportunidad cerrada para: ${command.payload}`)
      this.handleTimeout(command.payload, 'Ventana de oportunidad cerrada (20 min expirados).')
      if (command.timer) clearInterval(command.timer)
      this.pending.delete(key)

      return
    }

    command.attempts++
    command.lastSent = now
    // Log de reintento SILENCIADO por petición (solo visible en depuración extrema)
    // Logger.warn(`Reintentando entrega al nodo...`)

    // 2. Fallo Visual (al minuto 2 de insistencia si el nodo está online)
    if (command.attempts === 3) {
      Logger.warn(`Fallo visual (min 2). Reportando al historial mientras se sigue insistiendo.`)
      this.handleTimeout(
        command.payload,
        'Sin respuesta del Nodo Actuador (Sordo). Reintentando cada 60s...',
      )
    }

    mqttClient.publish(command.topic, command.payload, { qos: 1 })
  }

  private handleTimeout(payload: string, notes?: string) {
    if (!this.onFailure) return
    const taskId = this.extractTaskId(payload)

    if (taskId) this.onFailure(taskId, notes)
  }

  private extractTaskId(payload: string): string | null {
    try {
      if (payload.startsWith('{')) {
        const parsed = JSON.parse(payload)

        return parsed.task_id || null
      }

      return null
    } catch {
      return null
    }
  }
}

export const retryManager = new CommandRetryManager()

/**
 * Envía un comando de circuito al Nodo Actuador.
 */
export function executeSequence(
  purpose: TaskPurpose,
  durationMinutes: number,
  taskId: string,
  scheduledAt: Date = new Date(),
) {
  const durationSec = durationMinutes * 60

  const payload = {
    circuit: purpose,
    state: 'ON',
    duration: durationSec,
    task_id: taskId,
  }

  const message = JSON.stringify(payload)

  mqttClient.publish(ACTUATOR_TOPIC, message, {
    qos: 1,
    retain: false,
    properties: {
      messageExpiryInterval: 300,
    },
  })

  retryManager.track(ACTUATOR_TOPIC, message, scheduledAt)

  Logger.info(
    `Despachando Circuito: ${purpose} (${durationMinutes} min) [Task: ${taskId.slice(0, 8)}]`,
  )
}

/**
 * Envía un comando de parada inmediata para un circuito.
 */
export function stopSequence(purpose: TaskPurpose, taskId: string) {
  const payload = {
    circuit: purpose,
    state: 'OFF',
    task_id: taskId,
  }

  const message = JSON.stringify(payload)

  mqttClient.publish(ACTUATOR_TOPIC, message, {
    qos: 1,
    retain: false,
  })

  // Limpiamos reintentos de ON si existían para esta tarea
  retryManager.confirmByTaskId(taskId)

  Logger.warn(`Enviando PARADA (OFF) para: ${purpose} [Task: ${taskId.slice(0, 8)}]`)
}

/**
 * Envía un comando de sistema (eco, reset, etc) al Nodo Actuador.
 */
export function executeSystemCommand(command: string, isPersistent: boolean = false) {
  mqttClient.publish(SYSTEM_CMD_TOPIC, command, {
    qos: 1,
    retain: false,
  })
  Logger.info(`Comando: ${colors.magenta}${command}${colors.reset}`)
  retryManager.track(SYSTEM_CMD_TOPIC, command, new Date(), isPersistent)
}

let lastSamplingState: 'on' | 'off' | null = null

export function resetSamplingState() {
  lastSamplingState = null
}

/**
 * Sincroniza el estado del monitoreo del nodo basado en la hora actual.
 * Asegura que el nodo tenga el estado de muestreo correcto (Amanecer/Anochecer).
 */
export function syncNodeSampling(forcedState?: 'on' | 'off') {
  let targetState: 'on' | 'off'

  if (forcedState) {
    targetState = forcedState
  } else if (lastSamplingState) {
    // Si no se fuerza y ya tenemos un estado estipulado, usarlo.
    targetState = lastSamplingState
  } else {
    // Inicialización por hora solo si no hay estado previo (primer arranque)
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Caracas',
      hour: 'numeric',
      hour12: false,
    }
    const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now))

    targetState = hour >= 5 && hour < 19 ? 'on' : 'off'
  }

  // Evitar duplicados si el estado no ha cambiado
  if (lastSamplingState === targetState && !forcedState) return

  lastSamplingState = targetState

  if (targetState === 'on') {
    Logger.info('☀  Iniciando muestreo de iluminancia (Amanecer)')
    executeSystemCommand('lux_sampling:on', true)
  } else {
    Logger.info('🌙  Suspendiendo muestreo de iluminancia (Anochecer)')
    executeSystemCommand('lux_sampling:off', true)
  }
}
