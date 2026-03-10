import React from 'react'

import { ProductGridItemSkeleton } from './ProductGridItemSkeleton'

interface Props {
  /**
   * Cuántos items skeleton mostrar.
   * @default 6
   */
  count?: number
}

/**
 * Componente Skeleton que imita la estructura y layout de ProductGrid,
 * utilizando ProductGridItemSkeleton para los items individuales.
 * Ideal para usar como fallback en Suspense.
 */
export function ProductGridSkeleton({ count = 6 }: Props) {
  return (
    <div
      aria-label="Cargando productos..."
      className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-2xl:grid-cols-4 mt-10 grid animate-pulse grid-cols-1 gap-x-4 gap-y-2"
    >
      {/* Genera un array del tamaño 'count' y mapea para renderizar los skeletons */}
      {Array.from({ length: count }).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <ProductGridItemSkeleton key={index} />
      ))}
    </div>
  )
}
