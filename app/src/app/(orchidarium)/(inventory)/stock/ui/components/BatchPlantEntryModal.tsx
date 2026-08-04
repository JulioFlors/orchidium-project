'use client'

import type { PotSize, ZoneType } from '@package/database/enums'

import { useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { IoAddOutline } from 'react-icons/io5'

import { Modal, FormField, Input, SelectDropdown, Button } from '@/components'

interface SizeQuantityRow {
  size: PotSize
  quantity: number
  isMother: boolean
}

interface BatchPlantEntryModalProps {
  isOpen: boolean
  isPending: boolean
  potSizes: PotSize[]
  potSizeLabels: Record<PotSize, string>
  zoneLabels: Record<ZoneType, string>
  onClose: () => void
  onSave: (values: {
    zone: ZoneType
    eventType: string
    pottingDate?: string | null
    items: SizeQuantityRow[]
  }) => void
}

const EVENT_TYPES = [
  'Ingreso Inicial',
  'Repoteo',
  'Siembra',
  'Injerto',
  'Corte / Propagación',
  'Trasplante',
  'Compra / Insumo',
]

export function BatchPlantEntryModal({
  isOpen,
  isPending,
  potSizes,
  potSizeLabels,
  zoneLabels,
  onClose,
  onSave,
}: BatchPlantEntryModalProps) {
  const [zone, setZone] = useState<ZoneType>('ZONA_A')
  const [eventType, setEventType] = useState<string>('Ingreso Inicial')
  const [pottingDate, setPottingDate] = useState<string>('')
  const [items, setItems] = useState<SizeQuantityRow[]>([
    { size: 'NRO_5', quantity: 1, isMother: false },
  ])

  function addItemRow() {
    const usedSizes = items.map((i) => i.size)
    const availableSize = potSizes.find((s) => !usedSizes.includes(s)) || 'NRO_7'

    setItems((prev) => [...prev, { size: availableSize, quantity: 1, isMother: false }])
  }

  function removeItemRow(index: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItemRow(
    index: number,
    field: 'size' | 'quantity' | 'isMother',
    value: PotSize | number | boolean,
  ) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const totalQuantity = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (totalQuantity <= 0) return

    onSave({
      zone,
      eventType,
      pottingDate: pottingDate.trim() ? pottingDate : null,
      items: items.filter((i) => i.quantity > 0),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      subtitle="Registra 1 o múltiples ejemplares físicos en una sola operación del vivero"
      title="Registrar Ejemplares"
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField htmlFor="batch-zone" label="Ubicación (Zona)">
            <SelectDropdown
              id="batch-zone"
              options={Object.entries(zoneLabels).map(([val, label]) => ({
                value: val,
                label,
              }))}
              value={zone}
              onChange={(val) => setZone(val as ZoneType)}
            />
          </FormField>

          <FormField htmlFor="batch-event" label="Origen / Evento">
            <SelectDropdown
              id="batch-event"
              options={EVENT_TYPES.map((e) => ({ value: e, label: e }))}
              value={eventType}
              onChange={(val) => setEventType(val as string)}
            />
          </FormField>

          <FormField htmlFor="batch-date" label="Fecha (Opcional)">
            <Input
              id="batch-date"
              type="date"
              value={pottingDate}
              onChange={(e) => setPottingDate(e.target.value)}
            />
          </FormField>
        </div>

        {/* Distribución por Tamaños / Variantes */}
        <div className="border-input-outline bg-surface/30 flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-primary text-xs font-bold tracking-wider uppercase">
              Distribución por Tamaños de Maceta
            </span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Total del lote: {totalQuantity} {totalQuantity === 1 ? 'planta' : 'plantas'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((row, idx) => (
              <div key={row.size} className="flex items-center gap-3">
                <div className="flex-1">
                  <SelectDropdown
                    id={`batch-size-${idx}`}
                    options={potSizes.map((s) => ({
                      value: s,
                      label: potSizeLabels[s],
                    }))}
                    value={row.size}
                    onChange={(val) => updateItemRow(idx, 'size', val as PotSize)}
                  />
                </div>

                <div className="w-24">
                  <Input
                    min={1}
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>

                <label className="text-secondary hover:text-primary flex cursor-pointer items-center gap-1.5 text-xs font-medium select-none">
                  <input
                    checked={row.isMother}
                    className="rounded accent-purple-600"
                    type="checkbox"
                    onChange={(e) => updateItemRow(idx, 'isMother', e.target.checked)}
                  />
                  <span>Madre</span>
                </label>

                {items.length > 1 && (
                  <button
                    className="hover:bg-hover-overlay rounded p-2 text-red-500 transition-colors"
                    title="Eliminar fila"
                    type="button"
                    onClick={() => removeItemRow(idx)}
                  >
                    <MdDelete className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            className="mt-2 w-fit text-xs"
            size="sm"
            type="button"
            variant="ghost"
            onClick={addItemRow}
          >
            <IoAddOutline className="mr-1 size-4" />
            Añadir otro tamaño
          </Button>
        </div>

        <div className="border-input-outline -mx-6 mt-2 flex items-center justify-end gap-3 border-t px-6 pt-4">
          <Button disabled={isPending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} type="submit" variant="primary">
            Registrar ({totalQuantity} {totalQuantity === 1 ? 'Ejemplar' : 'Ejemplares'})
          </Button>
        </div>
      </form>
    </Modal>
  )
}
