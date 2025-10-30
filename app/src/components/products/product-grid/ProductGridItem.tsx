'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { Species } from '@/interfaces/'
import { StockLabel } from '@/components'

interface Props {
  product: Species
  index: number
}

export function ProductGridItem({ product, index }: Props) {
  const [displayImage, setDisplayImage] = useState(product.images[0])

  return (
    <div
      className="fade-in mb-6 flex flex-col overflow-hidden px-1 pt-1"
      data-product-index={index}
      id={`product--${product.slug}`}
    >
      <div id={`${product.slug}__container-image`}>
        <div className="relative aspect-[1/1] w-full" id={`${product.slug}__main-image`}>
          <Link
            aria-label={`Ver detalles de ${product.name}`}
            className="focus-product relative block h-full w-full"
            href={`/product/${product.slug}`}
          >
            <Image
              fill
              alt={product.name}
              className="rounded-xs object-cover"
              sizes="(min - width: 2000px)"
              src={`/plants/${displayImage}`}
              title={product.name}
              onMouseEnter={() =>
                setDisplayImage(product.images[1] ? product.images[1] : product.images[0])
              }
              onMouseLeave={() => setDisplayImage(product.images[0])}
              {...(index === 0 || index === 1 ? { priority: true } : {})}
            />
          </Link>

          {/* Etiqueta de Agotado */}
          {!product.stock.available && <StockLabel />}
        </div>
      </div>

      <div className="flex flex-row justify-between" id={`${product.slug}__container-details`}>
        <div
          className="mt-1 flex flex-col font-bold antialiased"
          id={`${product.slug}__main-details`}
        >
          <Link
            className="product-name tracking-2 text-balance text-black transition-all duration-300"
            href={`/product/${product.slug}`}
            id={`${product.slug}__link`}
            tabIndex={-1} // Evita que reciba focus al navegar con Tab
          >
            {product.name}
          </Link>

          <span className="text-secondary !-tracking-2 font-extrabold">$ {product.price}</span>
        </div>
        <div />
      </div>
    </div>
  )
}
