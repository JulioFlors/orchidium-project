'use client'

import Link from 'next/link'
import { IoSearchOutline, IoCartOutline } from 'react-icons/io5'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'motion/react'

import { PristinoPlant, Searchbox } from '@/components'
import { useUIStore } from '@/store'

export function TopMenu() {
  const [hoveredLink, setHoveredLink] = useState<HTMLElement | null>(null)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const indicatorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const isSideMenuOpen = useUIStore((state) => state.isSideMenuOpen)
  const openMenu = useUIStore((state) => state.openSideMenu)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const searchResults = useUIStore((state) => state.searchResults)

  const pathname = usePathname() //un atributo ARIA necesita la ruta actual

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

  const handleSearchClick = () => {
    setIsSearchExpanded(true)
    // Focus en el input cuando se expande
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100) // Pequeño delay para asegurar que el input esté montado
  }

  const handleFocusOutSearch = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.relatedTarget as Node) &&
      !searchTerm
    ) {
      setIsSearchExpanded(false)
    }
  }

  return (
    <header className="sticky-top-menu">
      <nav className="flex w-full items-center justify-between px-5 py-1 text-sm font-semibold">
        {/* Letf Menu ( Logo | Tienda ) */}
        <div className="text-primary flex items-center justify-start">
          <Link className="focus-visible" href="/">
            <PristinoPlant />
          </Link>

          <Link
            className="focus-visible sr-only top-2 left-5 !w-[13rem] text-center focus:not-sr-only focus:absolute focus:z-20 focus:p-2"
            href="#main-content"
          >
            Saltar al contenido principal
          </Link>

          <span className="mx-4">|</span>

          <Link
            className={clsx(
              'focus-visible-hover hover:bg-hover hover:text-primary rounded px-0 py-1 transition-all sm:px-2',
              { 'aria-current="page"': pathname === '/' },
            )}
            href="/"
          >
            Tienda
          </Link>
        </div>

        {/* Main Menu (Categorias)*/}
        <div className="lg-small:block hidden">
          <div
            ref={indicatorRef}
            className="bg-hover text-primary absolute top-[20%] bottom-0 w-auto rounded transition-all duration-500 ease-in-out"
          />
          <div ref={menuRef} className="flex w-full items-center justify-center">
            <Link
              className={clsx('nav-link focus-visible-hover', {
                'aria-current="page"': pathname === '/category/orquideas',
              })}
              href="/category/orquideas"
              onMouseEnter={(e) => setHoveredLink(e.currentTarget)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Orquídeas
            </Link>
            <Link
              className={clsx('nav-link focus-visible-hover', {
                'aria-current="page"': pathname === '/category/rosas-del-desierto',
              })}
              href="/category/rosas-del-desierto"
              onMouseEnter={(e) => setHoveredLink(e.currentTarget)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Rosas del Desierto
            </Link>
            <Link
              className={clsx('nav-link focus-visible-hover', {
                'aria-current="page"': pathname === '/category/cactus',
              })}
              href="/category/cactus"
              onMouseEnter={(e) => setHoveredLink(e.currentTarget)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Cactus
            </Link>
            <Link
              className={clsx('nav-link focus-visible-hover', {
                'aria-current="page"': pathname === '/category/suculentas',
              })}
              href="/category/suculentas"
              onMouseEnter={(e) => setHoveredLink(e.currentTarget)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Suculentas
            </Link>
          </div>
        </div>

        {/* Right Menu (SearchBox, Cart, Menu) */}
        <div className="flex items-center justify-end">
          <div className="lg-small:block hidden">
            <div ref={searchContainerRef} className="relative">
              <AnimatePresence>
                {isSearchExpanded ? (
                  <motion.div
                    key="search-input"
                    animate={{
                      width: 'auto',
                      opacity: 1,
                      transition: { duration: 0.3, ease: 'easeInOut' },
                    }}
                    className="aceleracion-hardware ml-2"
                    exit={{
                      width: 0,
                      opacity: 0,
                      transition: { duration: 0.2, ease: 'easeInOut' },
                    }}
                    initial={{ width: 0, opacity: 0 }}
                    tabIndex={0} // Para que el contenedor sea focusable
                    onBlur={handleFocusOutSearch}
                  >
                    <Searchbox isTopMenu searchResults={searchResults} />
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-icon"
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.2 } }}
                    aria-label="Buscar"
                    className="focus-visible mx-2"
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    onClick={handleSearchClick}
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
            aria-expanded={isSideMenuOpen}
            aria-label="Abrir menú"
            className="focus-visible-hover text-secondary hover:bg-hover hover:text-primary m-2 cursor-pointer rounded px-0 py-1 transition-all sm:px-2"
            type="button"
            onClick={() => openMenu()}
          >
            Menú
          </button>
        </div>
      </nav>
    </header>
  )
}
