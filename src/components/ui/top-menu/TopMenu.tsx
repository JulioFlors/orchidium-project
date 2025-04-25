'use client'

import clsx from 'clsx'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IoSearchOutline, IoCartOutline } from 'react-icons/io5'

import { staticRoutes } from '@/config'
import { useUIStore } from '@/store'
import { Route } from '@/interfaces'
import {
  handleFocusSearchInput,
  PristinoPlant,
  SearchBox,
  motionIconSearch,
  motionSearchBox,
  motionSubMenuVariants,
} from '@/components'

export function TopMenu() {
  // aria-current="page" necesita evaluar la ruta actual
  const pathname = usePathname()

  // ----- Estados globales -----
  const closeSearchBox = useUIStore((state) => state.closeSearchBox)
  const isSearchBoxExpanded = useUIStore((state) => state.isSearchBoxExpanded)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const openSearchBox = useUIStore((state) => state.openSearchBox)
  const openSidebar = useUIStore((state) => state.openSidebar)
  const searchTerm = useUIStore((state) => state.searchTerm)

  // ----- Estados locales -----
  const [activeSubMenuRoute, setActiveSubMenuRoute] = useState<Route | null>(null)
  const [hoveredLink, setHoveredLink] = useState<HTMLElement | null>(null)
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false)
  const [subMenuTargetAnimation, setSubMenuTargetAnimation] = useState<'enter' | 'switch'>('enter')

  // ----- Refs -----
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hoveredRef = useRef<HTMLDivElement>(null)
  const mainMenuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)

  // ----- Funciones Auxiliares -----

  // ---- Limpia la ref del timeout anterior ----
  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  // ---- Gestiona el cierre del subMenu -----
  const startCloseTimeout = () => {
    clearCloseTimeout() // Limpia cualquier timeout anterior antes de iniciar uno nuevo

    closeTimeoutRef.current = setTimeout(() => {
      setIsSubMenuOpen(false)
      setActiveSubMenuRoute(null)
      setHoveredLink(null)
    }, 10)
  }

  // ---- Al hacer hover en algun Link del mainMenu... -----
  const handleMainMenuLinkMouseEnter = (
    event: React.MouseEvent<HTMLAnchorElement>,
    route: Route,
  ) => {
    clearCloseTimeout()

    // Establece la animación objetivo BASADA en el estado actual
    setSubMenuTargetAnimation(isSubMenuOpen ? 'switch' : 'enter')

    setActiveSubMenuRoute(route) // Actualiza la ruta activa
    setIsSubMenuOpen(true) // Si ya era true, no causa re-render por sí mismo, pero es necesario.
    setHoveredLink(event.currentTarget) // establece el HoveredLink
  }

  // ---- Al entrar al mainMenu, cancela cierre pendiente del subMenu -----
  const handleMainMenuContainerMouseEnter = () => {
    clearCloseTimeout() // Cancela cierre si el cursor se mueve entre links pero dentro del contenedor
  }

  // ---- Al salir del mainMenu, inicia el timeout para cerrar el subMenu -----
  const handleMainMenuContainerMouseLeave = () => {
    startCloseTimeout()
  }

  // ---- Al entrar al subMenu, cancela el cierre pendiente -----
  const handleSubMenuContainerMouseEnter = () => {
    // Cancela el cierre si se mueve del main menu al submenu
    clearCloseTimeout()

    // re-establecer el hoveredLink si se perdió
    if (!hoveredLink && activeSubMenuRoute && mainMenuRef.current) {
      const link = mainMenuRef.current.querySelector<HTMLAnchorElement>(
        `a[href="${activeSubMenuRoute.url}"]`,
      )

      if (link) setHoveredLink(link)
    }
  }

  // ---- Al salir del subMenu, inicia el timeout para cerrar -----
  const handleSubMenuContainerMouseLeave = () => {
    startCloseTimeout()
  }

  // ---- Oculta el SearchBox si el foco se mueve fuera del contenedor y no hay ningún término de búsqueda activo -----
  const handleFocusOutSearch = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.relatedTarget as Node) &&
      !searchTerm
    ) {
      closeSearchBox()
    }
  }

  // ----- useEffects -----

  // ---- Actualiza la posición y el tamaño del hoveredRef -----
  useEffect(() => {
    if (hoveredLink && hoveredRef.current && mainMenuRef.current) {
      const rect = hoveredLink.getBoundingClientRect()
      const menuRect = mainMenuRef.current.getBoundingClientRect()

      // Obtener la altura del primer enlace
      const firstLink = mainMenuRef.current.querySelector('.nav-link')
      const linkHeight = firstLink ? (firstLink as HTMLElement).offsetHeight : 0

      hoveredRef.current.style.width = `${rect.width}px`
      hoveredRef.current.style.transform = `translateX(${rect.left - menuRect.left}px)`
      hoveredRef.current.style.height = `${linkHeight + 4}px` // Establecer la altura + 4 POR EL PADDING
      hoveredRef.current.style.opacity = '1'
    } else if (hoveredRef.current) {
      hoveredRef.current.style.opacity = '0'
    }
  }, [hoveredLink])

  // ----- Enfoca el SearchBox cuando se abre/expande -----
  useEffect(() => {
    handleFocusSearchInput(isSearchBoxExpanded, searchContainerRef)
  }, [isSearchBoxExpanded, searchContainerRef])

  // ----- Expande el SearchBox si hay un searchTerm valido al montar el componete -----
  useEffect(() => {
    if (searchTerm && !isSidebarOpen && !isSearchBoxExpanded) openSearchBox()
    if (!searchTerm && isSidebarOpen && isSearchBoxExpanded) closeSearchBox()
  }, [searchTerm, isSearchBoxExpanded, isSidebarOpen, openSearchBox, closeSearchBox])

  // ----- Limpia el timeout antes de que el componente TopMenu se desmonte -----
  useEffect(() => {
    return () => {
      clearCloseTimeout()
    }
  }, [])

  return (
    <header className="sticky top-0 z-10 bg-white">
      {/* Contenedor principal del TopMenu */}
      <div
        aria-label="Container topMenu"
        className="relative flex min-h-14 w-full items-center justify-between px-5 text-sm font-semibold"
        id="topMenu"
        role="menu"
      >
        {/* Letf Menu ( Logo | Tienda ) */}
        <h1
          aria-label="Container left-topMenu"
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
            {/* TODO: href="/tienda" */}
            Tienda
          </Link>
        </h1>

        {/* Ocultar Container main-topMenu en pantallas pequeñas donde se usa el Sidebar */}
        <div
          aria-label="Container main-topMenu"
          className="lg-small:block lg-small:relative hidden"
          onMouseEnter={handleMainMenuContainerMouseEnter}
          onMouseLeave={handleMainMenuContainerMouseLeave}
        >
          {/* Hover personalizado para la animacion de la Navegacion del main-topMenu */}
          <div
            ref={hoveredRef}
            aria-hidden="true"
            className="bg-hover text-primary pointer-events-none absolute top-[20%] bottom-0 w-auto rounded opacity-0 transition-all duration-500 ease-in-out"
          />

          {/* Navegación */}
          <nav
            ref={mainMenuRef}
            aria-label="Navegación Principal"
            className="flex min-h-14 w-full flex-0 grow items-center justify-center px-12"
            id="main-topMenu"
            role="navigation"
          >
            {staticRoutes
              .filter((route) => route.categories && route.categories.length > 0)
              .map((route) => (
                <Link
                  key={route.slug}
                  aria-expanded={isSubMenuOpen && activeSubMenuRoute?.slug === route.slug}
                  aria-haspopup="menu"
                  className={clsx('nav-link focus-visible-hover relative px-4 py-1', {
                    'aria-current="page"': pathname === `${route.url}`,
                  })}
                  href={route.url}
                  onMouseEnter={(e) => handleMainMenuLinkMouseEnter(e, route)}
                >
                  <span>{route.name}</span>
                </Link>
              ))}
          </nav>
        </div>

        {/* Right topMenu (SearchBox, Cart, Menu) */}
        <div
          aria-label="Container right-topMenu"
          className="flex min-h-14 flex-0 grow items-center justify-end"
          id="right-topMenu"
        >
          {/* SearchBox - Ocultar en pantallas pequeñas */}
          <div className="lg-small:block hidden">
            <div ref={searchContainerRef} className="relative flex items-center">
              <AnimatePresence>
                {isSearchBoxExpanded ? (
                  <motion.div
                    key="search-input"
                    animate={motionSearchBox.animate}
                    className="aceleracion-hardware z-10"
                    exit={motionSearchBox.exit}
                    initial={motionSearchBox.initial}
                    onBlur={handleFocusOutSearch}
                  >
                    <SearchBox isTopMenu />
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-icon"
                    animate={motionIconSearch.animate}
                    aria-label="Buscar"
                    className="aceleracion-hardware mx-2 outline-none"
                    exit={motionIconSearch.exit}
                    initial={motionIconSearch.initial}
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

          {/* Cart */}
          <Link
            aria-haspopup="false"
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
                3 {/* todo: Reemplazar con la cuenta real del carrito */}
              </span>
              <IoCartOutline className="h-5 w-5" />
            </div>
          </Link>

          {/* Menu Button */}
          <button
            aria-expanded={isSidebarOpen}
            aria-label="Abrir menú"
            className="focus-visible-hover text-secondary hover:bg-hover hover:text-primary m-2 cursor-pointer rounded px-0 py-1 transition-colors sm:px-4"
            type="button"
            onClick={openSidebar}
          >
            Menú
          </button>
        </div>
      </div>

      {/* SubMenu Container */}
      <AnimatePresence>
        {isSubMenuOpen && activeSubMenuRoute?.categories && (
          <motion.div
            key={activeSubMenuRoute.slug}
            animate={subMenuTargetAnimation}
            className="aceleracion-hardware lg-small:block absolute top-full right-0 left-0 hidden w-full bg-white"
            exit="exit"
            initial="initial"
            variants={motionSubMenuVariants}
            onMouseEnter={handleSubMenuContainerMouseEnter}
            onMouseLeave={handleSubMenuContainerMouseLeave}
          >
            {/* Contenedor interno */}
            <div className="mx-auto flex w-full justify-between px-25 py-15">
              {/* Columna Izquierda: Categorías */}
              <div className="flex flex-col space-y-3 pr-8">
                {activeSubMenuRoute.categories.map((category) => (
                  <div key={category.slug}>
                    <Link
                      className="focus-visible text-primary font-semibold hover:text-emerald-600"
                      href={category.url}
                      onClick={() => setIsSubMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                    {/* Lógica para grupos si aplica */}
                  </div>
                ))}
              </div>

              {/* Columna Derecha: Item Destacado */}
              {activeSubMenuRoute.featuredItem && (
                <div className="w-1/3 flex-shrink-0">
                  {activeSubMenuRoute.featuredItem.image && (
                    <div className="overflow-hidden rounded-xs">
                      <div className="relative aspect-video h-full w-full">
                        <Image
                          fill
                          priority
                          alt={activeSubMenuRoute.featuredItem.name}
                          className="object-cover"
                          sizes="(max-width: 414px)"
                          src={activeSubMenuRoute.featuredItem.image}
                        />
                      </div>
                    </div>
                  )}

                  <Link
                    className="focus-visible text-primary mt-3 block text-center font-semibold"
                    href={activeSubMenuRoute.featuredItem.url}
                    onClick={() => setIsSubMenuOpen(false)}
                  >
                    {activeSubMenuRoute.featuredItem.name}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
