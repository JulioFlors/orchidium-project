import type { PotSize } from '@package/database/enums'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminSaleItem {
  variantId?: string
  plantId?: string
  speciesName: string
  size: PotSize
  unitPrice: number
  quantity: number
}

interface AdminSaleState {
  items: AdminSaleItem[]
  notes: string

  addItem: (item: AdminSaleItem) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  setNotes: (notes: string) => void
  clearSale: () => void
}

export const useAdminSaleStore = create<AdminSaleState>()(
  persist(
    (set) => ({
      items: [],
      notes: '',

      addItem: (item) =>
        set((state) => {
          if (item.plantId) {
            const exists = state.items.some((i) => i.plantId === item.plantId)

            if (exists) return state

            return { items: [...state.items, item] }
          }

          if (item.variantId) {
            const existingIndex = state.items.findIndex((i) => i.variantId === item.variantId)

            if (existingIndex > -1) {
              const updated = [...state.items]

              updated[existingIndex].quantity += item.quantity

              return { items: updated }
            }
          }

          return { items: [...state.items, item] }
        }),

      removeItem: (index) =>
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        })),

      updateQuantity: (index, quantity) =>
        set((state) => {
          const updated = [...state.items]

          if (updated[index]) {
            updated[index].quantity = Math.max(1, quantity)
          }

          return { items: updated }
        }),

      setNotes: (notes) => set({ notes }),

      clearSale: () => set({ items: [], notes: '' }),
    }),
    {
      name: 'pristinoplant-admin-sale-store',
    },
  ),
)
