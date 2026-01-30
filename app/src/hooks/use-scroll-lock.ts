'use client'

import { useEffect } from 'react'

export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    const body = document.body

    if (isLocked) {
      // Calculamos el ancho del scrollbar
      const scrollbarWidth = window.innerWidth - body.clientWidth

      // Guardamos el estilo original
      const originalOverflow = body.style.overflow
      const originalPaddingRight = body.style.paddingRight

      // Bloqueamos
      body.style.overflow = 'hidden'

      // Compensamos el layout shift solo si existe scrollbar
      if (scrollbarWidth > 0) {
        body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
        body.style.paddingRight = `${scrollbarWidth}px`
      }

      // Cleanup al cerrar
      return () => {
        body.style.overflow = originalOverflow
        body.style.removeProperty('--scrollbar-width')
        body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isLocked])
}
