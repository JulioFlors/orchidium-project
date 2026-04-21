'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  IoCloseOutline,
  IoWarningOutline,
  IoAddOutline,
  IoFlaskOutline,
  IoWaterOutline,
} from 'react-icons/io5'
import { MdDewPoint, MdOutlineHistoryToggleOff } from 'react-icons/md'
import { PiSprayBottle } from 'react-icons/pi'

import { DeferredTaskModal, QueueTaskCard, type PlannerFormInputs } from './components'

import { Modal, Button, Heading } from '@/components/ui'
import { useToast } from '@/hooks'
import { TaskPurpose, TaskPurposeLabels, ZoneType } from '@/config/mappings'
import { type GlowVariant } from '@/components/ui/status-circle/StatusCircleIcon'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()

  if (!Array.isArray(json)) throw new Error(json.error || 'Respuesta inesperada')

  return json
}

interface PendingTask {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  status: string
  isRoutine?: boolean
  routineName?: string
  notes?: string
  source?: string
}

const ACTION_MAP: Record<
  TaskPurpose,
  { label: string; icon: React.ReactNode; color: string; glowVariant: GlowVariant }
> = {
  IRRIGATION: {
    label: TaskPurposeLabels.IRRIGATION,
    icon: <IoWaterOutline />,
    color: 'text-blue-500',
    glowVariant: 'blue',
  },
  HUMIDIFICATION: {
    label: TaskPurposeLabels.HUMIDIFICATION,
    icon: <PiSprayBottle />,
    color: 'text-cyan-500',
    glowVariant: 'cyan',
  },
  SOIL_WETTING: {
    label: TaskPurposeLabels.SOIL_WETTING,
    icon: <MdDewPoint />,
    color: 'text-emerald-500',
    glowVariant: 'green',
  },
  FERTIGATION: {
    label: TaskPurposeLabels.FERTIGATION,
    icon: <IoFlaskOutline />,
    color: 'text-purple-500',
    glowVariant: 'violet',
  },
  FUMIGATION: {
    label: TaskPurposeLabels.FUMIGATION,
    icon: <IoFlaskOutline />,
    color: 'text-orange-500',
    glowVariant: 'orange',
  },
}

export function QueueView() {
  const [isDeferredModalOpen, setIsDeferredModalOpen] = useState(false)
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
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <div className="flex flex-col gap-6">
        <Heading
          action={
            <Button
              className="tds-sm:w-auto flex w-full items-center justify-center gap-2"
              onClick={() => setIsDeferredModalOpen(true)}
            >
              <IoAddOutline className="h-5 w-5" /> Nueva Tarea
            </Button>
          }
          description="Vista detallada de la línea de tiempo de tareas únicas bajo observación."
          title="Cola de Ejecución"
        />

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
              {tasks.map((task) => (
                <QueueTaskCard
                  key={task.id}
                  colorClassName={ACTION_MAP[task.purpose].color}
                  icon={ACTION_MAP[task.purpose].icon}
                  task={task}
                  onCancel={setCancelTarget}
                />
              ))}
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

          <div className="border-input-outline -mx-6 mt-2 -mb-6 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setCancelTarget(null)
                setCancelReason('')
              }}
            >
              Volver
            </Button>
            <Button
              disabled={!cancelReason.trim()}
              variant="destructive"
              onClick={handleCancelConfirm}
            >
              Cancelar Tarea
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
