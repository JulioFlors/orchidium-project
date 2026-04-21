import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import PlantsCategoryClient from './PlantsCategoryClient'

import { getPaginatedSpeciesWithImages } from '@/actions'
import { shopRoutes } from '@/config'
import { PlantType, ShopRoute, Species, ShopCategory } from '@/interfaces'

export const metadata: Metadata = {
  title: 'Plantas',
  description:
    'Descubre nuestra amplia variedad de plantas, incluyendo Orquídeas, Cactus y Suculentas.',
}

// Re-using the slug to plant type mapping from client component
const slugToPlantType: Record<string, PlantType> = {
  orchids: 'ORCHID',
  adenium_obesum: 'ADENIUM_OBESUM',
  cactus: 'CACTUS',
  succulents: 'SUCCULENT',
  bromeliads: 'BROMELIAD',
}

interface CategorySection {
  category: ShopCategory
  speciesByGenus: Record<string, Species[]>
}

export default async function PlantsCategoryPage() {
  // Obtenemos la información de la ruta estática
  const route: ShopRoute | undefined = shopRoutes.find((route) => route.slug === 'plants')

  // Si no existe, mostrar 404
  if (!route) {
    notFound()
  }

  // Pre-cargar los datos en el servidor
  const initialData = await Promise.all(
    (route.categories || []).map(async (category) => {
      const type = slugToPlantType[category.slug.toLowerCase()]

      if (!type) return null

      const { species } = await getPaginatedSpeciesWithImages({
        plantType: type,
        take: 50, // Mismo límite que el cliente
        page: 1,
      })

      if (species.length === 0) return null

      // Agrupar por género en el servidor para mayor eficiencia
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

  const initialCategoriesData = initialData.filter((item): item is CategorySection => item !== null)

  return <PlantsCategoryClient initialCategoriesData={initialCategoriesData} route={route} />
}
