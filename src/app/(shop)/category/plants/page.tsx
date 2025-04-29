import { notFound } from 'next/navigation'

import { staticRoutes } from '@/config'
import { ProductGrid, Title, Subtitle } from '@/components'
import { Genus, Route } from '@/interfaces'
import { initialData } from '@/seed'

const seedGenus = initialData.genus
const seedSpecies = initialData.species

export default function PlantasCategoryPage() {
  // Seleccionar la ruta para "plants"
  const route: Route | undefined = staticRoutes.find((route) => route.slug === 'plants')

  // Si no existe, mostrar 404
  if (!route) {
    notFound()
  }

  // Mapeo para relacionar el categoty.slug con el 'type' del género
  const routeWrapper: Record<string, string> = {
    orchids: 'orchid',
    adenium_obesum: 'adenium_obesum',
    cactus: 'cactus',
    succulents: 'succulent',
  }

  return (
    <>
      {route.categories?.map((category, catIndex) => {
        // Encontrar los GRUPOS (géneros) que pertenecen a ESTA categoría
        const groupsInCategory: Genus[] = seedGenus.filter(
          (gen) => gen.type.toLowerCase() === routeWrapper[category.slug],
        )

        // Si no hay géneros para esta categoría, no mostrar nada para ella
        if (groupsInCategory.length === 0) {
          return null
        }

        return (
          <div key={category.slug}>
            {/* Mostrar título de la CATEGORÍA */}
            <Title className={`ml-1 ${catIndex > 0 ? '!mt-0' : ''}`} title={category.name} />

            {/* Iterar sobre cada GRUPO (género) dentro de la Categoría */}
            {groupsInCategory.map((group, groupIndex) => {
              // Encontrar los PRODUCTOS (especies) que pertenecen a ESTE grupo
              const speciesInGroup = seedSpecies.filter(
                (sp) => sp.genus.name.toLowerCase() === group.name.toLowerCase(),
              )

              // Si no hay especies para este género, no mostrar la sección
              if (speciesInGroup.length === 0) {
                return null
              }

              return (
                <div key={group.name}>
                  {/* Mostrar título del GRUPO */}
                  <Subtitle className="ml-1 !w-[calc(100%-8px)] px-0" subtitle={group.name} />

                  {/* Mostrar grid de productos para este grupo */}
                  <ProductGrid
                    index={catIndex === 0 && groupIndex === 0 ? 0 : -1}
                    products={speciesInGroup}
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
