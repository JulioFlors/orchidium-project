'use client'

import { useState } from 'react'

import { PlantInstance } from './PlantInstanceCard'

import { Modal, FormField, Input, Textarea, Button } from '@/components'

interface FloweringEventModalProps {
  isOpen: boolean
  isPending: boolean
  targetPlant?: PlantInstance | null
  onClose: () => void
  onSave: (values: { startDate: string; notes?: string }) => void
}

export function FloweringEventModal({
  isOpen,
  isPending,
  targetPlant,
  onClose,
  onSave,
}: FloweringEventModalProps) {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')

  if (!targetPlant) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      startDate,
      notes: notes.trim() ? notes : undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      subtitle={`Ejemplar #${targetPlant.id.slice(-8).toUpperCase()}`}
      title="Registrar Floración"
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FormField htmlFor="flowering-date" label="Fecha de Inicio de Floración">
          <Input
            required
            id="flowering-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </FormField>

        <FormField htmlFor="flowering-notes" label="Notas Observacionales (Opcional)">
          <Textarea
            className="min-h-22.5 resize-none"
            id="flowering-notes"
            placeholder=""
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        <div className="border-input-outline -mx-6 mt-4 flex items-center justify-end gap-3 border-t px-6 pt-4">
          <Button disabled={isPending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} type="submit" variant="primary">
            Iniciar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
