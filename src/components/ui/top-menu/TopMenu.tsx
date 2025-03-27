'use client'

import Link from 'next/link'
import { IoSearchOutline, IoCartOutline } from 'react-icons/io5'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

import { PristinoPlant } from '../icons/PristinoPlant'

import { useUIStore } from '@/store'

export function TopMenu() {
  const [hoveredLink, setHoveredLink] = useState<HTMLElement | null>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const openMenu = useUIStore((state) => state.openSideMenu)
  const isSideMenuOpen = useUIStore((state) => state.isSideMenuOpen) //Obtenemos el estado del sidebar
  const pathname = usePathname() //Obtenemos la ruta actual para los atributos ARIA que mejoran la accesibilidad

  useEffect(() => {
    if (hoveredLink && indicatorRef.current) {
      const rect = hoveredLink.getBoundingClientRect()
      const menuRect = menuRef.current?.getBoundingClientRect()

      if (menuRect) {
        indicatorRef.current.style.width = `${rect.width}px`
        indicatorRef.current.style.transform = `translateX(${rect.left - menuRect.left}px)`
        indicatorRef.current.style.opacity = '1'
      }
    } else if (indicatorRef.current) {
      indicatorRef.current.style.opacity = '0'
    }
  }, [hoveredLink])

  return (
    <header className="sticky-top-menu">
      <nav className="flex w-full items-center justify-between gap-3 px-5 py-1 text-sm font-semibold">
        {/* Primer grupo de elementos - Logo | Tienda */}
        <div className="text-primary flex items-center justify-between">
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

        {/* Center Menu */}
        <div className="hidden lg:block">
          <div ref={menuRef} className="relative flex items-center">
            <div
              ref={indicatorRef}
              className="bg-hover text-primary absolute bottom-0 h-full w-auto rounded px-2 py-1 opacity-0 transition-all duration-500 ease-in-out"
              style={{ top: 'auto', transform: 'translateY(0)' }}
            />
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

        {/* Search, Cart, Menu */}
        <div className="flex items-center">
          <div className="hidden lg:block">
            <Link aria-label="Buscar" className="focus-visible mx-2" href="/search">
              <IoSearchOutline className="h-5 w-5" />
            </Link>
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
