import type { Metadata } from 'next'
import type { Species, PlantType } from '@/interfaces'

import prisma from '@package/database'
import { getLandingSpecies, getShopLayoutConfig } from '@/actions'
import {
  ProductGrid,
  Title,
  Subtitle,
  TeslaSection,
  TeslaValuesSection,
  TeslaContactSection,
  SnapScrollHandler,
} from '@/components'

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
  isFeatured?: boolean
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

  // Cargar configuración de Layout
  const layoutResult = await getShopLayoutConfig()
  const layoutConfig = layoutResult.config

  // Obtener slugs de especies del Hero
  const heroSpeciesIds = layoutConfig?.heroSlides.map((s) => s.speciesId).filter(Boolean) || []
  const heroSpeciesList = heroSpeciesIds.length > 0
    ? await prisma.species.findMany({
        where: { id: { in: heroSpeciesIds } },
        select: { id: true, slug: true, name: true },
      })
    : []

  const heroSlidesData = [
    {
      defaultTitle: 'Orquídeas de Colección',
      defaultSubtitle: 'Cultivadas y aclimatadas al clima de Ciudad Guayana',
      defaultImage: 'plants/orchids/orchids.webp',
      defaultHref: '#productos-destacados',
    },
    {
      defaultTitle: 'Rosas del Desierto',
      defaultSubtitle: 'Bonsáis naturales de floración extraordinaria',
      defaultImage: 'plants/adenium_obesum/multiple-petals/adenium-obesum-marbella/marbella_0_2000.webp',
      defaultHref: '/category/plants/adenium_obesum',
    },
    {
      defaultTitle: 'Cactus',
      defaultSubtitle: 'Especies exóticas de colección y bajo mantenimiento',
      defaultImage: 'plants/cactus/mammillaria/mammillaria-vetula-ssp-gracilis/mammillaria-vetula-ssp-gracilis_0_2000.webp',
      defaultHref: '/category/plants/cactus',
    },
    {
      defaultTitle: 'Suculentas',
      defaultSubtitle: 'Geometrías botánicas y colores extraordinarios',
      defaultImage: 'plants/succulents/crassula/crassula-capitella-campfire/crassula-capitella-campfire_0_2000.webp',
      defaultHref: '/category/plants/succulents',
    },
  ].map((def, index) => {
    const slide = layoutConfig?.heroSlides[index]
    const species = heroSpeciesList.find((s) => s.id === slide?.speciesId)

    return {
      title: slide?.title || species?.name || def.defaultTitle,
      subtitle: slide?.speciesId ? '' : def.defaultSubtitle, // Sin descripción si hay especie seleccionada
      image: slide?.imageUrl || def.defaultImage,
      href: species ? `/product/${species.slug}` : def.defaultHref,
    }
  })

  return (
    <div className="tds-sm:-mx-9 tds-xl:-mx-12 -mx-6 -mt-14">
      <SnapScrollHandler />

      {heroSlidesData.map((slide, index) => (
        <TeslaSection
          key={index}
          priority={index === 0}
          showScrollIndicator={index === 0}
          image={slide.image}
          primaryButtonHref={slide.href}
          primaryButtonText="Comprar ahora"
          subtitle={slide.subtitle}
          title={slide.title}
        />
      ))}

      {/* SECCIÓN 5: Promesas de Valor */}
      <TeslaValuesSection />

      {/* SECCIÓN 6: Los más vendidos (Especies Destacadas) */}
      {featuredProducts.length > 0 && (
        <section
          className="bg-canvas relative flex min-h-dvh w-full snap-start flex-col justify-between overflow-y-auto pt-24 pb-16"
          id="productos-destacados"
        >
          <div className="mx-auto w-full max-w-7xl grow px-4 sm:px-6 lg:px-8">
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
        <section className="bg-surface dark:bg-canvas relative flex min-h-dvh w-full snap-start flex-col justify-between overflow-y-auto pt-24 pb-16">
          <div className="mx-auto w-full max-w-7xl grow px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <Title title="Floración Activa" />
              <Subtitle subtitle="Especies en floración real en nuestro invernadero en este momento" />
            </div>

            <ProductGrid index={1} products={floweringProducts} />
          </div>
        </section>
      )}

      {/* SECCIÓN 8: Contacto */}
      <TeslaContactSection />
    </div>
  )
}
