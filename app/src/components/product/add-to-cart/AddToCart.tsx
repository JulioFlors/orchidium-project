'use client'

import type { Species, ProductVariant } from '@/interfaces'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { StockNotificationWhatsapp, QuantitySelector, SizeSelector, StockLabel } from '@/components'

interface Props {
  product: Species
  // Props para control desde el Wrapper (Cliente)
  selectedVariant: ProductVariant | undefined
  onVariantSelected: (variant: ProductVariant) => void
}

export function AddToCart({ product, selectedVariant, onVariantSelected }: Props) {
  // Estado local para este formulario
  const [quantity, setQuantity] = useState<number>(1)
  const [posted, setPosted] = useState(false)

  // 1. ¿Existe algo que vender en general?
  const hasGlobalStock = product.variants.some((v) => v.available && v.quantity > 0)

  // 2. Lógica de Precio Dinámico
  const getPriceLabel = () => {
    // Caso A: Variante seleccionada -> Precio específico
    if (selectedVariant) return `$${selectedVariant.price}`

    // Caso B: Nada seleccionado -> Rango de Precios
    const availableVariants = product.variants.filter((v) => v.available && v.quantity > 0)
    // Si no hay stock, usamos todos los precios como referencia (gris)
    const targetVariants = availableVariants.length > 0 ? availableVariants : product.variants
    const prices = targetVariants.map((v) => v.price)

    if (prices.length === 0) return '$0'
    const min = Math.min(...prices)
    const max = Math.max(...prices)

    return min === max ? `$${min}` : `$${min} - $${max}`
  }

  // 3. Acción de Agregar al Carrito
  const addToCart = () => {
    setPosted(true)

    if (!selectedVariant) return

    // TODO: Conectar con Zustand (Cart Store) aquí
    // eslint-disable-next-line no-console
    console.log('Agregando al carrito:', {
      variant: selectedVariant,
      quantity: quantity,
    })

    // Reset visual post-agregado
    setQuantity(1)
    setPosted(false)
  }

  // Helper: ¿La variante seleccionada tiene stock?
  // Si no hay selección, asumimos true para no mostrar errores prematuros
  const isSelectedVariantAvailable = selectedVariant
    ? selectedVariant.available && selectedVariant.quantity > 0
    : true

  return (
    <>
      {/* ---- Price ---- */}
      <p className="text-primary fade-in tds-sm:mt-2 mt-0.5 mb-3 text-xl leading-6 font-semibold">
        {getPriceLabel()}
      </p>

      {/* --- SELECTOR DE MACETA (Size) --- */}
      {product.variants.length > 0 && (
        <SizeSelector
          selectedVariant={selectedVariant}
          variants={product.variants}
          onVariantChanged={(variant) => {
            onVariantSelected(variant) // Notificamos al padre
            setQuantity(1) // Reset cantidad al cambiar tamaño
            setPosted(false) // Limpiamos errores previos
          }}
        />
      )}

      {/* --- CONTROLES DE COMPRA --- */}
      {hasGlobalStock ? (
        <>
          {/* Selector de Cantidad: Solo si hay stock en la selección actual */}
          {isSelectedVariantAvailable && (
            <QuantitySelector quantity={quantity} onQuantityChanged={setQuantity} />
          )}

          <div className="mt-5.5">
            {/* Mensaje de Error: Intento sin seleccionar */}
            <AnimatePresence mode="wait">
              {!selectedVariant && posted && (
                <motion.p
                  animate={{ height: 'auto', marginBottom: 8, opacity: 1, y: 0 }}
                  className="overflow-hidden text-xs font-medium tracking-wide text-red-800/75"
                  exit={{ height: 0, marginBottom: 0, opacity: 1, y: 0 }}
                  initial={{ height: 0, marginBottom: 0, opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  Es necesario seleccionar el tamaño de la planta
                </motion.p>
              )}
            </AnimatePresence>

            {selectedVariant && !isSelectedVariantAvailable ? (
              // CASO: Variante Agotada
              <div className="fade-in">
                <StockNotificationWhatsapp
                  productName={`${product.name} (${selectedVariant.size})`}
                />
              </div>
            ) : (
              // CASO: Disponible para comprar
              <button
                className={`w-full transition-all duration-300 sm:w-[320px] lg:w-full xl:w-[320px] ${!selectedVariant && posted ? 'btn-primary' : 'btn-primary'} `}
                type="button"
                onClick={addToCart}
              >
                Agregar al carrito
              </button>
            )}
          </div>
        </>
      ) : (
        // CASO: Producto Totalmente Agotado (Global)
        <div className="mt-5">
          <StockLabel />
          <div className="fade-in">
            <StockNotificationWhatsapp
              productName={`${product.name} ${selectedVariant ? `(${selectedVariant.size})` : ''}`}
            />
          </div>
        </div>
      )}
    </>
  )
}
