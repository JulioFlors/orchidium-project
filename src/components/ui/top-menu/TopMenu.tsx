'use client'

import Link from 'next/link'
import { IoSearchOutline, IoCartOutline } from 'react-icons/io5'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'motion/react'

import { handleFocusSearchInput, PristinoPlant, SearchBox } from '@/components'
import { staticRoutes } from '@/config'
import { useUIStore } from '@/store'

const motionDivProps = {
  initial: { width: 0, opacity: 0 },
  animate: {
    width: 'auto',
    opacity: 1,
    transition: {
      x: { duration: 0.6, ease: 'easeOut' },
      opacity: { duration: 0.4, ease: 'easeOut', delay: 0.1 },
    },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: {
      x: { duration: 0.6, ease: 'easeInOut' },
      opacity: { duration: 0.3, ease: 'easeInOut', delay: 0.1 },
    },
  },
}

const motionButtonProps = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.6, opacity: { duration: 0.6, ease: 'easeInOut' } },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, opacity: { duration: 0.1, ease: 'easeOut' } },
  },
}

export function TopMenu() {
  const pathname = usePathname() //un atributo ARIA necesita la ruta actual

  const [hoveredLink, setHoveredLink] = useState<HTMLElement | null>(null)

  const indicatorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const searchBoxRef = useRef<HTMLDivElement | null>(null)

  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const openSidebar = useUIStore((state) => state.openSidebar)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const isSearchBoxExpanded = useUIStore((state) => state.isSearchBoxExpanded)
  const openSearchBox = useUIStore((state) => state.openSearchBox)
  const closeSearchBox = useUIStore((state) => state.closeSearchBox)

  useEffect(() => {
    if (hoveredLink && indicatorRef.current && menuRef.current) {
      const rect = hoveredLink.getBoundingClientRect()
      const menuRect = menuRef.current.getBoundingClientRect()

      // Obtener la altura del primer enlace
      const firstLink = menuRef.current.querySelector('.nav-link')
      const linkHeight = firstLink ? (firstLink as HTMLElement).offsetHeight : 0

      indicatorRef.current.style.width = `${rect.width}px`
      indicatorRef.current.style.transform = `translateX(${rect.left - menuRect.left}px)`
      indicatorRef.current.style.height = `${linkHeight + 4}px` // Establecer la altura + 4 POR EL PADDING
      indicatorRef.current.style.opacity = '1'
    } else if (indicatorRef.current) {
      indicatorRef.current.style.opacity = '0'
    }
  }, [hoveredLink])

  // Efecto para enfocar el input de búsqueda cuando el estado de expansión cambia.
  useEffect(() => {
    handleFocusSearchInput(isSearchBoxExpanded, searchContainerRef)
  }, [isSearchBoxExpanded, searchContainerRef])

  // Efecto para expandir el SearchBox si hay un searchTerm valido al montar el elemento
  useEffect(() => {
    if (searchTerm && !isSidebarOpen && !isSearchBoxExpanded) openSearchBox()

    if (!searchTerm && isSidebarOpen && isSearchBoxExpanded) closeSearchBox()
  }, [searchTerm, isSearchBoxExpanded, isSidebarOpen, openSearchBox, closeSearchBox])

  // Manejador de evento para el evento `onBlur` del contenedor de búsqueda.
  // Oculta el input de búsqueda si el foco se mueve fuera del contenedor y no hay ningún término de búsqueda activo
  const handleFocusOutSearch = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.relatedTarget as Node) &&
      !searchTerm
    ) {
      closeSearchBox()
    }
  }

  return (
    <header className="sticky top-0 z-10 bg-white">
      <div
        className="flex min-h-14 w-full items-center justify-between px-5 text-sm font-semibold"
        id="topMenu"
        role="menu"
      >
        {/* Letf Menu ( Logo | Tienda ) */}
        <h1
          className="text-primary flex min-h-14 flex-0 grow items-center justify-start"
          id="left-topMenu"
        >
          <Link className="focus-visible" href="/">
            <PristinoPlant />
          </Link>

          <Link
            className="focus-visible sr-only top-2 left-5 !w-[13rem] text-center focus:not-sr-only focus:absolute focus:z-20 focus:p-2"
            href="#main-content"
          >
            Saltar al contenido principal
          </Link>

          <span className="mx-4 text-[0.65625rem] leading-5 font-bold">|</span>

          <Link
            className={clsx(
              'focus-visible-hover hover:bg-hover hover:text-primary rounded px-0 py-1 transition-colors sm:px-4',
              { 'aria-current="page"': pathname === '/' },
            )}
            href="/"
          >
            Tienda
          </Link>
        </h1>

        {/* Main Menu (Categorias)*/}
        <div className="lg-small:block hidden">
          <div
            ref={indicatorRef}
            className="bg-hover text-primary absolute top-[20%] bottom-0 w-auto rounded transition-all duration-500 ease-in-out"
          />
          <nav
            ref={menuRef}
            className="flex min-h-14 w-full flex-0 grow items-center justify-center px-12"
            id="main-topMenu"
            role="navigation"
          >
            {staticRoutes
              .filter((route) => route.categories && route.categories.length > 0)
              .map((route) => (
                <Link
                  key={route.slug}
                  className={clsx('nav-link focus-visible-hover', {
                    'aria-current="page"': pathname === `${route.url}`,
                  })}
                  href={route.url || '#'}
                  onMouseEnter={(e) => setHoveredLink(e.currentTarget)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <span>{route.name}</span>
                </Link>
              ))}
          </nav>
        </div>

        {/* Right topMenu (SearchBox, Cart, Menu) */}
        <div className="flex min-h-14 flex-0 grow items-center justify-end" id="right-topMenu">
          <div className="lg-small:block hidden">
            <div ref={searchContainerRef} className="relative flex items-center">
              <AnimatePresence>
                {isSearchBoxExpanded ? (
                  <motion.div
                    key="search-input"
                    ref={searchBoxRef}
                    animate={motionDivProps.animate}
                    className="aceleracion-hardware"
                    exit={motionDivProps.exit}
                    initial={motionDivProps.initial}
                    onBlur={handleFocusOutSearch}
                  >
                    <SearchBox isTopMenu />
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-icon"
                    animate={motionButtonProps.animate}
                    aria-label="Buscar"
                    className="aceleracion-hardware mx-2 outline-none"
                    exit={motionButtonProps.exit}
                    initial={motionButtonProps.initial}
                    type="button"
                    onClick={openSearchBox}
                    onFocus={openSearchBox}
                  >
                    <IoSearchOutline className="h-5 w-5 cursor-pointer" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Link
            aria-haspopup="true"
            aria-label="Carrito de compras"
            className="focus-visible mx-2"
            href="/cart"
          >
            <div className="relative">
              <span
                aria-atomic="true"
                aria-live="polite"
                className="absolute -top-2 -right-2 rounded-full bg-emerald-500 px-1 text-xs font-bold text-white"
              >
                3
              </span>
              <IoCartOutline className="h-5 w-5" />
            </div>
          </Link>

          <button
            aria-expanded={isSidebarOpen}
            aria-label="Abrir menú"
            className="focus-visible-hover text-secondary hover:bg-hover hover:text-primary m-2 cursor-pointer rounded px-0 py-1 transition-colors sm:px-4"
            type="button"
            onClick={() => openSidebar()}
          >
            Menú
          </button>
        </div>
      </div>
    </header>
  )
}
