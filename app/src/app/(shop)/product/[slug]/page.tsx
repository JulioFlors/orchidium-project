export const revalidate = 604800 // 7 days

import type { Metadata } from 'next'

import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'

import { AddToCart } from '@/components'
import { getSpeciesBySlug } from '@/actions'

// ----------------------------------------------------------------------
// Optimización de Renderizado (Lazy Loading)
// ----------------------------------------------------------------------
// Usamos next/dynamic para cargar diferidamente los componentes del carrusel.
//
// ¿Por qué?
// 1. Reducción del Bundle Inicial: Los carruseles incluyen librerías pesadas (Swiper)
//    y lógica de cliente ('use client') que no son críticas para el First Contentful Paint (FCP).
// 2. Mejora del TTI: Al separar este código, el hilo principal del navegador se libera más rápido
//    para interactuar con elementos críticos como el botón de "Añadir al carrito".
//
// Diseño del Skeleton:
// Los skeletons replican exactamente las clases de diseño (márgenes negativos, aspect-ratio)
// de los componentes reales para evitar el Cumulative Layout Shift (CLS) durante la carga.

const MobileSlideshow = dynamic(
  () => import('@/components/product/slideshow/MobileSlideshow').then((mod) => mod.MobileSlideshow),
  {
    loading: () => (
      <div className="-mx-6 block aspect-square animate-pulse bg-neutral-200 sm:-mx-9 lg:hidden" />
    ),
  },
)

const Slideshow = dynamic(
  () => import('@/components/product/slideshow/Slideshow').then((mod) => mod.Slideshow),
  {
    loading: () => (
      <div className="hidden aspect-square w-full animate-pulse bg-neutral-200 lg:block" />
    ),
  },
)

type Params = Promise<{ slug: string }>

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params
  const slug = params.slug

  const product = await getSpeciesBySlug(slug)

  return {
    metadataBase: new URL('https://pristinoplant.vercel.app'),
    title: product?.name ?? 'Producto no encontrado',
    description:
      product?.description ?? 'No pudimos encontrar este producto en nuestro vivero | 404',
    openGraph: {
      // OpenGraph para compartir
      title: product?.name ?? 'Producto no encontrado',
      description:
        product?.description ?? 'No pudimos encontrar este producto en nuestro vivero | 404',
      images: [
        {
          url: `/${product?.images[0]}`,
          width: 2000,
          height: 2000,
          alt: product?.name,
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

  const isProductAvailable = product.stock?.available ?? false

  return (
    <div className="mb-20 grid grid-cols-1 gap-12 lg:mt-8 lg:grid-cols-3">
      {/* Container Carousel */}
      <div className="col-span-1 lg:col-span-2">
        {/* Mobile Slideshow */}
        <MobileSlideshow
          className="-mx-6 block sm:-mx-9 lg:hidden"
          images={product.images}
          isAvailable={isProductAvailable}
          title={product.name}
        />

        {/* Desktop Slideshow */}
        <Slideshow
          className="hidden lg:block"
          images={product.images}
          isAvailable={isProductAvailable}
          title={product.name}
        />
      </div>

      {/* Container Side */}
      <div className="col-span-1">
        {/* ---- Title ---- */}
        <h1 className="text-primary tracking-4 text-3xl leading-10 font-semibold text-balance hyphens-auto antialiased">
          {product.name}
        </h1>

        {/* Container Details */}
        <div className="w-full flex-1 items-center justify-start sm:w-[320px] lg:w-full xl:max-w-[320px]">
          {/* ---- Price ---- */}
          <p className="text-primary mt-0.5 mb-5 text-xl font-semibold">
            ${product.price} {/* product.price.toFixed(2) para mostrar decimales */}
          </p>

          {/* Selector de Tallas mb-24px */}
          {/*         <SizeSelector
          selectedSize={ product.sizes[ 1 ] }
          availableSizes={ product.sizes }
        /> */}

          <AddToCart product={product} />
        </div>

        {/* ---- Descripción ---- */}
        {product.description && (
          <div className="mt-3 mb-5 max-w-[75ch] py-5">
            <h3 className="pb-3 font-bold">Descripción</h3>
            <p className="mb-[1lh]">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
