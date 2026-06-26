import type { Metadata } from 'next'

import { ShopView } from './ui/ShopView'

import { getStoreData, getShopLayoutConfig } from '@/actions'

export const metadata: Metadata = {
  title: 'Gestor de Tienda',
}

export default async function ShopManagerPage() {
  const result = await getStoreData()
  const species = result.species || []

  const layoutResult = await getShopLayoutConfig()
  const layoutConfig = layoutResult.config || {
    heroSlides: [],
    categories: {
      orchids: { imageUrl: '' },
      adenium_obesum: { imageUrl: '' },
      cactus: { imageUrl: '' },
      succulents: { imageUrl: '' },
    },
    megamenu: {
      featuredItem: {
        speciesId: '',
        slug: '',
        title: '',
        imageUrl: '',
      },
    },
    featuredSpeciesIds: [],
  }

  // Mapear especies con array de string para imágenes
  const formattedSpecies = species.map((s) => ({
    ...s,
    images: s.images.map((img) => img.url),
  }))

  return <ShopView initialData={formattedSpecies} initialLayoutConfig={layoutConfig} />
}

