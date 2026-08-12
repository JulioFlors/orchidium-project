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
  availableSizes?: PotSize[]
  onClose: () => void
  onSave: (values: {
    size: PotSize
    status: PlantStatus
    zone: ZoneType
    origin?: string | null
    pottingDate?: string | null
  }) => void
}

const ORIGIN_OPTIONS = [
  { value: 'Establecida', label: 'Establecida' },
  { value: 'Corte', label: 'Corte' },
  { value: 'Injerto', label: 'Injerto' },
  { value: 'Transplante', label: 'Transplante' },
]

export function PlantFormModal({
  isOpen,
  isPending,
  editingPlant,
  potSizes,
  potSizeLabels,
  zoneLabels,
  availableSizes,
  onClose,
  onSave,
}: PlantFormModalProps) {
  const [size, setSize] = useState<PotSize>('NRO_5')
  const [status, setStatus] = useState<PlantStatus>('AVAILABLE')
  const [zone, setZone] = useState<ZoneType>('ZONA_A')
  const [origin, setOrigin] = useState<string>('Establecida')
  const [pottingDate, setPottingDate] = useState<string>('')

  // Usar tamaños filtrados por variante si existen, de lo contrario los tamaños globales
  const effectivePotSizes = availableSizes && availableSizes.length > 0 ? availableSizes : potSizes

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editingPlant) {
      setSize(editingPlant.currentSize)
      setStatus(editingPlant.status)
      setZone((editingPlant.location?.zone as ZoneType) || 'ZONA_A')
      setOrigin(editingPlant.origin || 'Establecida')
      setPottingDate(
        editingPlant.pottingDate
          ? new Date(editingPlant.pottingDate).toISOString().split('T')[0]
          : '',
      )
    } else {
      setSize(effectivePotSizes[0] || 'NRO_5')
      setStatus('AVAILABLE')
      setZone('ZONA_A')
      setOrigin('Establecida')
      setPottingDate('')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [editingPlant, isOpen, effectivePotSizes])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      size,
      status,
      zone,
      origin: origin.trim() ? origin : 'Establecida',
      pottingDate: pottingDate.trim() ? pottingDate : null,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      subtitle={editingPlant ? `#${editingPlant.id.slice(-8).toUpperCase()}` : undefined}
      title={editingPlant ? 'Editar Ejemplar' : 'Nuevo Ejemplar'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FormField htmlFor="plant-size" label="Variante">
          <SelectDropdown
            id="plant-size"
            options={effectivePotSizes.map((s) => ({
              value: s,
              label: potSizeLabels[s],
            }))}
            value={size}
            onChange={(val) => setSize(val as PotSize)}
          />
        </FormField>

        <FormField htmlFor="plant-zone" label="Ubicación">
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

        <FormField htmlFor="plant-status" label="Disponibilidad">
          <SelectDropdown
            id="plant-status"
            options={[
              { value: 'AVAILABLE', label: 'Disponible / Tienda' },
              { value: 'MOTHER', label: 'Planta Madre / Colección' },
            ]}
            value={status}
            onChange={(val) => setStatus(val as PlantStatus)}
          />
        </FormField>

        <FormField htmlFor="plant-origin" label="Origen">
          <SelectDropdown
            id="plant-origin"
            options={ORIGIN_OPTIONS}
            value={origin}
            onChange={(val) => setOrigin(val as string)}
          />
        </FormField>

        <FormField htmlFor="plant-date" label="Fecha">
          <Input
            className="cursor-pointer dark:scheme-dark"
            id="plant-date"
            type="date"
            value={pottingDate}
            onChange={(e) => setPottingDate(e.target.value)}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker()
              } catch {
                // Fallback
              }
            }}
          />
        </FormField>

        <div className="border-input-outline -mx-6 mt-4 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button disabled={isPending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} type="submit" variant="primary">
            {editingPlant ? 'Guardar Cambios' : 'Crear Ejemplar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
