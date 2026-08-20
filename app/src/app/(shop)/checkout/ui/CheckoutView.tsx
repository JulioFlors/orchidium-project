'use client'

import type { PaymentMethod } from '@package/database/enums'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PiArrowLeftBold, PiMapPinFill, PiReceiptFill } from 'react-icons/pi'
import { useSyncExternalStore } from 'react'

import { Button, buttonVariants, Heading } from '@/components'
import { createOrder } from '@/actions'
import { getImageUrl, useFormatPrice } from '@/lib'
import { authClient } from '@/lib/client/auth-client'
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

      clearCart()
      resetCheckout()
      router.push(`/checkout/order/${result.order.id}`)
    })
  }

  if (cart.length === 0 && step === 1) {
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
    <div className="mx-auto w-full max-w-300 px-4 py-8 sm:px-6 lg:px-8">
      {/* Heading Oficial de Pristinoplant */}
      <div className="mb-8 flex items-center gap-4">
        {step === 2 && (
          <button
            className="bg-canvas text-primary border-input-outline hover:bg-hover-overlay rounded-xl border p-2.5 transition-colors"
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
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: Datos de Envío y Facturación (1 Columna Centrada Estilo Tesla) */}
      {step === 1 ? (
        <form className="mx-auto flex w-full max-w-3xl flex-col gap-8" onSubmit={handleGoToStep2}>
          {/* Ficha 1: Tipo de Entrega y Dirección */}
          <div className="bg-canvas border-input-outline flex flex-col gap-5 rounded-xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <PiMapPinFill className="text-xl text-emerald-500" />
              <h2 className="text-primary text-base font-bold">Opción de Entrega</h2>
            </div>

            {/* Selector Visual de Entrega */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  deliveryType === 'SHIPPING'
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'bg-surface/50 border-input-outline hover:bg-hover-overlay'
                }`}
                onClick={() => setDeliveryType('SHIPPING')}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={deliveryType === 'SHIPPING'}
                    className="text-emerald-600 focus:ring-emerald-500"
                    id="delivery-shipping"
                    name="deliveryType"
                    type="radio"
                    onChange={() => setDeliveryType('SHIPPING')}
                  />
                  <label
                    className="text-primary cursor-pointer text-xs font-bold"
                    htmlFor="delivery-shipping"
                  >
                    Envío Nacional
                  </label>
                </div>
                <span className="text-emerald-500">🚚</span>
              </div>

              <div
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  deliveryType === 'PICKUP'
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'bg-surface/50 border-input-outline hover:bg-hover-overlay'
                }`}
                onClick={() => setDeliveryType('PICKUP')}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={deliveryType === 'PICKUP'}
                    className="text-emerald-600 focus:ring-emerald-500"
                    id="delivery-pickup"
                    name="deliveryType"
                    type="radio"
                    onChange={() => setDeliveryType('PICKUP')}
                  />
                  <label
                    className="text-primary cursor-pointer text-xs font-bold"
                    htmlFor="delivery-pickup"
                  >
                    Retiro en Orquideario
                  </label>
                </div>
                <span className="text-emerald-500">🏪</span>
              </div>
            </div>

            {/* Formulario según el tipo de entrega */}
            {deliveryType === 'SHIPPING' ? (
              <>
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-secondary text-xs font-semibold" htmlFor="shipping-name">
                      Nombre y Apellido
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="shipping-name"
                      maxLength={70}
                      type="text"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({ name: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-secondary text-xs font-semibold" htmlFor="shipping-id">
                      Cédula / RIF
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="shipping-id"
                      maxLength={20}
                      placeholder="Ej. V-19745523"
                      type="text"
                      value={shippingAddress.idNumber}
                      onChange={(e) => setShippingAddress({ idNumber: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label
                      className="text-secondary text-xs font-semibold"
                      htmlFor="shipping-address"
                    >
                      Dirección
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="shipping-address"
                      maxLength={250}
                      placeholder="Calle, sector, edif/casa, punto de referencia"
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({ address: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-secondary text-xs font-semibold" htmlFor="shipping-city">
                      Ciudad
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="shipping-city"
                      maxLength={50}
                      placeholder="Ej. Ciudad Guayana"
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ city: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-secondary text-xs font-semibold"
                      htmlFor="shipping-state"
                    >
                      Estado
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="shipping-state"
                      maxLength={50}
                      placeholder="Ej. Bolívar"
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ state: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label
                      className="text-secondary text-xs font-semibold"
                      htmlFor="shipping-phone"
                    >
                      Número de teléfono móvil
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="shipping-phone"
                      maxLength={30}
                      placeholder="Ej. 0414-8724205"
                      type="text"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Sección Métodos de Envío */}
                <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800/50">
                  <h3 className="text-primary text-xs font-bold tracking-wider uppercase">
                    Transporte y Método de Envío
                  </h3>

                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                      shippingMethod === 'MRW'
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'bg-surface/50 border-input-outline hover:bg-hover-overlay'
                    }`}
                    onClick={() => setShippingMethod('MRW')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        checked={shippingMethod === 'MRW'}
                        className="text-emerald-600 focus:ring-emerald-500"
                        id="shipping-mrw"
                        name="shippingMethod"
                        type="radio"
                        onChange={() => setShippingMethod('MRW')}
                      />
                      <label
                        className="text-primary cursor-pointer text-xs font-semibold"
                        htmlFor="shipping-mrw"
                      >
                        RESTO DE VENEZUELA (MRW PAGO EN DESTINO)
                      </label>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      COBRO A DESTINO
                    </span>
                  </div>

                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                      shippingMethod === 'ZOOM'
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'bg-surface/50 border-input-outline hover:bg-hover-overlay'
                    }`}
                    onClick={() => setShippingMethod('ZOOM')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        checked={shippingMethod === 'ZOOM'}
                        className="text-emerald-600 focus:ring-emerald-500"
                        id="shipping-zoom"
                        name="shippingMethod"
                        type="radio"
                        onChange={() => setShippingMethod('ZOOM')}
                      />
                      <label
                        className="text-primary cursor-pointer text-xs font-semibold"
                        htmlFor="shipping-zoom"
                      >
                        ZOOM (PAGO EN DESTINO)
                      </label>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      COBRO A DESTINO
                    </span>
                  </div>

                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                      shippingMethod === 'TEALCA'
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'bg-surface/50 border-input-outline hover:bg-hover-overlay'
                    }`}
                    onClick={() => setShippingMethod('TEALCA')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        checked={shippingMethod === 'TEALCA'}
                        className="text-emerald-600 focus:ring-emerald-500"
                        id="shipping-tealca"
                        name="shippingMethod"
                        type="radio"
                        onChange={() => setShippingMethod('TEALCA')}
                      />
                      <label
                        className="text-primary cursor-pointer text-xs font-semibold"
                        htmlFor="shipping-tealca"
                      >
                        TEALCA (PAGO EN DESTINO)
                      </label>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      COBRO A DESTINO
                    </span>
                  </div>

                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                      shippingMethod === 'DELIVERY_LOCAL'
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'bg-surface/50 border-input-outline hover:bg-hover-overlay'
                    }`}
                    onClick={() => setShippingMethod('DELIVERY_LOCAL')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        checked={shippingMethod === 'DELIVERY_LOCAL'}
                        className="text-emerald-600 focus:ring-emerald-500"
                        id="shipping-delivery"
                        name="shippingMethod"
                        type="radio"
                        onChange={() => setShippingMethod('DELIVERY_LOCAL')}
                      />
                      <label
                        className="text-primary cursor-pointer text-xs font-semibold"
                        htmlFor="shipping-delivery"
                      >
                        DELIVERY LOCAL (CIUDAD GUAYANA)
                      </label>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      $5,00 USD
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Caso Retiro en Orquideario */
              <div className="flex flex-col gap-4 pt-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-secondary text-xs font-semibold" htmlFor="pickup-name">
                      Nombre de Quien Retira
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
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
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-secondary text-xs font-semibold" htmlFor="pickup-id">
                      Cédula / RIF
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="pickup-id"
                      maxLength={20}
                      placeholder="Ej. V-19745523"
                      type="text"
                      value={shippingAddress.idNumber}
                      onChange={(e) => setShippingAddress({ idNumber: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-secondary text-xs font-semibold" htmlFor="pickup-phone">
                      Teléfono de Contacto
                    </label>
                    <input
                      required
                      className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                      id="pickup-phone"
                      maxLength={30}
                      placeholder="Ej. 0414-8724205"
                      type="text"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-input-outline bg-surface/50 flex flex-col gap-1.5 rounded-xl border p-4 text-xs">
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

          {/* Ficha 2: Datos de Facturación */}
          <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <PiReceiptFill className="text-xl text-emerald-500" />
              <h2 className="text-primary text-lg font-bold">Facturación</h2>
            </div>

            <label
              className="text-primary flex cursor-pointer items-center gap-2 text-xs font-medium"
              htmlFor="use-shipping-for-billing"
            >
              <input
                checked={billingInfo.useShippingAddress}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                id="use-shipping-for-billing"
                type="checkbox"
                onChange={(e) => setBillingInfo({ useShippingAddress: e.target.checked })}
              />
              Usar la misma información para la facturación
            </label>

            {!billingInfo.useShippingAddress && (
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-secondary text-xs font-semibold" htmlFor="billing-name">
                    Razón Social / Nombre
                  </label>
                  <input
                    required
                    className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                    id="billing-name"
                    maxLength={70}
                    type="text"
                    value={billingInfo.name}
                    onChange={(e) => setBillingInfo({ name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-secondary text-xs font-semibold" htmlFor="billing-id">
                    RIF / Cédula
                  </label>
                  <input
                    required
                    className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                    id="billing-id"
                    maxLength={20}
                    type="text"
                    value={billingInfo.idNumber}
                    onChange={(e) => setBillingInfo({ idNumber: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-secondary text-xs font-semibold" htmlFor="billing-address">
                    Dirección Fiscal
                  </label>
                  <input
                    required
                    className="border-input-outline bg-surface text-primary rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
                    id="billing-address"
                    maxLength={250}
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({ address: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-start">
            <Button className="w-full sm:w-55" size="lg" type="submit" variant="primary">
              Siguiente
            </Button>
          </div>
        </form>
      ) : (
        /* STEP 2: Revisar y Pagar (Layout 2 Columnas Estilo Tesla) */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Columna Izquierda: Lista de Artículos */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-2xl border p-6 shadow-sm">
              <h2 className="text-primary border-b border-zinc-100 pb-3 text-xl font-bold dark:border-zinc-800/50">
                Paso 2 de 2 — Revisar y pagar
              </h2>

              <div className="flex flex-col gap-6">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-center gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800/30"
                  >
                    <Image
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover"
                      height={80}
                      src={getImageUrl(item.image)}
                      width={80}
                    />
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-primary text-sm font-bold">{item.name}</span>
                      <span className="text-secondary text-xs opacity-75">Maceta {item.size}</span>
                      <span className="text-secondary text-xs">Cantidad: {item.quantity}</span>
                    </div>
                    <div className="min-w-30 text-right">
                      <span className="text-primary text-sm font-bold whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen del Pedido y Métodos de Pago */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-2xl border p-6 shadow-md">
              <h2 className="text-primary border-b border-zinc-100 pb-3 text-lg font-bold dark:border-zinc-800/50">
                Resumen del pedido ({itemsInCart} {itemsInCart === 1 ? 'artículo' : 'artículos'})
              </h2>

              {/* Ficha Resumen de Envío con [Editar] */}
              <div className="flex flex-col gap-1 border-b border-zinc-100 pb-4 text-xs dark:border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-secondary text-[11px] font-bold tracking-wider uppercase">
                    {deliveryType === 'PICKUP' ? 'Retiro en Sede' : 'Dirección de envío'}
                  </span>
                  <button
                    className="font-bold text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400"
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
                    ? 'Sede Principal - Puerto Ordaz, Ciudad Guayana'
                    : `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}`}
                </span>
                <span className="text-secondary">Tel: {shippingAddress.phone}</span>
              </div>

              {/* Ficha Resumen de Facturación con [Editar] */}
              <div className="flex flex-col gap-1 border-b border-zinc-100 pb-4 text-xs dark:border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-secondary text-[11px] font-bold tracking-wider uppercase">
                    Dirección de facturación
                  </span>
                  <button
                    className="font-bold text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400"
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

              {/* Método de Pago */}
              <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/50">
                <span className="text-secondary text-[11px] font-bold tracking-wider uppercase">
                  Método de Pago
                </span>
                <div className="flex flex-col gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <div
                      key={method.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                        paymentMethod === method.id
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'bg-surface/50 border-input-outline hover:bg-hover-overlay'
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <input
                        checked={paymentMethod === method.id}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        id={`payment-method-${method.id}`}
                        name="paymentMethod"
                        type="radio"
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      <label
                        className="flex cursor-pointer flex-col"
                        htmlFor={`payment-method-${method.id}`}
                      >
                        <span className="text-primary text-xs font-bold">{method.label}</span>
                        <span className="text-secondary text-[10px] opacity-70">
                          {method.description}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose Financiero */}
              <div className="flex flex-col gap-2 text-xs">
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
                <div className="text-primary flex items-center justify-between border-t border-zinc-100 pt-2 text-base font-bold dark:border-zinc-800/50">
                  <span>Total adeudado</span>
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

              <Button disabled={isPending} size="lg" variant="primary" onClick={handleConfirmOrder}>
                {isPending ? 'Procesando Pedido...' : 'Hacer pedido y pagar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
