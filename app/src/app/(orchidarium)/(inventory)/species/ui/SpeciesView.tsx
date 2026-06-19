'use client'

import type { PlantType } from '@package/database'

import { useRouter } from 'next/navigation'
import { MdAdd } from 'react-icons/md'

import { SpeciesInventoryCard } from './SpeciesInventoryCard'

import { Button, Heading, Title, Subtitle } from '@/components'

// ─────────────────────────────────────────────────────────────
// Tipos
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
  _count: {
    variants: number
    plants: number
  }
}

interface SpeciesViewProps {
  initialSpecies: Species[]
  genera: Genus[]
}

const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'Adeniums',
  BROMELIAD: 'Bromelias',
  CACTUS: 'Cactus',
  ORCHID: 'Orquídeas',
  SUCCULENT: 'Suculentas',
}

// ─────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────

export function SpeciesView({ initialSpecies }: SpeciesViewProps) {
  const router = useRouter()
  const speciesList = initialSpecies

  // 1. Agrupar por PlantType
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

  // Ordenamos los tipos de plantas
  const sortedTypes = (Object.keys(speciesByType) as PlantType[]).sort((a, b) =>
    PLANT_TYPE_LABELS[a].localeCompare(PLANT_TYPE_LABELS[b]),
  )

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* Header */}
      <Heading
        action={
          <Button id="btn-create-species" size="sm" onClick={() => router.push('/species/new')}>
            <MdAdd className="mr-1.5 h-4 w-4" />
            Nueva Especie
          </Button>
        }
        description={`${speciesList.length} especies registradas en el catálogo biológico`}
        title="Catálogo de Especies"
      />

      {speciesList.length === 0 ? (
        <div className="bg-canvas border-input-outline rounded-xl border border-dashed py-24 text-center">
          <span className="text-secondary text-sm">No hay especies registradas.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
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
                className="flex flex-col border-b border-zinc-100 pb-8 last:border-none last:pb-0 dark:border-zinc-800/50"
              >
                {/* Título de PlantType */}
                <Title className="ml-1" title={PLANT_TYPE_LABELS[type]} />

                {/* Sub-agrupación por Géneros */}
                <div className="flex flex-col">
                  {sortedGeneraIds.map((genusId) => {
                    const speciesInGenus = generaInType[genusId]
                    const genusName = speciesInGenus[0]?.genus.name ?? 'Sin Género'

                    return (
                      <div key={genusId} className="flex flex-col">
                        <Subtitle className="ml-1 w-[calc(100%-8px)]! px-0" subtitle={genusName} />

                        {/* Grid de Cards */}
                        <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-2xl:grid-cols-4 mt-9 grid gap-x-4 gap-y-2">
                          {speciesInGenus.map((species, i) => (
                            <SpeciesInventoryCard key={species.id} index={i} species={species} />
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
    </div>
  )
}
