'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  IoWaterOutline,
  IoFlaskOutline,
  IoAddOutline,
  IoTrashOutline,
  IoPencilOutline,
} from 'react-icons/io5'
import { PiSprayBottle } from 'react-icons/pi'
import { MdDewPoint, MdOutlineHistoryToggleOff } from 'react-icons/md'
import clsx from 'clsx'

import { ScheduleFormModal } from './ScheduleFormModal'

import { getSchedules, toggleSchedule, deleteSchedule } from '@/actions/planner/schedule-actions'

const ACTION_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  IRRIGATION: {
    label: 'Riego',
    icon: <IoWaterOutline className="h-5 w-5" />,
    color: 'text-blue-500',
  },
  HUMIDIFICATION: {
    label: 'Nebulización',
    icon: <PiSprayBottle className="h-5 w-5" />,
    color: 'text-cyan-500',
  },
  SOIL_WETTING: {
    label: 'Humedecer Suelo',
    icon: <MdDewPoint className="h-5 w-5" />,
    color: 'text-emerald-500',
  },
  FERTIGATION: {
    label: 'Fertirriego',
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-purple-500',
  },
  FUMIGATION: {
    label: 'Fumigación',
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-orange-500',
  },
}

// Helper para convertir el formato Cron "0 16 * * *" a "16:00" y luego a AM/PM
function formatCronTime(cronStr: string): string {
  const parts = cronStr.split(' ')

  if (parts.length < 2) return '--:--'
  const minutes = parts[0].padStart(2, '0')
  const hours = parseInt(parts[1], 10)

  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12

  return `${hours12}:${minutes} ${ampm}`
}

interface AutomationSchedule {
  id: string
  name: string
  purpose: 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
  cronTrigger: string
  durationMinutes: number
  isEnabled: boolean
  zones: string[]
}

export function SchedulesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AutomationSchedule | null>(null)

  // SWR para cargar las rutinas vía Server Action envuelta en una Promise simple
  const fetcher = async () => {
    const res = await getSchedules()

    if (!res.success) throw new Error(res.error)

    return res.data
  }

  const { data: schedules = [], isLoading, mutate } = useSWR('schedules', fetcher)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic UI sería mejor, pero por simplicidad de API hacemos mutate luego
    await toggleSchedule(id, !currentStatus)
    mutate()
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta rutina diaria?')) {
      await deleteSchedule(id)
      mutate()
    }
  }

  const openEditModal = (schedule: AutomationSchedule) => {
    setEditingSchedule(schedule)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setEditingSchedule(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full justify-end">
        <button
          className="bg-action hover:bg-action/90 focus-visible:ring-accessibility flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          type="button"
          onClick={openNewModal}
        >
          <IoAddOutline className="h-5 w-5" /> Nueva Rutina
        </button>
      </div>

      {isLoading ? (
        <div className="border-input-outline flex h-48 flex-col items-center justify-center gap-4 rounded-xl border border-dashed">
          <div className="text-primary h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-primary animate-pulse text-sm font-medium">
            Cargando programas...
          </span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-10">
          <MdOutlineHistoryToggleOff className="text-secondary/30 mb-2 h-12 w-12" />
          <p className="text-primary font-medium">No hay rutinas programadas</p>
          <p className="text-secondary mt-1 text-sm">
            Crea tu primer programa de riego automatizado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule: AutomationSchedule) => {
            const action = ACTION_MAP[schedule.purpose] || ACTION_MAP.IRRIGATION

            return (
              <div
                key={schedule.id}
                className={clsx(
                  'bg-surface border-input-outline flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all',
                  !schedule.isEnabled && 'opacity-60',
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'bg-hover-overlay flex h-10 w-10 items-center justify-center rounded-full',
                        action.color,
                      )}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <h3
                        className="text-primary max-w-[140px] truncate text-sm font-semibold"
                        title={schedule.name}
                      >
                        {schedule.name}
                      </h3>
                      <p className="text-secondary text-xs">{action.label}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex cursor-pointer items-center">
                    <span className="sr-only">Activar/Desactivar {schedule.name}</span>
                    <input
                      checked={schedule.isEnabled}
                      className="peer sr-only"
                      type="checkbox"
                      onChange={() => handleToggle(schedule.id, schedule.isEnabled)}
                    />
                    <div className="peer peer-checked:bg-action h-5 w-9 rounded-full bg-black/20 peer-focus:outline-none after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-white/20" />
                  </label>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-primary text-lg font-bold">
                      {formatCronTime(schedule.cronTrigger)}
                    </span>
                    <span className="text-secondary text-xs font-medium">
                      Duración: {schedule.durationMinutes} min • {schedule.zones.join(', ')}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      className="text-secondary hover:text-action focus-visible:ring-accessibility flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/5"
                      title="Editar"
                      type="button"
                      onClick={() => openEditModal(schedule)}
                    >
                      <IoPencilOutline className="h-4 w-4" />
                    </button>
                    <button
                      className="text-secondary focus-visible:ring-accessibility flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/5 hover:text-red-500 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/5"
                      title="Eliminar"
                      type="button"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <IoTrashOutline className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Reutilizable */}
      <ScheduleFormModal
        initialData={editingSchedule}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
