'use client'

import { useRef, useEffect } from 'react'
import { IoCloseOutline, IoChevronBackOutline } from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'

import { MainContent } from './MainContent'
import { CategoryContent } from './CategoryContent'
import { handleAccessibility } from './Utils'

import { useUIStore } from '@/store'

const motionProps = {
  initial: { x: '80%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { duration: 0.5, ease: 'easeOut' },
      opacity: { duration: 0.3, ease: 'easeOut', delay: 0.1 },
    },
  },
  exit: {
    x: '80%',
    opacity: 0,
    transition: {
      x: { duration: 0.6, ease: 'easeIn' },
      opacity: { duration: 0.4, ease: 'easeIn', delay: 0.1 },
    },
  },
}

export function Sidebar() {
  const sidebarRoute = useUIStore((state) => state.sidebarRoute)
  const closeMenu = useUIStore((state) => state.closeSideMenu)
  const isSideMenuOpen = useUIStore((state) => state.isSideMenuOpen)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)

  const contentRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    return handleAccessibility(isSideMenuOpen, navRef, setSidebarRoute)
  }, [isSideMenuOpen, navRef, setSidebarRoute, sidebarRoute])

  return (
    <div>
      {/* Background black */}
      {isSideMenuOpen && (
        <div className="fixed top-0 left-0 z-20 h-dvh w-dvw bg-black opacity-30" />
      )}
      {/* Blur */}
      {isSideMenuOpen && (
        <div
          className="fade-in fixed top-0 left-0 z-20 h-dvh w-dvw backdrop-blur-xs backdrop-filter"
          onClick={closeMenu}
        />
      )}
      {/* Navbar - Container */}
      <AnimatePresence>
        {isSideMenuOpen && (
          <motion.nav
            key="sidebar-nav"
            ref={navRef}
            animate={motionProps.animate}
            aria-hidden={!isSideMenuOpen}
            aria-label="Menú de navegación"
            aria-modal={isSideMenuOpen}
            className="aceleracion-hardware fixed top-0 right-0 z-30 flex h-dvh w-[414px] max-w-[82.3vw] flex-col bg-white shadow-xl sm:min-w-[414px]"
            exit={motionProps.exit}
            initial={motionProps.initial}
            role="dialog"
          >
            {/* Header del Sidebar*/}
            <div
              className="text-secondary sticky top-0 z-10 mt-4 mb-6 flex items-center justify-between px-8"
              id="sideMenuHeader"
            >
              {sidebarRoute ? (
                <button
                  aria-label="Volver al menú"
                  className="focus-visible my-1 flex cursor-pointer items-center font-medium"
                  type="button"
                  onClick={() => setSidebarRoute(null)}
                >
                  <IoChevronBackOutline size={20} />
                  <span className="mx-1">Volver</span>
                </button>
              ) : (
                <div />
              )}
              <button
                aria-label="Cerrar menú"
                className="focus-visible-hover text-secondary hover:bg-hover cursor-pointer rounded"
                type="button"
                onClick={() => closeMenu()}
              >
                <IoCloseOutline size={24} />
              </button>
            </div>
            {/* Contenido Principal del Sidebar */}
            <div
              ref={contentRef}
              className="mx-8 mb-2 flex flex-1 flex-col items-start overflow-x-hidden text-left"
              id="sideMenuContent"
            >
              {sidebarRoute ? <CategoryContent /> : <MainContent />}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
