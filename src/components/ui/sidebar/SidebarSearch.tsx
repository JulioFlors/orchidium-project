'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'

import { Category, Subcategory } from './types'
import { highlightMatch } from './SidebarUtils'

import { useUIStore } from '@/store'

interface SidebarSearchProps {
  searchResults: (Subcategory | Category)[]
}

const motionProps = {
  // Estado inicial: invisible, escala reducida, ligeramente arriba
  initial: { opacity: 0, scale: 0.8, y: -10 },
  // Estado animado: visible, escala normal, posición normal, con duración y easing
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  // Estado de salida
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15, ease: 'easeInOut' } },
}

export function SidebarSearch({ searchResults }: SidebarSearchProps) {
  const searchRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const closeMenu = useUIStore((state) => state.closeSideMenu)

  const searchTerm = useUIStore((state) => state.searchTerm)
  const setSearchTerm = useUIStore((state) => state.setSearchTerm)

  const [isResultsVisible, setIsResultsVisible] = useState(false)

  // Ocultar resultados al perder el foco del searchbox o del menú de resultados
  useEffect(() => {
    const handleFocusOut = (event: FocusEvent) => {
      // Verificar si el foco se movió fuera del searchbox y del menú de resultados
      if (
        searchRef.current &&
        !searchRef.current.contains(event.relatedTarget as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.relatedTarget as Node)
      ) {
        setIsResultsVisible(false)
      }
    }

    // Agregar listener al evento focusout del contenedor principal
    const container = containerRef.current

    if (container) {
      container.addEventListener('focusout', handleFocusOut)
    }

    return () => {
      if (container) {
        container.removeEventListener('focusout', handleFocusOut)
      }
    }
  }, [setIsResultsVisible])

  // Mostrar resultados al enfocar el input
  useEffect(() => {
    const inputElement = searchRef.current

    const handleFocus = () => {
      setIsResultsVisible(true)
    }

    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus)
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* SearchBox - Caja de búsqueda */}
      <div className="text-secondary relative mb-2 flex w-full items-center">
        <IoSearchOutline className="pointer-events-none absolute left-2" size={20} />
        <input
          ref={searchRef}
          className="focus-serch-box bg-serch-box w-full rounded py-2 pr-10 pl-10 text-base font-medium"
          placeholder="Buscar"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsResultsVisible(true)}
        />
        {searchTerm && (
          <button
            aria-label="Borrar búsqueda"
            className="hover:bg-serch-box-icon-hover absolute right-2 flex items-center rounded p-1 focus:outline-none"
            tabIndex={-1}
            type="button"
            onClick={() => setSearchTerm('')}
          >
            <IoCloseOutline className="cursor-pointer" size={16} />
          </button>
        )}
      </div>

      {/* Resultados de búsqueda con animacion de Motion */}
      <AnimatePresence>
        {isResultsVisible && searchTerm && searchResults.length > 0 && (
          <motion.div
            key="search-results"
            ref={resultsRef}
            animate={motionProps.animate}
            className="border-serch-box-outline absolute top-[44px] left-0 z-40 w-full rounded border-1 bg-white py-1 text-black shadow-lg"
            exit={motionProps.exit}
            initial={motionProps.initial}
          >
            {searchResults.map((result) => (
              <Link
                key={result.id}
                className="search-results block"
                href={result.url || '#'}
                onClick={() => {
                  setSearchTerm('')
                  setIsResultsVisible(false)
                  closeMenu()
                }}
              >
                {highlightMatch(result.title, searchTerm)}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
