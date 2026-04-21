'use client'

import { motion } from 'motion/react'
import { IoCloseOutline } from 'react-icons/io5'
import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import clsx from 'clsx'

import { Backdrop } from '@/components/ui/backdrop/Backdrop'

// ---- Constantes de Animación Unificadas ----
const MODAL_ANIMATION = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
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

// ---- Tamaños del modal ----
const SIZE_MAP = {
  sm: 'max-w-sm md:w-[384px]',
  md: 'max-w-md md:w-[448px]',
  lg: 'max-w-lg md:w-[512px]',
  xl: 'max-w-xl md:w-[576px]',
} as const

// ---- Props ----
interface ModalProps {
  /** Controla la visibilidad del modal */
  isOpen: boolean
  /** Callback para cerrar el modal */
  onClose: () => void
  /** Título del modal (obligatorio para accesibilidad) */
  title: string
  /** Subtítulo opcional (soporta texto o contenido estructurado) */
  subtitle?: ReactNode
  /** Icono decorativo junto al título */
  icon?: ReactNode
  /** Tamaño del contenedor */
  size?: keyof typeof SIZE_MAP
  /** Contenido del cuerpo del modal */
  children: ReactNode
  /** Slot de footer (botones de acción) */
  footer?: ReactNode
  /** Clases adicionales para el contenedor exterior */
  className?: string
  /** Clases adicionales para el contenido (body) */
  bodyClassName?: string
}

/**
 * Componente Modal estandarizado con:
 * - Focus Trapping (Tab/Shift+Tab ciclan dentro del modal)
 * - Backdrop con blur de 2px y bloqueo de scroll
 * - Cierre con Escape
 * - Animaciones spring unificadas
 * - Accesibilidad ARIA (role="dialog", aria-modal, aria-labelledby)
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  children,
  footer,
  className,
  bodyClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // ---- Focus Trapping ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape cierra el modal
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()

        return
      }

      // Tab → trampa de foco
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
          // Shift+Tab: Si estamos en el primero, ir al último
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: Si estamos en el último, ir al primero
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [onClose],
  )

  // ---- Auto-focus al abrir y restaurar al cerrar ----
  useEffect(() => {
    if (!isOpen) return

    // Guardar elemento con foco antes de abrir
    previousFocusRef.current = document.activeElement as HTMLElement

    // Auto-focus al primer elemento interactivo del modal
    const timer = setTimeout(() => {
      const modal = modalRef.current

      if (!modal) return

      const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)

      if (focusable.length > 0) {
        focusable[0].focus()
      }
    }, 50) // Esperar a que la animación inicie

    return () => {
      clearTimeout(timer)

      // Restaurar foco al cerrar
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  // ---- Registrar/Desregistrar listener de teclado ----
  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <Backdrop blur="backdrop-blur-[2px]" className="p-4" visible={isOpen} onClick={onClose}>
      <motion.div
        ref={modalRef}
        aria-labelledby="modal-title"
        aria-modal="true"
        className={clsx(
          'bg-surface border-input-outline relative z-10 w-full overflow-hidden rounded-2xl border shadow-xl',
          SIZE_MAP[size],
          className,
        )}
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        {...MODAL_ANIMATION}
      >
        {/* ---- Header ---- */}
        <div className="border-input-outline flex items-center justify-between border-b px-6 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-10">
            {icon && <span className="text-secondary shrink-0">{icon}</span>}
            <div className="min-w-0">
              <h2 className="text-primary line-clamp-2 text-lg font-semibold" id="modal-title">
                {title}
              </h2>
              {subtitle && <div className="text-secondary truncate text-xs">{subtitle}</div>}
            </div>
          </div>
          <button
            aria-label="Cerrar modal"
            className="text-secondary hover:bg-hover-overlay focus-visible:ring-accessibility cursor-pointer rounded-full p-1.5 shadow-none! transition-colors outline-none! focus:outline-none! focus-visible:ring-2 focus-visible:outline-none!"
            type="button"
            onClick={onClose}
          >
            <IoCloseOutline className="h-5 w-5" />
          </button>
        </div>

        {/* ---- Body ---- */}
        <div
          className={clsx('group relative flex min-h-0 flex-col', !footer && 'rounded-b-[inherit]')}
        >
          <div
            aria-label="Contenido del modal"
            className={clsx(
              'peer relative max-h-[70vh] overflow-y-auto p-6 outline-none focus:outline-none focus-visible:outline-none',
              !footer && 'rounded-b-[inherit]',
              bodyClassName,
            )}
            role="document"
          >
            {children}
          </div>
        </div>

        {/* ---- Footer (opcional) ---- */}
        {footer && (
          <div className="border-input-outline flex justify-end gap-3 border-t px-6 py-4">
            {footer}
          </div>
        )}
      </motion.div>
    </Backdrop>
  )
}
