'use client'

import type { PotSize } from '@package/database/enums'

import { useState, useEffect } from 'react'
import { PiStorefrontFill } from 'react-icons/pi'

import { Modal, Button, FormField, Input, SelectDropdown } from '@/components'

interface Variant {
  id: string
  size: PotSize
  price: number
  quantity: number
  available: boolean
}

interface SpeciesWithStoreData {
  id: string
  name: string
  genus: { name: string }
  variants: Variant[]
  isFeatured?: boolean
  _count: {
    plants: number
  }
}

interface VariantFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingVariant: Variant | null
  targetSpecies: SpeciesWithStoreData | null
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
  const [form, setForm] = useState({
    size: potSizes[0],
    price: 0,
    quantity: 0,
    available: true,
  })

  // Sincronizar estado al abrir o cambiar de variante
  useEffect(() => {
    if (isOpen) {
      if (editingVariant) {
        setForm({
          size: editingVariant.size,
          price: editingVariant.price,
          quantity: editingVariant.quantity,
          available: editingVariant.available,
        })
      } else {
        const nextAvailableSize =
          potSizes.find((s) => !targetSpecies?.variants.some((v) => v.size === s)) || potSizes[0]

        setForm({
          size: nextAvailableSize,
          price: 0,
          quantity: 0,
          available: true,
        })
      }
    }
  }, [isOpen, editingVariant, targetSpecies, potSizes])

  const handleSubmit = () => {
    onSave(form)
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={isPending} variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} onClick={handleSubmit}>
            {editingVariant ? 'Guardar Cambios' : 'Crear Variante'}
          </Button>
        </>
      }
      icon={<PiStorefrontFill />}
      isOpen={isOpen}
      title={
        editingVariant
          ? `Editar Variante: ${targetSpecies?.name}`
          : `Nueva Variante: ${targetSpecies?.name}`
      }
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="v-size" label="Tamaño Maceta">
            <SelectDropdown
              disabled={!!editingVariant}
              id="v-size"
              options={potSizes.map((s) => ({
                value: s,
                label: potSizeLabels[s],
              }))}
              value={form.size}
              onChange={(val) => setForm((p) => ({ ...p, size: val as PotSize }))}
            />
          </FormField>

          <FormField htmlFor="v-price" label="Precio (Centavos USD)">
            <Input
              id="v-price"
              placeholder="Ej: 2500 (= $25.00)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="v-qty" label="Stock Disponible">
            <Input
              id="v-qty"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
            />
          </FormField>

          <div className="flex flex-col justify-end">
            <div
              className="input-base text-primary bg-surface dark:bg-canvas border-input-outline flex cursor-pointer items-center justify-between rounded-md border p-2"
              role="button"
              tabIndex={0}
              onClick={() => setForm((p) => ({ ...p, available: !p.available }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setForm((p) => ({ ...p, available: !p.available }))
                }
              }}
            >
              <span className="text-sm font-medium">Publicar en tienda</span>
              <div
                className={`h-4 w-8 rounded-full transition-colors ${form.available ? 'bg-emerald-500' : 'bg-red-400'} relative`}
              >
                <div
                  className={`absolute top-1 h-2 w-2 rounded-full bg-white transition-all ${form.available ? 'right-1' : 'left-1'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
