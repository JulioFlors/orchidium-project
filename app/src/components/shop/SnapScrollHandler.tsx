'use client'

import { useEffect } from 'react'

export function SnapScrollHandler() {
  useEffect(() => {
    const html = document.documentElement

    // Añadir clases de scroll snap global temporalmente en el elemento html
    html.classList.add('snap-y', 'snap-mandatory', 'scroll-smooth')

    return () => {
      // Limpiar las clases al desmontar el componente (salir de la landing page)
      html.classList.remove('snap-y', 'snap-mandatory', 'scroll-smooth')
    }
  }, [])

  return null
}
