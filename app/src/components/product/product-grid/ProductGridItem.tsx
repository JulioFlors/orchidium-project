'use client'

import Image from 'next/image'
import Link from 'next/link'

import { ProductVariant, Species } from '@/interfaces/'
import { StockLabel, FloweringLabel } from '@/components'
import { useImageColor } from '@/hooks/useImageColor'
import { getImageUrl, useFormatPrice } from '@/lib'

interface Props {
  product: Species
  index: number
}

// Calculamos si hay stock disponible y extraemos los límites del rango.
const getProductDisplayInfo = (variants: ProductVariant[]) => {
  const availableVariants = variants.filter((variant) => variant.available && variant.quantity > 0)
  const hasStock = availableVariants.length > 0
  const targetVariants = hasStock ? availableVariants : variants
  const prices = targetVariants.map((variant) => variant.price)

  if (prices.length === 0) {
    return { minPrice: 0, maxPrice: 0, hasStock: false }
  }

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return {
    minPrice,
    maxPrice,
    hasStock,
  }
}

export function ProductGridItem({ product, index }: Props) {
  const { minPrice, maxPrice, hasStock } = getProductDisplayInfo(product.variants)
  const { formatRange } = useFormatPrice()
  const priceLabel = formatRange(minPrice, maxPrice)

  // Obtenemos dinámicamente el color dominante vibrante de la primera imagen
  const { color } = useImageColor(getImageUrl(product.images[0]))

  // Color RGB para el background del glow
  const glowColor = color ? `rgb(${color.r}, ${color.g}, ${color.b})` : 'rgb(128, 128, 128)'

  return (
    <div
      className="fade-in group relative mb-4 flex flex-col px-1 pt-1"
      data-product-index={index}
      id={`product--${product.slug}`}
    >
      {/* === AMBIENT GLOW === Fondo sólido de color que cubre TODA la card */}
      <div
        aria-hidden="true"
        className="ambient-glow pointer-events-none absolute"
        style={{
          background: glowColor,
          zIndex: 0,
        }}
      />

      {/* Contenido de la card (z-5 para estar por encima del glow) */}
      <div className="focus-product-card relative z-5" id={`${product.slug}__container-image`}>
        <div
          className="relative aspect-square w-full overflow-hidden rounded-xl"
          id={`${product.slug}__main-image`}
        >
          <Link
            aria-label={`Ver detalles de ${product.name}`}
            className="relative block h-full w-full outline-none"
            href={`/product/${product.slug}`}
          >
            <Image
              fill
              alt={product.name}
              className="rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
              src={getImageUrl(product.images[0])}
              title={product.name}
              {...(index <= 5 ? { priority: true } : {})}
            />
          </Link>

          {/* Etiqueta de Agotado: Se muestra si NINGUNA variante tiene stock */}
          {!hasStock && <StockLabel />}

          {/* Etiqueta de Floración: Se muestra si hay al menos una planta en floración activa */}
          {product.isFlowering && <FloweringLabel />}
        </div>
      </div>

      <div
        className="relative z-5 flex flex-row justify-between pt-2 pb-1"
        id={`${product.slug}__container-details`}
      >
        <div className="flex flex-col font-bold antialiased" id={`${product.slug}__main-details`}>
          <Link
            className="text-primary tracking-tight text-balance"
            href={`/product/${product.slug}`}
            id={`${product.slug}__link`}
            tabIndex={-1}
          >
            {product.name}
          </Link>

          {/* Mostramos el precio o el rango calculado */}
          <span className="text-secondary font-semibold tracking-wide">{priceLabel}</span>
        </div>
        <div />
      </div>
    </div>
  )
}
