'use client'

import Image from 'next/image'
import Link from 'next/link'

import { ProductVariant, Species } from '@/interfaces/'
import { StockLabel, isVariantAvailable } from '@/components'
import { useImageColor, getPresetForColorString } from '@/hooks/useImageColor'
import { getImageUrl, useFormatPrice } from '@/lib'

interface Props {
  product: Species
  index: number
  showGlow?: boolean
}

// Calculamos si hay stock disponible y extraemos los límites del rango.
const getProductDisplayInfo = (variants: ProductVariant[]) => {
  const availableVariants = variants.filter((variant) => isVariantAvailable(variant))
  const hasStock = availableVariants.length > 0
  const validPriceVariants = variants.filter((v) => v.price > 0)
  const targetVariants = hasStock ? availableVariants : validPriceVariants
  const prices = targetVariants.map((variant) => variant.price)

  if (prices.length === 0) {
    return { minPrice: 0, maxPrice: 0, hasStock: false, hasValidPrice: false }
  }

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return {
    minPrice,
    maxPrice,
    hasStock,
    hasValidPrice: true,
  }
}

export function ProductGridItem({ product, index, showGlow = true }: Props) {
  const { minPrice, maxPrice, hasStock, hasValidPrice } = getProductDisplayInfo(product.variants)
  const { formatRange } = useFormatPrice()
  const priceLabel = hasValidPrice ? formatRange(minPrice, maxPrice) : 'No disponible'

  // Obtenemos dinámicamente el color dominante o de contraste de la primera imagen
  const isCustomColor = Boolean(
    product.glowColor && !['dynamic', 'recommended', 'contrast'].includes(product.glowColor),
  )
  const mode = product.glowColor === 'contrast' ? 'contrast' : 'recommended'
  const { lightRgbString, darkRgbString, isLoaded } = useImageColor(
    isCustomColor ? '' : getImageUrl(product.images[0]) || product.name,
    mode,
  )

  const presetMatch = isCustomColor ? getPresetForColorString(product.glowColor!) : null

  const glowLight = isCustomColor
    ? presetMatch
      ? presetMatch.lightRgbString
      : product.glowColor!
    : lightRgbString || 'rgb(5, 150, 105)'

  const glowDark = isCustomColor
    ? presetMatch
      ? presetMatch.darkRgbString
      : product.glowColor!
    : darkRgbString || 'rgb(52, 211, 153)'

  const canShowGlow = showGlow && (isCustomColor || isLoaded)

  return (
    <div
      className="fade-in group relative mb-4 flex flex-col px-1 pt-1"
      data-product-index={index}
      id={`product--${product.slug}`}
      style={
        {
          '--glow-color': glowLight,
          '--glow-light': glowLight,
          '--glow-dark': glowDark,
        } as React.CSSProperties
      }
    >
      {/* === AMBIENT GLOW === Fondo sólido de color que cubre TODA la card */}
      {canShowGlow && (
        <div
          aria-hidden="true"
          className="ambient-glow pointer-events-none absolute"
          style={{
            background: 'var(--glow-color)',
            zIndex: 0,
          }}
        />
      )}

      {/* Contenido de la card (z-5 para estar por encima del glow) */}
      <div className="focus-product-card relative z-5" id={`${product.slug}__container-image`}>
        <div
          className="relative aspect-square w-full overflow-hidden rounded-xl"
          id={`${product.slug}__main-image`}
        >
          <Link
            aria-label={`Ver detalles de ${product.name}`}
            className="relative block h-full w-full outline-none"
            href={`/plant/${product.slug}`}
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
          {!hasStock && <StockLabel label="Agotado" />}

          {/* Etiqueta de Floración: Se muestra si hay al menos una planta en floración activa y tiene stock */}
          {hasStock && product.isFlowering && <StockLabel label="Floración" />}
        </div>
      </div>

      <div
        className="relative z-5 flex flex-row justify-between pt-2 pb-1"
        id={`${product.slug}__container-details`}
      >
        <div className="flex flex-col font-bold antialiased" id={`${product.slug}__main-details`}>
          <Link
            className="glow-title tracking-tight text-balance"
            href={`/plant/${product.slug}`}
            id={`${product.slug}__link`}
            tabIndex={-1}
          >
            {product.name}
          </Link>

          {/* Mostramos el precio o el rango calculado */}
          <span className="glow-meta font-semibold tracking-wide">{priceLabel}</span>
        </div>
        <div />
      </div>
    </div>
  )
}
