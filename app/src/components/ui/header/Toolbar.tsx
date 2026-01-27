'use client'

import type { SearchSuggestion } from '@/actions'

import clsx from 'clsx'
import Link from 'next/link'
import { IoStorefrontOutline } from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useRef } from 'react'

import {
  CartIcon,
  motionIconSearch,
  motionSearchBox,
  PersonIcon,
  SearchBox,
  SearchIcon,
  SidebarTrigger,
  ThemeToggle,
} from '@/components'
import { useUIStore } from '@/store'

interface Props {
  isOrchidarium: boolean
  isAuthLayout: boolean
  suggestions: SearchSuggestion[]
}

export function Toolbar({ isOrchidarium, isAuthLayout, suggestions }: Props) {
  const openSearchBox = useUIStore((state) => state.openSearchBox)
  const closeSearchBox = useUIStore((state) => state.closeSearchBox)
  const isSearchBoxExpanded = useUIStore((state) => state.isSearchBoxExpanded)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)

  const searchContainerRef = useRef<HTMLDivElement>(null)

  // ---- Oculta el SearchBox si el foco se mueve fuera del contenedor y no hay ningún término de búsqueda activo ----
  const handleFocusOutSearch = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.relatedTarget as Node) &&
      !searchTerm
    ) {
      closeSearchBox()
    }
  }

  // ----------------------------------------
  //  useEffects
  // ----------------------------------------

  // ----- Expande el SearchBox si hay un searchTerm valido al montar el componete -----
  useEffect(() => {
    if (searchTerm && !isSidebarOpen && !isSearchBoxExpanded) openSearchBox()
    if (!searchTerm && isSidebarOpen && isSearchBoxExpanded) closeSearchBox()
  }, [searchTerm, isSearchBoxExpanded, isSidebarOpen, openSearchBox, closeSearchBox])

  // ----------------------------------------
  //  Render (JSX)
  // ----------------------------------------

  // ---- Renderizamos solo el ThemeToggle) ---
  if (isAuthLayout) {
    return (
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    )
  }

  return (
    <>
      {/* ---- Shop Tollbar (Search + Cart) ---- */}
      {!isOrchidarium && (
        <>
          {/* ---- SearchBox Desktop ---- */}
          <div className="tds-sm:block hidden">
            <div
              ref={searchContainerRef}
              className="relative flex h-full items-center justify-end"
            />
            <AnimatePresence initial={false} mode="popLayout">
              {isSearchBoxExpanded ? (
                <motion.div
                  key="search-input"
                  className="aceleracion-hardware z-20 flex h-full items-center"
                  onBlur={handleFocusOutSearch}
                  {...motionSearchBox}
                >
                  <SearchBox isHeader suggestions={suggestions} />
                </motion.div>
              ) : (
                <motion.button
                  key="search-icon"
                  aria-label="Buscar"
                  className="search-button aceleracion-hardware"
                  type="button"
                  onClick={openSearchBox}
                  onFocus={openSearchBox}
                  {...motionIconSearch}
                >
                  <SearchIcon className="tds-icon" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ---- SearchBox Mobile ---- */}
          <div className="tds-sm:hidden block">
            <button
              aria-label="Abrir búsqueda"
              className="search-button focus-link-visible"
              type="button"
              // TODO: Conectar con openSearchModal() cuando se implemente el modal móvil
              // eslint-disable-next-line no-console
              onClick={() => console.log('Abrir Modal de Búsqueda Móvil')}
            >
              <SearchIcon className="tds-icon" />
            </button>
          </div>

          {/* ---- Cart ----*/}
          <Link aria-label="Carrito de compras" className="cart-link focus-link" href="/cart">
            <div className="relative">
              <span className="text-black-and-white absolute -top-2 -right-2 rounded-full bg-emerald-500 px-1 text-xs font-bold" />
              {/* todo: Reemplazar con la cuenta real del carrito */}
              <CartIcon className="tds-icon" />
            </div>
          </Link>
        </>
      )}

      {/* ---- Orchidarium Tollbar (Admin Tools) ---- */}
      {isOrchidarium && (
        <div className="tds-xl:flex hidden items-center gap-1">
          {/* ---- Store Icon ----*/}
          <Link className="focus-link-hover toolbar-icon" href="/" title="Tienda">
            <IoStorefrontOutline size={20} />
          </Link>

          {/* ---- ThemeToggle ----*/}
          <ThemeToggle />

          {/* ---- Account ----*/}
          <Link
            aria-label="Cuenta"
            className="focus-link-hover toolbar-icon mr-4"
            href="/orchidarium/account"
            title="Cuenta"
          >
            <PersonIcon className="tds-icon" />
          </Link>
        </div>
      )}

      {/* ---- Menu Button (OPTIMIZADO) ---- */}
      {/* Usamos el componente aislado en lugar del botón HTML directo */}
      <SidebarTrigger className={clsx(isOrchidarium && 'tds-xl:hidden')} />
    </>
  )
}
