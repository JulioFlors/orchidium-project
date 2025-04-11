'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { Species } from '@/interfaces/'
import { initialData } from '@/seed/seed'
import { filterSearchResults, ProductGrid } from '@/components'

// Definir la longitud mínima requerida para la búsqueda en esta página
const MIN_SEARCH_TERM_LENGTH = 3

export default function SearchResultsPage() {
  const searchParams = useSearchParams()

  // Obtener el término de búsqueda de la URL, quitar espacios y asegurar que no sea null
  const searchTerm = (searchParams.get('searchTerm') || '').trim()

  // Estado para almacenar los resultados de la búsqueda
  const [results, setResults] = useState<Species[]>([])
  // Estado para controlar si la búsqueda está en curso
  const [isLoading, setIsLoading] = useState(true)

  // todo: Reemplazar esto con la carga de datos real (fetch, server action, etc.)
  const speciesData = initialData.species

  // --- Actualiza los resultados de búsqueda (only species, min 3 chars, unlimit results) ---
  useEffect(() => {
    const isLimited = false

    setIsLoading(true)

    setResults(filterSearchResults(searchTerm, speciesData, isLimited))

    setIsLoading(false)
  }, [searchTerm, speciesData])

  return (
    <div className="mt-9">
      {/* --- Título de la página de resultados --- */}
      <h1
        aria-labelledby="category-heading"
        className="tracking-2 text-primary mb-2 pt-8 text-[1.625rem] leading-9 font-extralight antialiased"
        id=" category-heading"
      >
        Resultados de{' '}
        <span className="font-medium">
          {searchTerm.length >= MIN_SEARCH_TERM_LENGTH ? searchTerm : ''}
        </span>
        {/* Mostrar el término de búsqueda en el título solo si es válido */}
      </h1>

      {/* --- Contenido Principal: Grid de Productos o Mensajes --- */}
      {isLoading ? (
        <div />
      ) : results.length > 0 ? (
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
