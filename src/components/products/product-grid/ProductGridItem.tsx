'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { Species } from '@/interfaces/'

interface Props {
  product: Species
  index: number
}

export function ProductGridItem({ product, index }: Props) {
  const [displayImage, setDisplayImage] = useState(product.images[0])

  return (
    <div className="fade-in mb-6 flex flex-col overflow-hidden px-1 pt-1">
      <div className="relative aspect-[1/1] w-full">
        <Link
          aria-label={`Ver detalles de ${product.name}`}
          as="image"
          className="focus-product relative block h-full w-full"
          href={`/product/${product.slug}`}
        >
          <Image
            fill
            alt={product.name}
            className="rounded-xs object-cover"
            sizes="(min - width: 640px) and (max-width: 767px) calc(50vw - 18px - 2%) (min-width: 768px) and (max-width: 1279px) calc(33.33vw - 18px - 1.33%) (min-width: 1280px) calc(33.33vw - 24px - 1.5%) "
            src={`/plants/${displayImage}`}
            onMouseEnter={() =>
              setDisplayImage(product.images[1] ? product.images[1] : product.images[0])
            }
            onMouseLeave={() => setDisplayImage(product.images[0])}
            {...(index === 0 || index === 1 ? { priority: true } : {})}
          />
        </Link>
      </div>

      <div className="flex flex-col pt-2 font-bold antialiased">
        <Link
          className="product-name !tracking-06 text-black transition-all duration-300"
          href={`/product/${product.slug}`}
          tabIndex={-1} // Evita que reciba focus al navegar con Tab
        >
          {product.name}
        </Link>
        <span className="text-secondary font-extrabold">$ {product.price}</span>
      </div>
    </div>
  )
}
