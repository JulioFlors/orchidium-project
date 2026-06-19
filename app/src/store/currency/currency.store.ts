import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CurrencyState {
  currency: 'USD' | 'VES'
  rate: number | null
  setCurrency: (currency: 'USD' | 'VES') => void
  setRate: (rate: number | null) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      rate: null,
      setCurrency: (currency) => {
        // Si no hay tasa disponible, forzar siempre USD
        if (currency === 'VES' && get().rate === null) {
          set({ currency: 'USD' })
        } else {
          set({ currency })
        }
      },
      setRate: (rate) => {
        set({ rate })
        // Si la tasa se vuelve null por cualquier error, forzar fallback inmediato
        if (rate === null) {
          set({ currency: 'USD' })
        }
      },
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({ currency: state.currency }), // Solo persistir preferencia del usuario
    },
  ),
)
