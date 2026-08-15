'use client'

import type { Species, ProductVariant } from '@/interfaces'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import {
  StockNotificationWhatsapp,
  QuantitySelector,
  SizeSelector,
  StockLabel,
  Button,
  isProductAvailable,
  isVariantAvailable,
} from '@/components'
import { useCartStore } from '@/store'
import { getImageUrl, Logger, useFormatPrice } from '@/lib'

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
  const { format, formatRange } = useFormatPrice()
  const addProductToCart = useCartStore((state) => state.addProductToCart)

  // 1. ¿Existe algo que vender en general?
  const hasGlobalStock = isProductAvailable(product)

  // 2. Lógica de Precio Dinámico
  const getPriceLabel = () => {
    // Caso A: Variante seleccionada -> Precio específico (si es <= 0 mostrar 'No disponible')
    if (selectedVariant) {
      return selectedVariant.price > 0 ? format(selectedVariant.price) : 'No disponible'
    }

    // Caso B: Nada seleccionado -> Rango de Precios para variantes con precio > 0
    const availableVariants = product.variants.filter((v) => isVariantAvailable(v))
    const validPriceVariants = product.variants.filter((v) => v.price > 0)
    const targetVariants = availableVariants.length > 0 ? availableVariants : validPriceVariants
    const prices = targetVariants.map((v) => v.price)

    if (prices.length === 0) return 'No disponible'
    const min = Math.min(...prices)
    const max = Math.max(...prices)

    return formatRange(min, max)
  }

  // 3. Acción de Agregar al Carrito
  const addToCart = () => {
    setPosted(true)

    if (!selectedVariant) return

    const rawImage = product.images?.[0]
    const imageUrl = rawImage ? getImageUrl(rawImage) : '/images/placeholder.jpg'

    addProductToCart({
      id: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      price: selectedVariant.price,
      size: selectedVariant.size,
      image: imageUrl,
      quantity: quantity,
      maxStock: selectedVariant.quantity ?? 1,
    })

    Logger.info('Agregado al carrito:', {
      product: product.name,
      variant: selectedVariant.size,
      quantity,
    })

    // Reset visual post-agregado
    setQuantity(1)
    setPosted(false)
  }

  // Helper: ¿La variante seleccionada tiene stock?
  // Si no hay selección, asumimos true para no mostrar errores prematuros
  const isSelectedVariantAvailable = selectedVariant ? isVariantAvailable(selectedVariant) : true

  return (
    <>
      {/* ---- Price ---- */}
      <p className="text-primary fade-in tds-sm:mt-2 mt-0.5 mb-5 text-[19px] leading-2 font-semibold">
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
            setPosted(false) // Limpiamos aviso previo
          }}
        />
      )}

      {/* --- CONTROLES DE COMPRA --- */}
      {hasGlobalStock ? (
        <>
          {/* Selector de Cantidad: Deshabilitado si no hay maceta seleccionada */}
          {isSelectedVariantAvailable && (
            <QuantitySelector
              disabled={!selectedVariant}
              maxQuantity={selectedVariant?.quantity}
              quantity={quantity}
              onClickDisabled={() => setPosted(true)}
              onQuantityChanged={setQuantity}
            />
          )}

          <div className="mt-5.5">
            {/* Mensaje de Advertencia: Se muestra SOLO tras un intento de acción sin maceta */}
            <AnimatePresence mode="wait">
              {!selectedVariant && posted && (
                <motion.p
                  animate={{ height: 'auto', marginBottom: 8, opacity: 1, y: 0 }}
                  className="overflow-hidden text-xs font-medium tracking-wide text-red-800/75 dark:text-red-400/75"
                  exit={{ height: 0, marginBottom: 0, opacity: 0, y: -10 }}
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
                  size={selectedVariant.size}
                  speciesId={product.id}
                  variantId={selectedVariant.id}
                />
              </div>
            ) : (
              // CASO: Disponible para comprar
              <Button
                className="tds-sm:w-[320px] tds-lg:w-full tds-xl:w-[320px] w-full"
                type="button"
                onClick={addToCart}
              >
                Agregar al carrito
              </Button>
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
              size={selectedVariant?.size}
              speciesId={product.id}
              variantId={selectedVariant?.id}
            />
          </div>
        </div>
      )}
    </>
  )
}
