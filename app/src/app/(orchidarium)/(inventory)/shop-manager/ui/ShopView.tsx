'use client'

import type { PotSize } from '@package/database/enums'

import { useState, useTransition } from 'react'
import { PiStorefrontFill, PiWarningFill, PiCheckCircleFill } from 'react-icons/pi'
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md'

import {
  Modal,
  Button,
  Badge,
  Heading,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ActionMenu,
} from '@/components'
import { upsertVariant, deleteVariant, updateVariantStock } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

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
  _count: {
    plants: number
  }
}

interface ShopViewProps {
  initialData: SpeciesWithStoreData[]
}

const POT_SIZES: PotSize[] = ['NRO_5', 'NRO_7', 'NRO_10', 'NRO_14']

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────

export function ShopView({ initialData }: ShopViewProps) {
  const [data, setData] = useState<SpeciesWithStoreData[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetSpecies, setTargetSpecies] = useState<SpeciesWithStoreData | null>(null)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)

  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  // Form State
  const [form, setForm] = useState({
    size: POT_SIZES[0],
    price: 0,
    quantity: 0,
    available: true,
  })

  // ── Handlers de Modal ───────────────────────────────────────
  function openCreate(species: SpeciesWithStoreData) {
    setTargetSpecies(species)
    setEditingVariant(null)
    setForm({
      size: POT_SIZES.find((s) => !species.variants.some((v) => v.size === s)) || POT_SIZES[0],
      price: 0,
      quantity: 0,
      available: true,
    })
    setIsModalOpen(true)
  }

  function openEdit(species: SpeciesWithStoreData, variant: Variant) {
    setTargetSpecies(species)
    setEditingVariant(variant)
    setForm({
      size: variant.size,
      price: variant.price,
      quantity: variant.quantity,
      available: variant.available,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setTargetSpecies(null)
    setEditingVariant(null)
  }

  // ── Guardar Variante ────────────────────────────────────────
  function handleSave() {
    if (!targetSpecies) return

    startTransition(async () => {
      const result = await upsertVariant({
        id: editingVariant?.id,
        speciesId: targetSpecies.id,
        ...form,
      })

      if (!result.ok) {
        addToast(result.message ?? 'Error al guardar variante.', 'error')

        return
      }

      const savedVariant = result.variant as Variant

      setData((prev) =>
        prev.map((s) => {
          if (s.id !== targetSpecies.id) return s

          let newVariants = [...s.variants]

          if (editingVariant) {
            newVariants = newVariants.map((v) => (v.id === editingVariant.id ? savedVariant : v))
          } else {
            newVariants.push(savedVariant)
          }

          return { ...s, variants: newVariants.sort((a, b) => a.size.localeCompare(b.size)) }
        }),
      )

      addToast(editingVariant ? 'Variante actualizada.' : 'Variante añadida.', 'success')
      closeModal()
    })
  }

  // ── Eliminar Variante ───────────────────────────────────────
  function handleDelete(speciesId: string, variant: Variant) {
    if (!confirm(`¿Eliminar la variante ${variant.size} de esta especie?`)) return

    startTransition(async () => {
      const result = await deleteVariant(variant.id)

      if (!result.ok) {
        addToast(result.message ?? 'Error al eliminar.', 'error')

        return
      }

      setData((prev) =>
        prev.map((s) =>
          s.id === speciesId
            ? { ...s, variants: s.variants.filter((v) => v.id !== variant.id) }
            : s,
        ),
      )
      addToast('Variante eliminada comercialmente.', 'info')
    })
  }

  // ── Rápido Stock ───────────────────────────────────────────
  function handleQuickStock(variantId: string, speciesId: string, delta: number) {
    const species = data.find((s) => s.id === speciesId)
    const variant = species?.variants.find((v) => v.id === variantId)

    if (!variant) return

    const newQty = Math.max(0, variant.quantity + delta)

    startTransition(async () => {
      setData((prev) =>
        prev.map((s) => {
          if (s.id !== speciesId) return s

          return {
            ...s,
            variants: s.variants.map((v) => (v.id === variantId ? { ...v, quantity: newQty } : v)),
          }
        }),
      )

      const res = await updateVariantStock(variantId, newQty)

      if (!res.ok) {
        addToast('Error al actualizar stock sincronizado.', 'error')
      }
    })
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Header Limpio */}
      <Heading
        description="Administra precios, existencias y visibilidad online por especie"
        title="Gestor de Tienda"
      />

      <div className="text-secondary grid grid-cols-1 gap-6">
        {data.map((species) => (
          <Card key={species.id} className="bg-canvas border-input-outline group overflow-hidden">
            <CardHeader className="bg-surface border-input-outline border-b py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{species.genus.name}</Badge>
                    <span className="text-secondary text-xs opacity-60">
                      ID: {species.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <CardTitle className="text-primary text-xl">{species.name}</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <div className="tds-sm:flex hidden flex-col items-end">
                    <span className="text-primary font-mono text-sm font-bold">
                      {species._count.plants}
                    </span>
                    <span className="text-secondary text-[10px] uppercase opacity-60">
                      Inventario Real
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => openCreate(species)}>
                    <MdAdd className="mr-1.5 h-4 w-4" />
                    Añadir Variante
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="flex flex-col">
                {species.variants.length === 0 ? (
                  <div className="text-secondary/40 py-12 text-center text-sm italic">
                    No hay ofertas comerciales definidas para esta especie.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-input-outline border-b">
                          <th className="text-secondary px-6 py-4 text-left text-xs font-black tracking-widest uppercase opacity-60">
                            Tamaño
                          </th>
                          <th className="text-secondary px-6 py-4 text-left text-xs font-black tracking-widest uppercase opacity-60">
                            Precio
                          </th>
                          <th className="text-secondary px-6 py-4 text-left text-xs font-black tracking-widest uppercase opacity-60">
                            Stock Online
                          </th>
                          <th className="text-secondary px-6 py-4 text-left text-xs font-black tracking-widest uppercase opacity-60">
                            Estatus
                          </th>
                          <th className="px-6 py-4" />
                        </tr>
                      </thead>
                      <tbody className="divide-input-outline divide-y">
                        {species.variants.map((v) => (
                          <tr
                            key={v.id}
                            className="hover:bg-hover-overlay group/row transition-colors"
                          >
                            <td className="px-6 py-4">
                              <Badge className="font-mono" variant="secondary">
                                {v.size}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  ${(v.price / 100).toLocaleString()}
                                </span>
                                <span className="text-secondary text-[10px] opacity-40">USD</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`font-mono text-sm ${v.quantity < 5 ? 'font-black text-red-500' : 'text-primary font-bold'}`}
                                >
                                  {v.quantity} uds.
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    className="focus-visible:ring-accessibility bg-hover-overlay hover:bg-hover rounded p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                    type="button"
                                    onClick={() => handleQuickStock(v.id, species.id, -1)}
                                  >
                                    <span className="block h-3 w-3 text-center leading-none">
                                      -
                                    </span>
                                  </button>
                                  <button
                                    className="focus-visible:ring-accessibility bg-hover-overlay hover:bg-hover rounded p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                    type="button"
                                    onClick={() => handleQuickStock(v.id, species.id, 1)}
                                  >
                                    <span className="block h-3 w-3 text-center leading-none">
                                      +
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {v.available ? (
                                <Badge className="gap-1.5" variant="green">
                                  <PiCheckCircleFill className="h-3.5 w-3.5" /> Visible
                                </Badge>
                              ) : (
                                <Badge className="gap-1.5" variant="destructive">
                                  <PiWarningFill className="h-3.5 w-3.5" /> Pausado
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <ActionMenu
                                items={[
                                  {
                                    label: 'Editar Precios/Stock',
                                    icon: <MdEdit />,
                                    onClick: () => openEdit(species, v),
                                  },
                                  {
                                    label: 'Eliminar Variante',
                                    icon: <MdDelete />,
                                    onClick: () => handleDelete(species.id, v),
                                    variant: 'destructive',
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Upsert */}
      <Modal
        footer={
          <>
            <Button disabled={isPending} variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button isLoading={isPending} onClick={handleSave}>
              {editingVariant ? 'Guardar Cambios' : 'Crear Variante'}
            </Button>
          </>
        }
        icon={<PiStorefrontFill />}
        isOpen={isModalOpen}
        title={
          editingVariant
            ? `Editar Variante: ${targetSpecies?.name}`
            : `Nueva Variante: ${targetSpecies?.name}`
        }
        onClose={closeModal}
      >
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="v-size">
                Tamaño Maceta
              </label>
              <select
                className="input-base"
                disabled={!!editingVariant}
                id="v-size"
                value={form.size}
                onChange={(e) => setForm((p) => ({ ...p, size: e.target.value as PotSize }))}
              >
                {POT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="v-price">
                Precio (Centavos USD)
              </label>
              <input
                className="input-base font-mono"
                id="v-price"
                placeholder="Ej: 2500 (= $25.00)"
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="v-qty">
                Stock Disponible
              </label>
              <input
                className="input-base"
                id="v-qty"
                type="number"
                value={form.quantity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="flex flex-col justify-end">
              <div
                className="input-base flex cursor-pointer items-center justify-between"
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
    </div>
  )
}
