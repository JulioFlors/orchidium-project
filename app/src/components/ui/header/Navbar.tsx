'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { useRef, useEffect } from 'react'

import { NavItem } from '@/interfaces'

interface Props {
  items: NavItem[]
  activeItem: NavItem | null
  hoveredLink: HTMLElement | null
  onItemHover: (item: NavItem, element: HTMLElement) => void
  navRef: React.RefObject<HTMLElement | null>
}

export function Navbar({ items, activeItem, hoveredLink, onItemHover, navRef }: Props) {
  const hoveredRef = useRef<HTMLDivElement>(null)

  // ----------------------------------------
  //  useEffects
  // ----------------------------------------

  // ---- Actualiza la posición y el tamaño del hoveredRef -----
  // Animación del "Pill" (hover) del Navbar
  useEffect(() => {
    if (hoveredLink && hoveredRef.current && navRef.current) {
      const rect = hoveredLink.getBoundingClientRect()
      const menuRect = navRef.current.getBoundingClientRect()

      // Buscamos el primer link para obtener la altura estándar
      const firstLink = navRef.current.querySelector('.nav-link')
      const linkHeight = firstLink ? (firstLink as HTMLElement).offsetHeight : 0

      hoveredRef.current.style.width = `${rect.width}px`
      hoveredRef.current.style.transform = `translateX(${rect.left - menuRect.left}px)`
      hoveredRef.current.style.height = `${linkHeight + 4}px`
      hoveredRef.current.style.opacity = '1'
    } else if (hoveredRef.current) {
      hoveredRef.current.style.opacity = '0'
    }
  }, [hoveredLink, navRef])

  return (
    <>
      {/* "Pill" (hover) personalizado para la animacion del Navbar del Header */}
      <div
        ref={hoveredRef}
        aria-hidden="true"
        className="bg-hover-overlay text-primary pointer-events-none absolute top-[20%] bottom-0 w-auto rounded opacity-0 transition-all duration-500 ease-in-out"
      />

      {/* Navbar */}
      <nav
        ref={navRef}
        aria-label="Navegación Principal"
        className="tds-xs:h-14 flex h-9 w-full flex-1 items-center justify-center px-12"
      >
        {items.map((item) => (
          <Link
            key={item.key}
            aria-expanded={activeItem?.key === item.key}
            className={clsx('nav-link focus-link-hover bg-transparent!', {
              'aria-current="page"': item.isActive,
            })}
            href={item.href}
            onMouseEnter={(e) => onItemHover(item, e.currentTarget)}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
