'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { IoWaterOutline, IoFlaskOutline, IoAddOutline, IoCalendarOutline } from 'react-icons/io5'
import { PiSprayBottle } from 'react-icons/pi'
import { MdDewPoint } from 'react-icons/md'

import { ScheduleFormModal, ScheduleCard } from './components'

import { useToast } from '@/hooks'
import { getSchedules, toggleSchedule, deleteSchedule } from '@/actions/planner/schedule-actions'
import { TaskPurposeLabels } from '@/config/mappings'
import { Button, Heading } from '@/components'

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
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const { success, error } = useToast()

  // SWR para cargar las rutinas vía Server Action envuelta en una Promise simple
  const fetcher = async () => {
    const res = await getSchedules()

    if (!res.success) throw new Error(res.error)

    return res.data
  }

  const { data: schedules = [], isLoading, mutate } = useSWR('schedules', fetcher)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Bloquear si ya está en proceso
    if (pendingIds.has(id)) return

    setPendingIds((prev) => new Set(prev).add(id))

    try {
      const res = await toggleSchedule(id, !currentStatus)

      if (res.success) {
        success('Estado de rutina actualizado')

        await mutate()
      } else {
        error(res.error || 'No se pudo actualizar la rutina')
      }
    } catch (err) {
      error(
        'Error al conectar con el servidor: ' +
          (err instanceof Error ? err.message : 'Error desconocido'),
      )
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)

        next.delete(id)

        return next
      })
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
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <div className="flex flex-col gap-6">
        <Heading
          action={
            <Button
              className="tds-sm:w-auto flex w-full items-center justify-center gap-2"
              onClick={openNewModal}
            >
              <IoAddOutline className="h-5 w-5" /> Nueva Rutina
            </Button>
          }
          description="Planes de irrigación, nutrición y fertirriego programados periódicamente para el mantenimiento automatizado."
          title="Rutinas de Cultivo"
        />

        {isLoading ? (
          <div className="border-input-outline flex h-48 flex-col items-center justify-center gap-4 rounded-xl border border-dashed">
            <div className="text-primary h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-primary animate-pulse text-sm font-medium">
              Cargando programas...
            </span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-16 shadow-sm">
            <IoCalendarOutline className="text-secondary/20 mb-3 h-16 w-16" />
            <p className="text-secondary text-base font-medium">No hay rutinas activas</p>
            <p className="text-secondary mt-1 text-sm opacity-60">
              Aún no has configurado ninguna tarea recurrente para este orquideario.
            </p>
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 grid grid-cols-1 gap-4">
            {schedules.map((schedule: AutomationSchedule) => {
              const action = ACTION_MAP[schedule.purpose] || ACTION_MAP.IRRIGATION

              return (
                <ScheduleCard
                  key={schedule.id}
                  colorClassName={action.color}
                  icon={action.icon}
                  isLoading={pendingIds.has(schedule.id)}
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
    </div>
  )
}
