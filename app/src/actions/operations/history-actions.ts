'use server'

import { prisma, TaskStatus } from '@package/database'

import { Logger } from '@/lib'

export async function getHistoryTasks(limit = 20, offset = 0) {
  try {
    const tasks = await prisma.taskLog.findMany({
      where: {
        status: {
          in: [
            TaskStatus.PENDING,
            TaskStatus.CONFIRMED,
            TaskStatus.IN_PROGRESS,
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.EXPIRED,
            TaskStatus.CANCELLED,
            TaskStatus.DISPATCHED,
            TaskStatus.ACKNOWLEDGED,
            TaskStatus.WAITING_CONFIRMATION,
          ],
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Serialización manual de fechas para compatibilidad con JSON/SWR
    const data = tasks.map((task) => {
      const { ...rest } = task

      return {
        ...rest,
        notes: task.notes,
        status: task.status,
        scheduledAt: task.scheduledAt.toISOString(),
        executedAt: task.executedAt ? task.executedAt.toISOString() : null,
      }
    })

    return {
      success: true,
      data,
    }
  } catch (error) {
    Logger.error('Error fetching history tasks (server action):', error)

    return {
      success: false,
      error: 'Error al obtener el historial de tareas. Verifique la conexión con la base de datos.',
    }
  }
}
