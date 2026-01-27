'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { ProductVariant, Species } from '@/interfaces/'
import { StockLabel } from '@/components'

interface Props {
  product: Species
  index: number
}

// Calculamos el precio a mostrar y si hay stock disponible basado en las variantes.
const getProductDisplayInfo = (variants: ProductVariant[]) => {
  // Filtramos las variantes disponibles
  const availableVariants = variants.filter((variant) => variant.available && variant.quantity > 0)

  // Validamos que el producto NO este totalmente agotado
  const hasStock = availableVariants.length > 0

  // Definimos qué variantes usar para el cálculo de precio
  // - Si hay stock: Usamos SOLO las disponibles.
  // - Si NO hay stock: Usamos TODAS como referencia.
  const targetVariants = hasStock ? availableVariants : variants

  // Extraemos los precios de las variantes seleccionadas
  const prices = targetVariants.map((variant) => variant.price)

  // Evitamos calcular Math.min() con un array vacío
  if (prices.length === 0) {
    return { priceLabel: '$0', hasStock: false }
  }

  // Calculamos Min y Max
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // Formateamos la etiqueta
  const priceLabel = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`

  return {
    priceLabel,
    hasStock,
  }
}

export function ProductGridItem({ product, index }: Props) {
  const [displayImage, setDisplayImage] = useState(product.images[0])
  const { priceLabel, hasStock } = getProductDisplayInfo(product.variants)

  return (
    <div
      className="fade-in mb-6 flex flex-col overflow-hidden px-1 pt-1"
      data-product-index={index}
      id={`product--${product.slug}`}
    >
      <div id={`${product.slug}__container-image`}>
        <div className="relative aspect-square w-full" id={`${product.slug}__main-image`}>
          <Link
            aria-label={`Ver detalles de ${product.name}`}
            className="focus-product relative block h-full w-full"
            href={`/product/${product.slug}`}
          >
            <Image
              fill
              alt={product.name}
              className="rounded object-cover"
              sizes="(min - width: 2000px)"
              src={`/plants/${displayImage}`}
              title={product.name}
              onMouseEnter={() =>
                setDisplayImage(product.images[1] ? product.images[1] : product.images[0])
              }
              onMouseLeave={() => setDisplayImage(product.images[0])}
              {...(index <= 5 ? { priority: true } : {})}
            />
          </Link>

          {/* Etiqueta de Agotado: Se muestra si NINGUNA variante tiene stock */}
          {!hasStock && <StockLabel />}
        </div>
      </div>

      <div className="flex flex-row justify-between" id={`${product.slug}__container-details`}>
        <div
          className="mt-1 flex flex-col font-bold antialiased"
          id={`${product.slug}__main-details`}
        >
          <Link
            className="product-name text-primary tracking-tight text-balance transition-all duration-300"
            href={`/product/${product.slug}`}
            id={`${product.slug}__link`}
            tabIndex={-1} // Evita que reciba focus al navegar con Tab
          >
            {product.name}
          </Link>

          {/* Muestramos el precio o el rango calculado */}
          <span className="text-secondary font-semibold tracking-wide">{priceLabel}</span>
        </div>
        <div />
      </div>
    </div>
  )
}
