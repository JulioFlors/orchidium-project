'use client'

import type { PotSize } from '@package/database/enums'

import { useState, useEffect } from 'react'

import { Modal, Button, FormField, Input, SelectDropdown } from '@/components'

interface Variant {
  id: string
  size: PotSize
  price: number
  quantity: number
  available: boolean
}

interface VariantFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingVariant: Variant | null
  targetSpecies: { id: string; name: string; variants?: Array<{ size: PotSize }> } | null
  isPending: boolean
  onSave: (formValues: {
    size: PotSize
    price: number
    quantity: number
    available: boolean
  }) => void
  potSizes: PotSize[]
  potSizeLabels: Record<PotSize, string>
}

export function VariantFormModal({
  isOpen,
  onClose,
  editingVariant,
  targetSpecies,
  isPending,
  onSave,
  potSizes,
  potSizeLabels,
}: VariantFormModalProps) {
  const [size, setSize] = useState<PotSize>(potSizes[0])
  const [priceInput, setPriceInput] = useState<string>('')

  // Sincronizar estado al abrir o cambiar de variante
  useEffect(() => {
    if (isOpen) {
      if (editingVariant) {
        Promise.resolve().then(() => {
          setSize(editingVariant.size)
          setPriceInput(editingVariant.price ? editingVariant.price.toString() : '')
        })
      } else {
        const nextAvailableSize =
          potSizes.find((s) => !targetSpecies?.variants?.some((v) => v.size === s)) || potSizes[0]

        Promise.resolve().then(() => {
          setSize(nextAvailableSize)
          setPriceInput('')
        })
      }
    }
  }, [isOpen, editingVariant, targetSpecies, potSizes])

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value

    // Permitir únicamente dígitos y punto decimal .
    raw = raw.replace(/[^0-9.]/g, '')
    // Preservar solo el primer punto decimal
    const parts = raw.split('.')

    if (parts.length > 2) {
      raw = `${parts[0]}.${parts.slice(1).join('')}`
    }
    setPriceInput(raw)
  }

  const handleSubmit = () => {
    const parsed = parseFloat(priceInput)
    const validPrice = isNaN(parsed) || parsed < 0 ? 0 : parsed

    onSave({
      size,
      price: validPrice,
      quantity: 0,
      available: true,
    })
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={isPending} variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} onClick={handleSubmit}>
            {editingVariant ? 'Guardar Cambios' : 'Crear Tamaño'}
          </Button>
        </>
      }
      isOpen={isOpen}
      title={targetSpecies?.name ?? 'Especie'}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField htmlFor="v-size" label="Tamaño">
          <SelectDropdown
            disabled={!!editingVariant}
            id="v-size"
            options={potSizes.map((s) => ({
              value: s,
              label: potSizeLabels[s],
            }))}
            value={size}
            onChange={(val) => setSize(val as PotSize)}
          />
        </FormField>

        <FormField htmlFor="v-price" label="Precio">
          <div className="relative flex items-center">
            <span className="text-secondary pointer-events-none absolute left-3 text-sm font-bold opacity-60">
              $
            </span>
            <Input
              className="pl-7 font-mono font-bold"
              id="v-price"
              placeholder="0.00"
              type="text"
              value={priceInput}
              onChange={handlePriceChange}
            />
          </div>
        </FormField>
      </div>
    </Modal>
  )
}
