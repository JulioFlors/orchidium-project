'use client'

import { motion, AnimatePresence } from 'motion/react'
import { IoCloseOutline } from 'react-icons/io5'
import { useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Backdrop, buttonVariants } from '@/components'
import { PotSizeLabels } from '@/config'
import { useCartStore } from '@/store'
import { getImageUrl, useFormatPrice } from '@/lib'
import { useCloseDropdownOnBlur, useScrollLock } from '@/hooks'

// ---- Constantes de Animación ----
const MODAL_ANIMATION = {
  initial: { opacity: 0, y: -16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
}

/**
 * Modal flotante "Artículo agregado" al carrito.
 *
 * Características:
 * - Se posiciona inmediatamente debajo del Header y anclado a la derecha.
 * - Backdrop a nivel z-15 para NO oscurecer el Header (z-20).
 * - Muestra la miniatura del producto, nombre, tamaño/maceta, cantidad, precio y subtotal del carrito.
 * - Botón principal de acceso directo "Ver carrito (N)".
 * - No se cierra por temporizador; se cierra por click en backdrop, 'X', Escape,
 *   o cuando el mouse pasa por encima del Header o sale del navegador hacia arriba.
 */
export function AddedToCartModal() {
  const isAddedModalOpen = useCartStore((state) => state.isAddedModalOpen)
  const lastAddedItem = useCartStore((state) => state.lastAddedItem)
  const closeAddedModal = useCartStore((state) => state.closeAddedModal)
  const cart = useCartStore((state) => state.cart)

  const { format } = useFormatPrice()
  const modalRef = useRef<HTMLDivElement>(null)

  const subTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Bloqueo de scroll cuando el modal está abierto
  useScrollLock(isAddedModalOpen)

  // Cierre cuando se cambia de pestaña o se desenfoca la ventana
  useCloseDropdownOnBlur(isAddedModalOpen, closeAddedModal)

  // Manejador de Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeAddedModal()
      }
    },
    [closeAddedModal],
  )

  useEffect(() => {
    if (!isAddedModalOpen) return

    document.addEventListener('keydown', handleKeyDown)

    // Detectar salida del cursor hacia la parte superior del navegador (pestañas / barra de URL)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        closeAddedModal()
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isAddedModalOpen, handleKeyDown, closeAddedModal])

  if (!lastAddedItem) return null

  return (
    <>
      {/* ---- Backdrop detrás del Header en desktop (z-15) y sobre el Header en mobile (z-60) ---- */}
      <Backdrop
        blur="backdrop-blur-xs backdrop-filter"
        visible={isAddedModalOpen}
        zIndex="z-60 tds-sm:z-15"
        onClick={closeAddedModal}
      />

      <AnimatePresence>
        {isAddedModalOpen && (
          <motion.div
            ref={modalRef}
            aria-labelledby="added-to-cart-title"
            aria-modal="true"
            className={clsx(
              'bg-canvas border-input-outline/40 fixed z-60 tds-sm:z-20 flex flex-col shadow-2xl',
              // Mobile (<= tds-sm): Full-width anclado al fondo (estilo SearchModal)
              'inset-x-0 bottom-0 max-h-[calc(100dvh-3.5rem)] w-full rounded-t-3xl rounded-b-none border-t p-6',
              // Desktop (> tds-sm): Bajo el header y fijado al extremo derecho
              'tds-sm:top-14 tds-sm:bottom-auto tds-sm:right-[-0.5px] tds-sm:left-auto tds-sm:w-105 tds-sm:max-w-none tds-sm:max-h-none tds-sm:rounded-b-2xl tds-sm:rounded-t-none tds-sm:border-t-0 tds-sm:p-6',
            )}
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            {...MODAL_ANIMATION}
          >
            {/* ---- Cabecera ---- */}
            <div className="flex items-center justify-between pb-3">
              <h2
                className="text-primary text-xl font-bold tracking-tight"
                id="added-to-cart-title"
              >
                Artículo agregado
              </h2>

              <button
                aria-label="Cerrar notificación de artículo agregado"
                className="text-secondary hover:text-primary hover:bg-hover-overlay focus-visible:ring-accessibility flex cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors outline-none focus:outline-none focus-visible:ring-2"
                type="button"
                onClick={closeAddedModal}
              >
                <IoCloseOutline className="h-6 w-6" />
              </button>
            </div>

            {/* ---- Detalle del Producto Agregado ---- */}
            <div className="flex items-center gap-4 py-3">
              {/* Miniatura */}
              <div className="border-input-outline/20 bg-input/20 relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border">
                <Image
                  fill
                  unoptimized
                  alt={lastAddedItem.name}
                  className="object-cover"
                  sizes="64px"
                  src={getImageUrl(lastAddedItem.image) || '/images/placeholder.jpg'}
                />
              </div>

              {/* Información */}
              <div className="min-w-0 flex-1">
                <h3 className="text-primary line-clamp-2 text-sm font-semibold leading-snug">
                  {lastAddedItem.name}
                </h3>
                {lastAddedItem.size && (
                  <p className="text-secondary mt-0.5 text-xs font-medium">
                    Tamaño: {PotSizeLabels[lastAddedItem.size] || lastAddedItem.size}
                  </p>
                )}
                <p className="text-secondary mt-0.5 text-xs font-medium">
                  Cantidad: {lastAddedItem.quantity}
                </p>
              </div>

              {/* Precio */}
              <div className="shrink-0 text-right">
                <span className="text-primary text-sm font-semibold">
                  {format(lastAddedItem.price * lastAddedItem.quantity)}
                </span>
              </div>
            </div>

            {/* ---- Separador ---- */}
            <div className="border-input-outline/30 my-3 border-t" />

            {/* ---- Subtotal del Carrito ---- */}
            <div className="flex items-center justify-between py-1 mb-4">
              <span className="text-secondary text-sm font-medium">Subtotal</span>
              <span className="text-primary text-sm font-semibold">{format(subTotal)}</span>
            </div>

            {/* ---- Botón de Acción ---- */}
            <Link
              className={buttonVariants({
                variant: 'primary',
                className: 'w-full text-center justify-center',
              })}
              href="/cart"
              onClick={closeAddedModal}
            >
              Ver carrito ({totalItems})
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
