'use client'

import type { Category, Subcategory } from './types'

import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { IoCloseOutline, IoChevronBackOutline } from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'

import { SidebarMainContent } from './SidebarMainContent'
import { SidebarSubcategoryContent } from './SidebarSubcategoryContent'
import { filterSearchResults, focusFirstElement, handleAccessibility } from './SidebarUtils'

import { useUIStore } from '@/store'

// Datos de ejemplo para las categorías
const categories: Category[] = [
  {
    id: 'plantas',
    title: 'Plantas',
    subcategories: [
      {
        id: 'orquideas',
        title: 'Orquídeas',
        image: '/plants/orchids.jpg',
        url: '/category/orquideas',
      },
      {
        id: 'rosas-del-desierto',
        title: 'Rosas del Desierto',
        image: '/plants/Adenium-Obesum.jpg',
        url: '/category/rosas-del-desierto',
      },
      {
        id: 'cactus',
        title: 'Cactus',
        image: '/plants/cactus.jpg',
        url: '/category/cactus',
      },
      {
        id: 'suculentas',
        title: 'Suculentas',
        image: '/plants/suculentas.jpg',
        url: '/category/suculentas',
      },
    ],
  },
  {
    id: 'accesorios',
    title: 'Accesorios',
    subcategories: [
      {
        id: 'macetas',
        title: 'Macetas',
        image: '/placeholder.svg?height=200&width=200',
        url: '/category/macetas',
      },
      {
        id: 'herramientas',
        title: 'Herramientas',
        image: '/placeholder.svg?height=200&width=200',
        url: '/category/herramientas',
      },
    ],
  },
  {
    id: 'contacto',
    title: 'Contacto',
    url: '/about/contact',
  },
  {
    id: 'login',
    title: 'Iniciar sesión',
    url: '/auth/login',
  },
]

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
      x: { duration: 0.4, ease: 'easeIn' },
      opacity: { duration: 0.2, ease: 'easeIn', delay: 0.1 },
    },
  },
}

export function Sidebar() {
  const activeCategory = useUIStore((state) => state.activeCategory)
  const closeMenu = useUIStore((state) => state.closeSideMenu)
  const isSideMenuOpen = useUIStore((state) => state.isSideMenuOpen)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const setActiveCategory = useUIStore((state) => state.setActiveCategory)

  const contentRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  const [searchResults, setSearchResults] = useState<(Subcategory | Category)[]>([])

  useEffect(() => {
    setSearchResults(filterSearchResults(categories, searchTerm))
  }, [searchTerm])

  useEffect(() => {
    return handleAccessibility(isSideMenuOpen, navRef, setActiveCategory)
  }, [isSideMenuOpen, navRef, setActiveCategory, activeCategory])

  useEffect(() => {
    focusFirstElement(isSideMenuOpen, navRef)
  }, [isSideMenuOpen, navRef])

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
      {/* Sidemenu */}
      <AnimatePresence>
        {isSideMenuOpen && (
          <motion.nav
            key="sidebar-nav"
            ref={navRef}
            animate={motionProps.animate}
            aria-hidden={!isSideMenuOpen}
            aria-label="Menú de navegación"
            aria-modal={isSideMenuOpen}
            className={clsx(
              'fixed top-0 right-0 z-30 flex h-dvh flex-col bg-white',
              'max-w-[82.3%] sm:max-w-[60%] md:max-w-[45%] lg:max-w-[35%] xl:max-w-[30%] 2xl:max-w-[450px]',
            )}
            exit={motionProps.exit}
            initial={motionProps.initial}
            role="dialog"
          >
            {/* sideMenuHeader */}
            <div
              className="text-secondary sticky top-0 z-10 mt-4 mb-6 flex items-center justify-between px-8"
              id="sideMenuHeader"
            >
              {activeCategory ? (
                <button
                  aria-label="Volver al menú"
                  className="focus-visible my-1 flex cursor-pointer items-center font-medium"
                  type="button"
                  onClick={() => setActiveCategory(null)}
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
            {/* Contenido del mainSidabar */}
            <div
              ref={contentRef}
              className="mx-8 mb-2 flex flex-1 flex-col items-start overflow-x-hidden text-left"
              id="sideMenuContent"
            >
              {activeCategory ? (
                <SidebarSubcategoryContent categories={categories} categoryId={activeCategory} />
              ) : (
                <SidebarMainContent categories={categories} searchResults={searchResults} />
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
