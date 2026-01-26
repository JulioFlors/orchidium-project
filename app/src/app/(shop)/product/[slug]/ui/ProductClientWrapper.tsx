'use client'

import { useState } from 'react'

import { Species, ProductVariant } from '@/interfaces'
// Observa qué limpia es la importación ahora gracias a los barriles:
import { MobileSlideshow, Slideshow, AddToCart } from '@/components'

interface Props {
  product: Species
}

export function ProductClientWrapper({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>()

  // Lógica: ¿Hay stock global?
  const hasGlobalStock = product.variants.some((v) => v.available && v.quantity > 0)

  // Lógica: ¿El slideshow debe verse disponible?
  // Si hay variante seleccionada, manda el stock de esa. Si no, manda el global.
  const isSlideshowAvailable = selectedVariant
    ? selectedVariant.available && selectedVariant.quantity > 0
    : hasGlobalStock

  return (
    <div className="tds-lg:gap-12 tds-lg:mt-8 tds-lg:grid-cols-3 mb-20 grid grid-cols-1 gap-7">
      {/* Columna Izquierda: Imágenes */}
      <div className="tds-lg:col-span-2 col-span-1">
        <MobileSlideshow
          className="tds-lg:hidden -mx-6 block sm:-mx-9"
          images={product.images}
          isAvailable={isSlideshowAvailable}
          title={product.name}
        />
        <Slideshow
          className="tds-lg:block hidden"
          images={product.images}
          isAvailable={isSlideshowAvailable}
          title={product.name}
        />
      </div>

      {/* Columna Derecha: Detalles */}
      <div className="col-span-1 flex flex-col">
        <h1 className="text-primary tds-sm:text-3xl tds-sm:leading-7 text-2xl leading-10 font-semibold tracking-tighter text-balance hyphens-auto antialiased">
          {product.name}
        </h1>

        <div className="tds-lg:w-full w-full sm:w-[320px] xl:max-w-[320px]">
          <AddToCart
            product={product}
            selectedVariant={selectedVariant}
            onVariantSelected={setSelectedVariant}
          />
        </div>

        {product.description && (
          <div className="mt-3 mb-5 max-w-[75ch] py-5">
            <h3 className="text-primary pb-3 font-bold">Descripción</h3>
            <p className="text-secondary mb-[1lh] text-pretty">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
