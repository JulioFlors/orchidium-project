'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'
import { TaskPurpose, TaskStatus, TaskSource, ZoneType } from '@package/database/enums'

import { TaskTimelineModal, HistoryTaskCard } from './components'

import { getTaskEvents } from '@/actions/operations/control-actions'
import { TaskPurposeLabels } from '@/config/mappings'
import { Heading } from '@/components'

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

export function HistoryView() {
  const [selectedTask, setSelectedTask] = useState<HistoryTask | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  const PAGE_SIZE = 20

  const getKey = (pageIndex: number, previousPageData: HistoryTask[]) => {
    if (previousPageData && !previousPageData.length) return null

    return `/api/tasks/history?limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`
  }

  const {
    data: pages,
    setSize,
    mutate,
    isLoading,
    isValidating,
  } = useSWRInfinite<HistoryTask[]>(getKey, fetcher, {
    revalidateFirstPage: true,
    persistSize: true,
  })

  const tasks = useMemo(() => {
    if (!pages) return []
    const flatTasks = pages.flat()
    // Deduplicar por ID para evitar errores de React keys cuando hay "offset shift"
    const uniqueMap = new Map<string, HistoryTask>()

    flatTasks.forEach((t) => uniqueMap.set(t.id, t))

    return Array.from(uniqueMap.values())
  }, [pages])

  const isEmpty = pages?.[0]?.length === 0
  const isReachingEnd = isEmpty || (pages && pages[pages.length - 1]?.length < PAGE_SIZE)

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

  const isModalTerminal = useMemo(() => {
    if (!selectedTask) return false

    return ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(selectedTask.status)
  }, [selectedTask])

  const { data: timelineEvents = [], isLoading: isTimelineLoading } = useSWR<TaskEvent[]>(
    selectedTask ? ['task-events', selectedTask.id] : null,
    async ([, id]: [string, string]) => {
      const res = await getTaskEvents(id)

      return res.data || []
    },
    { refreshInterval: isModalTerminal ? 0 : 5000 },
  )

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

  useSWR(getKey(0, []), fetcher, {
    refreshInterval: hasActiveTasks ? 10000 : 60000,
    onSuccess: (newData) => {
      if (pages) {
        const newPages = [...pages]

        newPages[0] = newData
        mutate(newPages, { revalidate: false })
      }
    },
  })

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description="Registro auditable de todas las tareas del sistema de riego: manuales, diferidas y automatizadas."
        title="Historial de Operaciones"
      />

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
              <HistoryTaskCard
                key={task.id}
                task={task}
                onClickAction={(t) => setSelectedTask(t)}
              />
            ))}
          </div>

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
        scheduledAt={selectedTask?.scheduledAt}
        taskName={
          selectedTask
            ? `${TaskPurposeLabels[selectedTask.purpose]} #${selectedTask.id.substring(0, 8)}`
            : ''
        }
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
}
