'use client'

import type { PotSize, PlantStatus, ZoneType } from '@package/database/enums'

import { useState, useTransition } from 'react'
import { IoAddOutline } from 'react-icons/io5'

import {
  PlantInstanceCard,
  PlantInstance,
  VariantFormModal,
  PlantFormModal,
  StockPlantModal,
  FloweringEventModal,
  FloweringFormValues,
  ProductVariantCard,
} from './components'

import { SpeciesFloweringSection } from '@/app/(shop)/plant/[slug]/ui/SpeciesFloweringSection'
import { Heading, Button } from '@/components'
import {
  PotSizeLabels as POT_SIZE_LABELS,
  ZoneTypeLabels as ZONE_LABELS,
  sortVariantsByPotSizeAsc,
} from '@/config/mappings'
import {
  upsertVariant,
  deleteVariant,
  createPlant,
  updatePlant,
  deletePlant,
  createBatchPlants,
  createFloweringEvent,
  closeFloweringEvent,
} from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

interface Variant {
  id: string
  size: PotSize
  price: number
  quantity: number
  available: boolean
}

interface SpeciesDetail {
  id: string
  name: string
  slug: string
  description: string | null
  glowColor?: string | null
  genus: { id: string; name: string; type: string }
  images: Array<{ id: string; url: string; position: number }>
  variants: Variant[]
  plants: PlantInstance[]
}

interface StockDetailViewProps {
  species: SpeciesDetail
}

const POT_SIZES: PotSize[] = [
  'NRO_3',
  'NRO_5',
  'NRO_7',
  'NRO_8',
  'NRO_10',
  'NRO_12',
  'NRO_14',
  'NRO_15',
  'CT1',
  'CT2',
  'CT3',
  'CT4',
]

export function StockDetailView({ species: initialSpecies }: StockDetailViewProps) {
  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  const [species, setSpecies] = useState<SpeciesDetail>(initialSpecies)

  // Filtro activo en el Gemelo Digital
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string | null>(null)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null)

  // Estados de los Modales
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)

  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false)
  const [editingPlant, setEditingPlant] = useState<PlantInstance | null>(null)

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)

  const [isFloweringModalOpen, setIsFloweringModalOpen] = useState(false)
  const [floweringTargetPlant, setFloweringTargetPlant] = useState<PlantInstance | null>(null)

  // -------------------------------------------------------------
  // Lógica de Variantes (Comercial)
  // -------------------------------------------------------------
  function openCreateVariant() {
    setEditingVariant(null)
    setIsVariantModalOpen(true)
  }

  function openEditVariant(variant: Variant) {
    setEditingVariant(variant)
    setIsVariantModalOpen(true)
  }

  function handleSaveVariant(formValues: {
    size: PotSize
    price: number
    quantity: number
    available: boolean
  }) {
    startTransition(async () => {
      const result = await upsertVariant({
        id: editingVariant?.id,
        speciesId: species.id,
        ...formValues,
      })

      if (!result.ok) {
        addToast(result.message ?? 'Error al guardar variante.', 'error')

        return
      }

      const savedVariant = result.variant as Variant

      setSpecies((prev) => {
        let newVariants = [...prev.variants]

        if (editingVariant) {
          newVariants = newVariants.map((v) => (v.id === editingVariant.id ? savedVariant : v))
        } else {
          newVariants.push(savedVariant)
        }

        return { ...prev, variants: sortVariantsByPotSizeAsc(newVariants) }
      })

      addToast(editingVariant ? 'Variante actualizada.' : 'Variante añadida.', 'success')
      setIsVariantModalOpen(false)
      setEditingVariant(null)
    })
  }

  function handleDeleteVariant(variant: Variant) {
    if (!confirm(`¿Eliminar la variante ${variant.size}?`)) return

    startTransition(async () => {
      const result = await deleteVariant(variant.id)

      if (!result.ok) {
        addToast(result.message ?? 'Error al eliminar.', 'error')

        return
      }

      setSpecies((prev) => ({
        ...prev,
        variants: prev.variants.filter((v) => v.id !== variant.id),
      }))
    })
  }

  // -------------------------------------------------------------
  // Lógica del Gemelo Digital (Plantas Físicas)
  // -------------------------------------------------------------
  function openEditPlant(plant: PlantInstance) {
    setEditingPlant(plant)
    setIsPlantModalOpen(true)
  }

  function handleSaveSinglePlant(values: {
    size: PotSize
    status: PlantStatus
    zone: ZoneType
    origin?: string | null
    pottingDate?: string | null
  }) {
    startTransition(async () => {
      if (editingPlant) {
        const res = await updatePlant(editingPlant.id, {
          size: values.size,
          status: values.status,
          zone: values.zone,
          pottingDate: values.pottingDate,
        })

        if (!res.ok) {
          addToast(res.message ?? 'Error al actualizar la planta.', 'error')

          return
        }

        const updatedPlant = {
          ...(res.plant as PlantInstance),
          origin: values.origin !== undefined ? values.origin : editingPlant.origin,
        }

        setSpecies((prev) => ({
          ...prev,
          plants: prev.plants.map((p) => (p.id === editingPlant.id ? updatedPlant : p)),
        }))
        addToast('Planta física actualizada.', 'success')
      } else {
        const res = await createPlant({
          speciesId: species.id,
          size: values.size,
          status: values.status,
          zone: values.zone,
          pottingDate: values.pottingDate,
        })

        if (!res.ok) {
          addToast(res.message ?? 'Error al crear la planta.', 'error')

          return
        }

        const newPlant = {
          ...(res.plant as PlantInstance),
          origin: values.origin || 'Establecida',
        }

        setSpecies((prev) => ({
          ...prev,
          plants: [newPlant, ...prev.plants],
        }))
        addToast('Planta física añadida al inventario.', 'success')
      }

      setIsPlantModalOpen(false)
      setEditingPlant(null)
    })
  }

  function handleSaveBatchPlants(values: {
    zone: ZoneType
    eventType: string
    pottingDate?: string | null
    items: Array<{ size: PotSize; quantity: number; isMother: boolean }>
  }) {
    startTransition(async () => {
      const res = await createBatchPlants({
        speciesId: species.id,
        zone: values.zone,
        eventType: values.eventType,
        pottingDate: values.pottingDate,
        items: values.items,
      })

      if (!res.ok) {
        addToast(res.message ?? 'Error al crear lote masivo.', 'error')

        return
      }

      // Reemplazar el array completo de plantas con los datos frescos del servidor
      if (res.plants) {
        setSpecies((prev) => ({
          ...prev,
          plants: res.plants as PlantInstance[],
        }))
      }

      addToast(`Lote de ${res.count ?? 'múltiples'} plantas registrado con éxito.`, 'success')
      setIsBatchModalOpen(false)
    })
  }

  function handleDeletePlant(plant: PlantInstance) {
    if (!confirm(`¿Eliminar la planta #${plant.id.slice(-8).toUpperCase()}?`)) return

    startTransition(async () => {
      const res = await deletePlant(plant.id)

      if (!res.ok) {
        addToast(res.message ?? 'Error al eliminar la planta.', 'error')

        return
      }

      setSpecies((prev) => ({
        ...prev,
        plants: prev.plants.filter((p) => p.id !== plant.id),
      }))
    })
  }

  function handleOpenFlowering(plant: PlantInstance) {
    setFloweringTargetPlant(plant)
    setIsFloweringModalOpen(true)
  }

  function handleSaveFlowering(values: FloweringFormValues) {
    if (!floweringTargetPlant) return

    startTransition(async () => {
      if (values.eventId) {
        // Cierre de Floración Activa
        const res = await closeFloweringEvent({
          eventId: values.eventId,
          endDate: values.endDate!,
          notes: values.notes,
        })

        if (!res.ok) {
          addToast(res.message ?? 'Error al finalizar floración.', 'error')

          return
        }

        const updatedEvent = res.floweringEvent as {
          id: string
          startDate: Date | string
          endDate?: Date | string | null
          notes?: string | null
        }

        setSpecies((prev) => ({
          ...prev,
          plants: prev.plants.map((p) =>
            p.id === floweringTargetPlant.id
              ? {
                  ...p,
                  FloweringEvent: (p.FloweringEvent || []).map((e) =>
                    e.id === values.eventId ? updatedEvent : e,
                  ),
                }
              : p,
          ),
        }))

        addToast('Floración finalizada correctamente.', 'success')
      } else {
        // Registro de Nueva Floración (En Curso o Completa)
        const res = await createFloweringEvent({
          plantId: floweringTargetPlant.id,
          startDate: values.startDate,
          endDate: values.endDate,
          notes: values.notes,
        })

        if (!res.ok) {
          addToast(res.message ?? 'Error al registrar floración.', 'error')

          return
        }

        const newEvent = res.floweringEvent as {
          id: string
          startDate: Date | string
          endDate?: Date | string | null
          notes?: string | null
        }

        setSpecies((prev) => ({
          ...prev,
          plants: prev.plants.map((p) =>
            p.id === floweringTargetPlant.id
              ? { ...p, FloweringEvent: [newEvent, ...(p.FloweringEvent || [])] }
              : p,
          ),
        }))

        addToast('Evento de floración registrado correctamente.', 'success')
      }

      setIsFloweringModalOpen(false)
      setFloweringTargetPlant(null)
    })
  }

  // Cómputos para la Columna Izquierda (Estadísticas por Zona y Estado)
  const totalPlantsCount = species.plants.length
  const motherPlantsCount = species.plants.filter((p) => p.status === 'MOTHER').length
  const availablePlantsCount = species.plants.filter((p) => p.status === 'AVAILABLE').length
  const floweringPlantsCount = species.plants.filter(
    (p) => p.FloweringEvent && p.FloweringEvent.some((e) => !e.endDate),
  ).length

  // Conteo por Zonas
  const zoneCounts: Record<string, number> = {}

  species.plants.forEach((p) => {
    const z = p.location?.zone || 'SIN_UBICACION'

    zoneCounts[z] = (zoneCounts[z] || 0) + 1
  })

  // Filtrado de plantas físicas para el Gemelo Digital
  const filteredPlants = species.plants.filter((p) => {
    if (selectedZoneFilter && (p.location?.zone || 'SIN_UBICACION') !== selectedZoneFilter) {
      return false
    }
    if (selectedStatusFilter === 'MOTHER' && p.status !== 'MOTHER') {
      return false
    }
    if (selectedStatusFilter === 'AVAILABLE' && p.status !== 'AVAILABLE') {
      return false
    }
    if (
      selectedStatusFilter === 'FLOWERING' &&
      (!p.FloweringEvent || !p.FloweringEvent.some((e) => !e.endDate))
    ) {
      return false
    }

    return true
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Header Contextual Estandarizado */}
      <Heading
        action={
          <Button variant="primary" onClick={() => setIsBatchModalOpen(true)}>
            <IoAddOutline className="mr-1.5 size-5" /> Nuevo Ejemplar
          </Button>
        }
        title={species.name}
      />

      {/* Grid Superior de 2 Columnas */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Izquierda: Métricas de Inventario y Zonas (lg:col-span-1) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Card de Resumen de Inventario (InventoryMetricsCard) */}
          <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-5">
            <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <h2 className="text-primary text-base font-bold">Inventario</h2>
            </div>

            <div className="tds-xs:grid-cols-2 grid grid-cols-1 gap-3">
              <button
                className={`flex flex-col items-center justify-center rounded-lg p-3 text-center transition-all ${
                  selectedStatusFilter === null
                    ? 'border border-indigo-500/40 bg-indigo-500/10'
                    : 'bg-surface hover:bg-hover-overlay border border-transparent'
                }`}
                type="button"
                onClick={() => setSelectedStatusFilter(null)}
              >
                <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {totalPlantsCount}
                </span>
                <span className="text-secondary mt-0.5 text-[11px] font-semibold tracking-wider uppercase opacity-70">
                  Total
                </span>
              </button>

              <button
                className={`flex flex-col items-center justify-center rounded-lg p-3 text-center transition-all ${
                  selectedStatusFilter === 'MOTHER'
                    ? 'border border-rose-500/40 bg-rose-500/10'
                    : 'bg-surface hover:bg-hover-overlay border border-transparent'
                }`}
                type="button"
                onClick={() =>
                  setSelectedStatusFilter(selectedStatusFilter === 'MOTHER' ? null : 'MOTHER')
                }
              >
                <span className="font-mono text-xl font-bold text-rose-700 dark:text-rose-400">
                  {motherPlantsCount}
                </span>
                <span className="text-secondary mt-0.5 text-[11px] font-semibold tracking-wider uppercase opacity-70">
                  Madres
                </span>
              </button>

              <button
                className={`flex flex-col items-center justify-center rounded-lg p-3 text-center transition-all ${
                  selectedStatusFilter === 'AVAILABLE'
                    ? 'border border-violet-500/40 bg-violet-500/10'
                    : 'bg-surface hover:bg-hover-overlay border border-transparent'
                }`}
                type="button"
                onClick={() =>
                  setSelectedStatusFilter(selectedStatusFilter === 'AVAILABLE' ? null : 'AVAILABLE')
                }
              >
                <span className="font-mono text-xl font-bold text-violet-600 dark:text-violet-400">
                  {availablePlantsCount}
                </span>
                <span className="text-secondary mt-0.5 text-[11px] font-semibold tracking-wider uppercase opacity-70">
                  Tienda
                </span>
              </button>

              <button
                className={`flex flex-col items-center justify-center rounded-lg p-3 text-center transition-all ${
                  selectedStatusFilter === 'FLOWERING'
                    ? 'border border-fuchsia-500/40 bg-fuchsia-500/10'
                    : 'bg-surface hover:bg-hover-overlay border border-transparent'
                }`}
                type="button"
                onClick={() =>
                  setSelectedStatusFilter(selectedStatusFilter === 'FLOWERING' ? null : 'FLOWERING')
                }
              >
                <span className="font-mono text-xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                  {floweringPlantsCount}
                </span>
                <span className="text-secondary mt-0.5 text-[11px] font-semibold tracking-wider uppercase opacity-70">
                  Floración
                </span>
              </button>
            </div>
          </div>

          {/* Card de Ubicación Física por Zonas */}
          <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <h2 className="text-primary text-base font-bold">Distribución por Zonas</h2>
              {selectedZoneFilter && (
                <button
                  className="bg-surface hover:bg-hover-overlay border-input-outline text-secondary hover:text-primary cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors"
                  type="button"
                  onClick={() => setSelectedZoneFilter(null)}
                >
                  Limpiar Filtro
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {Object.entries(ZONE_LABELS)
                .filter(([zoneKey]) => (zoneCounts[zoneKey] || 0) > 0)
                .map(([zoneKey, zoneAlias]) => {
                  const count = zoneCounts[zoneKey] || 0
                  const isSelected = selectedZoneFilter === zoneKey

                  return (
                    <button
                      key={zoneKey}
                      className={`flex items-center justify-between rounded-lg p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border border-emerald-500/40 bg-emerald-500/10'
                          : 'bg-surface/50 hover:bg-hover-overlay border border-transparent'
                      }`}
                      type="button"
                      onClick={() => setSelectedZoneFilter(isSelected ? null : zoneKey)}
                    >
                      <span className="text-primary text-xs font-semibold">{zoneAlias}</span>
                      <span className="text-secondary font-mono text-xs font-bold">{count}</span>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Ofertas Comerciales (lg:col-span-2) */}
        <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-xl border p-6 lg:col-span-2">
          <Heading
            action={
              <Button size="sm" variant="ghost" onClick={openCreateVariant}>
                <IoAddOutline className="mr-1.5 size-5" />
                Añadir
              </Button>
            }
            title="Variantes"
          />

          {species.variants.length === 0 ? (
            <div className="text-secondary py-8 text-center text-xs italic opacity-60">
              No hay precios por tamaño configurados para esta especie.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 tds-xl:grid-cols-3">
              {sortVariantsByPotSizeAsc(species.variants).map((v) => (
                <ProductVariantCard
                  key={v.id}
                  variant={v}
                  onDelete={handleDeleteVariant}
                  onEdit={openEditVariant}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sección de Analítica de Floración de la Especie */}
      {species.slug && (
        <div className="w-full">
          <SpeciesFloweringSection fullWidth speciesSlug={species.slug} />
        </div>
      )}

      {/* Sección Inferior: Ejemplares Físicos */}
      <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-xl border p-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/50">
          <h2 className="text-primary text-xl font-extrabold tracking-tight">Ejemplares</h2>
        </div>

        {/* Cuadrícula de Tarjetas Responsivas PlantInstanceCard */}
        {filteredPlants.length === 0 ? (
          <div className="bg-surface/30 border-input-outline flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <p className="text-secondary px-4 text-xs">
              No se encontraron ejemplares físicos registrados que coincidan con los filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 tds-sm:grid-cols-3 tds-lg:grid-cols-4 gap-4">
            {filteredPlants.map((plant) => (
              <PlantInstanceCard
                key={plant.id}
                plant={plant}
                potSizeLabels={POT_SIZE_LABELS}
                zoneLabels={ZONE_LABELS}
                onDelete={handleDeletePlant}
                onEdit={openEditPlant}
                onFlowering={handleOpenFlowering}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <VariantFormModal
        editingVariant={editingVariant}
        isOpen={isVariantModalOpen}
        isPending={isPending}
        potSizeLabels={POT_SIZE_LABELS}
        potSizes={POT_SIZES}
        targetSpecies={{ id: species.id, name: species.name }}
        onClose={() => setIsVariantModalOpen(false)}
        onSave={handleSaveVariant}
      />

      <PlantFormModal
        availableSizes={species.variants.map((v) => v.size)}
        editingPlant={editingPlant}
        isOpen={isPlantModalOpen}
        isPending={isPending}
        potSizeLabels={POT_SIZE_LABELS}
        potSizes={POT_SIZES}
        zoneLabels={ZONE_LABELS}
        onClose={() => setIsPlantModalOpen(false)}
        onSave={handleSaveSinglePlant}
      />

      <StockPlantModal
        isOpen={isBatchModalOpen}
        isPending={isPending}
        potSizeLabels={POT_SIZE_LABELS}
        potSizes={POT_SIZES}
        zoneLabels={ZONE_LABELS}
        onClose={() => setIsBatchModalOpen(false)}
        onSave={handleSaveBatchPlants}
      />

      <FloweringEventModal
        isOpen={isFloweringModalOpen}
        isPending={isPending}
        targetPlant={floweringTargetPlant}
        onClose={() => setIsFloweringModalOpen(false)}
        onSave={handleSaveFlowering}
      />
    </div>
  )
}
