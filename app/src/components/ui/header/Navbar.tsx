'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { useRef, useEffect, useCallback } from 'react'

import { NavbarItem } from '@/interfaces'

interface Props {
  items: NavbarItem[]
  activeItem: NavbarItem | null
  hoveredLink: HTMLElement | null
  onItemHover: (item: NavbarItem, element: HTMLElement) => void
  navRef: React.RefObject<HTMLElement | null>
}

export function Navbar({ items, activeItem, hoveredLink, onItemHover, navRef }: Props) {
  // ---- Refs ----
  const hoveredRef = useRef<HTMLDivElement>(null)

  // ---- Lógica de posicionamiento con control de animación ----
  // con useCallback extraemos a una función reutilizable
  const updatePillPosition = useCallback(
    (shouldAnimate: boolean) => {
      if (hoveredLink && hoveredRef.current && navRef.current) {
        const rect = hoveredLink.getBoundingClientRect()
        const menuRect = navRef.current.getBoundingClientRect()

        // Buscamos el primer link para obtener la altura estándar (Para mantener la consistencia)
        const firstLink = navRef.current.querySelector('.nav-link')
        const linkHeight = firstLink ? (firstLink as HTMLElement).offsetHeight : rect.height

        // Manipulamos la transición directamente en el estilo inline
        if (shouldAnimate) {
          // Dejamos que la clase de Tailwind (duration-500) haga su trabajo
          hoveredRef.current.style.transition = ''
        } else {
          // "Deshabilitamos" la animación para que el cambio sea instantáneo (durante resize)
          hoveredRef.current.style.transition = 'none'
        }

        hoveredRef.current.style.width = `${rect.width}px`
        hoveredRef.current.style.transform = `translateX(${rect.left - menuRect.left}px)`
        hoveredRef.current.style.height = `${linkHeight + 4}px` // +4 para un poco de padding vertical si deseas
        hoveredRef.current.style.opacity = '1'
      } else if (hoveredRef.current) {
        hoveredRef.current.style.opacity = '0'
      }
    },
    [hoveredLink, navRef],
  )

  // ---- useEffect al cambiar de Link (Hover): MOSTRAMOS la animación ----
  useEffect(() => {
    // True = Animar el movimiento entre links
    updatePillPosition(true)
  }, [updatePillPosition])

  // ---- useEffect al Redimensionar (Resize/Zoom): NO mostramos la animación ----
  useEffect(() => {
    if (!hoveredLink) return

    const handleResize = () => {
      // False = Movimiento instantáneo (pegado al texto)
      window.requestAnimationFrame(() => updatePillPosition(false))
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize) // Por si acaso el scroll afecta el layout

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [hoveredLink, updatePillPosition])

  return (
    <>
      {/* "Pill" (hover) personalizado para la animacion del Navbar del Header */}
      <div
        ref={hoveredRef}
        aria-hidden="true"
        className="bg-hover-overlay text-primary pointer-events-none absolute top-[20%] bottom-0 w-auto rounded opacity-0 transition-all duration-500 ease-in-out will-change-transform"
      />

      {/* Navbar */}
      <nav
        ref={navRef}
        aria-label="Navegación Principal"
        className="tds-xs:h-14 flex h-9 w-full flex-1 items-center justify-center px-12"
      >
        {items.map((item) => {
          const commonProps = {
            'aria-expanded': activeItem?.key === item.key,
            className: clsx('nav-link focus-link-hover bg-transparent!', {
              'aria-current="page"': item.isActive,
            }),
            onMouseEnter: (e: React.MouseEvent<HTMLElement>) => onItemHover(item, e.currentTarget),
          }

          return item.href ? (
            <Link key={item.key} href={item.href} {...commonProps}>
              <span>{item.label}</span>
            </Link>
          ) : (
            <button key={item.key} type="button" {...commonProps}>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
