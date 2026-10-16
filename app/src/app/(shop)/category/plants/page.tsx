import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import PlantsCategoryClient from './PlantsCategoryClient'

import { getPaginatedSpeciesWithImages } from '@/actions'
import { shopRoutes } from '@/config'
import { PlantType, ShopRoute, Species, ShopCategory } from '@/interfaces'
import { getImageUrl } from '@/lib'

const catalogImage = getImageUrl('plants/orchids/orchids.webp')

export const metadata: Metadata = {
  title: 'Catálogo de Plantas',
  description:
    'Descubre nuestra amplia variedad de plantas de colección, incluyendo Orquídeas, Rosas del Desierto, Cactus y Suculentas.',
  openGraph: {
    title: 'Catálogo de Plantas | PristinoPlant',
    description:
      'Descubre nuestra amplia variedad de plantas de colección, incluyendo Orquídeas, Rosas del Desierto, Cactus y Suculentas.',
    url: '/category/plants',
    siteName: 'PristinoPlant',
    locale: 'es_VE',
    type: 'website',
    images: [
      {
        url: catalogImage,
        width: 1200,
        height: 630,
        alt: 'Catálogo de Plantas PristinoPlant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo de Plantas | PristinoPlant',
    description:
      'Descubre nuestra amplia variedad de plantas de colección, incluyendo Orquídeas, Rosas del Desierto, Cactus y Suculentas.',
    images: [catalogImage],
  },
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

      // Ordenar las especies alfabéticamente dentro de cada género
      Object.keys(speciesByGenus).forEach((genus) => {
        speciesByGenus[genus].sort((a, b) => a.name.localeCompare(b.name, 'es'))
      })

      return {
        category,
        speciesByGenus,
      }
    }),
  )

  const initialCategoriesData = initialData
    .filter((item): item is CategorySection => item !== null)
    .sort((a, b) => a.category.name.localeCompare(b.category.name, 'es'))

  return <PlantsCategoryClient initialCategoriesData={initialCategoriesData} route={route} />
}
