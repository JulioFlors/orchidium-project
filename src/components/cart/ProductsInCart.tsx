'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

import { useCartStore } from '@/store'
import { ProductImage, QuantitySelector } from '@/components'

export function ProductsInCart() {
  const updateProductQuantity = useCartStore((state) => state.updateProductQuantity)
  const removeProduct = useCartStore((state) => state.removeProduct)

  const [loaded, setLoaded] = useState(false)
  const productsInCart = useCartStore((state) => state.cart)

  useEffect(() => {
    setLoaded(true)
  }, [])

  if (!loaded) {
    return <p>Loading...</p>
  }

  return (
    <>
      {productsInCart.map((product) => (
        <div key={`${product.slug}-${product.size}`} className="mb-5 flex">
          <ProductImage
            alt={product.name}
            className="mr-5 rounded"
            height={100}
            src={product.image}
            style={{
              width: '100px',
              height: '100px',
            }}
            width={100}
          />

          <div>
            <Link className="cursor-pointer hover:underline" href={`/product/${product.slug} `}>
              {product.size} - {product.name}
            </Link>

            <p>${product.price}</p>
            <QuantitySelector
              quantity={product.quantity}
              onQuantityChanged={(quantity) => updateProductQuantity(product, quantity)}
            />

            <button className="mt-3 underline" type="button" onClick={() => removeProduct(product)}>
              Remover
            </button>
          </div>
        </div>
      ))}
    </>
  )
}
