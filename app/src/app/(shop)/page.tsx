import type { Metadata } from 'next'

import { initialData } from '@service/seeding'

import { ProductGrid, Title, Subtitle } from '@/components'

export const metadata: Metadata = {
  title: 'Tienda',
  description:
    'Descubre nuestra colección de orquídeas, cactus, suculentas, rosas del desierto y kokedamas para interiores. Envíos garantizados y asesoramiento experto para tus plantas.',
  openGraph: {
    title: 'Tienda',
    description:
      'Descubre nuestra colección de orquídeas, cactus, suculentas, rosas del desierto y kokedamas para interiores. Envíos garantizados y asesoramiento experto para tus plantas.',
    url: 'https://pristinoplant.vercel.app/',
    siteName: 'PristinoPlant',
    images: [
      {
        url: '/imgs/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'PristinoPlant | Tienda',
      },
    ],
    locale: 'es_VE',
    type: 'website',
  },
}

const products = initialData.species.map((species) => {
  const genus = initialData.genus.find((g) => g.name === species.genus.name)

  return {
    ...species,
    id: species.slug,
    genus: {
      name: species.genus.name,
      type: genus!.type, // ! non-null assertion operator
    },
    variants: species.variants.map((variant) => ({
      ...variant,
      id: crypto.randomUUID(),
      speciesId: species.slug,
    })),
  }
})

export default async function HomePage() {
  return (
    <>
      <Title title="Orquídeas" />

      <Subtitle subtitle="Todos los productos" />

      <ProductGrid index={0} products={products} />
    </>
  )
}
