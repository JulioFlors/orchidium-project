'use client'

import { useState, useEffect, cloneElement, isValidElement } from 'react'
import clsx from 'clsx'
import useSWR from 'swr'
import { IoWaterOutline, IoFlaskOutline, IoCloseOutline, IoWarningOutline } from 'react-icons/io5'
import { PiSprayBottle } from 'react-icons/pi'
import { MdDewPoint, MdOutlineHistoryToggleOff } from 'react-icons/md'

import { DeferredTaskModal, TaskStatusBadge, type PlannerFormInputs } from './components'

import { Modal, Badge, ActionMenu } from '@/components/ui'
import { useToast } from '@/hooks'
import { TaskPurposeLabels } from '@/config/mappings'
import { formatTime12h } from '@/utils'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()

  if (!Array.isArray(json)) throw new Error(json.error || 'Respuesta inesperada')

  return json
}

type TaskPurpose = 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
type ZoneType = 'ZONA_A' | 'ZONA_B' | 'ZONA_C' | 'ZONA_D'

interface PendingTask {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  status: string
  isRoutine?: boolean
  routineName?: string
}

const ACTION_MAP: Record<
  TaskPurpose,
  { label: string; icon: React.ReactNode; color: string; hex: string }
> = {
  IRRIGATION: {
    label: TaskPurposeLabels.IRRIGATION,
    icon: <IoWaterOutline className="h-5 w-5" />,
    color: 'text-blue-500',
    hex: '#3b82f6',
  },
  HUMIDIFICATION: {
    label: TaskPurposeLabels.HUMIDIFICATION,
    icon: <PiSprayBottle className="h-5 w-5" />,
    color: 'text-cyan-500',
    hex: '#22d3ee',
  },
  SOIL_WETTING: {
    label: TaskPurposeLabels.SOIL_WETTING,
    icon: <MdDewPoint className="h-5 w-5" />,
    color: 'text-emerald-500',
    hex: '#10b981',
  },
  FERTIGATION: {
    label: TaskPurposeLabels.FERTIGATION,
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-purple-500',
    hex: '#a855f7',
  },
  FUMIGATION: {
    label: TaskPurposeLabels.FUMIGATION,
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-orange-500',
    hex: '#f97316',
  },
}

export function QueueView() {
  const [isDeferredModalOpen, setIsDeferredModalOpen] = useState(false)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const { success, error } = useToast()

  const {
    data: tasks = [],
    isLoading,
    error: loadError,
    mutate,
  } = useSWR<PendingTask[]>('/api/planner/queue', fetcher, {
    refreshInterval: 5000,
  })

  // Sincronizar errores de carga con Toasts
  useEffect(() => {
    if (loadError) {
      error(`Error cargando la cola: ${loadError.message}`)
    }
  }, [loadError, error])

  const onSubmit = async (data: PlannerFormInputs) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: data.purpose,
          zones: [data.zone],
          durationMinutes: data.duration,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
          notes: data.notes || undefined,
        }),
      })

      if (res.ok) {
        success('Tarea agendada correctamente')

        mutate()
      } else {
        const errorData = await res.json().catch(() => ({}))

        error(errorData.error || 'Error al agendar la tarea')
      }
    } catch {
      error('Error de red al intentar agendar la tarea')
    }
  }

  const [cancelTarget, setCancelTarget] = useState<{
    id: string
    label: string
    isRoutine?: boolean
    scheduledAt?: string
  } | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !cancelReason.trim()) return

    try {
      const res = await fetch(`/api/tasks/${cancelTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason.trim(),
          scheduledAt: cancelTarget.scheduledAt,
        }),
      })

      if (res.ok) {
        success('Tarea cancelada correctamente')

        mutate()
      } else {
        const errorData = await res.json().catch(() => ({}))

        error(errorData.error || 'Error al cancelar la tarea')
      }
    } catch (err) {
      error(
        'Error de red al intentar cancelar la tarea: ' +
          (err instanceof Error ? err.message : 'Error desconocido'),
      )
    } finally {
      setCancelTarget(null)
      setCancelReason('')
    }
  }

  return (
    <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 pb-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-primary text-2xl font-bold tracking-tight antialiased">
              Cola de Ejecución
            </h1>
            <p className="text-secondary mt-1 text-sm">
              Vista detallada de la línea de tiempo de tareas únicas bajo observación.
            </p>
          </div>
          <div className="w-full shrink-0 sm:w-auto">
            <button
              className="bg-action hover:bg-action/90 focus-visible:ring-accessibility flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto sm:py-2"
              type="button"
              onClick={() => setIsDeferredModalOpen(true)}
            >
              <MdOutlineHistoryToggleOff className="h-5 w-5" /> Nueva Tarea Diferida
            </button>
          </div>
        </div>

        <DeferredTaskModal
          isOpen={isDeferredModalOpen}
          onClose={() => setIsDeferredModalOpen(false)}
          onSubmitSuccess={onSubmit}
        />

        <div className="flex w-full flex-col gap-4">
          {isLoading && tasks.length === 0 ? (
            <div className="border-input-outline flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8">
              <div className="text-primary h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-primary animate-pulse text-sm font-medium tracking-wide">
                Cargando tareas
              </span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-8">
              <MdOutlineHistoryToggleOff className="text-secondary/30 mb-2 h-10 w-10" />
              <p className="text-secondary text-sm">No hay tareas programadas para el futuro.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((task) => {
                const dateObj = new Date(task.scheduledAt)
                const isPast = dateObj < new Date()
                const isCancellable = task.status === 'PENDING'
                const isHovered = hoveredCardId === task.id
                const action = ACTION_MAP[task.purpose]

                return (
                  <div
                    key={task.id}
                    className={clsx(
                      'relative flex flex-col justify-between gap-4 rounded-xl border p-4 shadow-sm transition-all sm:flex-row sm:items-center',
                      'bg-surface border-input-outline cursor-default',
                      isHovered && 'bg-hover-overlay border-primary/20',
                      task.status === 'IN_PROGRESS' && 'border-amber-500/30 bg-amber-500/5',
                      task.status === 'CONFIRMED' && 'border-blue-500/30 bg-blue-500/5',
                      task.status === 'PENDING' && isPast && 'border-yellow-500/20 bg-yellow-500/5',
                    )}
                    onBlur={() => setHoveredCardId(null)}
                    onFocus={() => setHoveredCardId(task.id)}
                    onMouseEnter={() => setHoveredCardId(task.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={clsx(
                          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
                          isHovered && 'border',
                        )}
                        style={{
                          borderColor: action.hex,
                          background: isHovered
                            ? `radial-gradient(circle at center, ${action.hex}44 0%, ${action.hex}15 100%)`
                            : `radial-gradient(circle at center, ${action.hex}25 0%, transparent 70%)`,
                        }}
                      >
                        {isValidElement(action.icon)
                          ? cloneElement(
                              action.icon as React.ReactElement<{ style?: React.CSSProperties }>,
                              {
                                style: {
                                  color: isHovered ? 'var(--color-text-primary)' : action.hex,
                                },
                              },
                            )
                          : action.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-primary flex items-center gap-2 text-sm font-medium">
                          {action.label}
                          <Badge className="border-none bg-black/5 dark:bg-white/10" size="sm">
                            {task.zones.join(', ')}
                          </Badge>
                          <TaskStatusBadge isPast={isPast} status={task.status} />
                        </span>
                        <div className="text-secondary mt-1 flex items-center gap-2 text-xs">
                          <span>Duración: {task.duration} min</span>
                          <span>•</span>
                          <span>
                            {dateObj.toLocaleDateString('es-VE', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            , {formatTime12h(dateObj)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4 sm:ml-0">
                      {task.isRoutine && (
                        <div className="text-secondary flex items-center gap-2 rounded-md bg-black/5 px-3 py-1.5 text-xs font-semibold dark:bg-white/5">
                          <MdOutlineHistoryToggleOff className="h-4 w-4" />
                          {task.routineName}
                        </div>
                      )}

                      {isCancellable && (
                        <ActionMenu
                          items={[
                            {
                              label: 'Cancelar tarea',
                              icon: <IoCloseOutline className="text-red-500" />,
                              onClick: () =>
                                setCancelTarget({
                                  id: task.id,
                                  label: action.label,
                                  isRoutine: task.isRoutine,
                                  scheduledAt: task.scheduledAt,
                                }),
                              variant: 'danger',
                            },
                          ]}
                          triggerClassName={clsx(
                            'transition-opacity duration-200',
                            isHovered ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        icon={
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <IoCloseOutline className="text-lg text-red-500" />
          </div>
        }
        isOpen={!!cancelTarget}
        size="sm"
        title="Cancelar Tarea"
        onClose={() => {
          setCancelTarget(null)
          setCancelReason('')
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-secondary text-sm">
            Estás a punto de cancelar la tarea de{' '}
            <span className="text-primary font-semibold">{cancelTarget?.label}</span>.
            {cancelTarget?.isRoutine && (
              <span className="mt-1 block text-xs text-orange-500 italic">
                Esta tarea fue generada automáticamente por una rutina programada.
              </span>
            )}
          </p>

          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-red-500">
              <IoWarningOutline className="h-4 w-4 shrink-0" />
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-secondary text-sm font-medium" htmlFor="cancel-reason">
              Motivo de cancelación
            </label>
            <textarea
              className="focus-input border-input-outline w-full resize-none border text-sm"
              id="cancel-reason"
              placeholder="Ej: Cambio de prioridades, clima adverso..."
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="focus-visible:ring-accessibility rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/5"
              type="button"
              onClick={() => {
                setCancelTarget(null)
                setCancelReason('')
              }}
            >
              Volver
            </button>
            <button
              className="focus-visible:ring-accessibility rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!cancelReason.trim()}
              type="button"
              onClick={handleCancelConfirm}
            >
              Cancelar Tarea
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
