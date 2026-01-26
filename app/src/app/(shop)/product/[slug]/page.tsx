export const revalidate = 604800 // 7 days

import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { ProductClientWrapper } from './ui/ProductClientWrapper'

import { getSpeciesBySlug } from '@/actions'

type Params = Promise<{ slug: string }>

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params
  const slug = params.slug
  const product = await getSpeciesBySlug(slug)

  // URL de imagen por defecto si el producto no tiene imágenes
  const productImage = product?.images?.[0] ? `/${product.images[0]}` : '/imgs/placeholder.jpg'

  return {
    title: {
      absolute: product?.name ?? 'Planta no encontrada',
    },
    description:
      product?.description ?? 'No pudimos encontrar esta planta en nuestro Orquideario | 404',
    openGraph: {
      title: product?.name ?? 'Planta no encontrada',
      description:
        product?.description ?? 'No pudimos encontrar esta planta en nuestro Orquideario | 404',
      images: [
        {
          url: productImage, // Next.js usará metadataBase del layout para hacer esto absoluto
          width: 2000,
          height: 2000,
          alt: product?.name ?? 'Imagen de planta',
        },
      ],
    },
  }
}

export default async function ProductBySlugPage(props: { params: Params }) {
  const params = await props.params
  const slug = params.slug
  const product = await getSpeciesBySlug(slug)

  if (!product) notFound()

  // Delegamos la renderización al componente cliente
  return <ProductClientWrapper product={product} />
}
