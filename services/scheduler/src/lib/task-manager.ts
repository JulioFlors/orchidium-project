import { prisma, TaskStatus, TaskLog } from '@package/database'

import { Logger } from './logger'
import { executeSequence } from './mqtt-handler'

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
        select: { status: true, notes: true, actualStartAt: true },
      })

      if (!currentTask) {
        Logger.warn(`Se recibió evento ${status} para tarea inexistente: ${taskId.slice(0, 8)}`)

        return null
      }

      const terminalStatuses: TaskStatus[] = [
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
        TaskStatus.EXPIRED,
        TaskStatus.SKIPPED,
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
    executeSequence(taskLog.purpose, taskLog.duration, taskLog.id, taskLog.scheduledAt)

    await recordTaskEvent(
      taskLog.id,
      TaskStatus.DISPATCHED,
      'Comandos MQTT enviados al Nodo Actuador.',
      {
        executedAt: new Date(),
      },
    )

    Logger.success(`Circuito de Tarea Log ${taskLog.id.slice(0, 8)} despachado.`)
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
      await recordTaskEvent(task.id, TaskStatus.FAILED, 'Scheduler restart during execution')
    }
  }
}

/**
 * Procesa tareas que fueron postergadas porque el nodo estaba offline.
 * Ventana de oportunidad: 20 minutos.
 */
export async function processPostponedTasks() {
  const twentyMinsAgo = new Date(Date.now() - 20 * 60000)

  const postponed = await prisma.taskLog.findMany({
    where: {
      status: { in: [TaskStatus.PENDING, TaskStatus.FAILED] },
      OR: [
        { notes: { contains: 'Nodo Actuador no está conectado' } },
        { notes: { contains: 'Reintentando al reconectar' } },
        { notes: { contains: 'Interrumpida' } },
      ],
      scheduledAt: { gte: twentyMinsAgo },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  if (postponed.length > 0) {
    const isSingle = postponed.length === 1
    const introText = isSingle
      ? 'Reactivando 1 tarea postergada'
      : `Reactivando ${postponed.length} tareas postergadas`

    Logger.info(`${introText} tras reconexión del nodo.`)

    for (const task of postponed) {
      await processTaskLog(task)
    }
  }
}

/**
 * Callback para el RetryManager cuando agota los intentos de ACK o detecta fallo visual.
 */
export async function handleAckTimeout(taskId: string, notes?: string) {
  await recordTaskEvent(
    taskId,
    TaskStatus.FAILED,
    notes || 'Sin respuesta del Nodo Actuador (ACK timeout tras agotarse los reintentos).',
  )
}

/**
 * Limpia tareas que excedieron la ventana de oportunidad de 20 minutos.
 */
export async function cleanupExpiredTasks() {
  const twentyMinsAgo = new Date(Date.now() - 20 * 60000)

  const expired = await prisma.taskLog.updateMany({
    where: {
      status: { in: [TaskStatus.PENDING, TaskStatus.FAILED] },
      OR: [
        { notes: { contains: 'Nodo Actuador no está conectado' } },
        { notes: { contains: 'Reintentando al reconectar' } },
        { notes: { contains: 'Interrumpida' } },
      ],
      scheduledAt: { lt: twentyMinsAgo },
    },
    data: {
      status: TaskStatus.EXPIRED,
      notes: 'Ventana de oportunidad cerrada (20 min expirados sin reconexión del nodo).',
    },
  })

  if (expired.count > 0) {
    const isSingle = expired.count === 1
    const taskText = isSingle ? 'tarea expiró' : 'tareas expiraron'
    const resultText = isSingle ? 'marcó como expirada' : 'marcaron como expiradas'

    Logger.warn(`Limpieza: ${expired.count} ${taskText} y se ${resultText}.`)
  }
}
