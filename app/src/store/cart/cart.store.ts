import type { PotSize } from '@package/database/enums'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartProduct {
  id: string
  variantId: string
  slug: string
  name: string
  price: number
  size: PotSize
  image: string
  quantity: number
  maxStock: number
}

interface CartState {
  cart: CartProduct[]

  getTotalItems: () => number
  getSummaryInformation: () => {
    subTotal: number
    tax: number
    total: number
    itemsInCart: number
  }

  addProductToCart: (product: CartProduct) => void
  updateProductQuantity: (variantId: string, quantity: number) => void
  removeProduct: (variantId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      getTotalItems: () => {
        const { cart } = get()

        return cart.reduce((total, item) => total + item.quantity, 0)
      },

      getSummaryInformation: () => {
        const { cart } = get()
        const subTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)
        const tax = 0
        const total = subTotal + tax
        const itemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0)

        return {
          subTotal,
          tax,
          total,
          itemsInCart,
        }
      },

      addProductToCart: (product: CartProduct) => {
        const { cart } = get()
        const existing = cart.find((item) => item.variantId === product.variantId)

        if (!existing) {
          set({ cart: [...cart, product] })

          return
        }

        const updatedCart = cart.map((item) => {
          if (item.variantId === product.variantId) {
            const newQty = Math.min(item.quantity + product.quantity, item.maxStock)

            return { ...item, quantity: newQty }
          }

          return item
        })

        set({ cart: updatedCart })
      },

      updateProductQuantity: (variantId: string, quantity: number) => {
        const { cart } = get()

        const updatedCart = cart.map((item) => {
          if (item.variantId === variantId) {
            const newQty = Math.min(Math.max(1, quantity), item.maxStock)

            return { ...item, quantity: newQty }
          }

          return item
        })

        set({ cart: updatedCart })
      },

      removeProduct: (variantId: string) => {
        const { cart } = get()

        set({ cart: cart.filter((item) => item.variantId !== variantId) })
      },

      clearCart: () => {
        set({ cart: [] })
      },
    }),
    {
      name: 'pristinoplant-cart-store',
    },
  ),
)
