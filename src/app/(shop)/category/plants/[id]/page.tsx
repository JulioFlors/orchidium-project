'use client'

import { notFound, useParams } from 'next/navigation'

import { ProductGrid, Title, Subtitle } from '@/components'
import { Category, Genus, Route } from '@/interfaces'
import { staticRoutes } from '@/config'
import { initialData } from '@/seed'

const seedGenus = initialData.genus
const seedSpecies = initialData.species

export default function CategoryPage() {
  const categoryId = useParams().id

  // Seleccionar la ruta para "plants"
  const route: Route | undefined = staticRoutes.find((route) => route.slug === 'plants')

  // Comprobar que la categoria existe
  const category: Category | undefined = route?.categories?.find((cat) => {
    if (typeof categoryId === 'string') {
      return cat.slug.toLowerCase() === categoryId.toLowerCase()
    }

    return false // Si categoryId no es string, la comparación falla
  })

  // Si no existe, mostrar 404
  if (!category) {
    notFound()
  }

  // Mapea el slug de categoría (usados en rutas) a los tipos de planta (usados en la propiedad 'plantType' de los géneros).
  const routeWrapper: Record<string, string> = {
    orchids: 'orchid',
    adenium_obesum: 'adenium_obesum',
    cactus: 'cactus',
    succulents: 'succulent',
  }

  // Encontrar los GRUPOS (géneros) que pertenecen a ESTA categoría
  const groupsInCategory: Genus[] = seedGenus.filter(
    (gen) => gen.type.toLowerCase() === routeWrapper[category.slug],
  )

  return (
    <div key={category.slug}>
      {/* Mostrar título de la CATEGORÍA */}
      <Title className="ml-1" title={category.name} />

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
          <div key={group.name} id={group.name}>
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
