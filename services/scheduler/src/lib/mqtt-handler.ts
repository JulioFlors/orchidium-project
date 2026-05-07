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
  taskId: string
  attempts: number
  scheduledAt: number
  isPersistent: boolean
}

/**
 * SECUENCIADOR DE COMANDOS (CommandSequencer)
 * Gestiona la entrega ordenada y robusta de comandos al Nodo Actuador.
 * - Bloqueo estricto: Espera confirmación antes de enviar el siguiente.
 * - Reintento infinito: Re-envía cada 30s si no hay ACK.
 * - Throttling: 5s de separación mínima entre comandos exitosos.
 * - Estabilización: 60s de silencio tras boot/reconexión.
 * - Aborto de sesión: Limpia cola en cada reinicio para asegurar consistencia total.
 */
class CommandSequencer {
  private queue: PendingCommand[] = []
  private currentCommand: PendingCommand | null = null
  private state: 'OFFLINE' | 'STABILIZING' | 'READY' = 'OFFLINE'
  private stabilizationTimer: NodeJS.Timeout | null = null
  private retryTimer: NodeJS.Timeout | null = null
  private throttleTimer: NodeJS.Timeout | null = null

  public get lastActuatorState() {
    return this.state === 'OFFLINE' ? 'offline' : 'online'
  }

  /**
   * Pone al secuenciador en modo Estabilización (60s de silencio).
   * Limpia cualquier cola previa para iniciar desde cero.
   */
  setStabilizing() {
    this.clearAll()
    this.state = 'STABILIZING'

    if (this.stabilizationTimer) clearTimeout(this.stabilizationTimer)

    this.stabilizationTimer = setTimeout(() => {
      this.state = 'READY'
      this.processNext()
    }, 60000)
  }

  /**
   * Pone al secuenciador en modo Offline. Limpia cola.
   */
  setOffline() {
    this.clearAll()
    this.state = 'OFFLINE'
  }

  /**
   * Añade un comando a la cola de despacho.
   */
  track(
    topic: string,
    payload: string,
    scheduledAt: Date = new Date(),
    isPersistent: boolean = false,
  ) {
    const taskId = this.extractTaskId(payload) || `sys-${Date.now()}`

    // Evitar duplicados exactos en la cola
    if (this.queue.some((c) => c.taskId === taskId)) return

    this.queue.push({
      topic,
      payload,
      taskId,
      attempts: 0,
      scheduledAt: scheduledAt.getTime(),
      isPersistent,
    })

    if (this.state === 'READY') {
      this.processNext()
    }
  }

  /**
   * Procesa el siguiente comando en la cola.
   */
  private processNext() {
    if (this.state !== 'READY' || this.queue.length === 0 || this.currentCommand) {
      return
    }

    this.currentCommand = this.queue[0]
    this.dispatch()
  }

  /**
   * Realiza la publicación física del comando actual.
   */
  private dispatch() {
    if (!this.currentCommand || this.state !== 'READY') return

    const { topic, payload } = this.currentCommand

    // Publicamos con QoS 0 por requerimiento de diseño robusto
    mqttClient.publish(topic, payload, { qos: 0 })

    this.currentCommand.attempts++

    // Programar reintento por falta de ACK (30s)
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = setTimeout(() => {
      // Re-intentamos el mismo comando (no avanzamos en la cola)
      this.dispatch()
    }, 30000)
  }

  /**
   * Confirma la recepción de un comando y avanza la cola tras 5s.
   */
  confirmByTaskId(taskId: string) {
    if (
      this.currentCommand &&
      (this.currentCommand.taskId === taskId || taskId.includes(this.currentCommand.taskId))
    ) {
      // Limpiar timers de reintento del comando actual
      if (this.retryTimer) clearTimeout(this.retryTimer)

      const attempts =
        this.currentCommand.attempts > 1 ? ` (en ${this.currentCommand.attempts} intentos)` : ''

      Logger.debug(`El nodo confirmó ACK para la tarea${attempts} (ID: ${taskId.slice(0, 8)})`)

      // Eliminar de la cola
      this.queue.shift()
      this.currentCommand = null

      // Esperar 5s de estabilización antes del siguiente mensaje (Throttling)
      if (this.throttleTimer) clearTimeout(this.throttleTimer)
      this.throttleTimer = setTimeout(() => {
        this.processNext()
      }, 5000)
    }
  }

  /**
   * Limpia absolutamente todo el estado del secuenciador.
   */
  private clearAll() {
    this.queue = []
    this.currentCommand = null
    if (this.stabilizationTimer) clearTimeout(this.stabilizationTimer)
    if (this.retryTimer) clearTimeout(this.retryTimer)
    if (this.throttleTimer) clearTimeout(this.throttleTimer)
  }

  // Compatibilidad con código legado
  clear() {
    this.setOffline()
  }

  retryAllPending() {
    if (this.state === 'READY') this.processNext()
  }

  private extractTaskId(payload: string): string | null {
    try {
      if (payload.startsWith('{')) {
        const parsed = JSON.parse(payload)

        return parsed.task_id || parsed.id || null
      }

      return null
    } catch {
      return null
    }
  }
}

export const retryManager = new CommandSequencer()

/**
 * Envía un comando de circuito al Nodo Actuador.
 */
export function executeSequence(
  purpose: TaskPurpose,
  durationSeconds: number,
  taskId: string,
  scheduledAt: Date = new Date(),
) {
  const durationSec = Math.floor(durationSeconds)

  const payload = {
    circuit: purpose,
    state: 'ON',
    duration: durationSec,
    task_id: taskId,
  }

  const message = JSON.stringify(payload)

  retryManager.track(ACTUATOR_TOPIC, message, scheduledAt)

  const durationMinutes = Math.round((durationSeconds / 60) * 10) / 10

  Logger.info(
    `Despachando Circuito: ${purpose} (${durationMinutes} min / ${durationSec}s) [Task: ${taskId.slice(0, 8)}]`,
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

  retryManager.track(ACTUATOR_TOPIC, message, new Date())

  // Limpiamos reintentos de ON si existían para esta tarea
  retryManager.confirmByTaskId(taskId)

  Logger.warn(`Enviando PARADA (OFF) para: ${purpose} [Task: ${taskId.slice(0, 8)}]`)
}

/**
 * Envía un comando de sistema (eco, reset, etc) al Nodo Actuador.
 */
export function executeSystemCommand(command: string, isPersistent: boolean = false) {
  // Solo publicamos de inmediato si el nodo está online
  if (retryManager.lastActuatorState === 'online') {
    mqttClient.publish(SYSTEM_CMD_TOPIC, command, {
      qos: 1,
      retain: false,
    })
    Logger.info(`Comando: ${colors.magenta}${command}${colors.reset}`)
  } else {
    Logger.info(`Comando: ${colors.magenta}${command}${colors.reset} (Encolado - Nodo Offline)`)
  }

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
export function syncNodeSampling(forcedState?: 'on' | 'off', forcePublish: boolean = false) {
  let targetState: 'on' | 'off'

  if (forcedState) {
    targetState = forcedState
  } else if (lastSamplingState && !forcePublish) {
    // Si no se fuerza y ya tenemos un estado estipulado, usarlo.
    targetState = lastSamplingState
  } else {
    // Inicialización por hora solo si no hay estado previo (primer arranque) o se fuerza
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Caracas',
      hour: 'numeric',
      hour12: false,
    }
    const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now))

    targetState = hour >= 5 && hour < 19 ? 'on' : 'off'
  }

  // Evitar duplicados si el estado no ha cambiado (y no se está forzando publicación)
  if (lastSamplingState === targetState && !forcedState && !forcePublish) return

  lastSamplingState = targetState

  if (targetState === 'on') {
    if (!forcePublish) Logger.info('☀  Iniciando muestreo de iluminancia (Amanecer)')
    executeSystemCommand('lux_sampling:on', true)
  } else {
    if (!forcePublish) Logger.info('🌙  Suspendiendo muestreo de iluminancia (Anochecer)')
    executeSystemCommand('lux_sampling:off', true)
  }
}
