'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IoCloseOutline, IoChevronBackOutline } from 'react-icons/io5'

import { MainContent } from './MainContent'
import { CategoryContent } from './CategoryContent'
import { handleAccessibility, motionProps } from './Sidebar.utils'

import { useUIStore } from '@/store'

export function Sidebar() {
  const sidebarRoute = useUIStore((state) => state.sidebarRoute)
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)

  const contentRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    return handleAccessibility(isSidebarOpen, navRef, setSidebarRoute)
  }, [isSidebarOpen, navRef, setSidebarRoute, sidebarRoute])

  return (
    <div>
      {/* Background black */}
      {isSidebarOpen && <div className="fixed top-0 left-0 z-20 h-dvh w-dvw bg-black opacity-30" />}
      {/* Blur */}
      {isSidebarOpen && (
        <div
          className="fade-in fixed top-0 left-0 z-20 h-dvh w-dvw backdrop-blur-xs backdrop-filter"
          onClick={closeSidebar}
        />
      )}
      {/* Navbar - Container */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.nav
            key="sidebar-nav"
            ref={navRef}
            animate={motionProps.animate}
            aria-hidden={!isSidebarOpen}
            aria-label="Menú de navegación"
            aria-modal={isSidebarOpen}
            className="aceleracion-hardware fixed top-0 right-0 z-30 flex h-dvh w-[414px] max-w-[82.3vw] flex-col bg-white shadow-xl sm:min-w-[414px]"
            exit={motionProps.exit}
            initial={motionProps.initial}
            role="dialog"
          >
            {/* Header del Sidebar*/}
            <div
              className="text-secondary sticky top-0 z-10 mt-4 mb-6 flex items-center justify-between px-8"
              id="sidebarHeader"
            >
              {sidebarRoute ? (
                <button
                  aria-label="Volver al menú"
                  className="focus-link my-1 flex cursor-pointer items-center font-medium"
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
                className="focus-link-hover text-secondary hover:bg-hover cursor-pointer rounded"
                type="button"
                onClick={() => closeSidebar()}
              >
                <IoCloseOutline size={24} />
              </button>
            </div>
            {/* Contenido Principal del Sidebar */}
            <div
              ref={contentRef}
              className="mx-8 mb-2 flex flex-1 flex-col items-start overflow-x-hidden text-left"
              id="sidebarContent"
            >
              {sidebarRoute ? <CategoryContent /> : <MainContent />}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
