'use client'

import { AnimatePresence, motion } from 'motion/react'
import { ReactNode, useEffect } from 'react'
import { clsx } from 'clsx'

interface Props {
  visible: boolean
  children?: ReactNode
  onClick?: () => void
  blur?: string
  zIndex?: string
  className?: string
}

export function Backdrop({
  visible,
  children,
  onClick,
  blur = 'backdrop-blur-xs backdrop-filter',
  zIndex = 'z-15',
  className = '',
}: Props) {
  // Configuración de Bloqueo de Scroll Vertical al Abrirse (Heredado de Fase 8 DRY)
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)'
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* ---- Background Overlay ---- */}
          <motion.div
            animate={{ opacity: 1 }}
            className={clsx(
              'fixed inset-0 flex items-center justify-center bg-black/30',
              blur,
              zIndex,
              className,
            )}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onClick={onClick}
          >
            {/* Contenedor del Body Interceptado para evitar Bubbling al Overlay */}
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
