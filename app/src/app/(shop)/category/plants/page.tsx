import { notFound } from 'next/navigation'

import { ProductGrid, Title, Subtitle } from '@/components'
import { getAllSpeciesWithImages } from '@/actions'
import { PlantType, Route } from '@/interfaces'
import { staticRoutes } from '@/config'

// Awaited<...> se utiliza para obtener el tipo de retorno de una promesa.
// inferido directamente del retorno del server action.
type SpeciesWithGenus = Awaited<ReturnType<typeof getAllSpeciesWithImages>>[0]

// Mapeo para traducir el 'slug' (usado en la configuración de rutas)
// al valor exacto del 'enum PlantType' (usado en la base de datos).
const slugToPlantType: Record<string, PlantType> = {
  orchids: 'Orchid',
  adenium_obesum: 'Adenium_Obesum',
  cactus: 'Cactus',
  succulents: 'Succulent',
  bromeliads: 'Bromeliad',
}

export default async function PlantsCategoryPage() {
  // Obtenemos la información de la ruta estática
  const route: Route | undefined = staticRoutes.find((route) => route.slug === 'plants')

  // Si no existe, mostrar 404
  if (!route) {
    notFound()
  }

  // Se invoca el server action para obtener todas las especies.
  const allSpecies = await getAllSpeciesWithImages()

  return (
    <>
      {route.categories?.map((category, catIndex) => {
        // Traducimos el slug al PlantType correspondiente a esta categoría del bucle
        const currentPlantType = slugToPlantType[category.slug.toLowerCase()]

        // Si el slug no tiene un mapeo válido, simplemente no mostramos esta categoría.
        if (!currentPlantType) {
          return null
        }

        // Filtramos la lista completa de especies para obtener solo las de la categoría actual.
        const speciesInCategory = allSpecies.filter(
          (specie) => specie.genus.type === currentPlantType,
        )

        // Si no hay especies para esta categoría, no renderizamos la sección.
        if (speciesInCategory.length === 0) {
          return null
        }

        // Agrupamos las especies de ESTA categoría por su género.
        const speciesByGenus: Record<string, SpeciesWithGenus[]> = speciesInCategory.reduce(
          (acc, specie) => {
            const genus = specie.genus.name

            if (!acc[genus]) {
              acc[genus] = []
            }
            acc[genus].push(specie)

            return acc
          },
          {} as Record<string, SpeciesWithGenus[]>,
        )

        return (
          <div
            key={category.slug}
            className="scroll-mt-30"
            id={`${catIndex === 0 ? '#main-content' : ``}`}
          >
            {/* Mostrar título de la CATEGORÍA */}
            <Title className={`ml-1 ${catIndex > 0 ? 'mt-0!' : ''}`} title={category.name} />

            {/* Iteramos sobre los géneros agrupados para esta categoría */}
            {Object.entries(speciesByGenus).map(([genus, species], groupIndex) => (
              <div key={genus} className="scroll-mt-15" id={genus.toLowerCase()}>
                {/* Mostrar título del GENERO */}
                <Subtitle className="ml-1 w-[calc(100%-8px)]! px-0" subtitle={genus} />

                {/* Mostrar grid de productos para este GENERO */}
                <ProductGrid
                  index={catIndex === 0 && groupIndex === 0 ? 0 : -1}
                  products={species}
                />
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}
