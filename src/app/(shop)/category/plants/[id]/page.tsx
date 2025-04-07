import { notFound } from 'next/navigation'

import { ProductGrid, Title, Subtitle } from '@/components'
import { initialData } from '@/seed/seed'
import { Category, Genus, Route } from '@/interfaces'

const seedGenus = initialData.genus
const SeedRoute = initialData.routes
const seedSpecies = initialData.species

interface Props {
  params: {
    id: string
  }
}

export default async function CategoryPage({ params }: Props) {
  const { id: categoryId } = await params

  // Seleccionar la ruta para "plants"
  const route: Route | undefined = SeedRoute.find((route) => route.id === 'plants')

  // Comprobar que la categoria existe
  const category: Category | undefined = route?.categories?.find(
    (cat) => cat.id.toLowerCase() === categoryId.toLowerCase(),
  )

  // Si no existe, mostrar 404
  if (!category) {
    notFound()
  }

  // Mapea los IDs de categoría (usados en rutas) a los tipos de planta (usados en la propiedad 'plantType' de los géneros).
  const routeWrapper: Record<string, string> = {
    orchids: 'orchid',
    adenium_obesum: 'adenium_obesum',
    cactus: 'cactus',
    succulents: 'succulent',
  }

  // Encontrar los GRUPOS (géneros) que pertenecen a ESTA categoría
  const groupsInCategory: Genus[] = seedGenus.filter(
    (gen) => gen.type.toLowerCase() === routeWrapper[category.id],
  )

  return (
    <div key={category.id}>
      {/* Mostrar título de la CATEGORÍA */}
      <Title className="ml-1" title={category.title} />

      {/* Iterar sobre cada GRUPO (género) dentro de la Categoría */}
      {groupsInCategory.map((group, index) => {
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

            {/* Mostrar la cuadrícula de productos para ESTE grupo */}
            <ProductGrid index={index === 0 ? 0 : -1} products={speciesInGroup} />
          </div>
        )
      })}
    </div>
  )
}
