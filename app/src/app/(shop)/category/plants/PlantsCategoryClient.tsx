'use client'

import { useState, useEffect } from 'react'

import { ProductGrid, Title, Subtitle } from '@/components'
import { getPaginatedSpeciesWithImages } from '@/actions'
import { PlantType, ShopRoute, Species, ShopCategory } from '@/interfaces'

// Re-using the slug to plant type mapping
const slugToPlantType: Record<string, PlantType> = {
  orchids: 'ORCHID',
  adenium_obesum: 'ADENIUM_OBESUM',
  cactus: 'CACTUS',
  succulents: 'SUCCULENT',
  bromeliads: 'BROMELIAD',
}

interface Props {
  route: ShopRoute
}

interface CategorySection {
  category: ShopCategory
  speciesByGenus: Record<string, Species[]>
}

export default function PlantsCategoryClient({ route }: Props) {
  const [categoriesData, setCategoriesData] = useState<CategorySection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInitialData() {
      // For each category in the route, fetch its first page
      const initialData = await Promise.all(
        (route.categories || []).map(async (category) => {
          const type = slugToPlantType[category.slug.toLowerCase()]

          if (!type) return null

          const { species } = await getPaginatedSpeciesWithImages({
            plantType: type,
            take: 50, // Large enough for initial view
            page: 1,
          })

          if (species.length === 0) return null

          // Group by genus
          const speciesByGenus = species.reduce((acc: Record<string, Species[]>, s) => {
            const genus = s.genus.name

            if (!acc[genus]) acc[genus] = []
            acc[genus].push(s as unknown as Species)

            return acc
          }, {})

          return {
            category,
            speciesByGenus,
          }
        }),
      )

      setCategoriesData(initialData.filter((item): item is CategorySection => item !== null))

      setLoading(false)
    }

    loadInitialData()
  }, [route])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />

        <span className="text-secondary mt-4 animate-pulse text-sm font-medium">Cargando</span>
      </div>
    )
  }

  return (
    <>
      {categoriesData.map((data, catIndex) => (
        <div
          key={data.category.slug}
          className="scroll-mt-30"
          id={catIndex === 0 ? 'main-content' : undefined}
        >
          <Title className={`ml-1 ${catIndex > 0 ? 'mt-0!' : ''}`} title={data.category.name} />

          {Object.entries(data.speciesByGenus).map(([genus, species], groupIndex) => (
            <div key={genus} className="scroll-mt-15" id={genus.toLowerCase()}>
              <Subtitle className="ml-1 w-[calc(100%-8px)]! px-0" subtitle={genus} />

              <ProductGrid index={catIndex === 0 && groupIndex === 0 ? 0 : -1} products={species} />
            </div>
          ))}
        </div>
      ))}

      <div className="py-10 text-center">
        <span className="text-secondary text-[10px] font-bold tracking-widest uppercase opacity-30">
          Mostrando especies disponibles
        </span>
      </div>
    </>
  )
}
