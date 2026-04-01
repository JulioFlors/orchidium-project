'use client'

import type { Species } from '@/interfaces/'

import { useState, useEffect, useRef } from 'react'

import { ProductGrid } from '@/components'
import { getSearchSpeciesByTerm } from '@/actions'

// charts mínimo para filtrar la búsqueda
const MIN_SEARCH_TERM_LENGTH = 3

interface Props {
  results: Species[]
  searchTerm: string
}

export default function SearchPageClient({ results: initialResults, searchTerm }: Props) {
  const [results, setResults] = useState(initialResults)
  const [offset, setOffset] = useState(initialResults.length)
  const [hasMore, setHasMore] = useState(initialResults.length >= 20)
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  const PAGE_SIZE = 20

  // 1. Carga incremental cuando el observer entra en vista
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true)
          try {
            const nextResults = await getSearchSpeciesByTerm(searchTerm, PAGE_SIZE, offset)

            if (nextResults.length < PAGE_SIZE) {
              setHasMore(false)
            }
            if (nextResults.length > 0) {
              setResults((prev) => [...prev, ...nextResults])
              setOffset((prev) => prev + nextResults.length)
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error cargando más resultados:', error)
          } finally {
            setIsLoading(false)
          }
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, offset, searchTerm])

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
        <>
          <ProductGrid index={0} products={results} />

          {/* Trigger para el Scroll Infinito */}
          <div ref={observerRef} className="mt-8 mb-12 flex justify-center">
            {hasMore ? (
              <div className="flex flex-col items-center gap-3">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                <span className="text-secondary animate-pulse text-[11px] font-medium">
                  Cargando
                </span>
              </div>
            ) : (
              <span className="text-secondary text-[10px] font-bold tracking-widest uppercase opacity-30">
                Fin de la colección
              </span>
            )}
          </div>
        </>
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
