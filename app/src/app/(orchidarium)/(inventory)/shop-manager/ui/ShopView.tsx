'use client'

import type { PotSize } from '@package/database/enums'

import clsx from 'clsx'
import { useState, useTransition } from 'react'
import {
  PiStorefrontFill,
  PiWarningFill,
  PiCheckCircleFill,
  PiCoinsFill,
  PiPackageFill,
  PiStarBold,
  PiStarFill,
} from 'react-icons/pi'
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
import { upsertVariant, deleteVariant, updateVariantStock, toggleSpeciesFeatured } from '@/actions'
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
  isFeatured: boolean
  _count: {
    plants: number
  }
}

interface ShopViewProps {
  initialData: SpeciesWithStoreData[]
}

const POT_SIZES: PotSize[] = ['NRO_5', 'NRO_7', 'NRO_10', 'NRO_14']

const POT_SIZE_LABELS: Record<PotSize, string> = {
  NRO_5: 'Maceta Nro 5',
  NRO_7: 'Maceta Nro 7',
  NRO_10: 'Maceta Nro 10',
  NRO_14: 'Maceta Nro 14',
}

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

  // ── Alternar Destacado ─────────────────────────────────────
  function handleToggleFeatured(speciesId: string, currentFeatured: boolean) {
    const nextFeatured = !currentFeatured

    // Actualización optimista
    setData((prev) =>
      prev.map((s) => (s.id === speciesId ? { ...s, isFeatured: nextFeatured } : s)),
    )

    startTransition(async () => {
      const result = await toggleSpeciesFeatured(speciesId, nextFeatured)

      if (!result.ok) {
        // Rollback en caso de error
        setData((prev) =>
          prev.map((s) => (s.id === speciesId ? { ...s, isFeatured: currentFeatured } : s)),
        )
        addToast(result.message ?? 'Error al actualizar destacado.', 'error')
      } else {
        addToast(
          nextFeatured ? 'Especie destacada (más vendida).' : 'Especie quitada de destacados.',
          'success',
        )
      }
    })
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* Header */}
      <Heading
        description="Administra precios, existencias y visibilidad online por especie"
        title="Gestor de Tienda"
      />

      <div className="flex flex-col gap-8">
        {data.map((species) => (
          <Card key={species.id} className="bg-canvas border-input-outline overflow-hidden">
            <CardHeader className="bg-surface/50 border-input-outline border-b px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{species.genus.name}</Badge>
                    <span className="text-secondary font-mono text-[10px] opacity-40">
                      ID: {species.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-primary text-xl font-bold">{species.name}</CardTitle>
                    <button
                      className={clsx(
                        'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200',
                        species.isFeatured
                          ? 'border-yellow-400 bg-yellow-400/10 text-yellow-500 dark:border-yellow-500/50 dark:bg-yellow-500/10 dark:text-yellow-400'
                          : 'border-input-outline text-secondary opacity-60 hover:border-zinc-300 hover:bg-zinc-100 hover:opacity-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800',
                      )}
                      title={
                        species.isFeatured
                          ? 'Quitar de destacados (más vendidos)'
                          : 'Destacar especie (más vendidos)'
                      }
                      type="button"
                      onClick={() => handleToggleFeatured(species.id, species.isFeatured)}
                    >
                      {species.isFeatured ? (
                        <PiStarFill className="h-4 w-4" />
                      ) : (
                        <PiStarBold className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-primary font-mono text-sm font-bold">
                      {species._count.plants}
                    </span>
                    <span className="text-secondary text-[10px] font-semibold tracking-wider uppercase opacity-55">
                      Inventario Físico
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => openCreate(species)}>
                    <MdAdd className="mr-1.5 h-4 w-4" />
                    Añadir Variante
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {species.variants.length === 0 ? (
                <div className="text-secondary/50 py-8 text-center text-sm italic">
                  No hay ofertas comerciales configuradas para esta especie.
                </div>
              ) : (
                /* Grid de Variantes en lugar de tabla */
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {species.variants.map((v) => (
                    <div
                      key={v.id}
                      className="border-input-outline bg-surface/20 flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700"
                    >
                      {/* Fila Superior: Tamaño y Menu de Acciones */}
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
                        <Badge className="text-xs font-semibold" variant="secondary">
                          {POT_SIZE_LABELS[v.size]}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {v.available ? (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                          )}
                          <ActionMenu
                            items={[
                              {
                                label: 'Editar Variante',
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
                        </div>
                      </div>

                      {/* Cuerpo: Precio y Stock */}
                      <div className="flex flex-col gap-4 py-4">
                        {/* Precio */}
                        <div className="flex items-center gap-2">
                          <PiCoinsFill className="text-lg text-emerald-500 opacity-80" />
                          <div className="flex flex-col">
                            <span className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                              $
                              {(v.price / 100).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-secondary text-[9px] font-semibold uppercase opacity-40">
                              Precio Online
                            </span>
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PiPackageFill
                              className={`text-lg opacity-80 ${v.quantity < 5 ? 'text-red-500' : 'text-zinc-500'}`}
                            />
                            <div className="flex flex-col">
                              <span
                                className={`font-mono text-sm font-bold ${v.quantity < 5 ? 'font-black text-red-500' : 'text-primary'}`}
                              >
                                {v.quantity} unidades
                              </span>
                              <span className="text-secondary text-[9px] font-semibold uppercase opacity-40">
                                Stock Digital
                              </span>
                            </div>
                          </div>

                          {/* Controles rápidos de Stock */}
                          <div className="bg-canvas flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5 shadow-sm dark:border-zinc-800">
                            <button
                              className="hover:bg-hover-overlay text-secondary flex h-7 w-7 items-center justify-center rounded font-mono text-sm font-bold transition-colors focus:outline-none"
                              type="button"
                              onClick={() => handleQuickStock(v.id, species.id, -1)}
                            >
                              -
                            </button>
                            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                            <button
                              className="hover:bg-hover-overlay text-secondary flex h-7 w-7 items-center justify-center rounded font-mono text-sm font-bold transition-colors focus:outline-none"
                              type="button"
                              onClick={() => handleQuickStock(v.id, species.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Estatus */}
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800/50">
                        <span className="text-secondary text-[10px] font-medium opacity-50">
                          Visibilidad
                        </span>
                        {v.available ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <PiCheckCircleFill className="h-3.5 w-3.5" /> Visible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                            <PiWarningFill className="h-3.5 w-3.5" /> Pausado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    {POT_SIZE_LABELS[s]}
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
