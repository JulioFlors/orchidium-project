'use client'

import { useState } from 'react'

import { SpeciesFloweringSection } from './SpeciesFloweringSection'

import { Species, ProductVariant } from '@/interfaces'
import {
  MobileSlideshow,
  Slideshow,
  AddToCart,
  FormattedText,
  isProductAvailable,
  isVariantAvailable,
} from '@/components'

interface Props {
  product: Species
}

export function ProductClientWrapper({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>()

  // Lógica: ¿Hay stock global?
  const hasGlobalStock = isProductAvailable(product)

  // Lógica: ¿El slideshow debe verse disponible?
  // Si hay variante seleccionada, manda el stock de esa. Si no, manda el global.
  const isSlideshowAvailable = selectedVariant
    ? isVariantAvailable(selectedVariant)
    : hasGlobalStock

  return (
    <div className="tds-lg:mt-8 tds-lg:flex tds-lg:gap-12 mb-20 grid grid-cols-1 gap-7">
      {/* Columna Izquierda: Imágenes (64.4%) */}
      <div className="tds-lg:w-[64.4%] col-span-1">
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

      {/* Columna Derecha: Detalles (35.6%) */}
      <div className="tds-lg:w-[35.6%] col-span-1 flex flex-col">
        <h1 className="text-primary tds-sm:text-3xl tds-sm:leading-10 text-2xl leading-10 font-semibold tracking-tight text-balance hyphens-auto antialiased">
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
          <div className="mt-6 max-w-[75ch]">
            <h3 className="text-primary pb-3 font-semibold">Descripción</h3>
            <FormattedText className="text-secondary" text={product.description} />
          </div>
        )}

        {/* Sección de Floración y Estacionalidad por Especie */}
        <SpeciesFloweringSection
          initialData={{
            avgFloweringDurationDays: product.floweringDurationDays,
            lastYearFloweringCount: product.floweringFrequencyYear,
            floweringMonths: product.floweringMonths,
          }}
          speciesSlug={product.slug}
        />
      </div>
    </div>
  )
}
