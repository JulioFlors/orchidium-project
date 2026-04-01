'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
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
  IoCalendarOutline,
} from 'react-icons/io5'
import { RxStopwatch } from 'react-icons/rx'
import { MdOutlineHistoryToggleOff, MdLayers } from 'react-icons/md'
import { LuRadioTower } from 'react-icons/lu'
import { HiOutlineCog } from 'react-icons/hi'
import { TaskPurpose, TaskStatus, TaskSource, ZoneType } from '@package/database/enums'

import { Badge } from '@/components'
import { TaskTimelineModal } from '@/components/operations/TaskTimelineModal'
import { getTaskEvents } from '@/actions/control/control-actions'
import {
  TaskPurposeLabels,
  TaskSourceLabels,
  TaskStatusLabels,
  TaskStatusStyles,
  ZoneTypeLabels,
} from '@/config/mappings'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()

  if (!Array.isArray(json)) throw new Error(json.error || 'Respuesta inesperada')

  return json
}

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
  const statusLabel = TaskStatusLabels[task.status] || task.status
  const statusStyle = TaskStatusStyles[task.status] || 'text-secondary'
  const sourceLabel = TaskSourceLabels[task.source] || task.source

  return (
    <motion.div
      className="tds-sm:items-center tds-sm:gap-6 tds-sm:px-6 bg-surface border-input-outline group hover:bg-hover-overlay relative flex cursor-pointer flex-row gap-4 rounded-xl border p-4 shadow-sm transition-all"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(task)}
    >
      {/* Col 1: Icon (Siempre a la izquierda) */}
      <div
        className={clsx(
          'bg-canvas border-input-outline flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-2xl shadow-sm',
          statusStyle,
        )}
      >
        {STATUS_ICONS[task.status]}
      </div>

      {/* Main Content Area: Split en Dos Columnas Maestras */}
      <div className="tds-sm:grid tds-sm:grid-cols-[1fr_auto] tds-sm:items-center tds-sm:gap-x-6 flex flex-1 flex-col gap-4">
        {/* Columna Izquierda: Información de Identidad */}
        <div className="flex flex-col text-left">
          <div className="flex flex-row flex-nowrap items-center gap-2">
            <h3 className="tds-sm:whitespace-nowrap text-primary text-sm leading-tight font-bold whitespace-nowrap">
              {actionLabel}
            </h3>
            <Badge className={clsx('shrink-0', statusStyle)} size="sm" variant="status">
              {statusLabel}
            </Badge>
          </div>
          <div className="text-secondary mt-1 flex items-center gap-2 text-[11px] font-medium opacity-60">
            <span>{sourceLabel}</span>
            <span className="font-mono">#{task.id}</span>
          </div>
        </div>

        {/* Columna Derecha: Metadatos Técnicos (Colapso por Container Query) */}
        <div className="tds-sm:items-end tds-sm:border-0 tds-sm:pt-0 flex flex-col gap-2 border-t border-dashed border-white/5 pt-3">
          {/* Bloque Superior/Horizontal: Datos de Ejecución */}
          <div className="tds-sm:justify-end flex flex-row flex-wrap items-center gap-x-6 gap-y-2">
            {/* Bloque A: Zonas y Duración */}
            <div className="flex shrink-0 items-center gap-4 whitespace-nowrap">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <MdLayers className="text-secondary h-3.5 w-3.5 shrink-0 opacity-30" />
                <span className="text-primary font-mono text-[11px] font-bold tracking-tight uppercase">
                  {task.zones.map((z) => ZoneTypeLabels[z] || z).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <RxStopwatch className="text-secondary h-3.5 w-3.5 opacity-30" />
                <span className="text-primary font-mono text-[11px] font-bold tracking-tight uppercase">
                  {task.duration} min
                </span>
              </div>
            </div>

            {/* Bloque B: Cronograma (Fecha y Hora) */}
            <div className="flex shrink-0 items-center gap-4 whitespace-nowrap">
              {/* Fecha */}
              <div className="text-primary flex items-center gap-1.5">
                <IoCalendarOutline className="h-3.5 w-3.5 opacity-40" />
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap uppercase">
                  {new Date(task.scheduledAt).toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>

              {/* Hora de Inicio */}
              <div className="text-primary flex items-center gap-1.5 font-mono text-xs font-bold tracking-tighter whitespace-nowrap">
                <IoTimeOutline className="h-3.5 w-3.5 opacity-40" />
                <span className={clsx(!task.executedAt && 'opacity-30')}>
                  {new Date(task.executedAt || task.scheduledAt).toLocaleTimeString('es-VE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes (Sincronizadas verticalmente, solo visibles en Mobile) */}
          {task.notes && (
            <div className="tds-sm:hidden mt-1 border-t border-dashed border-white/5 pt-2">
              <p className="text-secondary text-[10px] leading-relaxed italic opacity-60">
                {task.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function HistoryPage() {
  const [selectedTask, setSelectedTask] = useState<HistoryTask | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  // 1. Configuración de SWRInfinite
  const PAGE_SIZE = 20

  const getKey = (pageIndex: number, previousPageData: HistoryTask[]) => {
    if (previousPageData && !previousPageData.length) return null // reached the end

    return `/api/tasks/history?limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`
  }

  const {
    data: pages,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite<HistoryTask[]>(getKey, fetcher, {
    revalidateFirstPage: true,
    persistSize: true,
  })

  const tasks = useMemo(() => (pages ? pages.flat() : []), [pages])

  const isEmpty = pages?.[0]?.length === 0
  const isReachingEnd = isEmpty || (pages && pages[pages.length - 1]?.length < PAGE_SIZE)

  // 2. Intersection Observer para Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoading && !isValidating) {
          setSize((prev) => prev + 1)
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [isReachingEnd, isLoading, isValidating, setSize])

  // 3. Evitar polling innecesario de eventos si la tarea ya terminó o falló definitivamente
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

  // 4. Refresh adaptativo para la primera página si hay tareas activas
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

  // 4. Refresh adaptativo para la primera página
  // Mantener refresco constante: 10s si hay actividad, 60s en reposo (evita UI estática)
  useSWR(getKey(0, []), fetcher, {
    refreshInterval: hasActiveTasks ? 10000 : 60000,
    onSuccess: (newData) => {
      // Actualizar la primera página de Infinite SWR
      if (pages) {
        const newPages = [...pages]

        newPages[0] = newData
        // SWRInfinite se actualizará si detecta cambios mutados
      }
    },
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
      ) : isEmpty ? (
        <div className="bg-surface border-input-outline flex flex-col items-center justify-center rounded-2xl border p-16 shadow-sm">
          <MdOutlineHistoryToggleOff className="text-secondary/20 mb-3 h-16 w-16" />
          <p className="text-secondary text-base font-medium">El historial está vacío</p>
          <p className="text-secondary mt-1 text-sm opacity-60">
            Aún no se ha registrado ninguna operación.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <HistoryTaskCard key={task.id} task={task} onClick={(t) => setSelectedTask(t)} />
            ))}
          </div>

          {/* Trigger para Infinite Scroll */}
          <div ref={observerRef} className="flex justify-center py-8">
            {!isReachingEnd ? (
              <div className="flex items-center gap-2">
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                <span className="text-secondary text-xs">Cargando</span>
              </div>
            ) : (
              <span className="text-secondary font-mono text-[10px] font-bold tracking-widest uppercase opacity-40">
                Fin del historial
              </span>
            )}
          </div>
        </>
      )}

      <TaskTimelineModal
        events={timelineEvents}
        isLoading={isTimelineLoading}
        isOpen={!!selectedTask}
        taskName={
          selectedTask ? `${TaskPurposeLabels[selectedTask.purpose]} #${selectedTask.id}` : ''
        }
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
}
