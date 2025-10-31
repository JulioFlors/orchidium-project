'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'
import { initialData } from '@service/seeding'

import { QuantityDropdown } from '@/components'

const productsInCart = [
  initialData.species[3],
  initialData.species[4],
  initialData.species[5],
  initialData.species[13],
  initialData.species[15],
  initialData.species[11],
  initialData.species[10],
  initialData.species[6],
  initialData.species[12],
]

export default function CartPage() {
  const [quantity, setQuantity] = useState<number>(1)

  // Todo -> Usando la data del seed por ahora
  const itemsInCart = productsInCart.length

  // ---- Formatear el precio con coma decimal y símbolo de moneda ---- //
  const formatPrice = (price: number) => {
    const formattedNumber = new Intl.NumberFormat('es-VE', {
      style: 'decimal',
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(price)

    // Añade manualmente el símbolo '$' al principio
    return `$${formattedNumber}`
  }

  // ---- Renderizado del carrito con items ---- //
  return (
    <div className="tds-sm:-mx-9 tds-xl:-mx-12 -mx-6">
      <div className="tds-lg:max-w-[1200px] tds-sm:px-9 tds-xl:px-12 mx-auto flex w-full max-w-[600px] px-6">
        <div className="flex w-full flex-col">
          {/* ---- Titulo de la pagina ---- */}
          <h2
            aria-labelledby="cart-header"
            className={clsx('cart-header', { 'border-none': itemsInCart === 0 })}
            id="#main-content"
          >
            Carrito
          </h2>

          {/* ---- CART EMPTY STATE ---- */}
          {itemsInCart === 0 ? (
            <div className="tds-lg:mt-11 tds-xl:px-12 mt-[22%] w-full px-0 sm:px-9">
              <div>
                <p className="tds-lg:text-start -tracking-1 tds-lg:text-[19px] my-auto max-w-[75ch] text-center text-[16px] leading-5 font-medium">
                  Su carrito está vacío.
                </p>
              </div>

              <Link
                className="btn-primary tds-lg:justify-center tds-lg:w-[320px] tds-lg:mr-6 mt-6 inline-block w-full justify-items-start"
                href="/category/plants"
              >
                Continúa comprando
              </Link>

              <Link
                className="btn-secondary tds-lg:justify-center tds-lg:w-[320px] mt-4 inline-block w-full justify-items-start"
                href="/category/plants"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            // ---- Carrito ---- //
            <div className="tds-lg:grid-cols-2 tds-sm:-mt-6 tds-sm:mb-6 mt-0 mb-0 -ml-6 grid grid-cols-1">
              {/* ---- tds-flex-item  ---- */}
              <div className="tds-sm:pt-6 flex w-full min-w-28 flex-1 flex-col pt-0 pl-6">
                {/* ---- Tag Continúa comprando  ---- */}
                {/* El self-start evitará que el Link se estire a todo lo ancho debido a su padre flex-col */}
                {/* <div className="tds-lg:mb-0 mt-6 mb-8 flex flex-col">
                  <p className="-tracking-2 max-w-[75ch] font-semibold">
                    Le faltan $ 10 de compra para obtener el envío gratuito
                  </p>

                  <Link
                    className="-tracking-2 underline-secondary mt-0.5 self-start"
                    href="/category/plants"
                  >
                    Continúa comprando
                  </Link>
                </div> */}

                {/* ---- lineitems__container ---- */}
                {productsInCart.map((product) => (
                  // ---- lineitem__container-wrapper ---- //
                  <div key={product.slug} className="tds-sm:mt-0 tds-lg:max-w-[546px] mt-6">
                    {/* ---- lineitem__container tds-flex tds-flex-gutters ---- // */}
                    <div className="tds-lg:mt-6 relative mt-0 flex flex-1">
                      {/* ---- lineitem__main-info ---- // */}
                      <div className="flex w-full flex-row flex-nowrap">
                        <div className="tds-sm:pt-6 max-h-[114px] max-w-[90px] shrink-0 pt-0">
                          <Link
                            aria-label={`Ver detalles de ${product.name}`}
                            href={`/product/${product.slug}`}
                          >
                            <Image
                              alt={product.name}
                              className="tds-lg:h-[90px] tds-lg:w-[90px] tds-lg:min-w-[90px] tds-lg:mb-0 mb-[5px] aspect-square h-20 w-20 min-w-20 rounded-xs object-cover"
                              height={80}
                              src={`/plants/${product.images[0]}`}
                              width={80}
                            />
                          </Link>
                        </div>

                        <div className="tds-sm:pt-6 flex-1 pt-0 pl-6">
                          {/* ---- lineitem - Title ---- */}
                          <Link
                            href={`/product/${product.slug}`}
                            id={`${product.slug}__link`}
                            tabIndex={-1} // Evita que reciba focus al navegar con Tab
                          >
                            <p className="-tracking-2 max-w-[75ch] font-semibold">{product.name}</p>
                          </Link>

                          <p className="max-w-[75ch] pt-[3px] tracking-normal">Maceta, P10</p>

                          <div className="flex pt-[3px]">
                            {/* ---- Selector de Cantidad ---- */}
                            <QuantityDropdown quantity={quantity} onQuantityChanged={setQuantity} />
                            <button
                              className="underline-secondary cursor-pointer tracking-normal"
                              type="button"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                        {/* ---- lineitem__price ---- // */}
                        <div className="lineitem__price">
                          <p className="-tracking-2 max-w-[75ch] font-semibold">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ---- tds-flex-item  ---- */}
              <div className="tds-sm:pt-6 flex-1 pt-0 pl-6">
                {/* ---- Order Summary - Resumen del pedido ---- */}
                <div className="order-summary">
                  {/* ---- Order Summary - Title ---- */}
                  <h2 className="tracking-4 text-primary tds-sm:text-xl tds-sm:leading-7 pt-0 pb-2 text-[17px] leading-5 font-semibold transition-all duration-300 ease-in-out">
                    Resumen del pedido
                  </h2>

                  {/* // fixed cart-store by zustand */}
                  {/* <OrderSummary /> */}

                  <div className="mb-6 flex flex-col">
                    <div className="my-2.5 flex justify-between">
                      <span className="">Envío</span>
                      <span className="text-right">Cobro a destino</span>
                    </div>

                    <div className="tracking-4 text-primary tds-sm:text-xl tds-sm:leading-7 flex items-center justify-between py-2 text-[17px] leading-5 font-semibold transition-all duration-300 ease-in-out">
                      <h2>Subtotal</h2>
                      <h2 translate="no">{formatPrice(10)}</h2>
                    </div>

                    <div className="text-tds-grey-30 text-sm">Tasa referencial del BCV</div>
                  </div>

                  {/* ---- Checkout ---- */}
                  <div className="checkout-button">
                    <div className="my-2.5 flex w-full justify-center">
                      <Link
                        className="btn-primary -tracking-2 tds-lg:max-w-none inline-block w-full max-w-125 justify-center align-middle"
                        href="/checkout/address"
                      >
                        Pagar
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
