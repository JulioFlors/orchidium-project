'use client'

import type { PlantType } from '@package/database'

import { useEffect } from 'react'

import { StockSpeciesCard } from './components/StockSpeciesCard'

import { Heading, Title, Subtitle } from '@/components'

interface SpeciesImage {
  id: string
  url: string
}

interface Genus {
  id: string
  name: string
  type: PlantType
}

interface SpeciesWithStoreData {
  id: string
  name: string
  slug: string
  genus: Genus
  images: SpeciesImage[]
  glowColor?: string | null
  variants: Array<{ id: string }>
  _count: {
    plants: number
  }
}

interface StockViewProps {
  initialData: SpeciesWithStoreData[]
}

const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'Adeniums',
  BROMELIAD: 'Bromelias',
  CACTUS: 'Cactus',
  ORCHID: 'Orquídeas',
  SUCCULENT: 'Suculentas',
}

export function StockView({ initialData }: StockViewProps) {
  const speciesList = initialData

  // Scroll automático y enfoque a la especie modificada
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash

    if (!hash) return

    const targetId = hash.replace('#', '')
    const element = document.getElementById(targetId)

    if (element) {
      const imageTarget = element.querySelector('.focus-product-card') as HTMLElement | null
      const linkElement = element.querySelector('a') as HTMLElement | null

      const timer = setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })

        if (imageTarget) {
          imageTarget.classList.add('is-focused')
        }
        if (linkElement) {
          linkElement.focus({ preventScroll: true })
        }

        const clearTimer = setTimeout(() => {
          if (imageTarget) {
            imageTarget.classList.remove('is-focused')
          }
          if (linkElement && document.activeElement === linkElement) {
            linkElement.blur()
          }
        }, 3000)

        return () => clearTimeout(clearTimer)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [])

  // Agrupación por PlantType y Genus
  const speciesByType = speciesList.reduce<
    Record<PlantType, Record<string, SpeciesWithStoreData[]>>
  >(
    (acc, species) => {
      const type = species.genus.type
      const genusId = species.genus.name

      if (!acc[type]) acc[type] = {}
      if (!acc[type][genusId]) acc[type][genusId] = []
      acc[type][genusId].push(species)

      return acc
    },
    {} as Record<PlantType, Record<string, SpeciesWithStoreData[]>>,
  )

  const sortedTypes = (Object.keys(speciesByType) as PlantType[]).sort((a, b) =>
    PLANT_TYPE_LABELS[a].localeCompare(PLANT_TYPE_LABELS[b], 'es'),
  )

  return (
    <div className="mt-9 flex w-full flex-col gap-8 pb-12">
      {/* Cabecera */}
      <Heading
        description="Gestión de inventario físico y variantes de venta por especie"
        title="Inventario y Stock"
      />

      {/* Grid del Inventario Estilo Catálogo / Tienda */}
      {speciesList.length === 0 ? (
        <div className="bg-canvas border-input-outline rounded-xl border border-dashed py-24 text-center">
          <span className="text-secondary text-sm">
            No hay especies registradas en el inventario.
          </span>
        </div>
      ) : (
        <div className="mt-4 flex flex-col">
          {sortedTypes.map((type) => {
            const generaInType = speciesByType[type]
            const sortedGeneraNames = Object.keys(generaInType).sort((a, b) =>
              a.localeCompare(b, 'es'),
            )

            return (
              <div key={type} className="flex flex-col pb-8 last:pb-0">
                {/* Encabezado de Tipo de Planta */}
                <Title className="ml-1" title={PLANT_TYPE_LABELS[type]} />

                {/* Sub-agrupación por Géneros */}
                <div className="flex flex-col gap-6">
                  {sortedGeneraNames.map((genusName) => {
                    const speciesInGenus = generaInType[genusName]
                    const sortedSpeciesInGenus = [...speciesInGenus].sort((a, b) =>
                      a.name.localeCompare(b.name, 'es'),
                    )

                    return (
                      <div key={genusName} className="flex flex-col">
                        <Subtitle className="ml-1 w-[calc(100%-8px)]! px-0" subtitle={genusName} />

                        {/* Listado de Especies */}
                        <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-2xl:grid-cols-4 mt-9 grid grid-cols-1 gap-x-4 gap-y-2">
                          {sortedSpeciesInGenus.map((species, speciesIndex) => (
                            <StockSpeciesCard
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
    </div>
  )
}
