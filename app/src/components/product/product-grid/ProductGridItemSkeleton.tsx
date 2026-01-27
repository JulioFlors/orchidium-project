import React from 'react'

export function ProductGridItemSkeleton() {
  return (
    <div className="mb-6 flex flex-col overflow-hidden px-1 pt-1">
      {/* Placeholder para la Imagen */}
      <div className="relative aspect-square w-full rounded bg-neutral-200" />

      {/* Placeholder para los Detalles */}
      <div className="mt-1 flex flex-col space-y-2">
        {/* Placeholder para el Nombre */}
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        {/* Placeholder para el Precio */}
        <div className="h-4 w-1/2 rounded bg-neutral-200" />
      </div>
    </div>
  )
}
