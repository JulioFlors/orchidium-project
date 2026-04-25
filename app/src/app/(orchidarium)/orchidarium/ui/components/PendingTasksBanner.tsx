'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { IoFlask, IoCheckmarkCircle, IoCloseCircle, IoCalendarOutline } from 'react-icons/io5'

import {
  confirmAgrochemicalTask,
  getPendingConfirmationTasks,
  skipAgrochemicalTask,
} from '@/actions/tasks/task-confirmation-actions'

interface PendingTask {
  id: string
  purpose: string
  scheduledAt: Date
  duration: number
  zones: string[]
  agrochemicalName: string | null
  agrochemicalType: string | null
  scheduleName: string | null
}

const PURPOSE_LABELS: Record<string, string> = {
  FERTIGATION: 'Fertirriego',
  FUMIGATION: 'Fumigación',
}

/**
 * Banner global que aparece cuando hay tareas de agroquímicos esperando
 * confirmación del usuario (estado WAITING_CONFIRMATION).
 * Se renderiza en el layout del orquideario para ser visible en cualquier ruta.
 */
export function PendingTasksBanner() {
  const [tasks, setTasks] = useState<PendingTask[]>([])
  const [isPending, startTransition] = useTransition()

  const fetchTasks = useCallback(() => {
    startTransition(async () => {
      const result = await getPendingConfirmationTasks()

      if (result.success && result.data.length > 0) {
        setTasks(result.data)
      } else {
        setTasks([])
      }
    })
  }, [])

  // Polling cada 30 segundos + carga inicial
  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 30_000)

    return () => clearInterval(interval)
  }, [fetchTasks])

  const handleConfirm = async (taskId: string) => {
    startTransition(async () => {
      const result = await confirmAgrochemicalTask(taskId)

      if (result.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
      }
    })
  }

  const handleSkip = async (taskId: string) => {
    startTransition(async () => {
      const result = await skipAgrochemicalTask(taskId)

      if (result.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
      }
    })
  }

  if (tasks.length === 0) return null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 pt-2">
      {tasks.map((task) => {
        const scheduledTime = new Date(task.scheduledAt).toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Caracas',
        })

        const purposeLabel = PURPOSE_LABELS[task.purpose] || task.purpose

        return (
          <div
            key={task.id}
            className="animate-in slide-in-from-top flex flex-col gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/20">
                <IoFlask className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-yellow-300">
                  {purposeLabel} programado para las {scheduledTime}
                </span>
                <span className="text-xs text-yellow-200/70">
                  {task.agrochemicalName && (
                    <span className="font-semibold">{task.agrochemicalName} · </span>
                  )}
                  {task.scheduleName && <span>Rutina: {task.scheduleName} · </span>}
                  {task.duration} min · {task.zones.join(', ')}
                </span>
                <span className="mt-1 text-xs font-medium text-yellow-200/50">
                  ¿Está preparado el tanque auxiliar con el producto correspondiente?
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                className="flex items-center gap-1.5 rounded-lg border border-green-500/40 bg-green-500/20 px-4 py-2 text-xs font-bold text-green-300 transition-colors hover:bg-green-500/30 disabled:opacity-50"
                disabled={isPending}
                type="button"
                onClick={() => handleConfirm(task.id)}
              >
                <IoCheckmarkCircle className="h-4 w-4" />
                Confirmar Preparación
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                disabled={isPending}
                type="button"
                onClick={() => handleSkip(task.id)}
              >
                <IoCloseCircle className="h-4 w-4" />
                Omitir
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                disabled={isPending}
                type="button"
                onClick={async () => {
                  const newDate = new Date(new Date(task.scheduledAt).getTime() + 48 * 60 * 60000)
                  const { rescheduleAgrochemicalTask } =
                    await import('@/actions/tasks/task-confirmation-actions')

                  startTransition(async () => {
                    const result = await rescheduleAgrochemicalTask(task.id, newDate)

                    if (result.success) {
                      setTasks((prev) => prev.filter((t) => t.id !== task.id))
                    }
                  })
                }}
              >
                <IoCalendarOutline className="h-4 w-4" />
                +48h
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
