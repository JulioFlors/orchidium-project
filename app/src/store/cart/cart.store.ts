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
  lastAddedItem: CartProduct | null
  isAddedModalOpen: boolean

  getTotalItems: () => number
  getSummaryInformation: () => {
    subTotal: number
    tax: number
    total: number
    itemsInCart: number
  }

  addProductToCart: (product: CartProduct) => void
  openAddedModal: (product?: CartProduct) => void
  closeAddedModal: () => void
  updateProductQuantity: (variantId: string, quantity: number) => void
  removeProduct: (variantId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      lastAddedItem: null,
      isAddedModalOpen: false,

      openAddedModal: (product?: CartProduct) => {
        set((state) => ({
          isAddedModalOpen: true,
          lastAddedItem: product ?? state.lastAddedItem,
        }))
      },

      closeAddedModal: () => {
        set({ isAddedModalOpen: false })
      },

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
          set({
            cart: [...cart, product],
            lastAddedItem: product,
            isAddedModalOpen: true,
          })

          return
        }

        const updatedCart = cart.map((item) => {
          if (item.variantId === product.variantId) {
            const newQty = Math.min(item.quantity + product.quantity, item.maxStock)

            return { ...item, quantity: newQty }
          }

          return item
        })

        set({
          cart: updatedCart,
          lastAddedItem: product,
          isAddedModalOpen: true,
        })
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
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
)
