import type { ProductVariant, Species } from '@/interfaces'

import clsx from 'clsx'

/** Evalúa si una variante individual tiene stock disponible comercialmente para la venta */
export function isVariantAvailable(variant?: ProductVariant): boolean {
  if (!variant) return false

  return Boolean(variant.available && variant.quantity > 0 && variant.price > 0)
}

/** Evalúa si una especie posee al menos una variante comercial con stock disponible para la venta */
export function isProductAvailable(product?: Species): boolean {
  if (!product || !product.variants || product.variants.length === 0) return false

  return product.variants.some((v) => isVariantAvailable(v))
}

interface Props {
  className?: string
  MobileSlideshow?: boolean
  Slideshow?: boolean
  label?: string
  product?: Species
  variant?: ProductVariant
}

export function StockLabel({
  className,
  MobileSlideshow = false,
  Slideshow = false,
  label = 'Agotado',
  product,
  variant,
}: Props) {
  // Evaluación lógica del contexto de stock comercial disponible para la venta
  const isAvailable = product
    ? isProductAvailable(product)
    : variant
      ? isVariantAvailable(variant)
      : null

  // Si se proveyó un producto o variante y cuenta con stock comercial activo, no mostramos la etiqueta de agotado
  if (isAvailable === true && label === 'Agotado') {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className={clsx(
        'bg-label dark:bg-input-outline absolute z-5 cursor-default font-bold whitespace-nowrap text-white select-none',
        {
          // Estilos para el componente ProductGridItem
          'top-0 left-0 min-h-[25px] w-auto min-w-[50px] rounded-tl-[0.21rem] rounded-br px-0.5 py-1.5 text-center text-[9px] leading-tight':
            !MobileSlideshow && !Slideshow,
          'sm:min-h-[30px] sm:min-w-20 sm:px-0.5 sm:py-2 sm:text-[11px]':
            !MobileSlideshow && !Slideshow,
          'xl:min-h-[35px] xl:min-w-[75px] xl:px-[5px] xl:py-2.5 xl:text-sm':
            !MobileSlideshow && !Slideshow,

          // Estilos para el componente MobileSlideshow
          'top-0 left-0 w-full px-9 py-2.5 text-center text-[13px] leading-3.5': MobileSlideshow,
          'sm:h-auto sm:w-auto': MobileSlideshow,

          // Estilos para el componente Slideshow
          'top-0 left-0 h-auto w-auto rounded-br px-9 py-2.5 text-center': Slideshow,
        },
        className,
      )}
    >
      {label}
    </span>
  )
}
