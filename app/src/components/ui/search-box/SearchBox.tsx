'use client'

import type { SearchSuggestion } from '@/actions'

import Link from 'next/link'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5'

import { handleFocusSearchInput } from '@/components'
import { useUIStore } from '@/store'

/**
 * Resalta las coincidencias de búsqueda dentro de un texto dado.
 *
 * @param text - El texto en el que se buscarán y resaltarán las coincidencias.
 * @param query - El término de búsqueda que se utilizará para encontrar coincidencias.
 * @returns Un array de elementos React que representan el texto con las coincidencias resaltadas.
 * Las coincidencias se resaltan utilizando la etiqueta <strong>.
 */
export const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

  const parts = text.split(regex)

  let counter = 1 // Contador para asegurar claves únicas

  return parts.map((part) => {
    const key = `${query}-${counter++}` // Clave única

    return regex.test(part) ? (
      <strong key={key} className="font-semibold">
        {part}
      </strong>
    ) : (
      <span key={key} className="font-light">
        {part}
      </span>
    )
  })
}

/**
 * Filtra una lista de sugerencias de búsqueda basándose en un término proporcionado,
 * devolviendo un subconjunto limitado de resultados para mostrar en un SearchBox.
 *
 * @param searchTerm - El término de búsqueda introducido por el usuario.
 * @param suggestions - El array completo de sugerencias de búsqueda disponibles (pre-cargado).
 * @returns Un array de `SearchSuggestion` que coinciden con el término de búsqueda,
 *          limitado a un máximo de 5 resultados. Retorna un array vacío si el
 *          término de búsqueda no tiene al menos 2 caracteres o no hay coincidencias.
 */
function filterSuggestions(
  searchTerm: string,
  suggestions: SearchSuggestion[],
): SearchSuggestion[] {
  const minLength = 2
  const limit = 5
  const normalizedTerm = searchTerm.trim().toLowerCase()

  if (normalizedTerm.length < minLength) return []

  const results = suggestions.filter((suggestion) =>
    suggestion.name.toLowerCase().includes(normalizedTerm),
  )

  return results.slice(0, limit)
}

const motionProps = {
  initial: { opacity: 0, scale: 0.8, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15, ease: 'easeInOut' } },
} as const

interface SearchBoxProps {
  isTopMenu?: boolean
  suggestions?: SearchSuggestion[]
}

/**
 * Un componente de búsqueda interactivo que proporciona sugerencias en tiempo real
 * y navega a una página de resultados de búsqueda completa.
 *
 * Este componente es un Client Component y gestiona su propio estado de UI,
 * pero recibe los datos para las sugerencias como una prop desde un Server Component padre.
 *
 * @component
 * @param {SearchBoxProps} props - Las propiedades del componente.
 * @param {boolean} [props.isTopMenu=false] - Adapta su comportamiento y UI al Header y al Sidebar.
 * @param {SearchSuggestion[]} props.suggestions - Un array con los datos precargados para filtrar y mostrar como sugerencias.
 *
 * @behavior
 * - Muestra sugerencias (máximo 5) cuando el usuario escribe al menos 2 caracteres.
 * - Al presionar 'Enter' con al menos 3 caracteres, navega a `/search?term=[búsqueda]`.
 * - Al hacer clic en una sugerencia, navega a la página de detalle del producto `/product/[slug]`.
 * - Utiliza el store de Zustand (`useUIStore`) para gestionar el término de búsqueda global.
 */
export function SearchBox({ isTopMenu = false, suggestions = [] }: SearchBoxProps) {
  const router = useRouter()

  // Referencias a elementos del DOM
  const searchRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Estados globales de Zustand
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const openSearchBox = useUIStore((state) => state.openSearchBox)
  const closeSearchBox = useUIStore((state) => state.closeSearchBox)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const setSearchTerm = useUIStore((state) => state.setSearchTerm)

  // Estado local para los resultados de la busqueda
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([])

  // Estado local para visibilidad de resultados
  const [isResultsVisible, setIsResultsVisible] = useState(false)

  // ---- Actualiza los resultados de búsqueda (only species, min 2 chars, max 5 results) ----
  useEffect(() => {
    const filteredResults = filterSuggestions(searchTerm, suggestions)

    setSearchResults(filteredResults)
  }, [searchTerm, suggestions])

  // ---- Manejo de visibilidad de resultados de búsqueda (focus/blur) ----
  useEffect(() => {
    const handleFocusOut = (event: FocusEvent) => {
      // Verificar si el foco se movió fuera del input del SearchBox y del contenedor de los resultados
      if (
        searchRef.current &&
        !searchRef.current.contains(event.relatedTarget as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.relatedTarget as Node)
      ) {
        setIsResultsVisible(false) // Ocultar los resultados
      }
    }

    // Verifica si el contenedor del componente se ha renderizado correctamente en el DOM
    const container = containerRef.current

    // Agregar listener al evento 'focusout' del contenedor principal
    if (container) {
      /**
       * El listener escucha el evento 'focusout' en el contenedor principal para ocultar los resultados
       * de búsqueda cuando el foco se pierde del input y de los resultados.
       */
      container.addEventListener('focusout', handleFocusOut)
    }

    // Limpiar el listener al desmontar el componente
    return () => {
      if (container) {
        container.removeEventListener('focusout', handleFocusOut)
      }
    }
  }, [setIsResultsVisible, isTopMenu, searchTerm, openSearchBox, closeSearchBox])

  //mostrar los resultados de búsqueda cuando el input recibe el foco.
  useEffect(() => {
    const inputElement = searchRef.current

    const handleFocus = () => {
      setIsResultsVisible(true) // Mostrar los resultados
    }

    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus)
    }

    // Limpiar el listener al desmontar el componente
    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus)
      }
    }
  }, [])

  // --- Manejo de Tecla Enter ---
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Comprobar si la tecla presionada es Enter
    if (event.key === 'Enter') {
      const trimmedSearchTerm = searchTerm.trim()

      // Comprobar si el término de búsqueda tiene 3 o más caracteres
      if (trimmedSearchTerm.length >= 3) {
        event.preventDefault() // Prevenir cualquier acción por defecto (como envío de formulario)

        // Navegar a la página de búsqueda con el término como query param
        router.push(`/search?term=${encodeURIComponent(trimmedSearchTerm)}`)

        setSearchTerm('') //          Limpiar el término de búsqueda
        setIsResultsVisible(false) // Ocultar lista de sugerencias
        //                            Cerrar el area de trabajo correspondiente
        void (isTopMenu ? closeSearchBox() : closeSidebar())
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full" tabIndex={-1}>
      {/* Contenedor principal del SearchBox */}

      <div
        className={clsx(
          'text-secondary relative mb-2 flex w-full items-center',
          { 'mb-0!': isTopMenu }, // Elimina el margen inferior si se usa en el TopMenu
        )}
      >
        {/* Contenedor del input de búsqueda */}
        <IoSearchOutline className="pointer-events-none absolute left-2" size={20} />
        {/* Icono de búsqueda */}
        <input
          ref={searchRef}
          className={clsx(
            'focus-search-box bg-search-box w-full rounded px-8 py-2 leading-6 font-medium',
            {
              'outline-search-box border-none bg-white outline-1 -outline-offset-1 transition-all duration-300 ease-in-out':
                isTopMenu,
            }, // Estilos específicos si se usa en el TopMenu
          )}
          placeholder="Buscar"
          role="searchbox"
          type="text"
          value={searchTerm} // Enlazar el valor del input al useUIStore searchTerm
          onChange={(e) => setSearchTerm(e.target.value)} // Actualizar el searchTerm
          onFocus={() => setIsResultsVisible(true)} // Mostrar los resultados al enfocar el input
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <button
            aria-label="Borrar búsqueda"
            className="hover:bg-search-box-icon-hover absolute right-2 flex items-center rounded p-1 focus:outline-none"
            tabIndex={-1}
            type="button"
            onClick={() => {
              setSearchTerm('') // Limpiar el término de búsqueda al hacer clic
              handleFocusSearchInput(true, containerRef) // Enfoca el input del searchBox
            }}
          >
            <IoCloseOutline className="cursor-pointer" size={16} />
            {/* Icono de cierre */}
          </button>
        )}
      </div>

      {/* Contenedor de resultados de búsqueda con animación */}
      <AnimatePresence>
        {isResultsVisible && searchTerm && searchResults.length > 0 && (
          <motion.div
            key="search-results"
            ref={resultsRef}
            animate={motionProps.animate} // Aplicar la animación de entrada
            className="border-search-box-outline absolute top-11 left-0 z-50! w-full rounded border bg-white py-1 text-black shadow-lg"
            data-testid="search-results-container"
            exit={motionProps.exit} // Aplicar la animación de salida
            initial={motionProps.initial} // Aplicar el estado inicial de la animación
          >
            {searchResults.map((result) => (
              <Link
                key={`${result.slug}`}
                className="search-results block"
                href={`/product/${result.slug}`}
                onClick={() => {
                  setSearchTerm('') //          Limpiar el término de búsqueda al seleccionar un resultado
                  setIsResultsVisible(false) // Ocultar los resultados al seleccionar un resultado
                  //                            Cerrar el area de trabajo correspondiente
                  void (isTopMenu ? closeSearchBox() : closeSidebar())
                }}
              >
                {highlightMatch(result.name, searchTerm)}
                {/* Mostrar el título del resultado resaltando las coincidencias con el término de búsqueda */}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
