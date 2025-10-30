'use client'

import { useState } from 'react'

import { FormField, RadioOption, RadioGroup } from '@/components'

// ---- Opciones válidas para los RadioOption ---- //
type DeliveryType = 'shipping' | 'pickup'
//type ShippingType = 'delivery' | 'zoom' | 'mrw'
//type PaymentType = 'pago-movil' | 'divisas' | 'bs'

// ---- Definición de los RadioOption ---- //
const deliveryOptions: RadioOption<DeliveryType>[] = [
  { value: 'shipping', label: 'Envio (Cobro a destino)' },
  { value: 'pickup', label: 'Retiro (Ciudad Guayana)' },
]

/* const shippingOptions: RadioOption<ShippingType>[] = [
  { value: 'delivery', label: 'Delivery (Ciudad Guayana)' },
  { value: 'zoom', label: 'ZOOM' },
  { value: 'mrw', label: 'MRW' },
] */

/* const paymentOptions: RadioOption<PaymentType>[] = [
  { value: 'pago-movil', label: 'Pago Movil' },
  { value: 'divisas', label: 'Divisas' },
  { value: 'bs', label: 'Bs' },
] */

export function AddressForm() {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('shipping')
  //  const [shippingType, setShippingType] = useState<ShippingType>('zoom')
  //  const [paymentType, setPaymentType] = useState<PaymentType>('pago-movil')

  return (
    <div className="flex w-full max-w-[850px] flex-col justify-center text-left">
      {/* ---- Título de la sección ---- */}
      <div className="space-y-8">
        <h1 className="tracking-2 tds-sm:tracking-4 tds-sm:text-[40px] tds-sm:leading-11 text-primary tds-sm:font-medium mt-0 pb-2 text-[26px] leading-8 font-semibold antialiased">
          Entrega
        </h1>
        <h3 className="tds-sm:text-[24px] text-primary mt-0 pb-2 text-[20px] leading-7 font-semibold tracking-normal antialiased">
          Métodos de envío
        </h3>
      </div>

      {/* Métodos de envío */}
      <div className="my-4">
        <RadioGroup
          name="billing-type"
          options={deliveryOptions}
          selectedValue={deliveryType}
          onValueChange={setDeliveryType}
        />
      </div>

      {/* ---- Formulario ---- */}
      <div className="tds-sm:grid-cols-[repeat(2,minmax(200px,1fr))] grid grid-cols-1 gap-6">
        {/* Usando FormField para Nombre y Apellidos */}
        <FormField htmlFor="billing-first-name" label="Nombre">
          <input className="form-input" id="billing-first-name" type="text" />
        </FormField>

        <FormField htmlFor="billing-last-name" label="Apellidos">
          <input className="form-input" id="billing-last-name" type="text" />
        </FormField>

        <div className="flex flex-col">
          <span className="-tracking-2 font-semibold">Cedula</span>
          <input
            className="focus-search-box bg-search-box mt-2 min-h-10 w-full rounded px-3 leading-6 font-semibold"
            type="text"
          />
        </div>

        <div className="flex flex-col">
          <span className="-tracking-2 font-semibold">Dirección</span>
          <input
            className="focus-search-box bg-search-box mt-2 min-h-10 w-full rounded px-3 leading-6 font-semibold"
            type="text"
          />
        </div>

        <div className="flex flex-col">
          <span className="-tracking-2 font-semibold">Ciudad</span>
          <input
            className="focus-search-box bg-search-box mt-2 min-h-10 w-full rounded px-3 leading-6 font-semibold"
            type="text"
          />
        </div>

        {/* todo -> adaptar el QuantityDropdown para la seleccion de los Estados */}
        <div className="flex flex-col">
          <span className="-tracking-2 font-semibold">Estado</span>
          <select className="focus-search-box bg-search-box mt-2 min-h-10 w-full rounded px-3 leading-6 font-semibold">
            <option value="">[ Seleccione ]</option>
            <option value="Amazonas">Amazonas</option>
            <option value="Anzoátegui">Anzoátegui</option>
            <option value="Apure">Apure</option>
            <option value="Aragua">Aragua</option>
            <option value="Barinas">Barinas</option>
            <option value="Bolívar">Bolívar</option>
            <option value="Carabobo">Carabobo</option>
            <option value="Cojedes">Cojedes</option>
            <option value="Delta Amacuro">Delta Amacuro</option>
            <option value="Dependencias Federales">Dependencias Federales</option>
            <option value="Distrito Capital">Distrito Capital</option>
            <option value="Falcón">Falcón</option>
            <option value="Guárico">Guárico</option>
            <option value="La Guaira">La Guaira</option>
            <option value="Lara">Lara</option>
            <option value="Mérida">Mérida</option>
            <option value="Miranda">Miranda</option>
            <option value="Monagas">Monagas</option>
            <option value="Nueva Esparta">Nueva Esparta</option>
            <option value="Portuguesa">Portuguesa</option>
            <option value="Sucre">Sucre</option>
            <option value="Táchira">Táchira</option>
            <option value="Trujillo">Trujillo</option>
            <option value="Yaracuy">Yaracuy</option>
            <option value="Zulia">Zulia</option>
          </select>
        </div>

        <div className="flex flex-col">
          <span className="-tracking-2 font-semibold">Teléfono</span>
          <input
            className="focus-search-box bg-search-box mt-2 min-h-10 w-full rounded px-3 leading-6 font-semibold"
            type="text"
          />
        </div>
      </div>
    </div>
  )
}
