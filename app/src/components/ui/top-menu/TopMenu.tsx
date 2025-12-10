'use client'

import type { PlantsNavData, SearchSuggestion } from '@/actions'

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
  motionIconSearch,
  motionSearchBox,
  motionSubMenu,
  PristinoPlant,
  SearchBox,
} from '@/components'

// Mapeo de slugs de categoría a tipos de plantas (usados en la propiedad 'plantType' de los géneros).
// Esto se usa para filtrar los géneros que pertenecen a una categoría específica.
const categoryWrapper: Record<string, string> = {
  orchids: 'orchid',
  adenium_obesum: 'adenium_obesum',
  cactus: 'cactus',
  succulents: 'succulent',
  bromeliads: 'bromeliad',
}

interface Props {
  suggestions?: SearchSuggestion[]
  plantsNavData?: PlantsNavData[]
  isAuthLayout?: boolean
}

export function TopMenu({
  suggestions = [],
  plantsNavData = [],
  isAuthLayout = false,
}: Props) {
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

  // ----- Refs -----
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hoveredRef = useRef<HTMLDivElement>(null)
  const mainMenuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const wasSubMenuOpenRef = useRef(false)

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
      wasSubMenuOpenRef.current = false
    }, 50) // Un pequeño delay antes de cerrar el subMenu
  }

  // ---- Al hacer hover en algun Link del mainMenu... -----
  const handleMainMenuLinkMouseEnter = (
    event: React.MouseEvent<HTMLAnchorElement>,
    route: Route,
  ) => {
    clearCloseTimeout()

    // Antes de actualizar el estado, registramos si el subMenu estaba abierto
    wasSubMenuOpenRef.current = isSubMenuOpen

    setHoveredLink(event.currentTarget) // establece el HoveredLink fuera del Timeout

    closeTimeoutRef.current = setTimeout(() => {
      setIsSubMenuOpen(true) // Si ya era true, no causa re-render por sí mismo, pero es necesario.
      setActiveSubMenuRoute(route) // Actualiza la ruta activa
    }, 100) // Un pequeño delay para permitir mover el cursor entre links sin abrir el subMenu "sin querer"
  }

  // ---- Al entrar al mainMenu, cancela cierre pendiente del subMenu -----
  const handleMainMenuContainerMouseEnter = () => {
    clearCloseTimeout()
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
    <header aria-label="Cabecera principal" className="fixed top-0 z-10 w-full bg-white">
      {/*---- Contenedor interno para el flex layout ----*/}
      <div className="relative flex min-h-14 w-full items-center justify-between text-sm font-semibold">
        {/*---- Left Menu ( Logo | Tienda ) ----*/}
        <div className="left-menu-container">
          <div className="left-menu-wrapper">
            <Link className="focus-link" href="/">
              <PristinoPlant />
            </Link>

            <Link
              className="focus-link sr-only top-2 left-5 w-52! text-center focus:not-sr-only focus:absolute focus:z-20 focus:p-2"
              href="#main-content"
            >
              Saltar al contenido principal
            </Link>

            {!isAuthLayout && (
              <>
                <span className="pipe">|</span>

                <Link
                  className={clsx('focus-link-hover page-shop', {
                    'aria-current="page"': pathname === '/',
                  })}
                  href="/"
                >
                  {/* TODO: href="/tienda" */}
                  Tienda
                </Link>
              </>
            )}
          </div>
        </div>

        {!isAuthLayout && (
          <>
            {/*---- Ocultar main-menu-container en pantallas pequeñas donde se usa el Sidebar ----*/}
            <div
              className="tds-xl:block tds-xl:relative hidden"
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
                className="flex min-h-14 w-full flex-1 items-center justify-center px-12"
                id="main-topMenu"
              >
                {staticRoutes
                  .filter((route) => route.categories && route.categories.length > 0)
                  .map((route) => (
                    <Link
                      key={route.slug}
                      aria-expanded={isSubMenuOpen && activeSubMenuRoute?.slug === route.slug}
                      className={clsx('nav-link focus-link-hover relative px-4 py-1', {
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

            {/*---- Right Menu Container (SearchBox, Cart, Menu) ----*/}
            <div className="right-menu-container">
              <div className="right-menu-wrapper">
                {/* SearchBox - Ocultar en pantallas pequeñas */}
                <div className="tds-xl:block hidden">
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
                          <SearchBox isTopMenu suggestions={suggestions} />
                        </motion.div>
                      ) : (
                        <motion.button
                          key="search-icon"
                          animate={motionIconSearch.animate}
                          aria-label="Buscar"
                          className="aceleracion-hardware mx-1.5 outline-none"
                          exit={motionIconSearch.exit}
                          initial={motionIconSearch.initial}
                          type="button"
                          onClick={openSearchBox}
                          onFocus={openSearchBox}
                        >
                          <IoSearchOutline className="h-[21px] w-[21px] cursor-pointer" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Cart */}
                <Link
                  aria-label="Carrito de compras"
                  className="cart-link focus-link"
                  href="/cart"
                >
                  <div className="relative">
                    <span
                      aria-atomic="true"
                      aria-live="polite"
                      className="absolute -top-2 -right-2 rounded-full bg-emerald-500 px-1 text-xs font-bold text-white"
                    >
                      {/* todo: Reemplazar con la cuenta real del carrito */}
                    </span>
                    <IoCartOutline className="icon-cart" />
                  </div>
                </Link>

                {/* Menu Button */}
                <button
                  aria-expanded={isSidebarOpen}
                  aria-label="Abrir menú"
                  className="menu-button"
                  type="button"
                  onClick={openSidebar}
                >
                  Menú
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* SubMenu Container */}
      {!isAuthLayout && (
        <AnimatePresence>
          {isSubMenuOpen && activeSubMenuRoute?.categories && (
            <motion.div
              key={activeSubMenuRoute.slug}
              animate="animate"
              className="aceleracion-hardware tds-xl:block absolute top-full right-0 left-0 hidden w-full bg-white"
              custom={wasSubMenuOpenRef.current}
              exit="exit"
              initial="initial"
              variants={motionSubMenu}
              onMouseEnter={handleSubMenuContainerMouseEnter}
              onMouseLeave={handleSubMenuContainerMouseLeave}
            >
              {/* Contenedor interno */}
              <div className="mx-auto flex w-full justify-between px-20 py-15">
                {/* Columna Izquierda: Categorías y Géneros */}
                <div className="-mx-4 flex flex-1">
                  {activeSubMenuRoute.categories.map((category) => {
                    // Encontrar los GRUPOS (géneros) que pertenecen a ESTA categoría
                    const groupsInCategory = plantsNavData.filter(
                      (gen) => gen.type.toLowerCase() === categoryWrapper[category.slug],
                    )

                    // Si no hay géneros en esta categoría, no renderizamos nada
                    if (groupsInCategory.length === 0) return null

                    return (
                      <div key={category.slug} className="flex-1 px-4">
                        {/* Título de la CATEGORÍA (Link a la página de categoría) */}
                        <p className="-tracking-2 mb-2 w-full text-base font-semibold text-black">
                          <Link
                            href={category.url}
                            tabIndex={-1}
                            onClick={() => setIsSubMenuOpen(false)}
                          >
                            {category.name}
                          </Link>
                        </p>

                        {/* Barra separadora */}
                        <div className="mb-5 h-1 w-full bg-neutral-300" />

                        {/* Lista de GRUPOS (géneros) */}
                        <ul className="max-h-61 w-full space-y-2 overflow-hidden">
                          {groupsInCategory.map((group) => (
                            <li key={group.name}>
                              {/* Link al GRUPO (género) dentro de la página de categoría */}
                              {/* La URL apunta a la página de categoría con un hash para el scroll */}
                              <Link
                                className="-tracking-2 leading-6 font-medium transition-colors duration-500 hover:text-black"
                                href={`${category.url}#${group.name.toLowerCase()}`}
                                tabIndex={-1}
                                onClick={() => setIsSubMenuOpen(false)}
                              >
                                {group.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {/* Columna Derecha: Item Destacado */}
                {activeSubMenuRoute.featuredItem &&
                  (() => {
                    const numCategories = activeSubMenuRoute.categories?.length || 0
                    let marginLeftPercent = 0

                    if (numCategories === 1) {
                      marginLeftPercent = 53
                    } else if (numCategories === 2) {
                      marginLeftPercent = 40
                    } else if (numCategories === 3) {
                      marginLeftPercent = 30
                    } else if (numCategories === 4) {
                      marginLeftPercent = 15
                    } else if (numCategories >= 5) {
                      marginLeftPercent = 2
                    }

                    return (
                      <div
                        className="w-1/3 shrink-0"
                        style={{
                          marginLeft: `${marginLeftPercent}%`,
                        }}
                      >
                        <Link
                          href={activeSubMenuRoute.featuredItem.url}
                          tabIndex={-1}
                          onClick={() => setIsSubMenuOpen(false)}
                        >
                          {activeSubMenuRoute.featuredItem.image && (
                            <div className="h-[90%] overflow-hidden rounded-xs">
                              <div className="relative aspect-video h-full w-full">
                                <Image
                                  fill
                                  priority
                                  alt={activeSubMenuRoute.featuredItem.name}
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  src={activeSubMenuRoute.featuredItem.image}
                                />
                              </div>
                            </div>
                          )}

                          {/* Título del Item Destacado */}
                          <p className="tracking-4 mt-3 block text-center text-xl font-semibold antialiased">
                            {activeSubMenuRoute.featuredItem.name}
                          </p>
                        </Link>
                      </div>
                    )
                  })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </header>
  )
}
