'use client'

import type { PotSize } from '@package/database/enums'

import { useState, useTransition } from 'react'
import { PiWarningFill, PiCheckCircleFill, PiCoinsFill, PiPackageFill } from 'react-icons/pi'
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md'

import { VariantFormModal } from './components'

import { Button, Badge, Card, CardHeader, CardTitle, CardContent, ActionMenu } from '@/components'
import { upsertVariant, deleteVariant, updateVariantStock } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

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

interface StockViewProps {
  initialData: SpeciesWithStoreData[]
}

const POT_SIZES: PotSize[] = ['NRO_5', 'NRO_7', 'NRO_10', 'NRO_14']

const POT_SIZE_LABELS: Record<PotSize, string> = {
  NRO_5: 'Maceta Nro 5',
  NRO_7: 'Maceta Nro 7',
  NRO_10: 'Maceta Nro 10',
  NRO_14: 'Maceta Nro 14',
}

export function StockView({ initialData }: StockViewProps) {
  const [data, setData] = useState<SpeciesWithStoreData[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetSpecies, setTargetSpecies] = useState<SpeciesWithStoreData | null>(null)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)

  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  // Handlers para Variante
  function openCreate(species: SpeciesWithStoreData) {
    setTargetSpecies(species)
    setEditingVariant(null)
    setIsModalOpen(true)
  }

  function openEdit(species: SpeciesWithStoreData, variant: Variant) {
    setTargetSpecies(species)
    setEditingVariant(variant)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setTargetSpecies(null)
    setEditingVariant(null)
  }

  function handleSave(formValues: {
    size: PotSize
    price: number
    quantity: number
    available: boolean
  }) {
    if (!targetSpecies) return

    startTransition(async () => {
      const result = await upsertVariant({
        id: editingVariant?.id,
        speciesId: targetSpecies.id,
        ...formValues,
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

  return (
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
                <CardTitle className="text-primary text-xl font-bold">{species.name}</CardTitle>
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {species.variants.map((v) => (
                  <div
                    key={v.id}
                    className="border-input-outline bg-surface/20 flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700"
                  >
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

                    <div className="flex flex-col gap-4 py-4">
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

      <VariantFormModal
        editingVariant={editingVariant}
        isOpen={isModalOpen}
        isPending={isPending}
        potSizeLabels={POT_SIZE_LABELS}
        potSizes={POT_SIZES}
        targetSpecies={targetSpecies}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  )
}
