'use client'

import { useRef } from 'react'
import { useTheme } from 'next-themes'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { VscColorMode } from 'react-icons/vsc'

// Importamos el icono SIN SSR.
// Esto significa que el servidor renderizará el botón vacío (o con el loading),
// y el cliente inyectará el icono después.
const ThemeIcon = dynamic(() => import('@/components').then((mod) => mod.ThemeIcon), {
  ssr: false,
  // Un placeholder invisible del mismo tamaño para evitar saltos de layout
  loading: () => <VscColorMode className="text-primary h-5 w-5 animate-pulse" />,
})

interface Props {
  className?: string
  iconClassName?: string
  isSidebar?: boolean
  label?: string
}

export function ThemeToggle({
  className,
  iconClassName = 'h-5 w-5 text-primary',
  isSidebar = false,
  label,
}: Props) {
  /* ---- Hooks ---- */
  const { setTheme, resolvedTheme } = useTheme()

  /* ---- Refs ---- */
  const toggleRef = useRef<HTMLButtonElement>(null)

  /* ---- Bloqueamos las Transiciones (Kill Switch) ---- */
  const toggleTheme = () => {
    // Creamos una etiqueta <style>
    const css = document.createElement('style')

    // Estas reglas CSS son las más agresivas posible
    css.appendChild(
      document.createTextNode(
        `* {
           -webkit-transition: none !important;
           -moz-transition: none !important;
           -o-transition: none !important;
           -ms-transition: none !important;
           transition: none !important;
        }`,
      ),
    )

    // Inyectamos la etiqueta
    document.head.appendChild(css)

    // Forzamos que el navegador se de cuenta de que hay nuevos estilos antes de seguir.
    // Acceder a window.getComputedStyle cumple con el objetivo.
    void window.getComputedStyle(css).opacity

    // Logica del Toggle: (Claro <-> Oscuro)
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    setTheme(nextTheme)

    // Eliminamos la etiqueta <style>
    // Esperamos unos ms para asegurar que el DOM ya haya aplicado el nuevo tema.
    setTimeout(() => {
      document.head.removeChild(css)

      // ⚡ FIX CLAVE: Asegurar que el foco no escape tras el renderizado
      if (isSidebar && toggleRef.current) {
        toggleRef.current.focus()
      }
    }, 75)
  }

  return (
    <button
      ref={toggleRef}
      aria-label="Alternar tema claro/oscuro"
      className={clsx(
        className,
        isSidebar ? 'focus-sidebar-content' : 'focus-link-hover toolbar-icon',
      )}
      type="button"
      onClick={toggleTheme}
    >
      {/* El contenido es dinámico */}
      <ThemeIcon className={iconClassName} />

      {/* 🆕 Etiqueta opcional (para el Sidebar) */}
      {label && <span className="ml-2 font-semibold">{label}</span>}
    </button>
  )
}
