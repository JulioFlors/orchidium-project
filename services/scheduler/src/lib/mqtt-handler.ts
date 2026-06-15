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

export const EMA_CMD_TOPIC = 'PristinoPlant/Weather_Station/ZONA_A/cmd'

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
  originalDurationMin: number
  sessionTotalAttempts: number
  isPersistent: boolean
  onFailure?: (taskId: string, notes?: string) => Promise<void>
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
  private state: 'UNKNOWN' | 'OFFLINE' | 'STABILIZING' | 'READY' = 'UNKNOWN'
  private stabilizationTimer: NodeJS.Timeout | null = null
  private retryTimer: NodeJS.Timeout | null = null
  private throttleTimer: NodeJS.Timeout | null = null

  constructor(public readonly nodeTarget: string = 'Nodo') {}

  public get connectionState() {
    if (this.state === 'UNKNOWN') return 'none'

    return this.state === 'OFFLINE' ? 'offline' : 'online'
  }

  public get isReady() {
    return this.state === 'READY'
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
   * Pone al secuenciador en modo READY instantáneamente.
   * Limpia cualquier cola previa.
   */
  setReady() {
    this.state = 'READY'
    this.processNext()
  }

  /**
   * Pone al secuenciador en modo Offline. Limpia cola.
   */
  setOffline() {
    this.clearAll()
    this.state = 'OFFLINE'
  }

  /**
   * Alias semántico para confirmByTaskId (para comandos de sistema)
   */
  confirm(payload: string) {
    return this.confirmByTaskId(payload)
  }

  /**
   * Añade un comando a la cola de despacho.
   */
  track(
    topic: string,
    payload: string,
    scheduledAt: Date = new Date(),
    originalDurationMin: number = 0,
    isPersistent: boolean = false,
    onFailure?: (taskId: string, notes?: string) => Promise<void>,
  ) {
    const taskId = this.extractTaskId(payload) || payload

    // Evitar duplicados exactos en la cola
    if (this.queue.some((c) => c.taskId === taskId)) return

    // Calcular intentos disponibles en la ventana actual (20 + duración - 1 - tiempo_transcurrido)
    const ageMs = Date.now() - scheduledAt.getTime()
    const ageMin = Math.floor(ageMs / 60000)
    const sessionTotalAttempts = Math.max(1, 20 + originalDurationMin - 1 - ageMin)

    this.queue.push({
      topic,
      payload,
      taskId,
      attempts: 0,
      scheduledAt: scheduledAt.getTime(),
      originalDurationMin,
      sessionTotalAttempts,
      isPersistent,
      onFailure,
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

    // Log informativo solo al primer intento para evitar spam
    if (this.currentCommand.attempts === 0) {
      const { topic, payload } = this.currentCommand
      const isIrrigation = topic.includes('irrigation')

      if (!isIrrigation) {
        Logger.mqtt(`Comando: ${colors.magenta}${payload}${colors.reset}`, this.nodeTarget)
      }
    }

    this.dispatch()
  }

  /**
   * Realiza la publicación física del comando actual.
   */
  private dispatch() {
    if (!this.currentCommand || this.state !== 'READY') return

    const {
      topic,
      payload,
      attempts,
      taskId,
      onFailure,
      scheduledAt,
      originalDurationMin,
      isPersistent,
    } = this.currentCommand

    const now = Date.now()
    const ageMs = now - scheduledAt
    const maxWindowMin = 20 + originalDurationMin

    // [🛡️ Ventana de Oportunidad]: Dinámica basada en duración original.
    if (!isPersistent && ageMs > maxWindowMin * 60 * 1000) {
      Logger.mqtt(
        `Ventana de oportunidad cerrada (${maxWindowMin} min) para la tarea ${taskId.slice(0, 8)}.`,
        this.nodeTarget,
      )
      if (onFailure) {
        onFailure(taskId, `Ventana de oportunidad cerrada (${maxWindowMin} min expirados).`).catch(
          (err) => Logger.error(`Error en callback de expiración para ${taskId.slice(0, 8)}:`, err),
        )
      }
      this.queue.shift()
      this.currentCommand = null
      this.processNext()

      return
    }

    // [🔄 Gestión de Persistencia]: Registro en DB al intento 3 para feedback visual
    if (attempts === 3) {
      if (onFailure) {
        Logger.mqtt(
          `${this.nodeTarget} no responde tras 3 intentos. Sincronizando estado FAILED en DB.`,
          this.nodeTarget,
        )
        onFailure(taskId, `Sin respuesta de ${this.nodeTarget}.`).catch((err) =>
          Logger.error(`Error en callback de persistencia para ${taskId.slice(0, 8)}:`, err),
        )
      } else {
        Logger.mqtt(
          `${this.nodeTarget} no responde tras 3 intentos al comando de sistema.`,
          this.nodeTarget,
        )
      }
    }

    // Publicamos con QoS 0 por requerimiento de diseño robusto
    mqttClient.publish(topic, payload, { qos: 0 })

    this.currentCommand.attempts++

    // Programar reintento por falta de ACK (60s)
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = setTimeout(() => {
      // Re-intentamos el mismo comando (no avanzamos en la cola)
      this.dispatch()
    }, 60000)
  }

  /**
   * Confirma la recepción de un comando y avanza la cola tras 5s.
   */
  confirmByTaskId(taskId: string): {
    attempts: number
    originalDurationMin: number
    sessionTotalAttempts: number
  } | null {
    if (
      this.currentCommand &&
      (this.currentCommand.taskId === taskId || taskId.includes(this.currentCommand.taskId))
    ) {
      // Limpiar timers de reintento del comando actual
      if (this.retryTimer) clearTimeout(this.retryTimer)

      const result = {
        attempts: this.currentCommand.attempts,
        originalDurationMin: this.currentCommand.originalDurationMin,
        sessionTotalAttempts: this.currentCommand.sessionTotalAttempts,
      }

      const attemptsStr = result.attempts > 1 ? ` (en ${result.attempts} intentos)` : ''

      Logger.ack(`${this.nodeTarget} confirmó ACK${attemptsStr} para el comando: ${taskId}`)

      // Eliminar de la cola
      this.queue.shift()
      this.currentCommand = null

      // Esperar 5s de estabilización antes del siguiente mensaje (Throttling)
      if (this.throttleTimer) clearTimeout(this.throttleTimer)
      this.throttleTimer = setTimeout(() => {
        this.processNext()
      }, 5000)

      return result
    }

    return null
  }

  /**
   * Elimina un comando de la cola de despacho por su taskId.
   */
  removeByTaskId(taskId: string) {
    this.queue = this.queue.filter((c) => c.taskId !== taskId)
    if (this.currentCommand && this.currentCommand.taskId === taskId) {
      if (this.retryTimer) clearTimeout(this.retryTimer)
      this.currentCommand = null
      this.processNext()
    }
  }

  /**
   * Obtiene la cantidad de comandos pendientes en la cola de despacho.
   */
  getPendingCommandsCount(): number {
    return this.queue.length + (this.currentCommand ? 1 : 0)
  }

  public hasCommand(taskId: string): boolean {
    if (this.currentCommand && this.currentCommand.taskId === taskId) {
      return true
    }

    return this.queue.some((c) => c.taskId === taskId)
  }

  public getCurrentCommandTaskId(): string | null {
    return this.currentCommand ? this.currentCommand.taskId : null
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

export const irrigationRetryManager = new CommandSequencer('Nodo Actuador')

export const systemRetryManager = new CommandSequencer('Nodo Actuador')

export const emaManager = new CommandSequencer('Nodo EMA')

/**
 * Envía un comando de circuito al Nodo Actuador.
 */
export function executeSequence(
  purpose: TaskPurpose,
  durationSeconds: number,
  taskId: string,
  scheduledAt: Date = new Date(),
  onFailure?: (taskId: string, notes?: string) => Promise<void>,
  originalDurationMin: number = 0,
) {
  const durationSec = Math.floor(durationSeconds)

  const payload = {
    circuit: purpose,
    state: 'ON',
    duration: durationSec,
    task_id: taskId,
  }

  const message = JSON.stringify(payload)
  const remainingMinutes = Math.round((durationSeconds / 60) * 10) / 10
  const finalOriginalMin = originalDurationMin || remainingMinutes

  irrigationRetryManager.track(
    ACTUATOR_TOPIC,
    message,
    scheduledAt,
    finalOriginalMin,
    false,
    onFailure,
  )

  Logger.mqtt(
    `Despachando Circuito: ${purpose} (${remainingMinutes} min / ${durationSec}s) [Task: ${taskId.slice(0, 8)}]`,
    'Nodo Actuador',
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

  irrigationRetryManager.track(ACTUATOR_TOPIC, message, new Date())

  // Limpiamos reintentos de ON si existían para esta tarea
  irrigationRetryManager.confirmByTaskId(taskId)

  Logger.mqtt(
    `Enviando PARADA (OFF) para: ${purpose} [Task: ${taskId.slice(0, 8)}]`,
    'Nodo Actuador',
  )
}

/**
 * Envía un comando de sistema (eco, reset, etc) al Nodo Actuador o EMA.
 */
export function executeSystemCommand(
  command: string,
  isPersistent: boolean = false,
  topic: string = SYSTEM_CMD_TOPIC,
) {
  let targetManager: CommandSequencer

  if (topic === EMA_CMD_TOPIC) {
    targetManager = emaManager
  } else {
    targetManager = isPersistent ? systemRetryManager : irrigationRetryManager
  }

  // Para comandos no persistentes, verificamos si el nodo está online
  if (targetManager.connectionState === 'offline' && !isPersistent) {
    Logger.mqtt(
      `Comando: ${colors.magenta}${command}${colors.reset} (Descartado — Nodo Offline)`,
      targetManager.nodeTarget,
    )

    return
  }

  targetManager.track(topic, command, new Date(), 0, isPersistent)
}

/**
 * Envía un comando de sistema específicamente a la Estación EMA.
 */
export function executeEmaCommand(command: string, isPersistent: boolean = false) {
  executeSystemCommand(command, isPersistent, EMA_CMD_TOPIC)
}

let lastSamplingState: 'on' | 'off' | null = null

export function isLuxSamplingActive(): boolean {
  return lastSamplingState === 'on'
}

export function resetSamplingState() {
  lastSamplingState = null
}

/**
 * Sincroniza el estado del monitoreo del nodo basado en la hora actual.
 * Asegura que el nodo tenga el estado de muestreo correcto (Amanecer/Anochecer).
 */
export function syncNodeSampling(
  forcedState?: 'on' | 'off',
  forcePublish: boolean = false,
  targetNode?: 'actuator' | 'ema',
) {
  let targetState: 'on' | 'off'

  if (forcedState) {
    targetState = forcedState
  } else if (lastSamplingState && !forcePublish) {
    // Si no se fuerza y ya tenemos un estado estipulado, usarlo.
    targetState = lastSamplingState
  } else {
    // Inicialización por hora solo si no hay estado previo (primer arranque) o se fuerza
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    const formatted = formatter.format(now)
    const [h, m] = formatted.split(':').map(Number)
    const currentMinutes = h * 60 + m

    // 04:59 = 4 * 60 + 59 = 299 minutos
    // 19:00 = 19 * 60 = 1140 minutos
    targetState = currentMinutes >= 299 && currentMinutes < 1140 ? 'on' : 'off'
  }

  // Evitar duplicados si el estado no ha cambiado (y no se está forzando publicación)
  if (lastSamplingState === targetState && !forcedState && !forcePublish && !targetNode) return

  // Solo actualizamos el estado global si no está dirigido a un nodo en particular
  if (!targetNode) {
    lastSamplingState = targetState
  }

  if (targetState === 'on') {
    if (!forcePublish && !targetNode) Logger.info('☀  Iniciando muestreo de iluminancia (Amanecer)')
    if (!targetNode || targetNode === 'actuator') {
      if (irrigationRetryManager.connectionState !== 'offline' || forcePublish) {
        executeSystemCommand('lux_sampling:on', true)
      }
    }
    if (!targetNode || targetNode === 'ema') {
      if (emaManager.connectionState !== 'offline' || forcePublish) {
        executeEmaCommand('lux_sampling:on', true)
      }
    }
  } else {
    if (!forcePublish && !targetNode)
      Logger.info('🌙  Suspendiendo muestreo de iluminancia (Anochecer)')
    if (!targetNode || targetNode === 'actuator') {
      if (irrigationRetryManager.connectionState !== 'offline' || forcePublish) {
        executeSystemCommand('lux_sampling:off', true)
      }
    }
    if (!targetNode || targetNode === 'ema') {
      if (emaManager.connectionState !== 'offline' || forcePublish) {
        executeEmaCommand('lux_sampling:off', true)
      }
    }
  }
}
