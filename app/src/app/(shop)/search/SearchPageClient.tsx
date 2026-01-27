'use client'

import type { Species } from '@/interfaces/'

import { ProductGrid } from '@/components'

// charts mínimo para filtrar la búsqueda
const MIN_SEARCH_TERM_LENGTH = 3

interface Props {
  results: Species[]
  searchTerm: string
}

export default function SearchPageClient({ results, searchTerm }: Props) {
  return (
    <div className="mt-9">
      {/* --- Título de la página de resultados --- */}
      <h1
        aria-labelledby="category-heading"
        className="text-primary tds-sm:leading-9 tds-sm:text-[26px] tds-sm:tracking-tight mb-2 pt-8 text-[23.5px] leading-7 font-extralight tracking-tighter antialiased"
        id=" category-heading"
      >
        Resultados de{' '}
        <span className="font-medium text-balance hyphens-auto">
          {searchTerm.length >= MIN_SEARCH_TERM_LENGTH ? searchTerm : ''}
        </span>
        {/* Mostrar el término de búsqueda en el título solo si es válido */}
      </h1>

      {/* --- Contenido Principal: Grid de Productos o Mensajes --- */}
      {results.length > 0 ? (
        <ProductGrid index={0} products={results} />
      ) : (
        <div className="mt-5.5 flex justify-between font-medium">
          {searchTerm.length >= MIN_SEARCH_TERM_LENGTH ? (
            <span>No se encontraron resultados</span>
          ) : (
            <span>Introduzca más caracteres</span>
          )}
        </div>
      )}
    </div>
  )
}
