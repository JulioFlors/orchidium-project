'use client'

import type { Agrochemical } from '@package/database'

import React, { useState } from 'react'
import clsx from 'clsx'
import { IoCheckmark } from 'react-icons/io5'

import { Modal, Button, FormField, Input, SelectDropdown } from '@/components/ui'
import { createDosingTask, updateDosingTask, type DosingTaskItem } from '@/actions/lab'
import { useToast } from '@/hooks'
import { TaskPurpose, TaskStatus, ZoneType, ZoneTypeLabels } from '@/config/mappings'

interface DosingTaskModalProps {
  isOpen: boolean
  onClose: () => void
  agrochemicals: Agrochemical[]
  onSuccess: () => void
  editingTask?: DosingTaskItem | null
}

export function DosingTaskModal({
  isOpen,
  onClose,
  agrochemicals,
  onSuccess,
  editingTask,
}: DosingTaskModalProps) {
  const { success, error } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [agrochemicalId, setAgrochemicalId] = useState(
    () => editingTask?.agrochemicalId || agrochemicals[0]?.id || '',
  )

  const initialTaskDate = editingTask ? new Date(editingTask.scheduledAt) : null

  const [scheduledDate, setScheduledDate] = useState(() =>
    initialTaskDate
      ? initialTaskDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  )
  const [scheduledTime, setScheduledTime] = useState(() =>
    initialTaskDate
      ? `${String(initialTaskDate.getHours()).padStart(2, '0')}:${String(initialTaskDate.getMinutes()).padStart(2, '0')}`
      : '08:00',
  )
  const [selectedZones, setSelectedZones] = useState<ZoneType[]>(() =>
    editingTask?.zones && editingTask.zones.length > 0 ? editingTask.zones : [ZoneType.ZONA_A],
  )
  const [notes, setNotes] = useState(() => editingTask?.notes || '')
  const [isCompleted, setIsCompleted] = useState(() => editingTask?.status === 'COMPLETED')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agrochemicalId) {
      error('Selecciona un insumo agroquímico')

      return
    }

    if (!scheduledDate) {
      error('Selecciona una fecha')

      return
    }

    if (selectedZones.length === 0) {
      error('Selecciona al menos una zona implicada')

      return
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`)

    if (!isCompleted && scheduledDateTime < new Date()) {
      error(
        'La fecha y hora de una tarea pendiente deben ser futuras (o marca la opción "Registrar como completada").',
      )

      return
    }

    try {
      setIsSubmitting(true)
      const selectedAgro = agrochemicals.find((a) => a.id === agrochemicalId)
      const inferredPurpose =
        selectedAgro?.type === 'FERTILIZANTE' ? TaskPurpose.FERTIGATION : TaskPurpose.FUMIGATION

      const fullIsoString = scheduledDateTime.toISOString()

      const payload = {
        agrochemicalId,
        purpose: inferredPurpose,
        scheduledAt: fullIsoString,
        zones: selectedZones,
        notes: notes || undefined,
        status: isCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING,
      }

      const res = editingTask
        ? await updateDosingTask(editingTask.id, payload)
        : await createDosingTask(payload)

      if (res.success) {
        success(
          editingTask
            ? 'Tarea de dosificación actualizada'
            : 'Tarea de dosificación registrada con éxito',
        )
        onSuccess()
        onClose()
      } else {
        error(res.error || 'Error al guardar la tarea')
      }
    } catch {
      error('Error de red al intentar guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleZone = (zone: ZoneType) => {
    if (selectedZones.includes(zone)) {
      if (selectedZones.length > 1) {
        setSelectedZones(selectedZones.filter((z) => z !== zone))
      }
    } else {
      setSelectedZones([...selectedZones, zone])
    }
  }

  const agroOptions = agrochemicals.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.purpose})`,
  }))

  const availableZones = Object.values(ZoneType)

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title={editingTask ? 'Editar Tarea de Dosificación' : 'Tarea de Dosificación'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-5 text-left" onSubmit={handleSubmit}>
        {/* Insumo Agroquímico */}
        <FormField htmlFor="agrochemicalIdSelect" label="Insumo Agroquímico">
          <SelectDropdown
            options={agroOptions}
            value={agrochemicalId}
            onChange={(val) => setAgrochemicalId(String(val))}
          />
        </FormField>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="scheduledDateInput" label="Fecha">
            <Input
              required
              className="cursor-pointer dark:scheme-dark"
              id="scheduledDateInput"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker()
                } catch {
                  // Fallback si el navegador no soporta showPicker
                }
              }}
            />
          </FormField>

          <FormField htmlFor="scheduledTimeInput" label="Hora">
            <Input
              required
              className="cursor-pointer dark:scheme-dark"
              id="scheduledTimeInput"
              step="60"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker()
                } catch {
                  // Fallback si el navegador no soporta showPicker
                }
              }}
            />
          </FormField>
        </div>

        {/* Zonas */}
        <FormField htmlFor="dosingZones" label="Zonas">
          <div className="flex flex-wrap gap-2" id="dosingZones">
            {availableZones.map((z) => {
              const isSelected = selectedZones.includes(z)

              return (
                <button
                  key={z}
                  className={`flex h-9 cursor-pointer items-center justify-center rounded-sm border px-3.5 text-xs font-bold transition-all duration-300 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accessibility focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                    isSelected
                      ? 'bg-action border-action text-white shadow-xs'
                      : 'bg-surface border-input-outline text-secondary hover:border-primary/30 hover:bg-hover-overlay'
                  }`}
                  type="button"
                  onClick={() => toggleZone(z)}
                >
                  {ZoneTypeLabels[z] || z}
                </button>
              )
            })}
          </div>
        </FormField>

        {/* Observaciones / Notas */}
        <FormField htmlFor="dosingNotesTextarea" label="Observaciones / Notas">
          <textarea
            className="focus-input mt-1.5 w-full resize-none border border-input-outline text-sm"
            id="dosingNotesTextarea"
            placeholder="Opcional..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        {/* Marcar ya realizada */}
        <div className="mt-1 flex items-center gap-2.5">
          <label
            className="group flex cursor-pointer select-none items-center gap-2.5"
            htmlFor="isCompletedCheck"
          >
            <div className="relative flex items-center justify-center">
              <input
                checked={isCompleted}
                className="peer sr-only"
                id="isCompletedCheck"
                type="checkbox"
                onChange={(e) => setIsCompleted(e.target.checked)}
              />
              <div
                className={clsx(
                  'flex size-4.5 cursor-pointer items-center justify-center rounded-sm border',
                  'peer-focus-visible:outline-1 peer-focus-visible:-outline-offset-1 peer-focus-visible:outline-accessibility',
                  isCompleted
                    ? 'bg-action border-action text-white shadow-xs group-hover:bg-action-hover group-hover:border-action-hover'
                    : 'bg-surface border-input-outline text-secondary group-hover:border-action-hover group-hover:bg-hover-overlay',
                )}
              >
                {isCompleted && <IoCheckmark className="size-3.5 stroke-[2.5]" />}
              </div>
            </div>
            <span className="text-primary text-xs font-medium">Registrar como completada</span>
          </label>
        </div>

        {/* Footer Actions Estándar */}
        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isSubmitting} type="submit">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
