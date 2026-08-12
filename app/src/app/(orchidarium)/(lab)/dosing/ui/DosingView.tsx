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
import { Heading, Button } from '@/components/ui'
import { useToast } from '@/hooks'

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

  const handleDelete = async (taskId: string) => {
    try {
      const res = await deleteDosingTask(taskId)

      if (res.success) {
        success('Registro eliminado')
        mutate()
      } else {
        toastError(res.error || 'No se pudo eliminar')
      }
    } catch {
      toastError('Error al eliminar')
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
        if (timePreset === 'today') {
          const isSameDay =
            taskDate.getDate() === now.getDate() &&
            taskDate.getMonth() === now.getMonth() &&
            taskDate.getFullYear() === now.getFullYear()

          if (!isSameDay) return false
        } else if (timePreset === 'week') {
          // Esta Semana (próximos 7 días)
          const endOfWeek = new Date(now)

          endOfWeek.setDate(now.getDate() + 7)
          if (taskDate < now || taskDate > endOfWeek) return false
        } else if (timePreset === 'next-week') {
          // Próxima Semana (de 7 a 14 días desde hoy)
          const startOfNextWeek = new Date(now)

          startOfNextWeek.setDate(now.getDate() + 7)
          const endOfNextWeek = new Date(now)

          endOfNextWeek.setDate(now.getDate() + 14)
          if (taskDate < startOfNextWeek || taskDate > endOfNextWeek) return false
        } else if (timePreset === 'month') {
          // Este Mes (próximos 30 días)
          const endOfMonth = new Date(now)

          endOfMonth.setDate(now.getDate() + 30)
          if (taskDate < now || taskDate > endOfMonth) return false
        } else if (timePreset === 'next-month') {
          // Próximo Mes (de 30 a 60 días desde hoy)
          const startOfNextMonth = new Date(now)

          startOfNextMonth.setDate(now.getDate() + 30)
          const endOfNextMonth = new Date(now)

          endOfNextMonth.setDate(now.getDate() + 60)
          if (taskDate < startOfNextMonth || taskDate > endOfNextMonth) return false
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
                onDelete={handleDelete}
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
    </div>
  )
}
