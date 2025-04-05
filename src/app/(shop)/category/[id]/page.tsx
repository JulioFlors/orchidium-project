import { notFound } from 'next/navigation'

import { ProductGrid, Title, Subtitle } from '@/components'
import { initialData } from '@/seed/seed'
import { Category, Genus, Subcategory } from '@/interfaces'

const seedGenus = initialData.genus
const seedSpecies = initialData.species
const seedCategories = initialData.categories

interface Props {
  params: {
    id: string
  }
}

export default async function CategoryPage({ params }: Props) {
  const { id: routeId } = await params
  let category: Category | undefined = undefined
  let subcategory: Subcategory | undefined = undefined
  let groupsInSubcategory: Genus[] = []

  // Envuelve el subcategory.id, para que coincida con los PlantType de genus.
  const routeWrapper: Record<string, string> = {
    orquideas: 'orchid',
    'rosas-del-desierto': 'adenium_obesum',
    cactus: 'cactus',
    suculentas: 'succulent',
  }

  // Primero, intentar encontrar si el ID corresponde a una Categoría principal
  category = seedCategories.find((cat) => cat.id.toLowerCase() === routeId.toLowerCase())

  // Si no es una categoría principal, intentar encontrar si es una Subcategoría
  if (!category) {
    subcategory = seedCategories
      .flatMap((cat) => cat.subcategories || []) // Obtener todas las subcategorías
      .find((sub) => sub.id.toLowerCase() === routeId.toLowerCase())
  }

  /* Encontrar los GRUPOS (géneros/tipos) que pertenecen a ESTA subcategoría */
  if (subcategory) {
    groupsInSubcategory = seedGenus.filter(
      (gen) => gen.type.toLowerCase() === routeWrapper[subcategory.id],
    )
  }

  // Si no se encontró ni categoría ni subcategoría, mostrar página 404
  if (!category && !subcategory) {
    notFound()
  }

  return (
    <>
      {/* CASO 1: Se accedió a una CATEGORÍA PRINCIPAL (e.g., /category/plantas) */}
      {category && category.subcategories && category.subcategories.length > 0 && (
        <>
          {/* Iterar sobre cada SUBCATEGORÍA dentro de la Categoría Principal */}
          {category.subcategories.map((sub, index) => {
            // Encontrar los GRUPOS (géneros/tipos) que pertenecen a ESTA subcategoría
            const groupsInSubcategory = seedGenus.filter(
              (gen) => gen.type.toLowerCase() === routeWrapper[sub.id],
            )

            // Si no hay grupos para esta subcategoría, no mostrar nada para ella
            if (groupsInSubcategory.length === 0) {
              return null
            }

            return (
              <div key={sub.id}>
                {/* Mostrar título de la SUBCATEGORÍA */}
                <Title className={`ml-1 ${index > 0 ? '!mt-0' : ''}`} title={sub.title} />

                {/* Iterar sobre cada GRUPO (género/tipo) dentro de la Subcategoría */}
                {groupsInSubcategory.map((group) => {
                  // Encontrar los PRODUCTOS (especies) que pertenecen a ESTE grupo
                  const speciesInGroup = seedSpecies.filter(
                    (sp) => sp.genus.name.toLowerCase() === group.name.toLowerCase(),
                  )

                  // Si no hay productos para este grupo, no mostrar la sección
                  if (speciesInGroup.length === 0) {
                    return null
                  }

                  return (
                    <div key={group.name}>
                      {/* Mostrar título del GRUPO (usando Subtitle o un componente similar) */}
                      {/* Asegúrate que el componente Subtitle pueda aceptar un título o crea uno nuevo si es necesario */}
                      <Subtitle className="ml-1 !w-[calc(100%-8px)] px-0" subtitle={group.name} />
                      {/* Mostrar la cuadrícula de productos para ESTE grupo */}
                      <ProductGrid products={speciesInGroup} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </>
      )}

      {/* CASO 2: Se accedió directamente a una SUBCATEGORÍA (e.g., /category/cactus) */}
      {subcategory && !category && (
        <div key={subcategory.id}>
          {/* Mostrar título de la SUBCATEGORÍA */}
          <Title className="ml-1" title={subcategory.title} />

          {/* Iterar sobre cada GRUPO (género/tipo) dentro de la Subcategoría */}
          {groupsInSubcategory.map((group) => {
            // Encontrar los PRODUCTOS (especies) que pertenecen a ESTE grupo
            const speciesInGroup = seedSpecies.filter(
              (sp) => sp.genus.name.toLowerCase() === group.name.toLowerCase(),
            )

            // Si no hay productos para este grupo, no mostrar la sección
            if (speciesInGroup.length === 0) {
              return null
            }

            return (
              <div key={group.name}>
                {/* Mostrar título del GRUPO */}
                <Subtitle className="ml-1 !w-[calc(100%-8px)] px-0" subtitle={group.name} />
                {/* Mostrar la cuadrícula de productos para ESTE grupo */}
                <ProductGrid products={speciesInGroup} />
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
