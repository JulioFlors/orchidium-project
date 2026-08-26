'use client'

import { motion } from 'motion/react'
import { IoCloseOutline } from 'react-icons/io5'
import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import clsx from 'clsx'

import { Backdrop } from '@/components/ui/backdrop/Backdrop'

// ---- Constantes de Animación Unificadas (easeOut fluido) ----
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

// ---- Selectores para elementos enfocables ----
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// ---- Tamaños del modal (Aplicados en Desktop >= tds-sm) ----
const SIZE_MAP = {
  sm: 'tds-sm:max-w-sm tds-sm:w-[384px]',
  md: 'tds-sm:max-w-md tds-sm:w-[448px]',
  lg: 'tds-sm:max-w-lg tds-sm:w-[512px]',
  xl: 'tds-sm:max-w-xl tds-sm:w-[576px]',
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
  /** Tamaño del contenedor en desktop */
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
 * Componente Modal estandarizado con doble layout responsivo:
 * - Desktop (> tds-sm): Centrado en pantalla con margen, bordes redondeados completos (rounded-2xl) y ancho según `size`.
 * - Mobile (<= tds-sm): Full-Width anclado al fondo (w-full inset-x-0 bottom-0), altura auto-adaptativa (h-auto) con tope máximo (max-h-[calc(100dvh-3.5rem)]), esquinas superiores redondeadas (rounded-t-3xl), esquinas inferiores rectas (rounded-b-none) y borde superior sutil (border-t border-input-outline/40).
 * - Focus Trapping (Tab/Shift+Tab ciclan dentro del modal)
 * - Backdrop con blur y bloqueo de scroll
 * - Cierre accesible con Escape y tap en el Backdrop
 * - Animación fluida con curva Material easeOut
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

    // Auto-focus al primer elemento interactivo del modal una vez finalizada la animación de entrada
    const timer = setTimeout(() => {
      const modal = modalRef.current

      if (!modal) return

      const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)

      if (focusable.length > 0) {
        focusable[0].focus({ preventScroll: true })
      }
    }, 420)

    return () => {
      clearTimeout(timer)

      // Restaurar foco al cerrar
      if (previousFocusRef.current) {
        previousFocusRef.current.focus({ preventScroll: true })
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
    <Backdrop
      blur="backdrop-blur-[2px]"
      className="flex flex-col justify-end p-0 tds-sm:items-center tds-sm:justify-center tds-sm:p-4"
      visible={isOpen}
      zIndex="z-60"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        aria-labelledby="modal-title"
        aria-modal="true"
        className={clsx(
          'bg-surface border-input-outline transform-gpu backface-hidden will-change-transform relative z-10 flex w-full flex-col isolate shadow-xl',
          // Mobile (<= tds-sm): Full-Width anclado al fondo, h-auto (se adapta al contenido) con tope máximo, rounded-t-3xl, border-t border-input-outline/40
          'h-auto max-h-[calc(100dvh-3.5rem)] rounded-t-3xl rounded-b-none border-t border-input-outline/40 border-x-0 border-b-0',
          // Desktop (> tds-sm): Centrado, h-auto max-h-[85vh], rounded-2xl, border completo
          'tds-sm:h-auto tds-sm:max-h-[85vh] tds-sm:rounded-2xl tds-sm:border',
          SIZE_MAP[size],
          className,
        )}
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        {...MODAL_ANIMATION}
      >
        {/* ---- Header ---- */}
        <div className="border-input-outline flex shrink-0 items-center justify-between border-b px-6 py-4">
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
          className={clsx(
            'group relative flex min-h-0 flex-1 flex-col',
            !footer && 'rounded-b-[inherit]',
          )}
        >
          <div
            aria-label="Contenido del modal"
            className={clsx(
              'peer relative w-full flex-1 overflow-y-auto p-6 outline-none focus:outline-none focus-visible:outline-none tds-sm:max-h-[70vh]',
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
          <div className="border-input-outline flex shrink-0 justify-end gap-3 border-t px-6 py-4">
            {footer}
          </div>
        )}
      </motion.div>
    </Backdrop>
  )
}
