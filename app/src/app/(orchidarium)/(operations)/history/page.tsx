'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoTimeOutline,
  IoHourglassOutline,
} from 'react-icons/io5'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'
import { LuRadioTower } from 'react-icons/lu'
import { HiOutlineCog } from 'react-icons/hi'

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

interface HistoryTask {
  id: string
  purpose: TaskPurpose
  zones: ZoneType[]
  duration: number
  scheduledAt: string
  executedAt: string | null
  status: TaskStatus
  notes: string | null
}

const ACTION_MAP: Record<TaskPurpose, string> = {
  IRRIGATION: 'Riego',
  HUMIDIFICATION: 'Nebulización',
  SOIL_WETTING: 'Humectación Suelo',
  FERTIGATION: 'Fertirriego',
  FUMIGATION: 'Fumigación',
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  PENDING: {
    label: 'Pendiente',
    icon: <IoTimeOutline className="h-4 w-4" />,
    className: 'text-secondary',
  },
  CONFIRMED: {
    label: 'Confirmada',
    icon: <LuRadioTower className="h-4 w-4" />,
    className: 'text-blue-500',
  },
  IN_PROGRESS: {
    label: 'Ejecutando',
    icon: <HiOutlineCog className="h-4 w-4 animate-spin" />,
    className: 'text-amber-500',
  },
  COMPLETED: {
    label: 'Completada',
    icon: <IoCheckmarkCircleOutline className="h-4 w-4" />,
    className: 'text-emerald-500',
  },
  FAILED: {
    label: 'Fallida',
    icon: <IoCloseCircleOutline className="h-4 w-4" />,
    className: 'text-red-500',
  },
  CANCELLED: {
    label: 'Cancelada',
    icon: <IoWarningOutline className="h-4 w-4" />,
    className: 'text-secondary',
  },
  SKIPPED: {
    label: 'Omitida',
    icon: <IoHourglassOutline className="h-4 w-4" />,
    className: 'text-secondary',
  },
  WAITING_CONFIRMATION: {
    label: 'Esperando',
    icon: <IoHourglassOutline className="h-4 w-4 animate-pulse" />,
    className: 'text-orange-500',
  },
}

export default function HistoryPage() {
  const { data: tasks = [], isLoading } = useSWR<HistoryTask[]>('/api/tasks/history', fetcher, {
    refreshInterval: 15000,
  })

  // Refresh adaptativo: si hay tareas activas, refrescar más rápido
  const hasActiveTasks = useMemo(
    () =>
      tasks.some((t) =>
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'WAITING_CONFIRMATION'].includes(t.status),
      ),
    [tasks],
  )

  // Re-fetch más agresivo si hay tareas activas
  useSWR<HistoryTask[]>(hasActiveTasks ? '/api/tasks/history' : null, fetcher, {
    refreshInterval: 5000,
  })

  return (
    <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 pb-12">
      {/* HEADER */}
      <div>
        <h1 className="text-primary text-2xl font-bold tracking-tight antialiased">
          Historial de Operaciones
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Registro auditable de todas las tareas del sistema de riego: manuales, diferidas y
          automatizadas.
        </p>
      </div>

      <div className="border-input-outline bg-surface overflow-hidden rounded-xl border shadow-sm">
        {isLoading && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl p-8">
            <div className="text-primary h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-primary animate-pulse text-sm font-medium tracking-wide">
              Cargando
            </span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <MdOutlineHistoryToggleOff className="text-secondary/30 mb-2 h-10 w-10" />
            <p className="text-secondary text-sm">
              El historial está vacío. Aún no se ha registrado ninguna tarea.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-hover-overlay text-secondary border-input-outline border-b text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Circuito Hidráulico</th>
                  <th className="px-6 py-4 font-semibold">Zonas</th>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Duración</th>
                  <th className="px-6 py-4 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-input-outline divide-y">
                {tasks.map((task) => {
                  const actionLabel = ACTION_MAP[task.purpose] || 'Desconocido'
                  const dateObj = new Date(task.scheduledAt)
                  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING

                  return (
                    <tr key={task.id} className="hover:bg-hover-overlay/50 transition-colors">
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center gap-1.5 font-medium ${statusConfig.className}`}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </td>
                      <td className="text-primary px-6 py-4 font-medium">{actionLabel}</td>
                      <td className="px-6 py-4">
                        <span className="text-secondary rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase dark:bg-white/10">
                          {task.zones.join(', ')}
                        </span>
                      </td>
                      <td className="text-secondary px-6 py-4 whitespace-nowrap">
                        {dateObj.toLocaleString('es-VE', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="text-secondary px-6 py-4">{task.duration} min</td>
                      <td className="text-secondary max-w-[200px] px-6 py-4 text-xs wrap-break-word whitespace-pre-wrap">
                        {task.notes || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
