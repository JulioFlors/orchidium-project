'use client'

import { useState } from 'react'

import { RadioOption, RadioGroup } from '@/components' // Ajusta la ruta

// Tipos para los valores de las opciones para mayor seguridad
type DeliveryMethod = 'shipping' | 'pickup'
type ShippingMethod = 'delivery' | 'zoom' | 'mrw'
type PaymentMethod = 'pago-movil' | 'cash'

// --- Definición de las opciones ---
const deliveryOptions: RadioOption<DeliveryMethod>[] = [
  {
    value: 'shipping',
    label: 'Envio (Cobro a destino)',
  },
  {
    value: 'pickup',
    label: 'Retiro (Ciudad Guayana)',
  },
]

const shippingOptions: RadioOption<ShippingMethod>[] = [
  {
    value: 'delivery',
    label: 'Delivery (Ciudad Guayana)',
  },
  {
    value: 'zoom',
    label: 'ZOOM',
  },
  {
    value: 'mrw',
    label: 'MRW',
  },
]

const paymentOptions: RadioOption<PaymentMethod>[] = [
  {
    value: 'pago-movil',
    label: 'Pago Movil',
  },
  {
    value: 'cash',
    label: 'Divisas',
  },
]

export function CheckoutView() {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping')
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('mrw')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago-movil')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg space-y-10">
        {/* ---- Métodos de Entrega ---- */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Entrega</h2>
          <RadioGroup
            name="delivery-method"
            options={deliveryOptions}
            selectedValue={deliveryMethod}
            onValueChange={setDeliveryMethod}
          />
        </section>

        {/* ---- Métodos de Envío ---- */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Métodos de envío</h2>
          <RadioGroup
            name="shipping-method"
            options={shippingOptions}
            selectedValue={shippingMethod}
            onValueChange={setShippingMethod}
          />
        </section>

        {/* --- Sección de Pago --- */}
        <section>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Pago</h2>
          <RadioGroup
            name="payment-method"
            options={paymentOptions}
            selectedValue={paymentMethod}
            onValueChange={setPaymentMethod}
          />
        </section>
      </div>
    </div>
  )
}
