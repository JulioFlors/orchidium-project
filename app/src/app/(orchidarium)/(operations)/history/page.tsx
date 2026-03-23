'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoTimeOutline,
  IoHourglassOutline,
  IoShieldCheckmarkOutline,
  IoRocketOutline,
} from 'react-icons/io5'
import { MdOutlineHistoryToggleOff, MdLayers } from 'react-icons/md'
import { LuRadioTower } from 'react-icons/lu'
import { HiOutlineCog } from 'react-icons/hi'

import { TaskTimelineModal } from '@/components/operations/TaskTimelineModal'
import { getTaskEvents } from '@/actions/control/control-actions'
import {
  TaskPurposeLabels,
  TaskSourceLabels,
  TaskStatusLabels,
  TaskStatusStyles,
} from '@/config/mappings'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()

  if (!Array.isArray(json)) throw new Error(json.error || 'Respuesta inesperada')

  return json
}

type TaskPurpose = 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
type ZoneType = 'ZONA_A' | 'ZONA_B' | 'ZONA_C' | 'ZONA_D'
type TaskStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'WAITING_CONFIRMATION'
  | 'AUTHORIZED'
  | 'DISPATCHED'
  | 'ACKNOWLEDGED'

type TaskSource = 'MANUAL' | 'DEFERRED' | 'ROUTINE'

interface HistoryTask {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  executedAt: string | null
  status: TaskStatus
  source: TaskSource
  notes: string | null
}

interface TaskEvent {
  id: string
  status: string
  timestamp: string | Date
  notes: string | null
}

// Iconos de estado — se mantienen aquí por ser JSX (no pueden ir en mappings.ts que es server-friendly)
const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <IoTimeOutline />,
  AUTHORIZED: <IoShieldCheckmarkOutline />,
  DISPATCHED: <IoRocketOutline />,
  ACKNOWLEDGED: <LuRadioTower />,
  CONFIRMED: <LuRadioTower />,
  IN_PROGRESS: <HiOutlineCog />,
  COMPLETED: <IoCheckmarkCircleOutline />,
  FAILED: <IoCloseCircleOutline />,
  EXPIRED: <IoCloseCircleOutline />,
  CANCELLED: <IoWarningOutline />,
  SKIPPED: <IoHourglassOutline />,
  WAITING_CONFIRMATION: <IoHourglassOutline className="animate-pulse" />,
}

function HistoryTaskCard({
  task,
  onClick,
}: {
  task: HistoryTask
  onClick: (task: HistoryTask) => void
}) {
  const actionLabel = TaskPurposeLabels[task.purpose] || 'Desconocido'
  const dateObj = new Date(task.scheduledAt)
  const statusLabel = TaskStatusLabels[task.status] || task.status
  const statusStyle = TaskStatusStyles[task.status] || 'text-secondary'
  const sourceLabel = TaskSourceLabels[task.source] || task.source

  return (
    <motion.div
      className="bg-surface border-input-outline group hover:bg-hover-overlay relative flex cursor-pointer flex-col justify-between gap-4 rounded-xl border p-4 shadow-sm transition-all sm:flex-row sm:items-center"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(task)}
    >
      {/* Left: Icon + Main Info */}
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            'bg-canvas border-input-outline flex h-12 w-12 items-center justify-center rounded-full border text-2xl shadow-sm',
            statusStyle,
          )}
        >
          {STATUS_ICONS[task.status]}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-primary text-sm leading-tight font-bold">{actionLabel}</h3>
            <span
              className={clsx(
                'rounded-full bg-current/10 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                statusStyle,
              )}
            >
              {statusLabel}
            </span>
          </div>
          <div className="text-label mt-1 flex items-center gap-2 text-[11px] font-medium opacity-80">
            <span>{sourceLabel}</span>
            <span>•</span>
            <span className="font-mono opacity-60">#{task.id.slice(0, 6)}</span>
          </div>
        </div>
      </div>

      {/* Middle: Metadata Labels (Zonas, Duración) */}
      <div className="flex flex-wrap items-center gap-3 sm:flex-1 sm:justify-center">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <MdLayers className="text-label h-3.5 w-3.5 shrink-0" />
          <span className="text-primary truncate font-mono text-xs font-bold tracking-tight uppercase">
            {task.zones.join(', ')}
          </span>
        </div>
        <div className="text-label hidden h-1 w-1 rounded-full bg-current opacity-20 sm:block" />
        <div className="flex items-center gap-1.5">
          <IoTimeOutline className="text-label h-3.5 w-3.5" />
          <span className="text-primary font-mono text-xs font-bold tracking-tight uppercase">
            {task.duration} min
          </span>
        </div>
      </div>

      {/* Right: Date & Time */}
      <div className="border-input-outline flex shrink-0 flex-col items-end border-t pt-3 sm:border-t-0 sm:pt-0">
        <span className="text-primary font-mono text-xs font-bold tracking-tight uppercase">
          {dateObj.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
        </span>
        <span className="text-label mt-0.5 font-mono text-[10px] font-bold opacity-60">
          {dateObj.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </span>
      </div>

      {/* Notes Truncadas */}
      {task.notes && (
        <div className="max-w-xs transition-opacity sm:absolute sm:bottom-1 sm:left-20 sm:opacity-0 sm:group-hover:opacity-100">
          <p className="text-label truncate text-[10px] italic">Nota: {task.notes}</p>
        </div>
      )}
    </motion.div>
  )
}

export default function HistoryPage() {
  const [selectedTask, setSelectedTask] = useState<HistoryTask | null>(null)

  // 1. Evitar polling innecesario de eventos si la tarea ya terminó o falló definitivamente
  const isModalTerminal = useMemo(() => {
    if (!selectedTask) return false

    return ['COMPLETED', 'CANCELLED', 'SKIPPED', 'EXPIRED'].includes(selectedTask.status)
  }, [selectedTask])

  const { data: timelineEvents = [], isLoading: isTimelineLoading } = useSWR<TaskEvent[]>(
    selectedTask ? ['task-events', selectedTask.id] : null,
    async ([, id]: [string, string]) => {
      const res = await getTaskEvents(id)

      return res.data || []
    },
    { refreshInterval: isModalTerminal ? 0 : 5000 },
  )

  // 2. Refresh de la tabla global relajado (60s) por defecto para optimizar peticiones a la Base de Datos
  const { data: tasks = [], isLoading } = useSWR<HistoryTask[]>('/api/tasks/history', fetcher, {
    refreshInterval: 60000,
  })

  // 3. Refresh adaptativo: si hay tareas activas, refrescamos más rápido (5s) para dar feedback real-time
  const hasActiveTasks = useMemo(
    () =>
      tasks.some((t) =>
        [
          'PENDING',
          'CONFIRMED',
          'IN_PROGRESS',
          'WAITING_CONFIRMATION',
          'DISPATCHED',
          'ACKNOWLEDGED',
        ].includes(t.status),
      ),
    [tasks],
  )

  useSWR<HistoryTask[]>(hasActiveTasks ? '/api/tasks/history' : null, fetcher, {
    refreshInterval: 5000,
  })

  return (
    <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 pb-12">
      {/* HEADER */}
      <div>
        <h1 className="text-primary flex items-center gap-2 text-2xl font-bold tracking-tight antialiased">
          Historial de Operaciones
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Registro auditable de todas las tareas del sistema de riego: manuales, diferidas y
          automatizadas.
        </p>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="text-primary h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-secondary animate-pulse text-sm font-medium tracking-wide">
            Sincronizando bitácora
          </span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-surface border-input-outline flex flex-col items-center justify-center rounded-2xl border p-16 shadow-sm">
          <MdOutlineHistoryToggleOff className="text-secondary/20 mb-3 h-16 w-16" />
          <p className="text-secondary text-base font-medium">El historial está vacío</p>
          <p className="text-secondary mt-1 text-sm opacity-60">
            Aún no se ha registrado ninguna operación.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <HistoryTaskCard key={task.id} task={task} onClick={(t) => setSelectedTask(t)} />
          ))}
        </div>
      )}

      <TaskTimelineModal
        events={timelineEvents}
        isLoading={isTimelineLoading}
        isOpen={!!selectedTask}
        taskName={
          selectedTask
            ? `${TaskPurposeLabels[selectedTask.purpose]} - ${selectedTask.id.slice(0, 8)}`
            : ''
        }
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
}
