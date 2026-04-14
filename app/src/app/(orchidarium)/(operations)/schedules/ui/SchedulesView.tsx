'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { IoWaterOutline, IoFlaskOutline, IoAddOutline } from 'react-icons/io5'
import { PiSprayBottle } from 'react-icons/pi'
import { MdDewPoint, MdOutlineHistoryToggleOff } from 'react-icons/md'

import { ScheduleFormModal, ScheduleCard } from './components'

import { useToast } from '@/hooks'
import { getSchedules, toggleSchedule, deleteSchedule } from '@/actions/planner/schedule-actions'
import { TaskPurposeLabels } from '@/config/mappings'
import { Button } from '@/components'

const ACTION_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  IRRIGATION: {
    label: TaskPurposeLabels.IRRIGATION,
    icon: <IoWaterOutline className="h-5 w-5" />,
    color: 'text-blue-500',
  },
  HUMIDIFICATION: {
    label: TaskPurposeLabels.HUMIDIFICATION,
    icon: <PiSprayBottle className="h-5 w-5" />,
    color: 'text-cyan-500',
  },
  SOIL_WETTING: {
    label: TaskPurposeLabels.SOIL_WETTING,
    icon: <MdDewPoint className="h-5 w-5" />,
    color: 'text-emerald-500',
  },
  FERTIGATION: {
    label: TaskPurposeLabels.FERTIGATION,
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-purple-500',
  },
  FUMIGATION: {
    label: TaskPurposeLabels.FUMIGATION,
    icon: <IoFlaskOutline className="h-5 w-5" />,
    color: 'text-orange-500',
  },
}

interface AutomationSchedule {
  id: string
  name: string
  purpose: 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'
  cronTrigger: string
  durationMinutes: number
  isEnabled: boolean
  zones: string[]
  fertilizationProgramId?: string | null
  phytosanitaryProgramId?: string | null
}

export function SchedulesView() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AutomationSchedule | null>(null)
  const { success, error } = useToast()

  // SWR para cargar las rutinas vía Server Action envuelta en una Promise simple
  const fetcher = async () => {
    const res = await getSchedules()

    if (!res.success) throw new Error(res.error)

    return res.data
  }

  const { data: schedules = [], isLoading, mutate } = useSWR('schedules', fetcher)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleSchedule(id, !currentStatus)

      if (res.success) {
        success('Estado de rutina actualizado')

        mutate()
      } else {
        error(res.error || 'No se pudo actualizar la rutina')
      }
    } catch (err) {
      error(
        'Error al conectar con el servidor: ' +
          (err instanceof Error ? err.message : 'Error desconocido'),
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta rutina diaria?')) {
      try {
        const res = await deleteSchedule(id)

        if (res.success) {
          success('Rutina eliminada correctamente')

          mutate()
        } else {
          error(res.error || 'No se pudo eliminar la rutina')
        }
      } catch (err) {
        error(
          'Error al intentar eliminar la rutina: ' +
            (err instanceof Error ? err.message : 'Error desconocido'),
        )
      }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold tracking-tight antialiased">
            Programas Automáticos
          </h1>
          <p className="text-secondary mt-1 text-sm">
            Configura y ajusta las pautas diarias recurrentes de irrigación automatizada.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <Button
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
            onClick={openNewModal}
          >
            <IoAddOutline className="h-5 w-5" /> Nueva Rutina
          </Button>
        </div>
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
              <ScheduleCard
                key={schedule.id}
                colorClassName={action.color}
                icon={action.icon}
                schedule={schedule}
                onDelete={handleDelete}
                onEdit={openEditModal}
                onToggle={handleToggle}
              />
            )
          })}
        </div>
      )}

      {/* Modal Reutilizable */}
      <ScheduleFormModal
        initialData={editingSchedule}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          success(editingSchedule ? 'Rutina actualizada' : 'Rutina creada con éxito')
          mutate()
        }}
      />
    </div>
  )
}
