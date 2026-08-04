'use client'

import type { PotSize, PlantStatus, ZoneType } from '@package/database/enums'

import { useState, useEffect } from 'react'

import { PlantInstance } from './PlantInstanceCard'

import { Modal, FormField, Input, SelectDropdown, Button } from '@/components'

interface PlantFormModalProps {
  isOpen: boolean
  isPending: boolean
  editingPlant?: PlantInstance | null
  potSizes: PotSize[]
  potSizeLabels: Record<PotSize, string>
  zoneLabels: Record<ZoneType, string>
  onClose: () => void
  onSave: (values: {
    size: PotSize
    status: PlantStatus
    zone: ZoneType
    pottingDate?: string | null
  }) => void
}

export function PlantFormModal({
  isOpen,
  isPending,
  editingPlant,
  potSizes,
  potSizeLabels,
  zoneLabels,
  onClose,
  onSave,
}: PlantFormModalProps) {
  const [size, setSize] = useState<PotSize>('NRO_5')
  const [status, setStatus] = useState<PlantStatus>('AVAILABLE')
  const [zone, setZone] = useState<ZoneType>('ZONA_A')
  const [pottingDate, setPottingDate] = useState<string>('')

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editingPlant) {
      setSize(editingPlant.currentSize)
      setStatus(editingPlant.status)
      setZone((editingPlant.location?.zone as ZoneType) || 'ZONA_A')
      setPottingDate(
        editingPlant.pottingDate
          ? new Date(editingPlant.pottingDate).toISOString().split('T')[0]
          : '',
      )
    } else {
      setSize('NRO_5')
      setStatus('AVAILABLE')
      setZone('ZONA_A')
      setPottingDate('')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [editingPlant, isOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      size,
      status,
      zone,
      pottingDate: pottingDate.trim() ? pottingDate : null,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      subtitle={editingPlant ? `Ejemplar #${editingPlant.id.slice(-8).toUpperCase()}` : undefined}
      title={editingPlant ? 'Editar Planta' : 'Nueva Planta'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FormField htmlFor="plant-size" label="Tamaño">
          <SelectDropdown
            id="plant-size"
            options={potSizes.map((s) => ({
              value: s,
              label: potSizeLabels[s],
            }))}
            value={size}
            onChange={(val) => setSize(val as PotSize)}
          />
        </FormField>

        <FormField htmlFor="plant-zone" label="Ubicación (Zona)">
          <SelectDropdown
            id="plant-zone"
            options={Object.entries(zoneLabels).map(([val, label]) => ({
              value: val,
              label,
            }))}
            value={zone}
            onChange={(val) => setZone(val as ZoneType)}
          />
        </FormField>

        <FormField htmlFor="plant-status" label="Estado de la Planta">
          <SelectDropdown
            id="plant-status"
            options={[
              { value: 'AVAILABLE', label: 'Disponible (Venta Comercial)' },
              { value: 'MOTHER', label: 'Planta Madre (Colección / No Venta)' },
            ]}
            value={status}
            onChange={(val) => setStatus(val as PlantStatus)}
          />
        </FormField>

        <FormField htmlFor="plant-date" label="Fecha de Siembra / Repoteo">
          <Input
            id="plant-date"
            type="date"
            value={pottingDate}
            onChange={(e) => setPottingDate(e.target.value)}
          />
        </FormField>

        <div className="border-input-outline -mx-6 mt-2 flex items-center justify-end gap-3 border-t px-6 pt-4">
          <Button disabled={isPending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} type="submit" variant="primary">
            {editingPlant ? 'Guardar Cambios' : 'Crear Planta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
