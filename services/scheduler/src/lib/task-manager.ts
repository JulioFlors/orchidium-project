import { prisma, TaskStatus, TaskLog } from '@package/database'
import { Cron } from 'croner'

import { Logger } from './logger'
import { executeSequence, stopSequence } from './mqtt-handler'
import { InferenceEngine } from './inference-engine'

const recentEvents = new Map<string, number>()

/**
 * Registra un evento de cambio de estado de forma atómica en TaskLog y TaskEventLog.
 */
export async function recordTaskEvent(
  taskId: string,
  status: TaskStatus,
  notes?: string,
  extraData: Record<string, unknown> = {},
) {
  try {
    const lockKey = `${taskId}_${status}`
    const now = Date.now()

    if (recentEvents.has(lockKey) && now - (recentEvents.get(lockKey) || 0) < 2000) {
      return null
    }
    recentEvents.set(lockKey, now)

    return await prisma.$transaction(async (tx) => {
      const currentTask = await tx.taskLog.findUnique({
        where: { id: taskId },
        select: { status: true, notes: true, actualStartAt: true, completedMinutes: true },
      })

      if (!currentTask) {
        Logger.warn(`Se recibió evento ${status} para tarea inexistente: ${taskId.slice(0, 8)}`)

        return null
      }

      const terminalStatuses: TaskStatus[] = [
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
        TaskStatus.EXPIRED,
      ]

      const isCurrentTerminal = terminalStatuses.includes(currentTask.status)
      const isNewTerminal = terminalStatuses.includes(status)
      const isStatusChange = currentTask.status !== status

      if (isCurrentTerminal && !isNewTerminal) {
        return null
      }

      let shouldUpdateStatus = true

      if (isCurrentTerminal) {
        if (currentTask.status !== status) {
          shouldUpdateStatus = false
        }
      }

      let resultRecord: TaskLog | null = currentTask as unknown as TaskLog

      if (shouldUpdateStatus) {
        if (currentTask.status === status) {
          if (currentTask.notes === notes || status === TaskStatus.IN_PROGRESS) {
            resultRecord = await tx.taskLog.update({
              where: { id: taskId },
              data: { notes, ...extraData },
            })
          }
        } else {
          resultRecord = await tx.taskLog.update({
            where: { id: taskId },
            data: {
              status,
              notes,
              executedAt:
                status === TaskStatus.IN_PROGRESS && !currentTask.actualStartAt
                  ? new Date()
                  : undefined,
              ...extraData,
            },
          })
        }
      } else {
        resultRecord = await tx.taskLog.update({
          where: { id: taskId },
          data: { notes, ...extraData },
        })
      }

      if (isStatusChange) {
        await tx.taskEventLog.create({
          data: {
            taskId,
            status,
            notes: notes || `Evento: ${status}`,
            userId: extraData.userId as string | undefined,
          },
        })
      }

      return resultRecord
    })
  } catch (err) {
    Logger.error(`Error persistiendo evento ${status} para tarea ${taskId.slice(0, 8)}:`, err)

    return null
  }
}

/**
 * Ejecutor atómico de una Tarea (TaskLog).
 * Contiene la lógica de despacho hacia MQTT.
 */
export async function processTaskLog(taskLog: TaskLog) {
  try {
    // [Smart Recalibration]: Usamos los minutos ya completados registrados en la DB
    // y el tiempo transcurrido si la tarea quedó en un limbo IN_PROGRESS.
    const alreadyCompletedSec = (taskLog.completedMinutes || 0) * 60
    let durationToExecuteSec = taskLog.duration * 60
    let isResumption = false

    if (alreadyCompletedSec > 0 || taskLog.actualStartAt) {
      isResumption = true
      let elapsedInCurrentRun = 0

      if (taskLog.actualStartAt && taskLog.status === TaskStatus.IN_PROGRESS) {
        elapsedInCurrentRun = Math.floor(
          (Date.now() - new Date(taskLog.actualStartAt).getTime()) / 1000,
        )
      }

      durationToExecuteSec = taskLog.duration * 60 - (alreadyCompletedSec + elapsedInCurrentRun)

      if (durationToExecuteSec <= 0) {
        Logger.warn(
          `Tarea ${taskLog.id.slice(0, 8)} ya alcanzó su meta de riego. Marcando como completada.`,
        )
        await recordTaskEvent(
          taskLog.id,
          TaskStatus.COMPLETED,
          `Riego finalizado tras recuperaciones (Total: ${taskLog.duration} min).`,
        )

        return
      }
    }

    // Despacho hacia MQTT con la duración recalibrada (en segundos)
    executeSequence(
      taskLog.purpose,
      durationToExecuteSec,
      taskLog.id,
      taskLog.scheduledAt,
      handleAckTimeout,
      taskLog.duration,
    )

    let durationText = `${durationToExecuteSec}s`

    if (durationToExecuteSec >= 60) {
      const mins = Math.round((durationToExecuteSec / 60) * 10) / 10

      durationText = `${mins} min`
    }

    const notes = isResumption
      ? `Reanudado por ${durationText}.`
      : 'Comandos MQTT enviados al Nodo Actuador.'

    await recordTaskEvent(taskLog.id, TaskStatus.DISPATCHED, notes, {
      executedAt: new Date(),
    })
  } catch (error) {
    Logger.error('Fallo crítico ejecutando taskLog', error)
    await prisma.taskLog
      .update({
        where: { id: taskLog.id },
        data: {
          status: TaskStatus.FAILED,
          notes: String(error),
        },
      })
      .catch((err) => {
        Logger.error(
          `Fallo secundario marcando tarea ${taskLog.id.slice(0, 8)} tras error previo`,
          err,
        )
      })
  }
}

/**
 * Busca tareas que quedaron en estado 'RUNNING' tras un reinicio del scheduler.
 */
export async function resumeInterruptedTasks() {
  const interrupted = await prisma.taskLog.findMany({
    where: {
      status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.DISPATCHED, TaskStatus.ACKNOWLEDGED] },
    },
  })

  if (interrupted.length > 0) {
    const isSingle = interrupted.length === 1
    const introText = isSingle
      ? 'Detectada 1 tarea interrumpida'
      : `Detectadas ${interrupted.length} tareas interrumpidas`
    const markText = isSingle ? 'Marcándola como fallida' : 'Marcándolas como fallidas'

    Logger.warn(`${introText} por reinicio. ${markText}.`)
    for (const task of interrupted) {
      await recordTaskEvent(
        task.id,
        TaskStatus.FAILED,
        'Reinicio del servicio Scheduler durante la ejecución',
      )
    }
  }
}

/**
 * Procesa tareas que fueron postergadas porque el nodo estaba offline.
 * Ventana de oportunidad: 20 minutos.
 */
export async function processPostponedTasks() {
  const now = Date.now()

  // Buscamos tareas candidatas a reintento que ya deberían haber iniciado
  const candidates = await prisma.taskLog.findMany({
    where: {
      status: { in: [TaskStatus.PENDING, TaskStatus.FAILED] },
      scheduledAt: { lte: new Date() },
    },
    include: {
      schedule: true,
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const postponed: TaskLog[] = []

  for (const task of candidates) {
    // Ventana Dinámica: 20 min + Duración de la tarea
    const dynamicWindowMs = (20 * 60 + task.duration) * 1000
    const expirationTime = task.scheduledAt.getTime() + dynamicWindowMs

    // [🛡️ SEGURIDAD]: Si la rutina fue desactivada, cancelamos la tarea pendiente
    if (task.schedule && !task.schedule.isEnabled && task.status === TaskStatus.PENDING) {
      await recordTaskEvent(
        task.id,
        TaskStatus.CANCELLED,
        'Tarea descartada: La rutina asociada fue desactivada por el usuario.',
      )
      continue
    }

    if (now >= task.scheduledAt.getTime() && now <= expirationTime) {
      postponed.push(task)
    }
  }

  if (postponed.length > 0) {
    const isSingle = postponed.length === 1
    const introText = isSingle
      ? 'Reactivando 1 tarea pendiente/postergada'
      : `Reactivando ${postponed.length} tareas pendientes/postergadas`

    Logger.info(`${introText}.`)

    for (const task of postponed) {
      await processTaskLog(task)
    }
  }
}

/**
 * Callback para el RetryManager cuando agota los intentos de ACK o detecta fallo visual.
 */
export async function handleAckTimeout(taskId: string, notes?: string) {
  await recordTaskEvent(taskId, TaskStatus.FAILED, notes || 'Sin respuesta del Nodo Actuador.')
}

/**
 * Limpia tareas que excedieron su ventana de oportunidad.
 * - Tareas normales (IRRIGATION, etc.): 20 minutos + Duración.
 * - Agroquímicos (FERTIGATION, FUMIGATION): 24 horas después de la hora programada.
 */
export async function cleanupExpiredTasks() {
  const now = Date.now()
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60000)

  // 1. Limpieza de tareas estándar (Ventana Dinámica)
  const standardCandidates = await prisma.taskLog.findMany({
    where: {
      status: { in: [TaskStatus.PENDING, TaskStatus.FAILED] },
      purpose: { notIn: ['FERTIGATION', 'FUMIGATION'] },
      OR: [
        { notes: { contains: 'Nodo Actuador no está conectado' } },
        { notes: { contains: 'Reintentando al reconectar' } },
        { notes: { contains: 'Interrumpida' } },
      ],
    },
  })

  const standardTasksToExpire: TaskLog[] = []

  for (const task of standardCandidates) {
    const dynamicWindowMs = (20 * 60 + task.duration) * 1000

    if (now > task.scheduledAt.getTime() + dynamicWindowMs) {
      standardTasksToExpire.push(task)
    }
  }

  // 2. Limpieza de agroquímicos (24h)
  const agroTasksToExpire = await prisma.taskLog.findMany({
    where: {
      status: { in: [TaskStatus.WAITING_CONFIRMATION, TaskStatus.PENDING, TaskStatus.FAILED] },
      purpose: { in: ['FERTIGATION', 'FUMIGATION'] },
      scheduledAt: { lt: twentyFourHoursAgo },
    },
  })

  const allTasksToExpire = [...standardTasksToExpire, ...agroTasksToExpire]

  for (const task of allTasksToExpire) {
    const isAgro = ['FERTIGATION', 'FUMIGATION'].includes(task.purpose)
    const reason = isAgro
      ? 'Ventana de confirmación cerrada (24h expiradas sin autorización).'
      : 'Ventana de oportunidad cerrada (20 min expirados sin reconexión del nodo).'

    await recordTaskEvent(task.id, TaskStatus.EXPIRED, reason)
  }

  if (allTasksToExpire.length > 0) {
    Logger.warn(`Limpieza: ${allTasksToExpire.length} tareas marcaron como expiradas.`)
  }
}

/**
 * Pre-agenda tareas de agroquímicos 12h antes de su ejecución para que el usuario pueda confirmarlas.
 */
export async function preScheduleAgrochemicals() {
  try {
    const agroSchedules = await prisma.automationSchedule.findMany({
      where: {
        isEnabled: true,
        purpose: { in: ['FERTIGATION', 'FUMIGATION'] },
      },
    })

    const now = new Date()
    const twelveHoursAhead = new Date(now.getTime() + 12 * 60 * 60000)

    for (const schedule of agroSchedules) {
      const cron = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' })
      const nextOccurrence = cron.nextRun()

      if (nextOccurrence && nextOccurrence <= twelveHoursAhead) {
        // Verificar si ya existe una tarea para esta fecha exacta (con margen de 1 min)
        const startWindow = new Date(nextOccurrence.getTime() - 60000)
        const endWindow = new Date(nextOccurrence.getTime() + 60000)

        const existing = await prisma.taskLog.findFirst({
          where: {
            scheduleId: schedule.id,
            scheduledAt: { gte: startWindow, lte: endWindow },
          },
        })

        if (!existing) {
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
      }
    }
  } catch (error) {
    Logger.error('Error en preScheduleAgrochemicals:', error)
  }
}

/**
 * Poller que ejecuta tareas que han sido marcadas como AUTHORIZED por el usuario.
 */
export async function processAuthorizedTasks() {
  try {
    const authorizedTasks = await prisma.taskLog.findMany({
      where: {
        status: TaskStatus.AUTHORIZED,
        scheduledAt: { lte: new Date() }, // Ya llegó su hora o ya pasó
      },
      include: { schedule: true },
    })

    for (const task of authorizedTasks) {
      Logger.info(`[ POLL ] Procesando tarea autorizada: ${task.id.slice(0, 8)} (${task.purpose})`)

      // Antes de ejecutar, pasar por el Motor de Inferencia para el Veto de último minuto
      if (task.schedule) {
        const inference = await InferenceEngine.evaluate(task.schedule)

        if (inference.shouldCancel) {
          Logger.warn(`[ AGRO ] VETO AMBIENTAL aplicado a tarea autorizada: ${inference.reason}`)
          await recordTaskEvent(task.id, TaskStatus.CANCELLED, inference.reason)
          continue
        }
      }

      await processTaskLog(task)
    }
  } catch (error) {
    Logger.error('Error en processAuthorizedTasks:', error)
  }
}

/**
 * Cancela una tarea con discriminación semántica y cierre seguro de hardware.
 */
export async function cancelTaskExecution(taskId: string, userId?: string, reason?: string) {
  try {
    const task = await prisma.taskLog.findUnique({
      where: { id: taskId },
    })

    if (!task) return { success: false, error: 'Tarea no encontrada' }

    const activeStatuses: TaskStatus[] = [
      TaskStatus.DISPATCHED,
      TaskStatus.ACKNOWLEDGED,
      TaskStatus.IN_PROGRESS,
    ]
    const isActivelyRunning = activeStatuses.includes(task.status)

    // El estado final será CANCELLED, pero si está activa esperaremos al ACK físico
    const finalStatus = TaskStatus.CANCELLED

    // Buscar nombre del administrador si hay userId
    let adminName = ''

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      })

      if (user?.name) adminName = user.name
    }

    const adminSuffix = adminName ? ` por ${adminName}` : ''

    const finalReason =
      reason ||
      (isActivelyRunning
        ? `Cancelación manual${adminSuffix}: Interrupción de operación activa.`
        : `Cancelación manual${adminSuffix}: Tarea descartada antes de iniciar.`)

    // 1. Si está activa, enviar OFF al hardware y marcar para cierre atómico
    if (isActivelyRunning) {
      const atomicReason = `[ATOMIC_CANCEL] ${finalReason}`

      // Marcamos la tarea con la nota especial pero mantenemos su estado actual (ej. IN_PROGRESS)
      // para que el poller de MQTT sepa que debe transicionar a CANCELLED al recibir el OFF.
      await recordTaskEvent(taskId, task.status, atomicReason, {
        userId,
      })

      stopSequence(task.purpose, task.id)
    } else {
      // 2. Si NO está activa, cancelar lógicamente de inmediato
      await recordTaskEvent(taskId, finalStatus, finalReason, {
        userId,
      })
    }

    return { success: true, status: finalStatus }
  } catch (error) {
    Logger.error(`Error cancelando tarea ${taskId}:`, error)

    return { success: false, error: 'Error interno en la cancelación' }
  }
}
