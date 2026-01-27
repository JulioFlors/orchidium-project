'use client'

import type { SearchSuggestion } from '@/actions'

import Link from 'next/link'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IoCloseOutline } from 'react-icons/io5'

import { SearchIcon } from '@/components'
import { useUIStore } from '@/store'

// ----------------------------------------
//  Funciones Auxiliares
// ----------------------------------------
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

// ----------------------------------------
//  Props
// ----------------------------------------

const motionProps = {
  initial: { opacity: 0, scale: 0.8, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15, ease: 'easeInOut' } },
} as const

interface SearchBoxProps {
  isHeader?: boolean
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
 * @param {boolean} [props.isHeader=false] - Adapta su comportamiento y UI al Header y al Sidebar.
 * @param {SearchSuggestion[]} props.suggestions - Un array con los datos precargados para filtrar y mostrar como sugerencias.
 *
 * @behavior
 * - Muestra sugerencias (máximo 5) cuando el usuario escribe al menos 2 caracteres.
 * - Al presionar 'Enter' con al menos 3 caracteres, navega a `/search?term=[búsqueda]`.
 * - Al hacer clic en una sugerencia, navega a la página de detalle del producto `/product/[slug]`.
 * - Utiliza el store de Zustand (`useUIStore`) para gestionar el término de búsqueda global.
 */
export function SearchBox({ isHeader = false, suggestions = [] }: SearchBoxProps) {
  // ----- Hooks de Next.js -----
  const router = useRouter()

  // ---- Referencias a elementos del DOM ----
  const searchRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // ----- Estados globales (Zustand) -----
  const { closeSearchBox, closeSidebar, searchTerm, setSearchTerm, isSearchBoxExpanded } =
    useUIStore()

  // ----- Estados locales -----
  const [isResultsVisible, setIsResultsVisible] = useState(false)

  // ----------------------------------------
  //  Lógica de Filtrado
  // ----------------------------------------
  // Actualiza los resultados de búsqueda
  // (only species, min 2 chars, max 5 results)
  // Se usa useMemo para derivar el estado
  // (en lugar de useEffect con setState)
  const searchResults = useMemo(() => {
    return filterSuggestions(searchTerm, suggestions)
  }, [searchTerm, suggestions])

  // ----------------------------------------
  //  Lógica de Focus
  // ----------------------------------------
  // Solo auto-enfocamos si estamos en el Header y se ha expandido.
  useEffect(() => {
    if (isHeader && isSearchBoxExpanded) {
      const timer = setTimeout(() => {
        if (searchRef.current) {
          searchRef.current.focus()
        }
      }, 350)
      // 300ms de la animación + 50ms de espera adicional
      // Esperamos a que la animación termine/DOM esté listo

      return () => clearTimeout(timer)
    }
  }, [isHeader, isSearchBoxExpanded])

  // ----------------------------------------
  //  Gestiona la visibilidad
  //  de los resultados de búsqueda (FocusOut)
  // ----------------------------------------
  useEffect(() => {
    const handleFocusOut = (_event: FocusEvent) => {
      // Usamos setTimeout para permitir que el foco se mueva al nuevo elemento antes de verificar
      setTimeout(() => {
        const newFocus = document.activeElement

        // Verificar si el foco se movió fuera del input del SearchBox y del contenedor de los resultados
        if (
          searchRef.current &&
          !searchRef.current.contains(newFocus) &&
          resultsRef.current &&
          !resultsRef.current.contains(newFocus)
        ) {
          setIsResultsVisible(false) // Ocultar los resultados
        }
      }, 0)
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
  }, [setIsResultsVisible])

  // ----------------------------------------
  //  Gestiona la visibilidad
  //  de los resultados de búsqueda (Focus)
  // ----------------------------------------
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

  // ----------------------------------------
  //  Manejo de Submit (Enter) y Navegación
  // ----------------------------------------
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Flecha Abajo o Tab: Mover foco a la lista
    if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
      if (resultsRef.current) {
        // Solo prevenimos el comportamiento por defecto (saltar al siguiente elemento)
        // si efectivamente hay resultados a los que ir.
        event.preventDefault()
        const firstLink = resultsRef.current.querySelector('a')

        if (firstLink) {
          firstLink.focus()
        }
      }

      return
    }

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
        void (isHeader ? closeSearchBox() : closeSidebar())
      }
    }
  }

  // ----------------------------------------
  //  Manejo de Teclado en la Lista de Resultados
  // ----------------------------------------
  const handleResultKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>, _slug: string) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextSibling = event.currentTarget.nextElementSibling as HTMLElement

      if (nextSibling) {
        nextSibling.focus()
      }
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prevSibling = event.currentTarget.previousElementSibling as HTMLElement

      if (prevSibling) {
        prevSibling.focus()
      } else {
        // Si no hay anterior, volver al input
        if (searchRef.current) {
          searchRef.current.focus()
        }
      }
    }

    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      // Simular clic
      event.currentTarget.click()
    }
  }

  // ----------------------------------------
  //  Render (JSX)
  // ----------------------------------------
  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center" tabIndex={-1}>
      {/* ---- Contenedor principal del SearchBox ----*/}
      {/* ---- Contenedor del input de búsqueda ---- */}
      <div
        className={clsx(
          'text-primary relative mb-2 flex h-full w-full items-center',
          { 'mb-0!': isHeader }, // Elimina el margen inferior si se usa en el Header
        )}
      >
        <SearchIcon className="text-secondary pointer-events-none absolute left-3 h-6 w-6" />

        <input
          ref={searchRef}
          className={clsx(isHeader ? 'header-searchbox' : 'sidebar-searchbox')}
          placeholder="Buscar"
          role="searchbox"
          type="text"
          value={searchTerm} // Enlazar el valor del input al useUIStore searchTerm
          onChange={(e) => setSearchTerm(e.target.value)} // Actualizar el searchTerm
          onFocus={() => setIsResultsVisible(true)} // Mostrar los resultados al enfocar el input
          onKeyDown={handleInputKeyDown}
        />
        {searchTerm && (
          <button
            aria-label="Borrar búsqueda"
            className="hover:bg-hover-overlay absolute right-2 z-10 flex items-center rounded p-1 backdrop-blur-lg transition-all duration-300 ease-in focus:outline-none"
            tabIndex={-1}
            type="button"
            onClick={() => {
              setSearchTerm('')
              // Enfocamos usando la ref local
              searchRef.current?.focus()
            }}
          >
            <IoCloseOutline className="cursor-pointer" size={16} />
          </button>
        )}
      </div>

      {/* ---- Contenedor de resultados de búsqueda con animación ---- */}
      <AnimatePresence>
        {isResultsVisible && searchTerm && searchResults.length > 0 && (
          <motion.div
            key="search-results"
            ref={resultsRef}
            className={clsx(
              'border-input-outline bg-canvas text-black-and-white absolute top-11 left-0 z-50! w-full rounded border py-1 shadow-lg',
            )}
            data-testid="search-results-container"
            {...motionProps}
          >
            {searchResults.map((result) => (
              <Link
                key={`${result.slug}`}
                className={clsx('search-results focus-bg-canvas block')}
                href={`/product/${result.slug}`}
                onClick={() => {
                  setSearchTerm('') //          Limpiar el término de búsqueda al seleccionar un resultado
                  setIsResultsVisible(false) // Ocultar los resultados al seleccionar un resultado
                  //                            Cerrar el area de trabajo correspondiente
                  void (isHeader ? closeSearchBox() : closeSidebar())
                }}
                onKeyDown={(e) => handleResultKeyDown(e, result.slug)}
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
