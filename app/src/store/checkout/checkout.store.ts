import type { PaymentMethod } from '@package/database/enums'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeliveryType = 'SHIPPING' | 'PICKUP'

export type ShippingMethod = 'MRW' | 'ZOOM' | 'TEALCA' | 'DELIVERY_LOCAL' | 'PICKUP_SEDE'

export interface AddressFormData {
  name: string
  idNumber: string
  address: string
  city: string
  state: string
  zipCode?: string
  phone: string
}

export interface BillingFormData {
  useShippingAddress: boolean
  name: string
  idNumber: string
  address: string
  city: string
  state: string
  zipCode?: string
}

interface CheckoutState {
  step: 1 | 2
  deliveryType: DeliveryType
  shippingMethod: ShippingMethod
  shippingCost: number
  selectedAddressId: string | null
  shippingAddress: AddressFormData
  billingInfo: BillingFormData
  paymentMethod: PaymentMethod

  setStep: (step: 1 | 2) => void
  setDeliveryType: (type: DeliveryType) => void
  setShippingMethod: (method: ShippingMethod) => void
  setSelectedAddressId: (id: string | null) => void
  setShippingAddress: (data: Partial<AddressFormData>) => void
  setBillingInfo: (data: Partial<BillingFormData>) => void
  setPaymentMethod: (method: PaymentMethod) => void
  resetCheckout: () => void
}

const initialShippingAddress: AddressFormData = {
  name: '',
  idNumber: '',
  address: '',
  city: 'Ciudad Guayana',
  state: 'Bolívar',
  zipCode: '',
  phone: '',
}

const initialBillingInfo: BillingFormData = {
  useShippingAddress: true,
  name: '',
  idNumber: '',
  address: '',
  city: 'Ciudad Guayana',
  state: 'Bolívar',
  zipCode: '',
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      step: 1,
      deliveryType: 'SHIPPING',
      shippingMethod: 'MRW',
      shippingCost: 0,
      selectedAddressId: null,
      shippingAddress: initialShippingAddress,
      billingInfo: initialBillingInfo,
      paymentMethod: 'PAGO_MOVIL',

      setStep: (step) => set({ step }),
      setDeliveryType: (type) =>
        set({
          deliveryType: type,
          shippingMethod: type === 'PICKUP' ? 'PICKUP_SEDE' : 'MRW',
          shippingCost: 0,
        }),
      setShippingMethod: (method) =>
        set({
          shippingMethod: method,
          shippingCost: method === 'DELIVERY_LOCAL' ? 5.0 : 0,
        }),
      setSelectedAddressId: (id) => set({ selectedAddressId: id }),
      setShippingAddress: (data) =>
        set((state) => ({
          shippingAddress: { ...state.shippingAddress, ...data },
        })),
      setBillingInfo: (data) =>
        set((state) => ({
          billingInfo: { ...state.billingInfo, ...data },
        })),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      resetCheckout: () =>
        set({
          step: 1,
          deliveryType: 'SHIPPING',
          shippingMethod: 'MRW',
          shippingCost: 0,
          selectedAddressId: null,
          shippingAddress: initialShippingAddress,
          billingInfo: initialBillingInfo,
          paymentMethod: 'PAGO_MOVIL',
        }),
    }),
    {
      name: 'pristinoplant-checkout-store',
    },
  ),
)
