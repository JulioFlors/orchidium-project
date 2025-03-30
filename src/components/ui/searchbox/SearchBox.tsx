'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'

import { highlightMatch, handleFocusSearchInput } from '@/components'
import { Category, Subcategory } from '@/interfaces'
import { useUIStore } from '@/store'

interface SearchboxProps {
  isTopMenu?: boolean
  searchResults: (Subcategory | Category)[]
}

const motionProps = {
  initial: { opacity: 0, scale: 0.8, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15, ease: 'easeInOut' } },
}

/**
 * Componente de la caja de búsqueda con funcionalidad de sugerencias y animaciones.
 *
 * @param {boolean} props.isTopMenu - Indica si el componente se usa en el TopMenu (opcional).
 * @param {(Subcategory | Category)[]} props.searchResults - Los resultados de búsqueda a mostrar.
 */
export function Searchbox({ isTopMenu = false, searchResults }: SearchboxProps) {
  const searchRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const closeMenu = useUIStore((state) => state.closeSideMenu)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const setSearchTerm = useUIStore((state) => state.setSearchTerm)

  const [isResultsVisible, setIsResultsVisible] = useState(false)

  // Ocultar los resultados de búsqueda cuando el foco se pierde del input o del contenedor de resultados.
  useEffect(() => {
    const handleFocusOut = (event: FocusEvent) => {
      // Verificar si el foco se movió fuera del searchbox y del menú de resultados
      if (
        searchRef.current &&
        !searchRef.current.contains(event.relatedTarget as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.relatedTarget as Node)
      ) {
        setIsResultsVisible(false) // Ocultar los resultados
      }
    }

    // Verifica si el contenedor del componente se ha renderizado correctamente en el DOM.
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
  }, [setIsResultsVisible]) // Dependencia en setIsResultsVisible para re-ejecutar si cambia la visibilidad

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
  }, []) // Dependencia vacía para que se ejecute solo al montar el componente

  return (
    <div ref={containerRef} className="relative w-full" tabIndex={-1}>
      {/* Contenedor principal del SearchBox */}

      <div
        className={clsx(
          'text-secondary relative mb-2 flex w-full items-center',
          { '!mb-0': isTopMenu }, // Elimina el margen inferior si se usa en el TopMenu
        )}
      >
        {/* Contenedor del input de búsqueda */}
        <IoSearchOutline className="pointer-events-none absolute left-2" size={20} />
        {/* Icono de búsqueda */}
        <input
          ref={searchRef}
          className={clsx(
            'focus-serch-box bg-serch-box w-full rounded px-8 py-2 leading-6 font-medium',
            {
              'outline-serch-box border-none bg-white outline-1 outline-offset-[-1px] transition-all duration-300 ease-in-out':
                isTopMenu,
            }, // Estilos específicos si se usa en el TopMenu
          )}
          placeholder="Buscar"
          role="searchbox"
          type="text"
          value={searchTerm} // Enlazar el valor del input al estado global searchTerm
          onChange={(e) => setSearchTerm(e.target.value)} // Actualizar el estado global al cambiar el input
          onFocus={() => setIsResultsVisible(true)} // Mostrar los resultados al enfocar el input
        />
        {searchTerm && (
          <button
            aria-label="Borrar búsqueda"
            className="hover:bg-serch-box-icon-hover absolute right-2 flex items-center rounded p-1 focus:outline-none"
            tabIndex={-1}
            type="button"
            onClick={() => {
              setSearchTerm('') // Limpiar el término de búsqueda al hacer clic
              handleFocusSearchInput(true, containerRef) // Enfoca el input del searchbox
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
            className="border-serch-box-outline absolute top-[44px] left-0 z-40 w-full rounded border-1 bg-white py-1 text-black shadow-lg"
            exit={motionProps.exit} // Aplicar la animación de salida
            initial={motionProps.initial} // Aplicar el estado inicial de la animación
          >
            {searchResults.map((result) => (
              <Link
                key={result.id}
                className="search-results block"
                href={result.url || '#'} // Usar la URL del resultado o un enlace vacío si no hay URL
                onClick={() => {
                  setSearchTerm('') // Limpiar el término de búsqueda al seleccionar un resultado
                  setIsResultsVisible(false) // Ocultar los resultados al seleccionar un resultado
                  closeMenu() // Cerrar el menú lateral (si aplica)
                }}
              >
                {highlightMatch(result.title, searchTerm)}
                {/* Mostrar el título del resultado resaltando las coincidencias con el término de búsqueda */}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
