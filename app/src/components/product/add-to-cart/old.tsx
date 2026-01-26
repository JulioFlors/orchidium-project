'use client'

import type { Species } from '@/interfaces'

import { useState } from 'react'

import { StockNotificationWhatsapp, QuantitySelector } from '@/components'
/* import { useCartStore } from '@/store' */

interface Props {
  product: Species
}

export function AddToCart({ product }: Props) {
  /*   const addProductToCart = useCartStore((state) => state.addProductTocart) */
  // Refactor: Calcular disponibilidad global basada en variantes
  const isProductAvailable = product.variants.some((v) => v.available && v.quantity > 0)

  /*   const [size, setSize] = useState<Size | undefined>() */
  const [quantity, setQuantity] = useState<number>(1)

  const addToCart = () => {
    // if (!size) return

    /*     const cartProduct: CartProduct = {
      // id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.variants[0]?.price, // TODO: Usar el precio de la variante seleccionada
      quantity: quantity,
      // size: size,
      image: product.images[0],
    }

    addProductToCart(cartProduct) */
    setQuantity(1)
    // setSize(undefined)
  }

  return (
    <>
      {/*{posted && !size && ( //
        <span className="fade-in mt-2 text-red-500">Debe de seleccionar una talla*</span>
      )} */}

      {/* Selector de Tallas */}
      {/* <SizeSelector availableSizes={product.sizes} selectedSize={size} onSizeChanged={setSize} /> */}

      {isProductAvailable ? (
        <>
          {/* ---- Selector de Cantidad ---- */}
          <QuantitySelector quantity={quantity} onQuantityChanged={setQuantity} />

          {/* ---- Add to Card ---- */}
          <button
            className="btn-primary w-full sm:w-[320px] lg:w-full xl:w-[320px]"
            type="button"
            onClick={addToCart}
          >
            Agregar al carrito
          </button>
        </>
      ) : (
        <StockNotificationWhatsapp productName={product.name} />
      )}
    </>
  )
}
