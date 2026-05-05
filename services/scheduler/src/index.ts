import { prisma, TaskStatus, CollisionGuard, ZoneType, DeviceStatus } from '@package/database'
import { Cron } from 'croner'

import { Logger } from './lib/logger'
import { InferenceEngine } from './lib/inference-engine'
import {
  mqttClient,
  retryManager,
  syncNodeSampling,
  resetSamplingState,
  MQTT_BROKER_URL,
} from './lib/mqtt-handler'
import {
  cleanupExpiredTasks,
  handleAckTimeout,
  preScheduleAgrochemicals,
  processAuthorizedTasks,
  processPostponedTasks,
  processTaskLog,
  recordTaskEvent,
  resumeInterruptedTasks,
} from './lib/task-manager'
import { processDay } from './lib/telemetry-processor'

// ---- Configuración de Reglas ----

async function init() {
  console.log() // Espacio en blanco
  Logger.info('🚀 Iniciando Servicio Scheduler (PristinoPlant)')

  const pgReady = await waitForPostgres()

  if (!pgReady) {
    Logger.error('FALLO CRÍTICO: No se pudo conectar a PostgreSQL.')
    process.exit(1)
  }

  const mqttReady = await waitForMosquitto()

  if (!mqttReady) {
    Logger.error('FALLO CRÍTICO: No se pudo conectar al Broker MQTT.')
    process.exit(1)
  }

  // 1. Cargar y programar rutinas primero (Prioridad estética)
  await initScheduler()

  // 2. Iniciar escucha de eventos MQTT
  setupMqttHandlers()
}

/**
 * Atenta contra la base de datos hasta que responda.
 */
async function waitForPostgres(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`

      return true
    } catch {
      if (i === 0) Logger.warn('Esperando a PostgreSQL')
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  return false
}

/**
 * Espera a que el Broker MQTT esté accesible.
 */
async function waitForMosquitto(retries = 15) {
  const url = new URL(MQTT_BROKER_URL)
  const host = url.hostname
  const port = parseInt(url.port) || 1883

  for (let i = 0; i < retries; i++) {
    if (mqttClient.connected) return true

    if (i === 0) Logger.warn(`Esperando a Mosquitto en ${host}:${port}`)
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  return mqttClient.connected
}

// ---- Gestión de Estado Local ----
let lastRainState: string | null = null
let lastFirmwareHeartbeat: number = Date.now()
let lastActuatorHeartbeat: number = Date.now()
let lastSyncTimestamp: number = 0

// Timeout para eventos de lluvia huérfanos (10 minutos sin señales de vida)
const RAIN_ORPHAN_TIMEOUT_MS = 10 * 60 * 1000

function setupMqttHandlers() {
  const subscribe = () => {
    mqttClient.subscribe(
      [
        'PristinoPlant/Actuator_Controller/cmd/received',
        'PristinoPlant/Actuator_Controller/irrigation/state',
        'PristinoPlant/Actuator_Controller/status',
        'PristinoPlant/Actuator_Controller/status/boot',
        'PristinoPlant/Weather_Station/Exterior/readings',
        'PristinoPlant/Weather_Station/Exterior/rain/state',
        'PristinoPlant/Weather_Station/Exterior/rain/event',
      ],
      { qos: 1 },
    )
  }

  mqttClient.on('connect', () => {
    Logger.success('Conectado a Broker MQTT')
    subscribe()
  })

  // Si ya estamos conectados (por el waitForMosquitto), suscribir de inmediato
  if (mqttClient.connected) {
    Logger.success('Conectado a Broker MQTT')
    subscribe()
  }

  mqttClient.on('message', async (topic, payload) => {
    try {
      const message = payload.toString().trim()

      // Heartbeat: cualquier mensaje del firmware actualiza el timestamp general
      if (
        topic.startsWith('PristinoPlant/Actuator_Controller/') ||
        topic.startsWith('PristinoPlant/Weather_Station/')
      ) {
        lastFirmwareHeartbeat = Date.now()
      }

      // 1. Monitoreo de Conexión del Nodo Actuador
      if (topic === 'PristinoPlant/Actuator_Controller/status') {
        if (message === 'online') {
          lastActuatorHeartbeat = Date.now()

          if (retryManager.lastActuatorState === 'online') {
            // Ignorar heartbeats periódicos para no generar spam de registros
            return
          }

          await handleNodeSync(false)
        } else if (message === 'offline' && retryManager.lastActuatorState !== 'offline') {
          const previousState = retryManager.lastActuatorState
          const reason =
            previousState === 'unknown'
              ? 'Estado inicial detectado como Offline.'
              : 'El dispositivo se desconectó inesperadamente (Fallo de red/energía).'

          await handleNodeOffline(reason, 'BROKER')
        } else if (message === 'rebooting') {
          await handleNodeOffline('Reinicio seguro solicitado por el sistema o el usuario.', 'NODE')
        }

        return
      }

      // 1.5 Detección de Reinicio Rápido (Boot Explícito)
      if (topic === 'PristinoPlant/Actuator_Controller/status/boot') {
        lastActuatorHeartbeat = Date.now()

        // No forzamos un offline previo, saltamos directamente al sync
        // para que evalúe si es un REBOOT o una sesión nueva.
        await handleNodeSync(true)

        return
      }

      // 2. Acuse de Recibo (ACK)
      if (topic === 'PristinoPlant/Actuator_Controller/cmd/received') {
        try {
          const parsed = JSON.parse(message)
          const taskId = parsed.task_id

          if (taskId) {
            await recordTaskEvent(
              taskId,
              TaskStatus.ACKNOWLEDGED,
              'Nodo Actuador: Comandos recibidos.',
            )
          }
          retryManager.confirmByTaskId(taskId || message)
        } catch {
          retryManager.confirmByTaskId(message)
        }

        return
      }

      // 3. Telemetría Funcional Física
      if (topic === 'PristinoPlant/Actuator_Controller/irrigation/state') {
        let updates: Record<string, { state: string; task_id?: string }> = {}

        try {
          updates = JSON.parse(message)
        } catch {
          return
        }

        for (const [, info] of Object.entries(updates)) {
          const { state, task_id: taskId } = info

          if (state === 'ON' && taskId) {
            retryManager.confirmByTaskId(taskId)
            await recordTaskEvent(taskId, TaskStatus.IN_PROGRESS, 'Circuito de Riego abierto.', {
              actualStartAt: new Date(),
            })
          } else if (state === 'OFF' && taskId) {
            const currentTask = await prisma.taskLog.findUnique({
              where: { id: taskId },
              select: { status: true, actualStartAt: true, duration: true, purpose: true },
            })

            let completedMinutes = currentTask?.duration || 0

            if (currentTask?.actualStartAt) {
              const elapsedMs = Date.now() - new Date(currentTask.actualStartAt).getTime()

              completedMinutes = Math.floor(elapsedMs / 60000)
            }

            const finished = await recordTaskEvent(
              taskId,
              TaskStatus.COMPLETED,
              'Circuito de Riego cerrado correctamente.',
              { completedMinutes: { set: completedMinutes } },
            )

            if (finished) {
              Logger.success(
                `${currentTask?.purpose || 'Tarea'} ${taskId.slice(0, 8)} FINALIZADA (${completedMinutes} min)`,
              )
            }
          }
        }

        return
      }

      // 4. Detección de Lluvia
      if (topic === 'PristinoPlant/Weather_Station/Exterior/rain/state') {
        let state = message

        if (message.startsWith('{')) {
          try {
            state = JSON.parse(message).state || message
          } catch {
            /* ignore */
          }
        }

        if (state === 'Raining' && lastRainState !== 'Raining') {
          Logger.warn('🌧️ [WeatherGuard] Lluvia detectada por sensores en tiempo real.')
        }
        lastRainState = state
        lastFirmwareHeartbeat = Date.now()

        return
      }
    } catch (error: Error | unknown) {
      Logger.error('Error procesando QoS Message:', error)
    }
  })
}

/**
 * Verifica si un evento de lluvia ha quedado huérfano (firmware desconectado).
 * Si han pasado más de 10 minutos sin señales del firmware durante un evento Raining,
 * se da el evento por terminado.
 */
function checkRainOrphanTimeout() {
  if (lastRainState !== 'Raining') return

  const elapsed = Date.now() - lastFirmwareHeartbeat

  if (elapsed > RAIN_ORPHAN_TIMEOUT_MS) {
    Logger.warn(
      `🌧️ [WeatherGuard] Evento de lluvia huérfano detectado. Sin señales del firmware en ${Math.round(elapsed / 60000)}min. Dando por terminado.`,
    )
    lastRainState = 'Dry'
  }
}

/**
 * Verifica si el nodo actuador ha dejado de enviar señales de vida (online).
 * Timeout: 90 segundos.
 */
function checkActuatorTimeout() {
  if (retryManager.lastActuatorState === 'offline') return

  const elapsed = Date.now() - lastActuatorHeartbeat

  if (elapsed > 90_000) {
    handleNodeOffline(`Inactividad detectada (Timeout 90s sin mensajes 'online').`, 'SCHEDULER')
  }
}

/**
 * Gestiona la desconexión del nodo y la limpieza de tareas interrumpidas.
 */
async function handleNodeOffline(reason: string, origin: 'BROKER' | 'NODE' | 'SCHEDULER') {
  if (retryManager.lastActuatorState === 'offline') return

  retryManager.lastActuatorState = 'offline'
  Logger.node('OFFLINE', origin)
  resetSamplingState()

  // 1. Registro en el Historial (Postgres)
  await prisma.deviceLog
    .create({
      data: {
        device: 'Actuator_Controller',
        status: 'OFFLINE',
        notes: `[${origin}] ${reason}`,
      },
    })
    .catch((err) => Logger.error('Fallo persistiendo deviceLog (OFFLINE)', err))

  // 2. Gestionar tareas que estaban en ejecución
  const interruptedTasks = await prisma.taskLog.findMany({
    where: {
      status: {
        in: [TaskStatus.ACKNOWLEDGED, TaskStatus.IN_PROGRESS, TaskStatus.DISPATCHED],
      },
    },
  })

  for (const task of interruptedTasks) {
    retryManager.confirmByTaskId(task.id)

    // Todas las tareas interrumpidas (DISPATCHED, ACKNOWLEDGED, IN_PROGRESS)
    // vuelven a FAILED para ser reanudadas automáticamente tras la reconexión.
    let extraNotes = 'Interrumpida: El Nodo Actuador perdió conexión inesperadamente.'
    let addedMinutes = 0

    // Si ya estaba en progreso, calculamos cuánto tiempo se ejecutó para registro
    if (task.actualStartAt && task.status === TaskStatus.IN_PROGRESS) {
      const elapsedMs = Date.now() - new Date(task.actualStartAt).getTime()

      addedMinutes = Math.floor(elapsedMs / 60000)
      extraNotes = `Interrumpida tras ${addedMinutes} min de riego efectivo.`
    }

    await recordTaskEvent(task.id, TaskStatus.FAILED, extraNotes, {
      completedMinutes: { increment: addedMinutes },
    })
  }

  if (interruptedTasks.length > 0) {
    const isSingle = interruptedTasks.length === 1
    const taskText = isSingle ? 'tarea' : 'tareas'
    const actionText = isSingle ? 'pausó' : 'pausaron'
    const nameInfo = isSingle ? ` (${interruptedTasks[0].purpose})` : ''

    Logger.warn(
      `Se ${actionText} ${interruptedTasks.length} ${taskText}${nameInfo} para su recuperación automática.`,
    )
  }

  retryManager.clear()
}

/**
 * Orquesta la sincronización completa del nodo tras una reconexión o reinicio.
 * Implementa un bloqueo de 5 segundos para evitar ráfagas redundantes.
 */
async function handleNodeSync(isBoot: boolean = false) {
  const now = Date.now()
  const timeSinceLastSync = now - lastSyncTimestamp

  // Si ya sincronizamos hace menos de 5 segundos, ignoramos la redundancia
  if (timeSinceLastSync < 5000) {
    if (isBoot) {
      Logger.debug('[ MQTT ] Boot redundante detectado. Ignorando sincronización duplicada.')
    }

    return
  }

  // Determinamos la semántica del mensaje ONLINE
  let notes = 'Dispositivo conectado / Heartbeat recuperado.'
  let statusToSave: DeviceStatus = 'ONLINE'

  if (isBoot) {
    // Calculamos el tiempo desde el último latido físico en vez del lastSync
    const timeSinceLastHeartbeat = now - lastFirmwareHeartbeat

    // Si ha pasado más de 30 minutos desde el último heartbeat exitoso,
    // asumimos que el dispositivo estuvo apagado intencionalmente y es una nueva sesión.
    if (timeSinceLastHeartbeat > 30 * 60 * 1000) {
      notes = 'Controlador Conectado (Sesión nueva tras inactividad prolongada).'
      statusToSave = 'ONLINE'
    } else {
      notes = 'Reinicio del controlador.'
      statusToSave = 'REBOOT'
    }
  }

  lastSyncTimestamp = now

  // Marcamos estado tanto en consola como en Influx/Historial
  if (statusToSave === 'REBOOT') {
    Logger.node('REBOOT')
  } else {
    Logger.node('ONLINE')
  }

  // Registro en la base de datos para el Timeline/Widget
  // Solo registramos si realmente el estado cambió o es un REBOOT explícito
  if (retryManager.lastActuatorState !== 'online' || statusToSave === 'REBOOT') {
    await prisma.deviceLog
      .create({
        data: {
          device: 'Actuator_Controller',
          status: statusToSave,
          notes: notes,
        },
      })
      .catch((err) => Logger.error('Fallo persistiendo deviceLog (ONLINE/REBOOT)', err))
  }

  // Si es un REBOOT en caliente, el hardware apagó los pines.
  // Por ende, cualquier tarea que estuviera ejecutándose fue interrumpida de facto.
  if (statusToSave === 'REBOOT') {
    const interruptedTasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [TaskStatus.ACKNOWLEDGED, TaskStatus.IN_PROGRESS, TaskStatus.DISPATCHED],
        },
      },
    })

    for (const task of interruptedTasks) {
      retryManager.confirmByTaskId(task.id)

      let extraNotes = 'Interrumpida: El Nodo Actuador se reinició inesperadamente.'
      let addedMinutes = 0

      if (task.actualStartAt && task.status === TaskStatus.IN_PROGRESS) {
        const elapsedMs = Date.now() - new Date(task.actualStartAt).getTime()

        addedMinutes = Math.floor(elapsedMs / 60000)
        extraNotes = `Interrumpida tras ${addedMinutes} min de riego efectivo por reinicio.`
      }

      await recordTaskEvent(task.id, TaskStatus.FAILED, extraNotes, {
        completedMinutes: { increment: addedMinutes },
      })
    }

    if (interruptedTasks.length > 0) {
      const isSingle = interruptedTasks.length === 1
      const taskText = isSingle ? 'tarea activa' : 'tareas activas'
      const actionText = isSingle ? 'pausó' : 'pausaron'

      Logger.warn(`Se ${actionText} ${interruptedTasks.length} ${taskText} debido al reinicio.`)
    }
  }

  retryManager.lastActuatorState = 'online'
  resetSamplingState()
  syncNodeSampling(undefined, true)
  retryManager.retryAllPending()
  await processPostponedTasks()
  await resumeInterruptedTasks()
}

// ---- Lógica de Rutinas (Crons) ----
async function initScheduler() {
  await waitForPostgres()

  // Registrar callback para fallos de ACK y expiración rápida
  retryManager.setOnFailure(handleAckTimeout)

  // Verificación periódica de inactividad de nodos y eventos (cada 15s)
  setInterval(checkRainOrphanTimeout, 60_000)
  setInterval(checkActuatorTimeout, 15_000)

  // Cron de limpieza de tareas expiradas (Ventana de 20 min / 24h agroquímicos)
  new Cron('*/5 * * * *', { timezone: 'America/Caracas' }, async () => {
    await cleanupExpiredTasks()
  })

  // Cron de Pre-Agendamiento de Agroquímicos (12h antes)
  new Cron('0 * * * *', { timezone: 'America/Caracas' }, async () => {
    await preScheduleAgrochemicals()
  })

  // Poller de Tareas Autorizadas (cada 1 min)
  new Cron('* * * * *', { timezone: 'America/Caracas' }, async () => {
    await processAuthorizedTasks()
  })

  // Cron para sincronizar muestreo de iluminancia (Amanecer 4:59am / Anochecer 7:01pm)
  new Cron('59 4 * * *', { timezone: 'America/Caracas' }, () => {
    if (retryManager.lastActuatorState === 'online') {
      syncNodeSampling('on')
    } else {
      Logger.warn('Sampling sync postponed: Actuator Node is OFFLINE.')
    }
  })
  new Cron('1 19 * * *', { timezone: 'America/Caracas' }, () => {
    if (retryManager.lastActuatorState === 'online') {
      syncNodeSampling('off')
    } else {
      Logger.warn('Sampling sync postponed: Actuator Node is OFFLINE.')
    }
  })

  // Cron de Mantenimiento de Filtros (Lunes y Jueves 8:00 AM)
  new Cron('0 8 * * 1,4', { timezone: 'America/Caracas' }, async () => {
    try {
      await prisma.notification.create({
        data: {
          type: 'MAINTENANCE_REMINDER',
          title: 'Mantenimiento de Filtros',
          description: 'Recordatorio periódico: Limpiar filtros del sistema de riego.',
          priority: 'NORMAL',
        },
      })
      Logger.info('🔔 Notificación de mantenimiento de filtros generada.')
    } catch (error) {
      Logger.error('Error generando notificación de mantenimiento:', error)
    }
  })

  // Cron de cierre oficial diario (Media noche 12:01 AM)
  new Cron('1 0 * * *', { timezone: 'America/Caracas' }, async () => {
    try {
      Logger.info('Procesando Telemetría de las Estaciones Meteorológicas.')
      const yesterday = new Date()

      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      await processDay(ZoneType.EXTERIOR, yesterday)
      await processDay(ZoneType.ZONA_A, yesterday)
      Logger.success('Cierre diario de ayer completado.')
    } catch (error) {
      Logger.error('Error en cierre diario:', error)
    }
  })

  Logger.info('Cargando Rutinas desde la base de datos')

  const schedules = await prisma.automationSchedule.findMany({
    where: { isEnabled: true },
  })

  schedules.forEach((schedule) => {
    Logger.info(`Programando: "${schedule.name}" ➜ [${schedule.cronTrigger}]`)
    new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' }, () => {
      runTask(schedule.id)
    })
  })
}

async function runTask(scheduleId: string) {
  Logger.info(`⏰ Ejecutando Rutina Programada (ID: ${scheduleId.slice(0, 8)})`)

  try {
    const schedule = await prisma.automationSchedule.findUnique({
      where: { id: scheduleId },
    })

    if (!schedule || !schedule.isEnabled) return

    if (retryManager.lastActuatorState !== 'online') {
      Logger.warn(`⏭️ Rutina POSTERGADA: ${schedule.name}. Motivo: Nodo Actuador OFFLINE.`)

      await prisma.taskLog.create({
        data: {
          scheduleId: schedule.id,
          purpose: schedule.purpose,
          zones: schedule.zones,
          status: TaskStatus.PENDING,
          source: 'ROUTINE',
          scheduledAt: new Date(),
          duration: schedule.durationMinutes,
          notes: 'Nodo Actuador no está conectado. Esperando reconexión',
          events: {
            create: {
              status: TaskStatus.PENDING,
              notes: 'Nodo Actuador OFFLINE: Esperando reconexión para ejecutar.',
            },
          },
        },
      })

      return
    }

    // 1. Evaluar si la rutina debe proceder mediante el Motor de Inferencia
    const inference = await InferenceEngine.evaluate(schedule)

    // Lógica especial para Agroquímicos
    if (schedule.purpose === 'FERTIGATION' || schedule.purpose === 'FUMIGATION') {
      // Buscar si ya existe una tarea pre-agendada
      const taskLog = await prisma.taskLog.findFirst({
        where: {
          scheduleId: schedule.id,
          scheduledAt: {
            gte: new Date(Date.now() - 60000), // Ventana de 1min para el trigger exacto
            lte: new Date(Date.now() + 60000),
          },
        },
      })

      // Si no existe (por algún motivo falló el pre-scheduler), crearla ahora
      if (!taskLog) {
        const nextOccurrence = new Date(Date.now() + 12 * 60 * 60 * 1000)
        const task = await prisma.taskLog.create({
          data: {
            scheduleId: schedule.id,
            purpose: schedule.purpose,
            zones: schedule.zones,
            status: TaskStatus.WAITING_CONFIRMATION,
            source: 'ROUTINE',
            scheduledAt: nextOccurrence,
            duration: schedule.durationMinutes,
            notes: 'Tarea pre-agendada para confirmación (12h de antelación).',
          },
        })

        // Crear notificación de confirmación
        await prisma.notification.create({
          data: {
            type: 'AGROCHEMICAL_CONFIRM',
            title: 'Confirmación de Agroquímicos',
            description: `Se requiere preparar el tanque para la rutina: ${schedule.name} programada para el ${nextOccurrence.toLocaleTimeString('es-VE')}`,
            taskId: task.id,
            priority: 'HIGH',
          },
        })

        Logger.info(
          `[ AGRO ] Pre-agendada rutina "${schedule.name}" para el ${nextOccurrence.toLocaleString('es-VE')}`,
        )
      }

      // Si está en WAITING_CONFIRMATION, NO se ejecuta. Se queda esperando 24h.
      if (taskLog && taskLog.status === TaskStatus.WAITING_CONFIRMATION) {
        Logger.info(
          `[ AGRO ] Tarea ${taskLog.id.slice(0, 8)} (${schedule.name}) en espera de confirmación.`,
        )

        return
      }

      // Si ya está AUTHORIZED (por confirmación manual anticipada), procesar con Veto ambiental
      if (taskLog && taskLog.status === TaskStatus.AUTHORIZED) {
        if (inference.shouldCancel) {
          Logger.warn(`[ AGRO ] VETO AMBIENTAL aplicado a tarea autorizada: ${inference.reason}`)
          await recordTaskEvent(taskLog.id, TaskStatus.CANCELLED, inference.reason)

          return
        }
        await processTaskLog(taskLog)

        return
      }

      return
    }

    // Lógica estándar para otras tareas (IRRIGATION, etc.)
    if (inference.shouldCancel) {
      Logger.warn(`❌ Rutina CANCELADA: ${schedule.name}. Motivo: ${inference.reason}`)

      if (inference.reason && !inference.reason.includes('Cancelación manual')) {
        await prisma.taskLog.create({
          data: {
            scheduleId: schedule.id,
            purpose: schedule.purpose,
            zones: schedule.zones,
            status: TaskStatus.CANCELLED,
            source: 'ROUTINE',
            scheduledAt: new Date(),
            duration: schedule.durationMinutes,
            notes: inference.reason,
          },
        })
      }

      return
    }

    const collisionCheck = await CollisionGuard.checkTimeWindow(
      new Date(),
      schedule.durationMinutes,
    )

    if (collisionCheck.hasCollision) {
      const conflictIds = collisionCheck.conflictingTasks
        .map((t) => (t as { id: string }).id.split('-')[0])
        .join(', ')

      await prisma.taskLog.create({
        data: {
          scheduleId: schedule.id,
          purpose: schedule.purpose,
          zones: schedule.zones,
          status: TaskStatus.CANCELLED,
          source: 'ROUTINE',
          scheduledAt: new Date(),
          duration: schedule.durationMinutes,
          notes: `Cancelada por CollisionGuard: solapamiento con: ${conflictIds}`,
        },
      })
      Logger.warn(`⚠️ Rutina Cancelada por Colisión: ${schedule.name}`)

      return
    }

    const taskLog = await prisma.taskLog.create({
      data: {
        scheduleId: schedule.id,
        purpose: schedule.purpose,
        zones: schedule.zones,
        status: TaskStatus.PENDING,
        source: 'ROUTINE',
        scheduledAt: new Date(),
        duration: schedule.durationMinutes,
      },
    })

    await processTaskLog(taskLog)
  } catch (error: Error | unknown) {
    Logger.error('Error en runTask:', error)
  }
}

init()
