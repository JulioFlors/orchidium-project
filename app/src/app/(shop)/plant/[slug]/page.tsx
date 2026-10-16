export const revalidate = 604800 // 7 days

import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { ProductClientWrapper } from './ui/ProductClientWrapper'

import { getSpeciesBySlug } from '@/actions'
import { getImageUrl } from '@/lib'

type Params = Promise<{ slug: string }>

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params
  const slug = params.slug
  const product = await getSpeciesBySlug(slug)

  const title = product?.name ?? 'Planta no encontrada'
  const description =
    product?.description ??
    'Descubre nuestra colección de plantas y orquídeas en el Orquideario PristinoPlant.'
  const productImage = getImageUrl(product?.images?.[0])

  return {
    title: {
      absolute: `${title} | PristinoPlant`,
    },
    description,
    openGraph: {
      title: `${title} | PristinoPlant`,
      description,
      url: `/plant/${slug}`,
      siteName: 'PristinoPlant',
      locale: 'es_VE',
      type: 'website',
      images: [
        {
          url: productImage,
          width: 1200,
          height: 1200,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | PristinoPlant`,
      description,
      images: [productImage],
    },
  }
}

export default async function PlantBySlugPage(props: { params: Params }) {
  const params = await props.params
  const slug = params.slug
  const product = await getSpeciesBySlug(slug)

  if (!product) notFound()

  // Delegamos la renderización al componente cliente
  return <ProductClientWrapper product={product} />
}
