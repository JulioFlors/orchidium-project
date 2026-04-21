'use client'

import { useMemo } from 'react'

import { ProductGrid, Title, Subtitle } from '@/components'
import { Species, ShopRoute, ShopCategory } from '@/interfaces'

interface CategorySection {
  category: ShopCategory
  speciesByGenus: Record<string, Species[]>
}

interface Props {
  route: ShopRoute
  initialCategoriesData: CategorySection[]
}

export default function PlantsCategoryClient({ initialCategoriesData }: Props) {
  // Extraemos todas las especies que están en floración de todas las subcategorías
  const floweringSpecies = useMemo(() => {
    return initialCategoriesData
      .flatMap((data) => Object.values(data.speciesByGenus).flat())
      .filter((species) => species.isFlowering)
  }, [initialCategoriesData])

  return (
    <>
      {/* Sección destacada: En Floración (Solo si hay ejemplares) */}
      {floweringSpecies.length > 0 && (
        <div className="mb-12 scroll-mt-30">
          <Title className="ml-1 text-pink-500!" title="En Floración" />
          <Subtitle
            className="ml-1 w-[calc(100%-8px)]! px-0"
            subtitle="Ejemplares listos para disfrutar su belleza máxima"
          />
          <ProductGrid index={0} products={floweringSpecies} />

          <div className="mx-1 mt-8 border-b border-white/5" />
        </div>
      )}

      {initialCategoriesData.map((data, catIndex) => (
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
