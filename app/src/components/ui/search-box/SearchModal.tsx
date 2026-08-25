'use client'

import type { SearchSuggestion } from '@/actions'

import { motion, AnimatePresence } from 'motion/react'
import { IoCloseOutline } from 'react-icons/io5'
import { useEffect, useRef, useCallback } from 'react'
import clsx from 'clsx'

import { SearchBox } from '@/components'
import { useScrollLock } from '@/hooks'
import { useUIStore } from '@/store'

// ---- Constantes de Animación ----
// Patrón inspirado en Sidebar (deslizamiento parcial + opacidad escalonada)
const MODAL_ANIMATION = {
  initial: { y: '60%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      y: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.25, ease: 'easeOut', delay: 0.05 },
    },
  },
  exit: {
    y: '60%',
    opacity: 0,
    transition: {
      y: { duration: 0.35, ease: [0.4, 0, 1, 1] },
      opacity: { duration: 0.2, ease: 'easeIn' },
    },
  },
} as const

const BACKDROP_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
}

// ---- Selectores para elementos enfocables ----
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// ---- Props ----
interface SearchModalProps {
  /** Controla la visibilidad del modal (opcional, por defecto usa useUIStore) */
  isOpen?: boolean
  /** Callback para cerrar el modal (opcional, por defecto usa useUIStore) */
  onClose?: () => void
  /** Sugerencias de búsqueda precargadas */
  suggestions?: SearchSuggestion[]
  /** Clases CSS adicionales para el contenedor del modal */
  className?: string
}

/**
 * Modal de búsqueda adaptado para dispositivos móviles.
 *
 * Características:
 * - Ocupa el ancho completo (full-width) y se ancla al fondo de la pantalla.
 * - Deja un espacio superior visible con backdrop desenfocado.
 * - Esquinas superiores redondeadas y esquinas inferiores rectas.
 * - Cabecera con título "Buscar" y botón de cierre.
 * - Integra el componente SearchBox con auto-foco y sugerencias en tiempo real.
 * - Cierre accesible con tecla Escape, tap en backdrop o selección de resultado.
 * - Bloqueo de scroll del body y trampa de foco.
 */
export function SearchModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  suggestions = [],
  className,
}: SearchModalProps) {
  // ----- Store Global (Zustand) -----
  const storeIsOpen = useUIStore((state) => state.isSearchModalOpen)
  const storeCloseModal = useUIStore((state) => state.closeSearchModal)
  const openSearchBox = useUIStore((state) => state.openSearchBox)
  const closeSearchBox = useUIStore((state) => state.closeSearchBox)
  const searchTerm = useUIStore((state) => state.searchTerm)

  const isOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen
  const onClose = propOnClose !== undefined ? propOnClose : storeCloseModal

  // ----- Refs -----
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // ----- 🔒 Scroll Lock -----
  useScrollLock(isOpen)

  // ---- Manejador de Cierre Seguro ----
  const handleClose = useCallback(() => {
    onClose()
    if (!searchTerm.trim()) {
      closeSearchBox()
    }
  }, [onClose, searchTerm, closeSearchBox])

  // ----- Sincronización Responsiva (Cierre al superar tds-sm y cesión a SearchBox del Header si hay término) -----
  useEffect(() => {
    if (!isOpen) return

    const mediaQuery = window.matchMedia('(min-width: 40.0625rem)') // tds-sm

    const handleBreakpoint = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches && isOpen) {
        onClose()
        if (searchTerm.trim().length > 0) {
          openSearchBox()
        } else {
          closeSearchBox()
        }
      }
    }

    mediaQuery.addEventListener('change', handleBreakpoint)

    // Check inicial
    if (mediaQuery.matches && isOpen) {
      onClose()
      if (searchTerm.trim().length > 0) {
        openSearchBox()
      } else {
        closeSearchBox()
      }
    }

    return () => mediaQuery.removeEventListener('change', handleBreakpoint)
  }, [isOpen, onClose, openSearchBox, closeSearchBox, searchTerm])

  // ---- Focus Trapping y Escape Key ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape cierra el modal
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()

        return
      }

      // Tab: trampa de foco dentro del modal
      if (e.key === 'Tab') {
        const modal = modalRef.current

        if (!modal) return

        const focusableElements = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)

        if (focusableElements.length === 0) {
          e.preventDefault()

          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [handleClose],
  )

  // ---- Guardar foco previo y restaurar al cerrar ----
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  // ---- Registrar listener de teclado global ----
  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end">
          {/* ---- Backdrop / Overlay Oscurecido ---- */}
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={handleClose}
            {...BACKDROP_ANIMATION}
          />

          {/* ---- Contenedor Modal Full-Width Inferior ---- */}
          <motion.div
            ref={modalRef}
            aria-labelledby="search-modal-title"
            aria-modal="true"
            className={clsx(
              'bg-canvas border-input-outline/40 relative z-10 flex h-[calc(100dvh-3.5rem)] w-full flex-col rounded-t-3xl border-t shadow-2xl',
              className,
            )}
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            {...MODAL_ANIMATION}
          >
            {/* ---- Cabecera: Título "Buscar" + Botón de Cierre ---- */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2
                className="text-primary text-2xl font-bold tracking-tight"
                id="search-modal-title"
              >
                Buscar
              </h2>

              <button
                aria-label="Cerrar modal de búsqueda"
                className="text-secondary hover:text-primary hover:bg-hover-overlay focus-visible:ring-accessibility flex cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors outline-none focus:outline-none focus-visible:ring-2"
                type="button"
                onClick={handleClose}
              >
                <IoCloseOutline className="h-6 w-6" />
              </button>
            </div>

            {/* ---- Cuerpo: SearchBox y Sugerencias ---- */}
            <div className="w-full flex-1 overflow-y-auto px-6 pt-1 pb-6">
              <SearchBox isModal suggestions={suggestions} onSearchSubmit={handleClose} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
