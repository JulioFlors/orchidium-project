'use client'

import type { Agrochemical, TaskStatus } from '@package/database'
import type { DosingTaskItem } from '@/actions/lab'

import React, { useState, useMemo } from 'react'
import useSWR from 'swr'
import { IoAddOutline, IoFlaskOutline } from 'react-icons/io5'

import {
  DosingTaskCard,
  DosingTaskModal,
  DosingFiltersBar,
  type TimeFilterPreset,
  type StatusFilterPreset,
} from './components'

import { getDosingTasks, updateDosingTaskStatus, deleteDosingTask } from '@/actions/lab'
import { Heading, Button, Modal } from '@/components/ui'
import { useToast } from '@/hooks'
import { useFormDraftStore } from '@/store'

interface DosingViewProps {
  initialTasks: DosingTaskItem[]
  agrochemicals: Agrochemical[]
}

const fetcher = async () => {
  const res = await getDosingTasks(100, 0)

  if (!res.success) throw new Error(res.error)

  return res.data || []
}

export function DosingView({ initialTasks, agrochemicals }: DosingViewProps) {
  const { success, error: toastError } = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<DosingTaskItem | null>(null)

  const [timePreset, setTimePreset] = useState<TimeFilterPreset>('all')
  const [statusPreset, setStatusPreset] = useState<StatusFilterPreset>('all')
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)

  const { data: tasks = initialTasks, mutate } = useSWR<DosingTaskItem[]>(
    '/api/planner/dosing',
    fetcher,
    {
      fallbackData: initialTasks,
      refreshInterval: 15000,
      revalidateOnFocus: true,
    },
  )

  const [taskToCancel, setTaskToCancel] = useState<DosingTaskItem | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<DosingTaskItem | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const cancelReasonKey = taskToCancel ? `cancel-dosing-task-${taskToCancel.id}` : ''
  const cancelReason = taskToCancel ? ((drafts[cancelReasonKey] as string | undefined) ?? '') : ''

  const handleStatusChange = async (taskId: string, status: string, postponeHours?: number) => {
    try {
      const res = await updateDosingTaskStatus(taskId, status as TaskStatus, postponeHours)

      if (res.success) {
        success('Estado actualizado correctamente')
        mutate()
      } else {
        toastError(res.error || 'No se pudo actualizar el estado')
      }
    } catch {
      toastError('Error de conexión')
    }
  }

  const handleConfirmCancelTask = async () => {
    if (!taskToCancel || !cancelReason.trim()) return

    setIsCancelling(true)
    try {
      const res = await updateDosingTaskStatus(taskToCancel.id, 'CANCELLED' as TaskStatus)

      if (res.success) {
        success('Tarea cancelada correctamente')
        clearDraft(cancelReasonKey)
        setTaskToCancel(null)
        mutate()
      } else {
        toastError(res.error || 'No se pudo cancelar la tarea')
      }
    } catch {
      toastError('Error al cancelar la tarea')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return

    setIsDeleting(true)
    try {
      const res = await deleteDosingTask(taskToDelete.id)

      if (res.success) {
        success('Registro eliminado')
        setTaskToDelete(null)
        mutate()
      } else {
        toastError(res.error || 'No se pudo eliminar')
      }
    } catch {
      toastError('Error al eliminar')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtrado reactivo por rangos de Tiempo y Estado
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = new Date(t.scheduledAt)
      const now = new Date()

      // 1. Filtro por Presets de Estado
      if (statusPreset !== 'all' && t.status !== statusPreset) {
        return false
      }

      // 2. Filtro por Fecha Personalizada
      if (selectedDate) {
        const taskYmd = taskDate.toISOString().split('T')[0]

        if (taskYmd !== selectedDate) return false
      } else {
        // 3. Filtro por Presets Temporales
        let startRange: Date | null = null
        let endRange: Date | null = null

        if (timePreset === 'today') {
          startRange = new Date(now)
          startRange.setHours(0, 0, 0, 0)

          endRange = new Date(now)
          endRange.setHours(23, 59, 59, 999)
        } else if (timePreset === 'week') {
          // Esta Semana: Lunes (00:00:00) a Domingo (23:59:59.999) de la semana actual
          const day = now.getDay()
          const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1)

          startRange = new Date(now)
          startRange.setDate(diffToMonday)
          startRange.setHours(0, 0, 0, 0)

          endRange = new Date(startRange)
          endRange.setDate(startRange.getDate() + 6)
          endRange.setHours(23, 59, 59, 999)
        } else if (timePreset === 'next-week') {
          // Próxima Semana: Lunes (00:00:00) a Domingo (23:59:59.999) de la semana siguiente
          const day = now.getDay()
          const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1)
          const thisMonday = new Date(now)

          thisMonday.setDate(diffToMonday)
          thisMonday.setHours(0, 0, 0, 0)

          startRange = new Date(thisMonday)
          startRange.setDate(thisMonday.getDate() + 7)

          endRange = new Date(startRange)
          endRange.setDate(startRange.getDate() + 6)
          endRange.setHours(23, 59, 59, 999)
        } else if (timePreset === 'month') {
          // Este Mes: Día 1 (00:00:00) al último día del mes actual (23:59:59.999)
          startRange = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
          endRange = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        } else if (timePreset === 'next-month') {
          // Próximo Mes: Día 1 (00:00:00) al último día del mes siguiente (23:59:59.999)
          startRange = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
          endRange = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999)
        }

        if (startRange && endRange) {
          if (taskDate < startRange || taskDate > endRange) return false
        }
      }

      return true
    })
  }, [tasks, timePreset, statusPreset, selectedDate])

  return (
    <div className="mx-auto mt-8 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        {/* Encabezado Principal */}
        <Heading
          action={
            <Button
              variant="primary"
              onClick={() => {
                setEditingTask(null)
                setIsAddModalOpen(true)
              }}
            >
              <IoAddOutline className="mr-1.5 h-4 w-4" />
              Nueva Tarea
            </Button>
          }
          description="Cronograma y seguimiento de las tareas de dosificación manual."
          title="Dosificación de Agroquímicos"
        />

        {/* Barra de Filtros por Rango */}
        <DosingFiltersBar
          selectedDate={selectedDate}
          statusPreset={statusPreset}
          timePreset={timePreset}
          onSelectedDateChange={setSelectedDate}
          onStatusPresetChange={setStatusPreset}
          onTimePresetChange={setTimePreset}
        />

        {/* Lista de Tarjetas / Feed */}
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-surface border-input-outline flex flex-col items-center justify-center rounded-lg border p-12 text-center shadow-xs">
              <IoFlaskOutline className="text-secondary h-12 w-12 opacity-30" />
              <h4 className="text-primary mt-3 text-sm font-bold">No se encontraron tareas</h4>
              <p className="text-secondary mt-1 text-xs opacity-60">
                Ajusta los filtros de busqueda.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <DosingTaskCard
                key={task.id}
                task={task}
                onCancel={(t) => setTaskToCancel(t)}
                onDelete={(t) => setTaskToDelete(t)}
                onEdit={(taskToEdit) => {
                  setEditingTask(taskToEdit)
                  setIsAddModalOpen(true)
                }}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal para Agregar/Editar Tarea Manual */}
      <DosingTaskModal
        key={editingTask ? editingTask.id : 'new-dosing-modal'}
        agrochemicals={agrochemicals}
        editingTask={editingTask}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingTask(null)
        }}
        onSuccess={() => mutate()}
      />

      <Modal
        isOpen={!!taskToCancel}
        size="md"
        title={
          taskToCancel
            ? `Cancelar Tarea - ${taskToCancel.agrochemical?.name || 'Dosificación'}`
            : 'Cancelar Tarea'
        }
        onClose={() => setTaskToCancel(null)}
      >
        <div className="flex flex-col gap-5">
          {taskToCancel?.scheduledAt && (
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-secondary">Programada para el </span>
              <span className="text-primary font-mono font-bold">
                {new Date(taskToCancel.scheduledAt).toLocaleDateString('es-VE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          <div className="bg-surface/50 rounded-lg border border-dashed border-red-500/30 p-4">
            <p className="text-primary text-xs leading-relaxed">
              <span className="font-bold text-red-500 uppercase">Nota:</span> Esta acción no se
              puede deshacer.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-secondary text-sm font-medium" htmlFor="cancel-dosing-reason">
              Motivo de cancelación
            </label>
            <textarea
              className="focus-input border-input-outline w-full resize-none border text-sm"
              id="cancel-dosing-reason"
              placeholder="Ej: Cambio de prioridades, insumo agotado..."
              rows={3}
              value={cancelReason}
              onChange={(e) => setDraft(cancelReasonKey, e.target.value)}
            />
          </div>

          <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button variant="ghost" onClick={() => setTaskToCancel(null)}>
              Volver
            </Button>
            <Button
              disabled={!cancelReason.trim()}
              isLoading={isCancelling}
              variant="destructive"
              onClick={handleConfirmCancelTask}
            >
              {isCancelling ? 'Cancelando' : 'Cancelar Tarea'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!taskToDelete}
        size="md"
        title="Eliminar Registro de Dosificación"
        onClose={() => setTaskToDelete(null)}
      >
        <div className="flex flex-col gap-5">
          <div className="bg-surface/50 rounded-lg border border-dashed border-red-500/30 p-4">
            <p className="text-primary text-xs leading-relaxed">
              <span className="font-bold text-red-500 uppercase">Nota:</span> Esta acción no se
              puede deshacer. Se eliminará permanentemente este registro de dosificación.
            </p>
          </div>

          <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button variant="ghost" onClick={() => setTaskToDelete(null)}>
              Volver
            </Button>
            <Button isLoading={isDeleting} variant="destructive" onClick={handleConfirmDeleteTask}>
              Eliminar Registro
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
