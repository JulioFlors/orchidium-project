'use client'

import type { PotSize, ZoneType } from '@package/database/enums'

import { useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { IoAddOutline, IoFlowerOutline } from 'react-icons/io5'

import { Modal, FormField, Input, SelectDropdown, Button, ActionMenu } from '@/components'

interface SizeQuantityRow {
  id: string
  size: PotSize
  quantity: number
  isMother: boolean
}

interface StockPlantModalProps {
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
    items: { size: PotSize; quantity: number; isMother: boolean }[]
  }) => void
}

const ORIGIN_TYPES = [
  { value: 'Corte', label: 'Corte' },
  { value: 'Establecida', label: 'Establecida' },
  { value: 'Injerto', label: 'Injerto' },
  { value: 'Transplante', label: 'Transplante' },
]

export function StockPlantModal({
  isOpen,
  isPending,
  potSizes,
  potSizeLabels,
  zoneLabels,
  onClose,
  onSave,
}: StockPlantModalProps) {
  const [zone, setZone] = useState<ZoneType | ''>('')
  const [eventType, setEventType] = useState<string>('')
  const [pottingDate, setPottingDate] = useState<string>('')
  const [items, setItems] = useState<SizeQuantityRow[]>([
    { id: '1', size: '' as PotSize, quantity: 0, isMother: false },
  ])

  function addItemRow() {
    const usedSizes = items.map((i) => i.size).filter(Boolean)
    const availableSize = potSizes.find((s) => !usedSizes.includes(s)) || ('' as PotSize)

    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), size: availableSize, quantity: 0, isMother: false },
    ])
  }

  function removeItemRow(id: string) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function updateItemRow(
    id: string,
    field: 'size' | 'quantity' | 'isMother',
    value: PotSize | number | boolean,
  ) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const totalQuantity = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!zone) return
    const validItems = items.filter((i) => i.size && Number(i.quantity) > 0)

    if (validItems.length === 0) return

    onSave({
      zone,
      eventType,
      pottingDate: pottingDate.trim() ? pottingDate : null,
      items: validItems.map(({ size, quantity, isMother }) => ({ size, quantity, isMother })),
    })
  }

  const isFormValid = zone && totalQuantity > 0 && items.every((i) => i.size && i.quantity > 0)

  return (
    <Modal isOpen={isOpen} size="lg" title="Registrar Ejemplares" onClose={onClose}>
      <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit}>
        <FormField htmlFor="batch-zone" label="Ubicación">
          <SelectDropdown
            id="batch-zone"
            options={Object.entries(zoneLabels).map(([val, label]) => ({
              value: val,
              label,
            }))}
            placeholder="Seleccionar"
            value={zone}
            onChange={(val) => setZone(val as ZoneType)}
          />
        </FormField>

        <FormField htmlFor="batch-event" label="Origen">
          <SelectDropdown
            id="batch-event"
            options={ORIGIN_TYPES}
            value={eventType}
            onChange={(val) => setEventType(val as string)}
          />
        </FormField>

        <FormField htmlFor="batch-date" label="Fecha">
          <Input
            className="cursor-pointer dark:scheme-dark"
            id="batch-date"
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

        {/* Bloque de Variantes */}
        <div className="border-input-outline bg-surface/30 flex flex-col gap-3 rounded-xl border p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-primary text-xs font-bold">Variantes</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {items.map((row) => {
              const otherSelectedSizes = items
                .filter((item) => item.id !== row.id)
                .map((item) => item.size)
                .filter(Boolean)

              return (
                <div key={row.id} className="flex flex-nowrap items-center gap-2 sm:gap-3">
                  <div className="min-w-24 flex-1">
                    <SelectDropdown
                      id={`batch-size-${row.id}`}
                      options={potSizes.map((s) => ({
                        value: s,
                        label: potSizeLabels[s],
                        disabled: otherSelectedSizes.includes(s),
                      }))}
                      placeholder="Seleccionar"
                      value={row.size || ''}
                      onChange={(val) => updateItemRow(row.id, 'size', val as PotSize)}
                    />
                  </div>

                  <div className="w-16 min-w-14 shrink-0 sm:w-20">
                    <Input
                      className="px-1.5 text-center text-xs"
                      id={`batch-qty-${row.id}`}
                      inputMode="numeric"
                      max={99}
                      min={1}
                      placeholder=""
                      type="text"
                      value={row.quantity === 0 ? '' : row.quantity}
                      onChange={(e) => {
                        const val = e.target.value

                        if (val === '') {
                          updateItemRow(row.id, 'quantity', 0)

                          return
                        }
                        if (/^\d+$/.test(val)) {
                          const num = parseInt(val, 10)

                          if (num <= 99) {
                            updateItemRow(row.id, 'quantity', num)
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Acciones y Badge Madre */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {row.isMother && (
                      <span className="rounded-full bg-linear-to-r from-blue-600 to-indigo-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                        Madre
                      </span>
                    )}

                    <ActionMenu
                      align="right"
                      hoverOnly={false}
                      items={[
                        {
                          label: row.isMother ? 'Desmarcar Madre' : 'Marcar como Madre',
                          icon: <IoFlowerOutline className="h-4 w-4" />,
                          onClick: () => updateItemRow(row.id, 'isMother', !row.isMother),
                        },
                        ...(items.length > 1
                          ? [
                              {
                                label: 'Eliminar Fila',
                                icon: <MdDelete className="h-4 w-4" />,
                                variant: 'destructive' as const,
                                onClick: () => removeItemRow(row.id),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Fila de resumen de total acumulado (Solo si existen 2 o más variantes) */}
          {items.length >= 2 && (
            <div className="border-input-outline/50 flex items-center justify-between border-t pt-2.5 text-xs">
              <span className="text-secondary font-medium">Total acumulado</span>
              <span className="font-mono text-xs font-bold text-primary">
                {totalQuantity} {totalQuantity === 1 ? 'ejemplar' : 'ejemplares'}
              </span>
            </div>
          )}

          <Button
            className="mt-1 w-fit text-xs"
            disabled={items.length >= potSizes.length}
            size="sm"
            type="button"
            variant="ghost"
            onClick={addItemRow}
          >
            <IoAddOutline className="mr-1 size-4" />
            Añadir variante
          </Button>
        </div>

        <div className="border-input-outline -mx-6 mt-4 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button disabled={isPending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!isFormValid} isLoading={isPending} type="submit" variant="primary">
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
