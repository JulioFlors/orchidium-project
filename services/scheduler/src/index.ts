import { prisma, TaskStatus, CollisionGuard, ZoneType } from '@package/database'
import { Cron } from 'croner'

import { Logger } from './lib/logger'
import { InferenceEngine } from './lib/inference-engine'
import { mqttClient, retryManager, syncNodeSampling, MQTT_BROKER_URL } from './lib/mqtt-handler'
import {
  recordTaskEvent,
  processTaskLog,
  resumeInterruptedTasks,
  processPostponedTasks,
  cleanupExpiredTasks,
  handleAckTimeout,
} from './lib/task-manager'
import { processDay } from './scripts/backfill-history'

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

function setupMqttHandlers() {
  const subscribe = () => {
    mqttClient.subscribe(
      [
        'PristinoPlant/Actuator_Controller/cmd/received',
        'PristinoPlant/Actuator_Controller/irrigation/state',
        'PristinoPlant/Actuator_Controller/status',
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

      // 1. Monitoreo de Conexión del Nodo Actuador
      if (topic === 'PristinoPlant/Actuator_Controller/status') {
        if (message === 'online' && retryManager.lastActuatorState !== 'online') {
          retryManager.lastActuatorState = 'online'
          Logger.node('ONLINE')
          syncNodeSampling()

          await prisma.deviceLog
            .create({
              data: {
                device: 'Actuator_Controller',
                status: 'ONLINE',
                notes: 'Dispositivo conectado / Heartbeat recuperado.',
              },
            })
            .catch((err) => Logger.error('Fallo persistiendo deviceLog (ONLINE)', err))

          await processPostponedTasks()
          await resumeInterruptedTasks()
        } else if (message === 'offline' && retryManager.lastActuatorState !== 'offline') {
          const previousState = retryManager.lastActuatorState

          retryManager.lastActuatorState = 'offline'
          Logger.node('OFFLINE')

          await prisma.deviceLog
            .create({
              data: {
                device: 'Actuator_Controller',
                status: 'OFFLINE',
                notes:
                  previousState === 'unknown'
                    ? 'LWT: Estado inicial detectado como Offline.'
                    : 'LWT: El dispositivo se desconectó inesperadamente.',
              },
            })
            .catch((err) => Logger.error('Fallo persistiendo deviceLog (OFFLINE)', err))

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
        if (message === 'Raining' && lastRainState !== 'Raining') {
          Logger.warn('🌧️ [WeatherGuard] Lluvia detectada por sensores en tiempo real.')
        }
        lastRainState = message

        return
      }
    } catch (error: Error | unknown) {
      Logger.error('Error procesando QoS Message:', error)
    }
  })
}

// ---- Lógica de Rutinas (Crons) ----
async function initScheduler() {
  await waitForPostgres()

  // Registrar callback para fallos de ACK y expiración rápida
  retryManager.setOnFailure(handleAckTimeout)

  // Cron de limpieza de tareas expiradas (Ventana de 20 min)
  new Cron('*/5 * * * *', { timezone: 'America/Caracas' }, async () => {
    await cleanupExpiredTasks()
  })

  // Cron para sincronizar muestreo de iluminancia (Amanecer 5am / Anochecer 7:01pm)
  new Cron('0 5 * * *', { timezone: 'America/Caracas' }, () => {
    syncNodeSampling()
  })
  new Cron('1 19 * * *', { timezone: 'America/Caracas' }, () => {
    syncNodeSampling()
  })

  // Cron de cierre oficial diario (16:01 PM)
  new Cron('1 16 * * *', { timezone: 'America/Caracas' }, async () => {
    try {
      Logger.info('Iniciando cierre diario oficial de telemetría a las 16:01...')
      const today = new Date()

      today.setHours(0, 0, 0, 0)
      await processDay(ZoneType.EXTERIOR, today)
      await processDay(ZoneType.ZONA_A, today)
      Logger.success('Cierre diario completado.')
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
    // Esto detecta cancelaciones manuales en la cola y condiciones ambientales adversas.
    const inference = await InferenceEngine.evaluate(schedule)

    if (inference.shouldCancel) {
      Logger.warn(`⏭️ Rutina SALTADA: ${schedule.name}. Motivo: ${inference.reason}`)

      // Solo creamos el log si no era una cancelación manual (para no duplicar registros en el historial)
      // Si inference.reason menciona "Cancelación manual", significa que ya hay un log CANCELLED previo.
      if (inference.reason && !inference.reason.includes('Cancelación manual')) {
        await prisma.taskLog.create({
          data: {
            scheduleId: schedule.id,
            purpose: schedule.purpose,
            zones: schedule.zones,
            status: TaskStatus.SKIPPED,
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
