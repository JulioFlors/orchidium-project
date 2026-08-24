'use client'

import type { PaymentMethod } from '@package/database/enums'

import { useState, useSyncExternalStore, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PiArrowLeftBold, PiCheckBold } from 'react-icons/pi'
import clsx from 'clsx'

import { createOrder } from '@/actions'
import { Button, buttonVariants, FormField, Heading, Input } from '@/components'
import { PotSizeLabels } from '@/config/mappings'
import { authClient, getImageUrl, useFormatPrice } from '@/lib'
import { useCartStore, useCheckoutStore, useCurrencyStore } from '@/store'

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; description: string }> = [
  {
    id: 'PAGO_MOVIL',
    label: 'Pago Móvil',
    description: 'Mercantil. C.I./RIF: 24847678 — Tel: 0414-8724205.',
  },
  {
    id: 'TRANSFERENCIA_VES',
    label: 'Transferencia en Bolívares',
    description: 'Cta. Mercantil 0105 0188 1311 8817 5750.',
  },
  {
    id: 'EFECTIVO_DIVISAS',
    label: 'Efectivo en Divisas',
    description: 'Entrega de efectivo en USD al momento del retiro o entrega.',
  },
]

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function CheckoutView() {
  const isLoaded = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [isPending, startTransition] = useTransition()
  const [isNavigating, setIsNavigating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const cart = useCartStore((state) => state.cart)
  const clearCart = useCartStore((state) => state.clearCart)

  const subTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const itemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0)

  const { format: formatPrice } = useFormatPrice()
  const currency = useCurrencyStore((state) => state.currency)
  const rate = useCurrencyStore((state) => state.rate)

  const {
    step,
    deliveryType,
    shippingMethod,
    shippingCost,
    shippingAddress,
    billingInfo,
    paymentMethod,
    setStep,
    setDeliveryType,
    setShippingMethod,
    setShippingAddress,
    setBillingInfo,
    setPaymentMethod,
    resetCheckout,
  } = useCheckoutStore()

  if (!isLoaded) {
    return (
      <div className="mx-auto flex w-full max-w-150 flex-col items-center justify-center py-20 text-center">
        <p className="text-secondary text-sm">Cargando proceso de pago...</p>
      </div>
    )
  }

  function handleGoToStep2(e: React.FormEvent) {
    e.preventDefault()

    if (!shippingAddress.name || !shippingAddress.idNumber || !shippingAddress.phone) {
      setErrorMessage('Por favor complete su Nombre, Cédula y Teléfono.')

      return
    }

    if (deliveryType === 'SHIPPING' && !shippingAddress.address) {
      setErrorMessage('Por favor ingrese la dirección exacta para el envío.')

      return
    }

    setErrorMessage(null)
    setStep(2)
  }

  function handleConfirmOrder() {
    startTransition(async () => {
      setErrorMessage(null)

      const result = await createOrder({
        userId: session?.user?.id,
        items: cart.map((item) => ({
          variantId: item.variantId,
          speciesName: item.name,
          size: item.size,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
        paymentMethod,
        shippingCost,
        shippingAddress: {
          ...shippingAddress,
          deliveryType,
          shippingMethod,
        },
        billingInfo: billingInfo.useShippingAddress ? { ...shippingAddress } : { ...billingInfo },
      })

      if (!result.ok || !result.order) {
        setErrorMessage(result.message || 'Error al procesar el pedido.')

        return
      }

      setIsNavigating(true)
      router.push(`/checkout/order/${result.order.id}`)
      clearCart()
      resetCheckout()
    })
  }

  if (cart.length === 0 && step === 1 && !isNavigating) {
    return (
      <div className="mx-auto flex w-full max-w-150 flex-col items-center justify-center py-20 text-center">
        <h1 className="text-primary text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="text-secondary mt-2 text-sm">
          No hay productos en el carrito para realizar la compra.
        </p>
        <Link
          className={buttonVariants({ variant: 'primary', className: 'mt-6' })}
          href="/category/plants"
        >
          Ver Catálogo de Plantas
        </Link>
      </div>
    )
  }

  return (
    <div className="tds-sm:-mx-9 tds-xl:-mx-12 -mx-6">
      <div className="tds-lg:max-w-300 tds-sm:px-9 tds-xl:px-12 mx-auto flex w-full max-w-150 px-6">
        <div className="flex w-full flex-col py-6 sm:py-8">
          {/* Heading Oficial de Pristinoplant */}
          <div className="mb-8 flex items-center gap-4">
            {step === 2 && (
              <button
                className="bg-surface text-primary border-input-outline hover:bg-hover-overlay cursor-pointer rounded border p-2.5 transition-colors"
                type="button"
                onClick={() => setStep(1)}
              >
                <PiArrowLeftBold className="h-5 w-5" />
              </button>
            )}
            <Heading
              description={`Paso ${step} de 2`}
              title={step === 1 ? 'Facturación y Envío' : 'Revisar y pagar'}
            />
          </div>

          {errorMessage && (
            <div className="border-action/40 bg-action/10 text-primary mb-8 rounded border p-4 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Datos de Envío y Facturación (Formulario Amplio y Abierto Estilo Tesla) */}
          {step === 1 ? (
            <div className="mx-auto flex w-full max-w-225 flex-col">
              <form className="flex w-full flex-col gap-10" onSubmit={handleGoToStep2}>
                {/* SECCIÓN 1: Envío */}
                <div className="flex flex-col gap-6">
                  <h2 className="text-primary text-2xl font-bold tracking-tight">Envío</h2>

                  {/* Selector de Opciones de Entrega (Estilo SelectorGroup sin radios) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      className={clsx(
                        'flex cursor-pointer items-center justify-between rounded border p-4 text-left transition-all duration-200 outline-none',
                        deliveryType === 'SHIPPING'
                          ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/40 text-white shadow-xs'
                          : 'bg-surface border-input-outline text-secondary hover:bg-hover-overlay hover:text-primary hover:border-primary/30',
                      )}
                      type="button"
                      onClick={() => setDeliveryType('SHIPPING')}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={clsx(
                            'text-xs font-bold',
                            deliveryType === 'SHIPPING' ? 'text-white' : 'text-primary',
                          )}
                        >
                          Envío Nacional
                        </span>
                        <span
                          className={clsx(
                            'text-[11px]',
                            deliveryType === 'SHIPPING' ? 'text-white/80' : 'text-secondary',
                          )}
                        >
                          Entrega por courier en toda Venezuela
                        </span>
                      </div>
                      <span className="text-xl">🚚</span>
                    </button>

                    <button
                      className={clsx(
                        'flex cursor-pointer items-center justify-between rounded border p-4 text-left transition-all duration-200 outline-none',
                        deliveryType === 'PICKUP'
                          ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/40 text-white shadow-xs'
                          : 'bg-surface border-input-outline text-secondary hover:bg-hover-overlay hover:text-primary hover:border-primary/30',
                      )}
                      type="button"
                      onClick={() => setDeliveryType('PICKUP')}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={clsx(
                            'text-xs font-bold',
                            deliveryType === 'PICKUP' ? 'text-white' : 'text-primary',
                          )}
                        >
                          Retiro en Orquideario
                        </span>
                        <span
                          className={clsx(
                            'text-[11px]',
                            deliveryType === 'PICKUP' ? 'text-white/80' : 'text-secondary',
                          )}
                        >
                          Directamente en nuestra sede física
                        </span>
                      </div>
                      <span className="text-xl">🏪</span>
                    </button>
                  </div>

                  {/* Formulario según tipo de entrega */}
                  {deliveryType === 'SHIPPING' ? (
                    <div className="flex flex-col gap-5 pt-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          className="sm:col-span-2"
                          htmlFor="shipping-name"
                          label="Nombre y Apellido"
                        >
                          <Input
                            required
                            id="shipping-name"
                            maxLength={70}
                            type="text"
                            value={shippingAddress.name}
                            onChange={(e) => setShippingAddress({ name: e.target.value })}
                          />
                        </FormField>

                        <FormField htmlFor="shipping-id" label="Cédula / RIF">
                          <Input
                            required
                            id="shipping-id"
                            maxLength={20}
                            placeholder="Ej. V-19745523"
                            type="text"
                            value={shippingAddress.idNumber}
                            onChange={(e) => setShippingAddress({ idNumber: e.target.value })}
                          />
                        </FormField>

                        <FormField htmlFor="shipping-phone" label="Número de teléfono móvil">
                          <Input
                            required
                            id="shipping-phone"
                            maxLength={30}
                            placeholder="Ej. 0414-8724205"
                            type="text"
                            value={shippingAddress.phone}
                            onChange={(e) => setShippingAddress({ phone: e.target.value })}
                          />
                        </FormField>

                        <FormField
                          className="sm:col-span-2"
                          htmlFor="shipping-address"
                          label="Dirección"
                        >
                          <Input
                            required
                            id="shipping-address"
                            maxLength={250}
                            placeholder="Calle, sector, edif/casa, punto de referencia"
                            type="text"
                            value={shippingAddress.address}
                            onChange={(e) => setShippingAddress({ address: e.target.value })}
                          />
                        </FormField>

                        <FormField htmlFor="shipping-city" label="Ciudad">
                          <Input
                            required
                            id="shipping-city"
                            maxLength={50}
                            placeholder="Ej. Ciudad Guayana"
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ city: e.target.value })}
                          />
                        </FormField>

                        <FormField htmlFor="shipping-state" label="Estado">
                          <Input
                            required
                            id="shipping-state"
                            maxLength={50}
                            placeholder="Ej. Bolívar"
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ state: e.target.value })}
                          />
                        </FormField>
                      </div>

                      {/* Métodos de Transporte / Couriers */}
                      <div className="flex flex-col gap-3 pt-4">
                        <h3 className="text-secondary text-xs font-semibold tracking-wide">
                          Transporte y Método de Envío
                        </h3>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {[
                            {
                              id: 'MRW',
                              label: 'MRW (Pago en destino)',
                              priceText: 'Cobro a destino',
                            },
                            {
                              id: 'ZOOM',
                              label: 'ZOOM (Pago en destino)',
                              priceText: 'Cobro a destino',
                            },
                            {
                              id: 'TEALCA',
                              label: 'TEALCA (Pago en destino)',
                              priceText: 'Cobro a destino',
                            },
                            {
                              id: 'DELIVERY_LOCAL',
                              label: 'Delivery Local (Ciudad Guayana)',
                              priceText: '$5,00 USD',
                            },
                          ].map((courier) => {
                            const isSelected = shippingMethod === courier.id

                            return (
                              <button
                                key={courier.id}
                                className={clsx(
                                  'flex cursor-pointer items-center justify-between rounded border p-3.5 text-left transition-all duration-200 outline-none',
                                  isSelected
                                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/40 text-white shadow-xs'
                                    : 'bg-surface border-input-outline text-secondary hover:bg-hover-overlay hover:text-primary hover:border-primary/30',
                                )}
                                type="button"
                                onClick={() =>
                                  setShippingMethod(
                                    courier.id as 'MRW' | 'ZOOM' | 'TEALCA' | 'DELIVERY_LOCAL',
                                  )
                                }
                              >
                                <span
                                  className={clsx(
                                    'text-xs font-semibold',
                                    isSelected ? 'text-white' : 'text-primary',
                                  )}
                                >
                                  {courier.label}
                                </span>
                                <span
                                  className={clsx(
                                    'text-[11px] font-bold',
                                    isSelected ? 'text-white' : 'text-action',
                                  )}
                                >
                                  {courier.priceText}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Caso: Retiro en Orquideario */
                    <div className="flex flex-col gap-5 pt-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          className="sm:col-span-2"
                          htmlFor="pickup-name"
                          label="Nombre de Quien Retira"
                        >
                          <Input
                            required
                            id="pickup-name"
                            maxLength={70}
                            type="text"
                            value={shippingAddress.name}
                            onChange={(e) =>
                              setShippingAddress({
                                name: e.target.value,
                                address: 'Retiro en Orquideario Pristinoplant',
                              })
                            }
                          />
                        </FormField>

                        <FormField htmlFor="pickup-id" label="Cédula / RIF">
                          <Input
                            required
                            id="pickup-id"
                            maxLength={20}
                            placeholder="Ej. V-19745523"
                            type="text"
                            value={shippingAddress.idNumber}
                            onChange={(e) => setShippingAddress({ idNumber: e.target.value })}
                          />
                        </FormField>

                        <FormField htmlFor="pickup-phone" label="Teléfono de Contacto">
                          <Input
                            required
                            id="pickup-phone"
                            maxLength={30}
                            placeholder="Ej. 0414-8724205"
                            type="text"
                            value={shippingAddress.phone}
                            onChange={(e) => setShippingAddress({ phone: e.target.value })}
                          />
                        </FormField>
                      </div>

                      <div className="border-input-outline bg-surface/60 flex flex-col gap-1 rounded border p-4 text-xs">
                        <p className="text-primary font-bold">Ubicación</p>
                        <p className="text-secondary leading-relaxed">
                          UD-102, San Félix, Ciudad Guayana, Estado Bolívar, Venezuela.
                        </p>
                        <p className="text-secondary opacity-80">
                          Nos contactaremos para coordinar el retiro.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECCIÓN 2: Facturación */}
                <div className="flex flex-col gap-5">
                  <h2 className="text-primary text-2xl font-bold tracking-tight">Facturación</h2>

                  {/* Checkbox Estilizado con token del proyecto */}
                  <button
                    aria-checked={billingInfo.useShippingAddress}
                    className="group flex cursor-pointer select-none items-center gap-3 self-start outline-none"
                    role="checkbox"
                    type="button"
                    onClick={() =>
                      setBillingInfo({ useShippingAddress: !billingInfo.useShippingAddress })
                    }
                  >
                    <span
                      className={clsx(
                        'flex h-5 w-5 items-center justify-center rounded border transition-all duration-200',
                        billingInfo.useShippingAddress
                          ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-xs'
                          : 'bg-input border-input-outline group-hover:border-primary/40',
                      )}
                    >
                      {billingInfo.useShippingAddress && (
                        <PiCheckBold className="h-3.5 w-3.5 text-white" />
                      )}
                    </span>
                    <span className="text-primary text-xs font-semibold">
                      Usar la misma información para la facturación
                    </span>
                  </button>

                  {!billingInfo.useShippingAddress && (
                    <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                      <FormField
                        className="sm:col-span-2"
                        htmlFor="billing-name"
                        label="Razón Social / Nombre"
                      >
                        <Input
                          required
                          id="billing-name"
                          maxLength={70}
                          type="text"
                          value={billingInfo.name}
                          onChange={(e) => setBillingInfo({ name: e.target.value })}
                        />
                      </FormField>

                      <FormField htmlFor="billing-id" label="RIF / Cédula">
                        <Input
                          required
                          id="billing-id"
                          maxLength={20}
                          type="text"
                          value={billingInfo.idNumber}
                          onChange={(e) => setBillingInfo({ idNumber: e.target.value })}
                        />
                      </FormField>

                      <FormField
                        className="sm:col-span-2"
                        htmlFor="billing-address"
                        label="Dirección Fiscal"
                      >
                        <Input
                          required
                          id="billing-address"
                          maxLength={250}
                          type="text"
                          value={billingInfo.address}
                          onChange={(e) => setBillingInfo({ address: e.target.value })}
                        />
                      </FormField>
                    </div>
                  )}
                </div>

                {/* Botón Siguiente */}
                <div className="pt-2">
                  <Button className="w-full sm:w-56" size="lg" type="submit" variant="primary">
                    Siguiente
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* STEP 2: Revisar y Pagar (Layout 2 Columnas Idéntico en Dimensiones a /cart) */
            <div className="tds-lg:grid-cols-2 tds-sm:-mt-6 tds-sm:mb-6 mt-0 mb-0 -ml-6 grid grid-cols-1">
              {/* Columna Izquierda: Lista de Artículos */}
              <div className="tds-sm:pt-6 flex w-full min-w-0 flex-1 flex-col pt-0 pl-6">
                <h2 className="text-primary text-xl font-bold tracking-tight pb-2">
                  Artículos en el pedido
                </h2>

                <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {cart.map((item) => (
                    <div key={item.variantId} className="flex items-center gap-4 py-4">
                      <Image
                        alt={item.name}
                        className="aspect-square h-20 w-20 rounded object-cover"
                        height={80}
                        src={getImageUrl(item.image)}
                        width={80}
                      />
                      <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                        <span className="text-primary text-sm font-bold truncate">{item.name}</span>
                        <span className="text-secondary text-xs">
                          Tamaño: {PotSizeLabels[item.size] || item.size}
                        </span>
                        <span className="text-secondary text-xs">Cantidad: {item.quantity}</span>
                      </div>
                      <div className="min-w-24 text-right">
                        <span className="text-primary text-sm font-bold whitespace-nowrap">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna Derecha: Facturación / Resumen del Pedido */}
              <div className="tds-sm:pt-6 flex-1 pt-0 pl-6">
                <div className="order-summary">
                  <h2 className="text-primary border-b border-zinc-200 pb-3 text-lg font-bold dark:border-zinc-800/60">
                    Resumen del pedido ({itemsInCart} {itemsInCart === 1 ? 'artículo' : 'artículos'}
                    )
                  </h2>

                  {/* Resumen de Envío con [Editar] */}
                  <div className="flex flex-col gap-1 border-b border-zinc-200 py-3 text-xs dark:border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary text-[11px] font-bold tracking-wider uppercase">
                        {deliveryType === 'PICKUP' ? 'Retiro en Sede' : 'Dirección de envío'}
                      </span>
                      <button
                        className="text-action cursor-pointer font-bold hover:underline"
                        type="button"
                        onClick={() => setStep(1)}
                      >
                        Editar
                      </button>
                    </div>
                    <span className="text-primary font-semibold">
                      {shippingAddress.name} ({shippingAddress.idNumber})
                    </span>
                    <span className="text-secondary">
                      {deliveryType === 'PICKUP'
                        ? 'UD-102, San Félix, Ciudad Guayana'
                        : `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}`}
                    </span>
                    <span className="text-secondary">Tel: {shippingAddress.phone}</span>
                  </div>

                  {/* Resumen de Facturación con [Editar] */}
                  <div className="flex flex-col gap-1 border-b border-zinc-200 py-3 text-xs dark:border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary text-[11px] font-bold tracking-wider uppercase">
                        Dirección de facturación
                      </span>
                      <button
                        className="text-action cursor-pointer font-bold hover:underline"
                        type="button"
                        onClick={() => setStep(1)}
                      >
                        Editar
                      </button>
                    </div>
                    <span className="text-primary font-semibold">
                      {billingInfo.useShippingAddress ? shippingAddress.name : billingInfo.name}
                    </span>
                    <span className="text-secondary">
                      {billingInfo.useShippingAddress
                        ? `${shippingAddress.address}, ${shippingAddress.city}`
                        : billingInfo.address}
                    </span>
                  </div>

                  {/* Método de Pago (Selectores estilo card) */}
                  <div className="flex flex-col gap-3 border-b border-zinc-200 py-4 dark:border-zinc-800/60">
                    <span className="text-secondary text-[11px] font-bold tracking-wider uppercase">
                      Método de Pago
                    </span>
                    <div className="flex flex-col gap-2">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = paymentMethod === method.id

                        return (
                          <button
                            key={method.id}
                            className={clsx(
                              'flex cursor-pointer flex-col gap-0.5 rounded border p-3 text-left transition-all duration-200 outline-none',
                              isSelected
                                ? 'bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500/40 text-white shadow-xs'
                                : 'bg-surface border-input-outline text-secondary hover:bg-hover-overlay hover:text-primary hover:border-primary/30',
                            )}
                            type="button"
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <span
                              className={clsx(
                                'text-xs font-bold',
                                isSelected ? 'text-white' : 'text-primary',
                              )}
                            >
                              {method.label}
                            </span>
                            <span
                              className={clsx(
                                'text-[10px]',
                                isSelected ? 'text-white/80' : 'text-secondary',
                              )}
                            >
                              {method.description}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Desglose Financiero */}
                  <div className="flex flex-col gap-2 pt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-secondary">Subtotal</span>
                      <span className="text-primary font-semibold">${subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Envío</span>
                      <span className="text-primary font-semibold">
                        {shippingCost > 0
                          ? `$${shippingCost.toFixed(2)}`
                          : deliveryType === 'PICKUP'
                            ? 'Gratis'
                            : 'Cobro a Destino'}
                      </span>
                    </div>
                    <div className="text-primary flex items-center justify-between border-t border-zinc-200 pt-2 text-base font-bold dark:border-zinc-800/60">
                      <span>Total</span>
                      <span>${(subTotal + shippingCost).toFixed(2)}</span>
                    </div>

                    {rate && (
                      <div className="flex justify-between pt-1">
                        <span className="text-secondary font-semibold">Monto en Bolívares</span>
                        <span className="text-primary font-bold">
                          Bs. {((subTotal + shippingCost) * rate).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {currency === 'USD' && rate && (
                      <div className="text-secondary text-[11px] opacity-70">
                        Tasa BCV Bs. {rate.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <Button
                    className="mt-2 w-full"
                    disabled={isPending || isNavigating}
                    isLoading={isPending || isNavigating}
                    size="lg"
                    variant="primary"
                    onClick={handleConfirmOrder}
                  >
                    {isPending || isNavigating ? 'Procesando Pedido...' : 'Realizar pedido'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
