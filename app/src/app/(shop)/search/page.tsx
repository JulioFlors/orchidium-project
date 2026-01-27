import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import SearchPageClient from './SearchPageClient'

import { getSearchSpeciesByTerm } from '@/actions'
import { ProductGridSkeleton } from '@/components'

interface Props {
  searchParams: Promise<{
    term?: string
  }>
}

export default async function SearchPage(props: Props) {
  const searchParams = await props.searchParams
  const searchTerm = searchParams.term || ''

  // Si no hay término de búsqueda, redirigimos a la página de inicio.
  if (searchTerm.trim().length === 0) {
    redirect('/')
  }

  return (
    <Suspense key={searchTerm} fallback={<SearchPageFallback searchTerm={searchTerm} />}>
      <SearchResults searchTerm={searchTerm} />
    </Suspense>
  )
}

// Componente asíncrono para cargar los datos.
async function SearchResults({ searchTerm }: { searchTerm: string }) {
  // invocamos el server action
  const results = await getSearchSpeciesByTerm(searchTerm)

  // Renderizamos el Client Component con los datos ya cargados.
  return <SearchPageClient results={results} searchTerm={searchTerm} />
}

// Se muestra mientras el componente cliente se carga o espera datos
function SearchPageFallback({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="mt-9">
      <h1
        aria-labelledby="category-heading"
        className="text-primary tds-sm:leading-9 tds-sm:text-[26px] tds-sm:tracking-tight mb-2 pt-8 text-[23.5px] leading-7 font-extralight tracking-tighter antialiased"
      >
        Resultados de <span className="font-medium text-balance hyphens-auto">{searchTerm}</span>
      </h1>

      {/* --- Usar el Skeleton del Grid --- */}
      <ProductGridSkeleton />
    </div>
  )
}
