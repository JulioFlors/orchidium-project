'use client'

import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { QuantityDropdown, buttonVariants } from '@/components'
import { getImageUrl, useFormatPrice } from '@/lib'
import { useCartStore } from '@/store'

export function CartView() {
  const { cart, updateProductQuantity, removeProduct, getSummaryInformation } = useCartStore()
  const { format: formatPrice, rate } = useFormatPrice()

  const { subTotal, itemsInCart } = getSummaryInformation()

  return (
    <div className="tds-sm:-mx-9 tds-xl:-mx-12 -mx-6">
      <div className="tds-lg:max-w-300 tds-sm:px-9 tds-xl:px-12 mx-auto flex w-full max-w-150 px-6">
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
                <p className="tds-lg:text-start tds-lg:text-[19px] my-auto max-w-[75ch] text-center text-[16px] leading-5 font-medium tracking-wide">
                  Su carrito está vacío.
                </p>
              </div>

              <Link
                className={buttonVariants({
                  variant: 'primary',
                  className:
                    'tds-lg:justify-center tds-lg:w-[320px] tds-lg:mr-6 mt-6 w-full justify-items-start',
                })}
                href="/category/plants"
              >
                Continúa comprando
              </Link>
            </div>
          ) : (
            // ---- Carrito ---- //
            <div className="tds-lg:grid-cols-2 tds-sm:-mt-6 tds-sm:mb-6 mt-0 mb-0 -ml-6 grid grid-cols-1 gap-8">
              {/* ---- Lista de Ítems ---- */}
              <div className="tds-sm:pt-6 flex w-full min-w-28 flex-1 flex-col pt-0 pl-6">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="tds-sm:mt-0 tds-lg:max-w-136.5 mt-6 border-b border-border/40 pb-6"
                  >
                    <div className="tds-lg:mt-6 relative mt-0 flex flex-1">
                      <div className="flex w-full flex-row flex-nowrap items-start justify-between">
                        {/* Imagen R2 */}
                        <div className="tds-sm:pt-6 max-h-28.5 max-w-22.5 shrink-0 pt-0">
                          <Link
                            aria-label={`Ver detalles de ${item.name}`}
                            href={`/product/${item.slug}`}
                          >
                            <Image
                              alt={item.name}
                              className="tds-lg:h-22.5 tds-lg:w-22.5 tds-lg:min-w-22.5 tds-lg:mb-0 mb-1.25 aspect-square h-20 w-20 min-w-20 rounded object-cover"
                              height={80}
                              src={getImageUrl(item.image)}
                              width={80}
                            />
                          </Link>
                        </div>

                        {/* Detalles */}
                        <div className="tds-sm:pt-6 flex-1 pt-0 pl-4">
                          <Link
                            href={`/product/${item.slug}`}
                            id={`${item.slug}__link`}
                            tabIndex={-1}
                          >
                            <p className="max-w-[75ch] font-semibold tracking-wide text-primary">
                              {item.name}
                            </p>
                          </Link>

                          <p className="max-w-[75ch] pt-0.75 text-sm text-secondary">
                            Tamaño: {item.size}
                          </p>

                          <div className="flex items-center gap-3 pt-2">
                            <QuantityDropdown
                              maxQuantity={item.maxStock}
                              quantity={item.quantity}
                              onQuantityChanged={(newQty) =>
                                updateProductQuantity(item.variantId, newQty)
                              }
                            />
                            <button
                              className="text-xs text-red-500 hover:underline cursor-pointer"
                              type="button"
                              onClick={() => removeProduct(item.variantId)}
                            >
                              Quitar
                            </button>
                          </div>
                        </div>

                        {/* Precio con espacio holgado */}
                        <div className="lineitem__price pl-4 text-right min-w-[110px] shrink-0">
                          <p className="font-semibold tracking-wide whitespace-nowrap text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-secondary whitespace-nowrap">
                              c/u {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ---- Resumen del Pedido ---- */}
              <div className="tds-sm:pt-6 flex-1 pt-0 pl-6">
                <div className="order-summary bg-surface p-6 rounded-lg border border-border/50 shadow-sm">
                  <h2 className="text-primary tds-sm:text-xl tds-sm:leading-7 pt-0 pb-4 text-[17px] leading-5 font-semibold tracking-tighter transition-all duration-300 ease-in-out border-b border-border/40">
                    Resumen del pedido
                  </h2>

                  <div className="my-4 flex flex-col gap-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Envío</span>
                      <span className="text-right font-medium">Cobro a destino</span>
                    </div>

                    <div className="text-primary tds-sm:text-xl tds-sm:leading-7 flex items-center justify-between py-2 text-[17px] leading-5 font-semibold tracking-tighter transition-all duration-300 ease-in-out border-t border-border/30 pt-4">
                      <h2>Subtotal</h2>
                      <h2 className="whitespace-nowrap" translate="no">
                        {formatPrice(subTotal)}
                      </h2>
                    </div>

                    {rate && rate > 0 && (
                      <div className="text-xs text-secondary bg-surface-hover/50 p-2.5 rounded border border-border/20">
                        <span className="font-medium">Tasa referencial BCV:</span> Bs.{' '}
                        {rate.toFixed(2)} / USD
                      </div>
                    )}
                  </div>

                  {/* ---- Botón Checkout ---- */}
                  <div className="checkout-button pt-2">
                    <div className="flex w-full justify-center">
                      <Link
                        className={buttonVariants({
                          variant: 'primary',
                          className:
                            'tds-lg:max-w-none w-full max-w-125 justify-center align-middle tracking-wide py-3',
                        })}
                        href="/checkout"
                      >
                        Continuar al Checkout
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
