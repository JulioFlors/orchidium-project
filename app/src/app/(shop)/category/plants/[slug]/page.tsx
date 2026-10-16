import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { ProductGrid, Title, Subtitle } from '@/components'
import { PlantType, ShopRoute, ShopCategory } from '@/interfaces'
import { getSpeciesByType } from '@/actions'
import { shopRoutes } from '@/config'
import { getImageUrl } from '@/lib'

// Awaited<...> se utiliza para obtener el tipo de retorno de una promesa.
// inferido directamente del retorno del server action.
type SpeciesWithGenus = Awaited<ReturnType<typeof getSpeciesByType>>[0]

// Mapeo para traducir el 'slug' (usado en la configuración de rutas)
// al valor exacto del 'enum PlantType' (usado en la base de datos).
const slugToPlantType: Record<string, PlantType> = {
  orchids: 'ORCHID',
  adenium_obesum: 'ADENIUM_OBESUM',
  cactus: 'CACTUS',
  succulents: 'SUCCULENT',
  bromeliads: 'BROMELIAD',
}

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const resolvedParams = await props.params
  const categorySlug = resolvedParams.slug.toLowerCase()

  const route: ShopRoute | undefined = shopRoutes.find((r) => r.slug === 'plants')
  const category: ShopCategory | undefined = route?.categories?.find(
    (cat) => cat.slug.toLowerCase() === categorySlug,
  )

  if (!category) {
    return {
      title: 'Categoría no encontrada | PristinoPlant',
    }
  }

  const categoryName = category.name
  const title = `Colección de ${categoryName} | PristinoPlant`
  const description = `Explora nuestra exclusiva colección de ${categoryName.toLowerCase()} cultivadas y aclimatadas en el Orquideario PristinoPlant.`
  const categoryImage = getImageUrl(category.image)

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      url: `/category/plants/${categorySlug}`,
      siteName: 'PristinoPlant',
      locale: 'es_VE',
      type: 'website',
      images: [
        {
          url: categoryImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [categoryImage],
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  // Usamos 'await' para obtener el objeto 'params' real.
  const resolvedParams = await params

  // Normalizamos el slug de la URL a minúsculas.
  const categorySlug = resolvedParams.slug.toLowerCase()

  // Seleccionamos la ruta "plants"
  const route: ShopRoute | undefined = shopRoutes.find((route) => route.slug === 'plants')

  // Comprobamos que la categoria existe
  const category: ShopCategory | undefined = route?.categories?.find((cat) => {
    if (typeof categorySlug === 'string') {
      return cat.slug.toLowerCase() === categorySlug
    }

    return false // Si categorySlug no es string, la comparación falla
  })

  // Traducimos el slug al PlantType correspondiente.
  const plantType = slugToPlantType[categorySlug]

  // Si no existe, mostrar 404
  if (!plantType || !category) {
    notFound()
  }

  // Se invoca el server action para obtener las especies de este tipo.
  const species = await getSpeciesByType(plantType)

  // Agrupamos las especies por su género.
  const speciesByGenus: Record<string, SpeciesWithGenus[]> = species.reduce(
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

  const sortedGeneraEntries = Object.entries(speciesByGenus).sort(([genusA], [genusB]) =>
    genusA.localeCompare(genusB, 'es'),
  )

  return (
    <div key={category.slug} className="scroll-mt-30" id="#main-content">
      {/* Mostrar título de la CATEGORÍA */}
      <Title className="ml-1" title={category.name} />

      {/* Iteramos sobre los géneros agrupados ordenados alfabéticamente */}
      {sortedGeneraEntries.map(([genus, speciesList], index) => {
        const sortedSpecies = [...speciesList].sort((a, b) => a.name.localeCompare(b.name, 'es'))

        return (
          <div key={genus} className="scroll-mt-15" id={genus.toLowerCase()}>
            {/* Mostrar título del GENERO */}
            <Subtitle className="ml-1 w-[calc(100%-8px)]! px-0" subtitle={genus} />

            {/* Mostrar grid de productos para este GENERO */}
            <ProductGrid index={index === 0 ? 0 : -1} products={sortedSpecies} />
          </div>
        )
      })}
    </div>
  )
}
