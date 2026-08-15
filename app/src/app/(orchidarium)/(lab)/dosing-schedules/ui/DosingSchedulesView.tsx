'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { IoFlaskOutline, IoAddOutline, IoCalendarOutline } from 'react-icons/io5'

import { DosingScheduleFormModal } from './components/DosingScheduleFormModal'

import { useToast } from '@/hooks'
import {
  getDosingSchedules,
  toggleDosingSchedule,
  deleteDosingSchedule,
} from '@/actions/lab/dosing-schedule-actions'
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

export interface DosingScheduleItem {
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

export function DosingSchedulesView() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<DosingScheduleItem | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<DosingScheduleItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const { success, error } = useToast()

  // SWR para cargar las rutinas de dosificación
  const fetcher = async () => {
    const res = await getDosingSchedules()

    if (!res.success) throw new Error(res.error)

    return res.data
  }

  const { data: schedules = [], isLoading, mutate } = useSWR('dosing-schedules', fetcher)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (pendingIds.has(id)) return

    setPendingIds((prev) => new Set(prev).add(id))

    try {
      const res = await toggleDosingSchedule(id, !currentStatus)

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
      const res = await deleteDosingSchedule(scheduleToDelete.id)

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

  const openEditModal = (schedule: DosingScheduleItem) => {
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
              size="sm"
              variant="primary"
              onClick={openNewModal}
            >
              <IoAddOutline className="h-5 w-5" />
              <span>Nueva Rutina</span>
            </Button>
          }
          description="Programa y gestiona la frecuencia de fertilizaciones y controles fitosanitarios del laboratorio."
          title="Rutinas de Dosificación"
        />
      </div>

      {isLoading ? (
        <div className="text-secondary flex h-64 items-center justify-center">
          <p className="animate-pulse text-sm">Cargando rutinas de dosificación...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="border-black-and-white/5 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="bg-surface mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-sm">
            <IoCalendarOutline className="text-secondary h-8 w-8 opacity-40" />
          </div>
          <h3 className="text-primary text-base font-semibold">
            No hay rutinas de dosificación configuradas
          </h3>
          <p className="text-secondary mt-1 max-w-sm text-sm opacity-60">
            Crea una rutina para automatizar la proyección de tareas de fertilización y fumigación
            en tu agenda.
          </p>
          <Button
            className="mt-6 flex items-center gap-2"
            size="sm"
            variant="secondary"
            onClick={openNewModal}
          >
            <IoAddOutline className="h-4 w-4" />
            <span>Crear primera rutina</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => {
            const actionInfo = ACTION_MAP[schedule.purpose] || {
              label: schedule.purpose,
              icon: <IoFlaskOutline className="h-5 w-5" />,
              color: 'text-primary',
            }

            return (
              <ScheduleCard
                key={schedule.id}
                colorClassName={actionInfo.color}
                icon={actionInfo.icon}
                isLoading={pendingIds.has(schedule.id)}
                schedule={schedule}
                onDelete={() => setScheduleToDelete(schedule)}
                onEdit={() => openEditModal(schedule)}
                onToggle={(id, current) => handleToggle(id, current)}
              />
            )
          })}
        </div>
      )}

      {/* Modal para Crear / Editar Rutina */}
      {isFormModalOpen && (
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
          onSuccess={() => mutate()}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {scheduleToDelete && (
        <Modal
          isOpen={!!scheduleToDelete}
          size="sm"
          title="Eliminar Rutina de Dosificación"
          onClose={() => setScheduleToDelete(null)}
        >
          <p className="text-secondary text-sm">
            {`¿Estás seguro de que deseas eliminar la rutina "${scheduleToDelete.name}"? Esta acción no se puede deshacer.`}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              disabled={isDeleting}
              variant="secondary"
              onClick={() => setScheduleToDelete(null)}
            >
              Cancelar
            </Button>
            <Button disabled={isDeleting} variant="destructive" onClick={handleConfirmDelete}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
