'use client'

import type { PlantType } from '@package/database'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MdEdit, MdDelete, MdInfo, MdFolder, MdCategory, MdSpa } from 'react-icons/md'

import {
  CatalogSpeciesCard,
  TypeManagerModal,
  GenusFormModal,
  SpeciesFormModal,
} from './components'
import { EnvironmentCard } from '../../../(monitoring)/monitoring/ui/components/EnvironmentCard'
import { Heading, ActionMenu } from '@/components'
import { updateGenus, deleteGenus, createGenus, createSpecies } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'
import { useFormDraftStore } from '@/store'

// ─────────────────────────────────────────────────────────────
// Interfaces y Tipos
// ─────────────────────────────────────────────────────────────

interface SpeciesImage {
  id: string
  url: string
}

interface Genus {
  id: string
  name: string
  type: PlantType
}

interface Species {
  id: string
  name: string
  slug: string
  description: string | null
  genusId: string
  genus: Genus
  images: SpeciesImage[]
  glowColor?: string | null
  _count: {
    variants: number
    plants: number
  }
}

interface CatalogViewProps {
  initialSpecies: Species[]
  initialGenera: Genus[]
}

const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'Adeniums',
  BROMELIAD: 'Bromelias',
  CACTUS: 'Cactus',
  ORCHID: 'Orquídeas',
  SUCCULENT: 'Suculentas',
}

const PLANT_TYPE_SINGLE_LABELS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'Adenium Obesum',
  BROMELIAD: 'Bromelia',
  CACTUS: 'Cactus',
  ORCHID: 'Orquídea',
  SUCCULENT: 'Suculenta',
}

// ─────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────

export function CatalogView({ initialSpecies, initialGenera }: CatalogViewProps) {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  // Estados Locales
  const [speciesList, setSpeciesList] = useState<Species[]>(initialSpecies)
  const [generaList, setGeneraList] = useState<Genus[]>(initialGenera)

  // Modales
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [isGenusModalOpen, setIsGenusModalOpen] = useState(false)
  const [editingGenus, setEditingGenus] = useState<Genus | null>(null)

  // Estados para creación de Especie
  const [isSpeciesCreateModalOpen, setIsSpeciesCreateModalOpen] = useState(false)

  // Conteo Cuantitativo
  const totalSpecies = speciesList.length
  const totalGenera = generaList.length
  const totalTypes = Object.keys(PLANT_TYPE_LABELS).length

  // Agrupación de Especies por PlantType y Genus
  const speciesByType = speciesList.reduce<Record<PlantType, Record<string, Species[]>>>(
    (acc, species) => {
      const type = species.genus.type
      const genusId = species.genusId

      if (!acc[type]) {
        acc[type] = {}
      }
      if (!acc[type][genusId]) {
        acc[type][genusId] = []
      }
      acc[type][genusId].push(species)

      return acc
    },
    {} as Record<PlantType, Record<string, Species[]>>,
  )

  const sortedTypes = (Object.keys(speciesByType) as PlantType[]).sort((a, b) =>
    PLANT_TYPE_LABELS[a].localeCompare(PLANT_TYPE_LABELS[b]),
  )

  // Handlers para Géneros
  function openEditGenus(genus: Genus) {
    setEditingGenus(genus)
    setIsGenusModalOpen(true)
  }

  function handleSaveOrCreateGenus(name: string, type: PlantType) {
    if (editingGenus) {
      // Caso de Edición
      startTransition(async () => {
        const result = await updateGenus(editingGenus.id, {
          name: name.trim(),
          type: editingGenus.type, // Limitamos edición estrictamente al nombre
        })

        if (result.ok && result.genus) {
          addToast('Género actualizado correctamente.', 'success')
          // Actualizar en el estado local
          setGeneraList((prev) =>
            prev.map((g) => (g.id === editingGenus.id ? { ...g, name: name.trim() } : g)),
          )
          setSpeciesList((prev) =>
            prev.map((s) =>
              s.genusId === editingGenus.id
                ? { ...s, genus: { ...s.genus, name: name.trim() } }
                : s,
            ),
          )
          setIsGenusModalOpen(false)
          setEditingGenus(null)
        } else {
          addToast(result.message || 'Error al actualizar el género.', 'error')
        }
      })
    } else {
      // Caso de Creación
      startTransition(async () => {
        const result = await createGenus({
          name: name.trim(),
          type,
        })

        if (result.ok && result.genus) {
          addToast('Género creado con éxito.', 'success')
          setGeneraList((prev) => [...prev, result.genus as Genus])
          useFormDraftStore.getState().clearDraft('catalog-genus-form')
          setIsGenusModalOpen(false)
        } else {
          addToast(result.message || 'Error al crear el género.', 'error')
        }
      })
    }
  }

  function handleDeleteGenusClick(genus: Genus) {
    // Buscar si hay especies vinculadas localmente
    const speciesInGenusCount = speciesList.filter((s) => s.genusId === genus.id).length

    if (speciesInGenusCount > 0) {
      addToast(
        `Seguridad: No se puede eliminar el género "${genus.name}" porque tiene ${speciesInGenusCount} especie(s) asociada(s).`,
        'error',
      )

      return
    }

    if (!confirm(`¿Estás seguro de eliminar el género "${genus.name}"?`)) return

    startTransition(async () => {
      const result = await deleteGenus(genus.id)

      if (result.ok) {
        addToast('Género eliminado con éxito.', 'success')
        setGeneraList((prev) => prev.filter((g) => g.id !== genus.id))
      } else {
        addToast(result.message || 'Error al eliminar el género.', 'error')
      }
    })
  }

  // Handlers para Especies
  function openCreateSpecies() {
    setIsSpeciesCreateModalOpen(true)
  }

  function handleSaveSpecies(data: { name: string; genusId: string; description: string; glowColor: string }) {
    if (!data.name.trim()) {
      addToast('El nombre de la especie es obligatorio.', 'warning')
      return
    }
    if (!data.genusId) {
      addToast('Debes seleccionar un género.', 'warning')
      return
    }

    startTransition(async () => {
      const result = await createSpecies({
        name: data.name.trim(),
        genusId: data.genusId,
        description: data.description,
        glowColor: data.glowColor,
      })

      if (result.ok && result.species) {
        addToast('Especie creada con éxito.', 'success')
        const genusObj = generaList.find((g) => g.id === data.genusId)
        if (genusObj) {
          const newSpecies: Species = {
            id: result.species.id,
            name: result.species.name,
            slug: result.species.slug,
            description: result.species.description,
            genusId: result.species.genusId,
            genus: genusObj,
            images: [],
            glowColor: result.species.glowColor,
            _count: {
              variants: 0,
              plants: 0,
            },
          }
          setSpeciesList((prev) => [...prev, newSpecies])
        }
        useFormDraftStore.getState().clearDraft('catalog-species-form')
        setIsSpeciesCreateModalOpen(false)
        router.push(`/catalog/${result.species.id}`)
      } else {
        addToast(result.message || 'Error al crear la especie.', 'error')
      }
    })
  }

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* Cabecera */}
      <Heading
        description="Consolidación de la taxonomía del catálogo (tipos de plantas, géneros y especies)"
        title="Catálogo"
      />

      {/* Cards de Métricas e Interacciones rápidas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <EnvironmentCard
          className="md:col-span-1"
          color="purple"
          icon={<MdCategory className="h-6 w-6" />}
          title="Tipos de Plantas"
          unit="activos"
          value={totalTypes}
          onClick={() => setIsTypeModalOpen(true)}
        />
        <EnvironmentCard
          className="md:col-span-1"
          color="orange"
          icon={<MdFolder className="h-6 w-6" />}
          title="Géneros Registrados"
          unit="géneros"
          value={totalGenera}
          onClick={() => {
            setEditingGenus(null)
            setIsGenusModalOpen(true)
          }}
        />
        <EnvironmentCard
          className="md:col-span-2 lg:col-span-1"
          color="green"
          icon={<MdSpa className="h-6 w-6" />}
          title="Especies en Catálogo"
          unit="especies"
          value={totalSpecies}
          onClick={openCreateSpecies}
        />
      </div>

      {/* Grid del Catálogo Estilo Tienda */}
      {speciesList.length === 0 ? (
        <div className="bg-canvas border-input-outline rounded-xl border border-dashed py-24 text-center">
          <span className="text-secondary text-sm">No hay especies registradas en el catálogo.</span>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-12">
          {sortedTypes.map((type) => {
            const generaInType = speciesByType[type]
            const sortedGeneraIds = Object.keys(generaInType).sort((a, b) => {
              const nameA = generaInType[a][0]?.genus.name ?? ''
              const nameB = generaInType[b][0]?.genus.name ?? ''

              return nameA.localeCompare(nameB)
            })

            return (
              <div
                key={type}
                className="flex flex-col pb-8 last:pb-0"
              >
                {/* Título del Tipo de Planta con ActionMenu */}
                <div className="group relative z-8 flex items-center gap-2 mt-9">
                  <h2 className="text-primary text-2xl font-bold tracking-tighter antialiased leading-none">
                    {PLANT_TYPE_LABELS[type]}
                  </h2>
                  <ActionMenu
                    align="left"
                    hoverOnly={true}
                    items={[
                      {
                        label: 'Gestionar Tipo de Planta',
                        icon: <MdInfo />,
                        onClick: () => setIsTypeModalOpen(true),
                      }
                    ]}
                    triggerClassName="h-7 w-7"
                  />
                </div>

                {/* Sub-agrupación por Géneros */}
                <div className="flex flex-col gap-6">
                  {sortedGeneraIds.map((genusId) => {
                    const speciesInGenus = generaInType[genusId]
                    const firstSpecies = speciesInGenus[0]
                    const genusName = firstSpecies?.genus.name ?? 'Sin Género'
                    const genusObj = firstSpecies ? firstSpecies.genus : null

                    return (
                      <div key={genusId} className="flex flex-col">
                        <div className="group tds-xs:sticky tds-xs:backdrop-blur-lg top-14 z-7 flex items-center gap-2 bg-canvas/30 dark:bg-canvas/60 mt-8 ml-1 w-[calc(100%-8px)]! px-0">
                          <h3 className="text-primary text-xl font-medium tracking-wider antialiased leading-none py-4">
                            {genusName}
                          </h3>
                          {genusObj && (
                            <ActionMenu
                              align="left"
                              hoverOnly={true}
                              items={[
                                {
                                  label: 'Editar Nombre',
                                  icon: <MdEdit />,
                                  onClick: () => openEditGenus(genusObj),
                                },
                                {
                                  label: 'Eliminar Género',
                                  icon: <MdDelete />,
                                  variant: 'destructive',
                                  onClick: () => handleDeleteGenusClick(genusObj),
                                },
                              ]}
                              triggerClassName="h-7 w-7 mt-1.5"
                            />
                          )}
                        </div>

                        {/* Listado de Especies */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {speciesInGenus.map((species, speciesIndex) => (
                            <CatalogSpeciesCard
                              key={species.id}
                              index={speciesIndex}
                              species={species}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modales Extrayendo Lógica */}
      <TypeManagerModal
        isOpen={isTypeModalOpen}
        plantTypeSingleLabels={PLANT_TYPE_SINGLE_LABELS}
        onClose={() => setIsTypeModalOpen(false)}
      />

      <GenusFormModal
        editingGenus={editingGenus}
        isOpen={isGenusModalOpen}
        isPending={isPending}
        plantTypeLabels={PLANT_TYPE_LABELS}
        plantTypeSingleLabels={PLANT_TYPE_SINGLE_LABELS}
        onClose={() => {
          setIsGenusModalOpen(false)
          setEditingGenus(null)
        }}
        onSave={handleSaveOrCreateGenus}
      />

      <SpeciesFormModal
        generaList={generaList}
        isOpen={isSpeciesCreateModalOpen}
        isPending={isPending}
        plantTypeLabels={PLANT_TYPE_LABELS}
        onClose={() => setIsSpeciesCreateModalOpen(false)}
        onSave={handleSaveSpecies}
      />
    </div>
  )
}
