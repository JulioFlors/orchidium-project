import type { Metadata } from 'next'
import type { Species, PlantType } from '@/interfaces'

import { getLandingSpecies } from '@/actions'
import { ProductGrid, Title, Subtitle, TeslaSection, TeslaValuesSection } from '@/components'

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

interface LandingSpecies {
  id: string
  name: string
  slug: string
  description: string | null
  isFeatured: boolean
  genus: {
    id: string
    name: string
    type: string
  }
  images: {
    id: string
    url: string
  }[]
  variants: {
    id: string
    size: 'NRO_5' | 'NRO_7' | 'NRO_10' | 'NRO_14'
    price: number
    quantity: number
    available: boolean
  }[]
}

function mapSpeciesToProduct(sp: LandingSpecies): Species {
  return {
    id: sp.id,
    name: sp.name,
    slug: sp.slug,
    description: sp.description,
    images: sp.images.map((img) => img.url),
    genus: {
      name: sp.genus.name,
      type: sp.genus.type as PlantType,
    },
    variants: sp.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      price: variant.price,
      quantity: variant.quantity,
      available: variant.available,
      speciesId: sp.slug,
    })),
  }
}

export default async function HomePage() {
  const { featured = [], flowering = [] } = await getLandingSpecies()

  // Mapear los datos de BD a las interfaces compatibles de ProductGrid
  const featuredProducts = (featured as unknown as LandingSpecies[]).map(mapSpeciesToProduct)
  const floweringProducts = (flowering as unknown as LandingSpecies[]).map(mapSpeciesToProduct)

  return (
    <div className="tds-sm:-mx-9 tds-xl:-mx-12 -mx-6 -mt-14">
      {/* SECCIÓN 1: Hero Principal (Orquídeas) */}
      <TeslaSection
        priority
        showScrollIndicator
        image="/plants/orchids/orchids.webp"
        primaryButtonHref="#productos-destacados"
        primaryButtonText="Comprar ahora"
        subtitle="Cultivadas y aclimatadas por nuestro orquideario familiar"
        title="Orquídeas de Colección"
      />

      {/* SECCIÓN 2: Rosas del Desierto */}
      <TeslaSection
        image="/plants/adenium_obesum/marbella_0_2000.webp"
        primaryButtonHref="/category/plants/adenium_obesum"
        primaryButtonText="Comprar ahora"
        subtitle="Bonsáis naturales de floración extraordinaria"
        title="Rosas del Desierto"
      />

      {/* SECCIÓN 3: Cactus */}
      <TeslaSection
        image="/plants/cactus/mammillaria-vetula-ssp-gracilis_0_2000.webp"
        primaryButtonHref="/category/plants/cactus"
        primaryButtonText="Comprar ahora"
        subtitle="Especies exóticas de colección y bajo mantenimiento"
        title="Cactus"
      />

      {/* SECCIÓN 4: Suculentas */}
      <TeslaSection
        image="/plants/succulents/crassula-capitella-campfire_0_2000.webp"
        primaryButtonHref="/category/plants/succulents"
        primaryButtonText="Comprar ahora"
        subtitle="Geometrías botánicas y colores extraordinarios"
        title="Suculentas"
      />

      {/* SECCIÓN 5: Promesas de Valor */}
      <TeslaValuesSection />

      {/* SECCIÓN 6: Los más vendidos (Especies Destacadas) */}
      {featuredProducts.length > 0 && (
        <section
          className="bg-canvas relative flex min-h-screen w-full snap-start flex-col justify-between overflow-y-auto pt-24 pb-16"
          id="productos-destacados"
        >
          <div className="mx-auto w-full max-w-7xl flex-grow px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <Title title="Los más vendidos" />
              <Subtitle subtitle="Las especies favoritas de nuestros coleccionistas en Ciudad Guayana" />
            </div>

            <ProductGrid index={0} products={featuredProducts} />
          </div>
        </section>
      )}

      {/* SECCIÓN 7: Floración Activa */}
      {floweringProducts.length > 0 && (
        <section className="bg-surface dark:bg-canvas relative flex min-h-screen w-full snap-start flex-col justify-between overflow-y-auto pt-24 pb-16">
          <div className="mx-auto w-full max-w-7xl flex-grow px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <Title title="Floración Activa" />
              <Subtitle subtitle="Especies en floración real en nuestro invernadero en este momento" />
            </div>

            <ProductGrid index={1} products={floweringProducts} />
          </div>
        </section>
      )}
    </div>
  )
}
