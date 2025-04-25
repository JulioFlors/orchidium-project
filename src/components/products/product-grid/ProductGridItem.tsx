'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import clsx from 'clsx'

import { Species } from '@/interfaces/'

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
              sizes="(min - width: 640px) and (max-width: 767px) calc(50vw - 18px - 2%) (min-width: 768px) and (max-width: 1279px) calc(33.33vw - 18px - 1.33%) (min-width: 1280px) calc(33.33vw - 24px - 1.5%) "
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
          {!product.stock.available && (
            <span
              aria-hidden="true"
              className={clsx(
                'bg-label absolute top-0 left-0 z-[5] min-h-[25px] min-w-[50px] cursor-default px-0.5 py-1.5 text-center text-[9px] leading-tight font-bold whitespace-nowrap text-white select-none',
                'sm:min-h-[30px] sm:min-w-[80px] sm:px-[2px] sm:py-[8px] sm:text-[11px]',
                'xl:min-h-[35px] xl:min-w-[75px] xl:px-[5px] xl:py-[10px] xl:text-sm',
              )}
            >
              Agotado
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-row justify-between" id={`${product.slug}__container-details`}>
        <div
          className="mt-1 flex flex-col font-bold antialiased"
          id={`${product.slug}__main-details`}
        >
          <Link
            className="product-name !tracking-02 line-clamp-3 break-words text-black transition-all duration-300"
            href={`/product/${product.slug}`}
            id={`${product.slug}__link`}
            tabIndex={-1} // Evita que reciba focus al navegar con Tab
          >
            {product.name}
          </Link>

          <span className="text-secondary !tracking-02 font-extrabold">$ {product.price}</span>
        </div>
        <div />
      </div>
    </div>
  )
}
