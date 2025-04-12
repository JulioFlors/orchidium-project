import { Suspense } from 'react'

import SearchPageClient from './SearchPageClient'

import { ProductGridSkeleton } from '@/components'

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </Suspense>
  )
}

// Se muestra mientras el componente cliente se carga o espera datos
function SearchPageFallback() {
  return (
    <div className="mt-9">
      {/* --- Skeleton para el Título --- */}
      <h1
        aria-labelledby="category-heading-skeleton"
        className="mb-2 animate-pulse pt-8"
        id="category-heading-skeleton"
      >
        <div className="h-9 w-3/4 rounded bg-gray-200" />
      </h1>

      {/* --- Usar el Skeleton del Grid --- */}
      <ProductGridSkeleton />
    </div>
  )
}
