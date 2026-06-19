'use client'

import { useTheme } from 'next-themes'
import React, { useRef } from 'react'
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5'

import { ToggleSwitch } from '@/components'

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
  const toggleTheme = (nextTheme: string) => {
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
    void window.getComputedStyle(css).opacity

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

  const optionA = {
    label: label || '',
    icon: <IoSunnyOutline className={iconClassName} />,
    value: 'light',
  }

  const optionB = {
    label: label || '',
    icon: <IoMoonOutline className={iconClassName} />,
    value: 'dark',
  }

  return (
    <ToggleSwitch
      activeValue={resolvedTheme || 'light'}
      ariaLabel="Alternar tema claro/oscuro"
      className={className}
      isSidebar={isSidebar}
      optionA={optionA}
      optionB={optionB}
      onChange={toggleTheme}
    />
  )
}
