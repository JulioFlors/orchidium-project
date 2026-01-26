'use client'

import type { SearchSuggestion } from '@/actions'

import { IoCloseOutline, IoChevronBackOutline } from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useRef, useEffect } from 'react'
import clsx from 'clsx'

import { handleAccessibility, motionProps, OrchidariumSidebar, ShopSidebar } from '@/components'
import { Navigation, shopNavigation } from '@/config'
import { useUIStore } from '@/store'

interface Props {
  suggestions?: SearchSuggestion[]
}

export function Sidebar({ suggestions = [] }: Props) {
  // ----- Hooks ----
  const pathname = usePathname()

  // ---- Store (zustand) -----
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)
  const sidebarRoute = useUIStore((state) => state.sidebarRoute)

  // ----- Refs -----
  const navRef = useRef<HTMLElement | null>(null)

  // ----------------------------------------
  //  Helpers
  // ----------------------------------------

  // ----- obtenemos el Título de la Sección Actual -----
  const getCurrentTitle = () => {
    if (!sidebarRoute) return ''

    // Buscamos en ambas configuraciones
    const shopRoute = shopNavigation.find((r) => r.slug === sidebarRoute)

    if (shopRoute) return shopRoute.name

    const adminRoute = Navigation.find((r) => r.slug === sidebarRoute)

    if (adminRoute) return adminRoute.name

    return ''
  }

  // ----- Helpers -----
  const isOrchidarium = pathname.startsWith('/orchidarium')
  const currentTitle = getCurrentTitle()

  // ----------------------------------------
  //  useEffects
  // ----------------------------------------

  // ----- Accesibilidad -----
  useEffect(() => {
    return handleAccessibility(isSidebarOpen, navRef, setSidebarRoute)
  }, [isSidebarOpen, navRef, setSidebarRoute, sidebarRoute])

  // ----- Cierre Automático (Solo Orquideario) -----
  useEffect(() => {
    if (!isOrchidarium) return

    const mediaQuery = window.matchMedia('(min-width: 75rem)') // tds-xl

    const handleResize = (e: MediaQueryListEvent) => {
      if (e.matches && isSidebarOpen) {
        closeSidebar()
      }
    }

    // Escuchamos los cambios
    mediaQuery.addEventListener('change', handleResize)

    // Check inicial
    if (mediaQuery.matches && isSidebarOpen) {
      closeSidebar()
    }

    return () => mediaQuery.removeEventListener('change', handleResize)
  }, [isSidebarOpen, closeSidebar, isOrchidarium])

  // ----------------------------------------
  //  Render (JSX)
  // ----------------------------------------
  return (
    <div>
      {/* ---- Background black ---- */}
      {isSidebarOpen && <div className="fixed top-0 left-0 z-20 h-dvh w-dvw bg-black opacity-30" />}

      {/* ---- Blur Backdrop ---- */}
      {isSidebarOpen && (
        <div
          className="fade-in fixed top-0 left-0 z-20 h-dvh w-dvw backdrop-blur-xs backdrop-filter"
          onClick={closeSidebar}
        />
      )}

      {/* ---- Sidebar Container ---- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.nav
            key="sidebar-nav"
            ref={navRef}
            {...motionProps}
            aria-hidden={!isSidebarOpen}
            aria-label="Menú de navegación"
            aria-modal={isSidebarOpen}
            className="aceleracion-hardware bg-canvas fixed top-0 right-0 z-30 flex h-dvh w-[414px] max-w-[82.3vw] flex-col shadow-xl sm:min-w-[414px]"
            role="dialog"
          >
            {/* ---- Sidebar Header ---- */}
            <div
              className={clsx(
                `text-secondary tds-xs:mt-3 tds-xs:mb-5 sticky top-0 z-10 flex items-center justify-between px-7.5`,
                `${sidebarRoute ? 'my-2' : ''}`,
              )}
            >
              {/* IZQUIERDA: Botón Volver (con ancho fijo para balancear flex) */}
              <div className="flex flex-1 justify-start">
                {sidebarRoute ? (
                  <button
                    aria-label="Volver al menú principal"
                    className="focus-link-hover header-sidebar"
                    type="button"
                    onClick={() => setSidebarRoute(null)}
                  >
                    <IoChevronBackOutline className="tds-icon" />
                    <span className="tds-xs:block mr-1 hidden">Volver</span>
                  </button>
                ) : (
                  // Placeholder vacío para mantener el layout
                  <div className="h-8 w-8" />
                )}
              </div>

              {/* CENTRO: Título de Sección */}
              <div className="shrink-0 text-center">
                {sidebarRoute && <h2 className="title-sidebar">{currentTitle}</h2>}
              </div>

              {/* DERECHA: Botón Cerrar */}
              <div className="flex flex-1 justify-end">
                <button
                  aria-label="Cerrar menú"
                  className="focus-link-hover header-sidebar"
                  type="button"
                  onClick={() => closeSidebar()}
                >
                  <IoCloseOutline className="icon-close" />
                </button>
              </div>
            </div>

            {/* ---- Sidebar Content (Scrollable) ---- */}
            <div className="mx-8 flex flex-1 flex-col items-start overflow-x-hidden pb-4 text-left">
              {isOrchidarium ? <OrchidariumSidebar /> : <ShopSidebar suggestions={suggestions} />}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
