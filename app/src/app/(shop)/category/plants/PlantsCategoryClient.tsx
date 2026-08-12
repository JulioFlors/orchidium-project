'use client'

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
  return (
    <>
      {initialCategoriesData.map((data, catIndex) => {
        const sortedGenera = Object.entries(data.speciesByGenus).sort(([genusA], [genusB]) =>
          genusA.localeCompare(genusB, 'es'),
        )

        const categoryFloweringSpecies = Object.values(data.speciesByGenus)
          .flat()
          .filter((species) => species.isFlowering)
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))

        const hasFlowering = categoryFloweringSpecies.length > 0

        return (
          <div
            key={data.category.slug}
            className="scroll-mt-30"
            id={catIndex === 0 ? 'main-content' : undefined}
          >
            <Title className={`ml-1 ${catIndex > 0 ? 'mt-0!' : ''}`} title={data.category.name} />

            {hasFlowering && (
              <div className="scroll-mt-15" id={`floracion-${data.category.slug}`}>
                <Subtitle className="ml-1 w-[calc(100%-8px)]! px-0" subtitle="Floración" />

                <ProductGrid index={catIndex === 0 ? 0 : -1} products={categoryFloweringSpecies} />
              </div>
            )}

            {sortedGenera.map(([genus, species], groupIndex) => {
              const sortedSpecies = [...species].sort((a, b) => a.name.localeCompare(b.name, 'es'))

              return (
                <div key={genus} className="scroll-mt-15" id={genus.toLowerCase()}>
                  <Subtitle className="ml-1 w-[calc(100%-8px)]! px-0" subtitle={genus} />

                  <ProductGrid
                    index={catIndex === 0 && !hasFlowering && groupIndex === 0 ? 0 : -1}
                    products={sortedSpecies}
                  />
                </div>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
