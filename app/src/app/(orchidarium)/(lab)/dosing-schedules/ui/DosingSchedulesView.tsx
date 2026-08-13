'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { IoFlaskOutline, IoAddOutline, IoCalendarOutline } from 'react-icons/io5'

import { DosingScheduleFormModal } from './components/DosingScheduleFormModal'

import { useToast } from '@/hooks'
import { getSchedules, toggleSchedule, deleteSchedule } from '@/actions/planner/schedule-actions'
import { TaskPurposeLabels } from '@/config/mappings'
import { Button, Heading, Modal } from '@/components'
import { ScheduleCard } from '@/app/(orchidarium)/(operations)/schedules/ui/components/ScheduleCard'

const ACTION_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
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
  executionType?: 'HARDWARE' | 'MANUAL'
  cronTrigger: string
  durationMinutes: number
  isEnabled: boolean
  zones: string[]
  fertilizationProgramId?: string | null
  phytosanitaryProgramId?: string | null
}

export function DosingSchedulesView() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AutomationSchedule | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<AutomationSchedule | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const { success, error } = useToast()

  // SWR para cargar las rutinas manuales de dosificación
  const fetcher = async () => {
    const res = await getSchedules('MANUAL')

    if (!res.success) throw new Error(res.error)

    return res.data
  }

  const { data: schedules = [], isLoading, mutate } = useSWR('schedules-manual', fetcher)

  const handleToggle = async (id: string, currentStatus: boolean) => {
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

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return

    setIsDeleting(true)
    try {
      const res = await deleteSchedule(scheduleToDelete.id)

      if (res.success) {
        success('Rutina eliminada correctamente')
        mutate()
        setScheduleToDelete(null)
      } else {
        error(res.error || 'No se pudo eliminar la rutina')
      }
    } catch (err) {
      error(
        'Error al intentar eliminar la rutina: ' +
          (err instanceof Error ? err.message : 'Error desconocido'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditModal = (schedule: AutomationSchedule) => {
    setEditingSchedule(schedule)
    setIsFormModalOpen(true)
  }

  const openNewModal = () => {
    setEditingSchedule(null)
    setIsFormModalOpen(true)
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
          description="Programación de ciclos de fertilización y control fitosanitario."
          title="Rutinas de Dosificación Manual"
        />

        {isLoading ? (
          <div className="border-input-outline flex h-48 flex-col items-center justify-center gap-4 rounded-xl border border-dashed">
            <div className="text-primary h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-primary animate-pulse text-sm font-medium">
              Cargando rutinas de dosificación...
            </span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-16 shadow-sm">
            <IoCalendarOutline className="text-secondary/20 mb-3 h-16 w-16" />
            <p className="text-secondary text-base font-medium">
              No hay rutinas de dosificación activas
            </p>
            <p className="text-secondary mt-1 text-sm opacity-60">
              Aún no has configurado ninguna rutina manual de fertilización o fumigación.
            </p>
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 grid grid-cols-1 gap-4">
            {schedules.map((schedule: AutomationSchedule) => {
              const action = ACTION_MAP[schedule.purpose] || ACTION_MAP.FERTIGATION

              return (
                <ScheduleCard
                  key={schedule.id}
                  colorClassName={action.color}
                  icon={action.icon}
                  isLoading={pendingIds.has(schedule.id)}
                  schedule={schedule}
                  onDelete={(id) => {
                    const target = schedules.find((s: AutomationSchedule) => s.id === id)

                    if (target) setScheduleToDelete(target)
                  }}
                  onEdit={openEditModal}
                  onToggle={handleToggle}
                />
              )
            })}
          </div>
        )}

        {/* Modal de Creación / Edición */}
        <DosingScheduleFormModal
          initialData={
            editingSchedule
              ? {
                  id: editingSchedule.id,
                  name: editingSchedule.name,
                  purpose: editingSchedule.purpose as 'FERTIGATION' | 'FUMIGATION',
                  cronTrigger: editingSchedule.cronTrigger,
                  zones: editingSchedule.zones,
                  fertilizationProgramId: editingSchedule.fertilizationProgramId,
                  phytosanitaryProgramId: editingSchedule.phytosanitaryProgramId,
                }
              : null
          }
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            success(editingSchedule ? 'Rutina actualizada' : 'Rutina creada con éxito')
            mutate()
          }}
        />

        {/* Modal de Confirmación de Eliminación */}
        <Modal
          isOpen={!!scheduleToDelete}
          size="md"
          title="Eliminar Rutina de Dosificación"
          onClose={() => setScheduleToDelete(null)}
        >
          <div className="flex flex-col gap-5">
            <p className="text-secondary text-sm">
              ¿Estás seguro de que deseas eliminar la rutina{' '}
              <strong className="text-primary">{scheduleToDelete?.name}</strong>?
            </p>

            <div className="bg-surface/50 border-input-outline rounded-lg border border-dashed p-4">
              <p className="text-secondary text-xs leading-relaxed">
                <span className="font-bold text-pink-400 uppercase">Nota:</span> Esta acción no se
                puede deshacer y eliminará permanentemente la rutina programada.
              </p>
            </div>

            <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
              <Button
                disabled={isDeleting}
                variant="ghost"
                onClick={() => setScheduleToDelete(null)}
              >
                Cancelar
              </Button>
              <Button isLoading={isDeleting} variant="destructive" onClick={handleConfirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
