'use client'

import type { PlantsNavData, SearchSuggestion } from '@/actions'

import clsx from 'clsx'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

import { NavItem } from '@/interfaces'
import { Navbar, NavbarDropdown, motionSubMenu, PristinoPlant, Toolbar } from '@/components'
import { shopNavigation, Navigation } from '@/config'

interface Props {
  suggestions?: SearchSuggestion[]
  plantsNavData?: PlantsNavData[]
}

export function Header({ suggestions = [], plantsNavData = [] }: Props) {
  // ----- Hooks -----
  const pathname = usePathname()
  const isAuthLayout = pathname.startsWith('/auth')
  const isOrchidarium = pathname.startsWith('/orchidarium')

  // ----- Estados Locales -----
  const [activeItem, setActiveItem] = useState<NavItem | null>(null)
  const [hoveredLink, setHoveredLink] = useState<HTMLElement | null>(null)
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false)
  const [wasSubMenuOpen, setWasSubMenuOpen] = useState(false)

  // ----- Refs -----
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  // ----------------------------------------
  // Logica de Navegacion Dinamica
  // ----------------------------------------
  /**
   * Renderiza los enlaces de navegación central dependiendo del contexto
   */
  const getNavItems = (): NavItem[] => {
    // El Navbar se mantiene limpio.
    if (isAuthLayout) return []

    if (isOrchidarium) {
      return Navigation.map((module) => ({
        key: module.slug,
        label: module.name,
        href: module.slug === 'dashboard' ? '/orchidarium' : module.basePath,
        isActive:
          module.slug === 'dashboard'
            ? pathname === '/orchidarium'
            : pathname.startsWith(module.basePath),
        hasDropdown: true,
        dropdownType: module.dropdownLayout,
        childrenData: module.sidebarItems,
      }))
    }

    return shopNavigation
      .filter((route) => route.categories && route.categories.length > 0)
      .map((route) => ({
        key: route.slug,
        label: route.name,
        href: route.url,
        isActive: pathname === route.url,
        hasDropdown: true,
        dropdownType: 'shop',
        childrenData: route,
      }))
  }

  const navItems = getNavItems()

  // ----------------------------------------
  //  MANEJADORES DE EVENTOS (HANDLERS)
  // ----------------------------------------
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
      setActiveItem(null)
      setHoveredLink(null)
      setWasSubMenuOpen(false)
    }, 50) // Un pequeño delay antes de cerrar el subMenu
  }

  // ---- Al hacer hover en algun Link del mainMenu... -----
  const handleItemHover = (item: NavItem, element: HTMLElement) => {
    clearCloseTimeout()

    // Antes de actualizar el estado, registramos si el subMenu estaba abierto
    setWasSubMenuOpen(isSubMenuOpen)

    setHoveredLink(element) // establece el HoveredLink fuera del Timeout

    closeTimeoutRef.current = setTimeout(() => {
      setIsSubMenuOpen(true) // Si ya era true, no causa re-render por sí mismo, pero es necesario.
      setActiveItem(item) // Actualiza la ruta activa
    }, 100) // Un pequeño delay para permitir mover el cursor entre links sin abrir el subMenu "sin querer"
  }

  // ---- Al entrar al mainMenu, cancela cierre pendiente del subMenu -----
  const handleHeaderMouseEnter = () => clearCloseTimeout()

  // ---- Al salir del mainMenu, inicia el timeout para cerrar el subMenu -----
  const handleHeaderMouseLeave = () => startCloseTimeout()

  // ---- Al entrar al subMenu, cancela el cierre pendiente -----
  // Lógica para mantener el pill si entramos al dropdown
  const handleSubMenuMouseEnter = () => {
    // Cancela el cierre si se mueve del main menu al submenu
    clearCloseTimeout()

    // Si se perdió el hoveredLink, intentamos restaurarlo
    if (!hoveredLink && activeItem && navRef.current) {
      // Buscamos el link que corresponde al item activo dentro del nav
      const link = navRef.current.querySelector<HTMLElement>(`a[href="${activeItem.href}"]`)

      if (link) setHoveredLink(link)
    }
  }

  // ---- Al salir del subMenu, inicia el timeout para cerrar -----
  const handleSubMenuMouseLeave = () => {
    startCloseTimeout()
  }

  // ----------------------------------------
  //  useEffects
  // ----------------------------------------

  // ----- Limpia el timeout antes de que el componente Header se desmonte -----
  useEffect(() => {
    return () => {
      clearCloseTimeout()
    }
  }, [])

  // ----------------------------------------
  //  Render (JSX)
  // ----------------------------------------
  return (
    <header
      aria-label="Cabecera principal"
      className={clsx('bg-canvas top-0 z-10 w-full', isAuthLayout ? 'tds-sm:fixed' : 'fixed')}
    >
      {/*---- Contenedor interno para el flex layout ----*/}
      <div className="tds-xs:h-14 relative flex h-9 w-full items-center justify-between font-semibold">
        {/*---- Left Menu (Logo | section-label) ----*/}
        <div className="left-menu-container">
          <div className="left-menu-wrapper">
            <Link className="focus-link" href="/">
              <PristinoPlant className={isAuthLayout ? 'w-36' : ''} />
            </Link>

            <Link
              className={clsx(
                'focus-link tds-xs:text-sm tds-xs:left-5 sr-only top-2 left-2 text-center text-[9px] focus:not-sr-only focus:absolute focus:z-20 focus:p-2',
                // Centrado respecto al logo | label
                'tds-xs:focus:h-8 focus:h-6',
                'tds-xs:focus:top-3 focus:top-1.5',
                // Centrado del texto dentro del botón
                'focus:flex focus:items-center focus:justify-center',
                {
                  'tds-xs:w-66! w-43!': isOrchidarium,
                  'tds-xs:w-53! w-37!': !isOrchidarium,
                },
              )}
              href="#main-content"
            >
              Saltar al contenido principal
            </Link>

            {/* Etiquetas Contextuales */}
            {!isAuthLayout && !isOrchidarium && (
              <>
                <span className="pipe">|</span>
                <Link
                  className={clsx('focus-link-hover section-label', {
                    'aria-current="page"': pathname === '/',
                  })}
                  href="/"
                >
                  {/* TODO: href="/shop" cuando se tenga un landing page en href="/" */}
                  Tienda
                </Link>
              </>
            )}

            {!isAuthLayout && isOrchidarium && (
              <>
                <span className="pipe">|</span>
                <Link
                  className={clsx('focus-link-hover section-label', {
                    'aria-current="page"': pathname === '/orchidarium',
                  })}
                  href="/orchidarium"
                >
                  Orquideario
                </Link>
              </>
            )}
          </div>
        </div>

        {/*---- Navbar.tsx (Desktop) ----*/}
        {!isAuthLayout && (
          <div
            className="tds-xl:block tds-xl:relative hidden h-full flex-1"
            onMouseEnter={handleHeaderMouseEnter}
            onMouseLeave={handleHeaderMouseLeave}
          >
            <Navbar
              activeItem={activeItem}
              hoveredLink={hoveredLink}
              items={navItems}
              navRef={navRef}
              onItemHover={handleItemHover}
            />
          </div>
        )}

        {/*---- Right Menu Container (Toolbar.tsx) ----*/}
        <div className={clsx('right-menu-container', isAuthLayout && 'pr-5')}>
          <div className="right-menu-wrapper">
            <Toolbar
              isAuthLayout={isAuthLayout}
              isOrchidarium={isOrchidarium}
              suggestions={suggestions}
            />
          </div>
        </div>
      </div>

      {/* ---- NavbarDropdown.tsx (Desktop) ---- */}
      <AnimatePresence>
        {isSubMenuOpen && activeItem && (
          <motion.div
            key={activeItem.key}
            animate="animate"
            className="aceleracion-hardware tds-xl:block bg-canvas absolute top-full right-0 left-0 hidden w-full"
            custom={wasSubMenuOpen}
            exit="exit"
            initial="initial"
            variants={motionSubMenu}
            onMouseEnter={handleSubMenuMouseEnter}
            onMouseLeave={handleSubMenuMouseLeave}
          >
            <NavbarDropdown
              activeItem={activeItem}
              plantsNavData={plantsNavData}
              onClose={() => setIsSubMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
