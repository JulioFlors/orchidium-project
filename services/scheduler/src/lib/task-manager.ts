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
    executeSequence(taskLog.purpose, taskLog.duration, taskLog.id)

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
    Logger.warn(
      `Detectadas ${interrupted.length} tareas interrumpidas. Marcándolas como fallidas para reintento.`,
    )
    for (const task of interrupted) {
      await recordTaskEvent(task.id, TaskStatus.FAILED, 'Scheduler restart during execution')
    }
  }
}
