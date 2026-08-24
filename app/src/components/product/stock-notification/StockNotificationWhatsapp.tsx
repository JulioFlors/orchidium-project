'use client'

import type { PotSize, ProductVariant } from '@/interfaces'

import { useState, FormEvent, MouseEvent } from 'react'
import { clsx } from 'clsx'
import Link from 'next/link'

import { Button } from '@/components'
import { Logger } from '@/lib'
import { requestStockNotification } from '@/actions'
import { PotSizeLabels, PotSizeDimensions, sortVariantsByPotSizeAsc } from '@/config'

interface Props {
  productName: string
  speciesId?: string
  variantId?: string
  size?: PotSize
  variants?: ProductVariant[]
  selectedVariant?: ProductVariant
  onVariantChange?: (variant: ProductVariant) => void
}

export function StockNotificationWhatsapp({
  productName,
  speciesId,
  variantId,
  size,
  variants,
  selectedVariant,
  onVariantChange,
}: Props) {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [userName, setUserName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [userSelectedVariantId, setUserSelectedVariantId] = useState<string | null>(null)

  const [userNameError, setUserNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [variantError, setVariantError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const hasVariants = Boolean(variants && variants.length > 0)
  const sortedVariants = variants ? sortVariantsByPotSizeAsc(variants) : []

  const activeVariantId =
    userSelectedVariantId ??
    selectedVariant?.id ??
    variantId ??
    (variants && variants.length === 1 ? variants[0].id : undefined)

  const activeVariant =
    variants?.find((v) => v.id === activeVariantId) ||
    selectedVariant ||
    (variants?.length === 1 ? variants[0] : undefined)

  const handleShowForm = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsFormVisible(true)
    setSubmitSuccess(false)
    setSubmitError(null)
  }

  const handleVariantSelect = (variant: ProductVariant) => {
    setUserSelectedVariantId(variant.id)
    setVariantError(null)
    onVariantChange?.(variant)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let isValid = true

    setUserNameError(null)
    setPhoneError(null)
    setVariantError(null)
    setSubmitError(null)

    if (hasVariants && !activeVariantId) {
      setVariantError('Es necesario seleccionar el tamaño de la planta')
      isValid = false
    }

    if (!userName.trim()) {
      setUserNameError('Se necesita un nombre')
      isValid = false
    }
    if (!phoneNumber.trim()) {
      setPhoneError('Se necesita un número de WhatsApp')
      isValid = false
    } else if (!/^\+?[0-9\s-()]{7,20}$/.test(phoneNumber)) {
      setPhoneError('Introduzca un número de WhatsApp válido (ej: +584141234567)')
      isValid = false
    }

    if (!isValid) {
      return
    }

    setIsSubmitting(true)

    const finalVariant = variants?.find((v) => v.id === activeVariantId)
    const finalVariantId = finalVariant?.id || variantId
    const finalSize = finalVariant?.size || size

    Logger.info('[SNAT] Enviando datos de solicitud de notificación de stock:', {
      userName,
      phoneNumber,
      productName,
      speciesId,
      variantId: finalVariantId,
      size: finalSize,
    })

    if (!speciesId) {
      // Fallback si no viene speciesId
      setSubmitError('Ocurrió un inconveniente con la especie seleccionada.')
      setIsSubmitting(false)

      return
    }

    const res = await requestStockNotification({
      userName,
      phoneNumber,
      speciesId,
      variantId: finalVariantId,
      size: finalSize,
    })

    if (res.ok) {
      setSubmitSuccess(true)
      setIsFormVisible(false)
    } else {
      setSubmitError(res.error || 'Hubo un problema al registrar tu notificación.')
      setSubmitSuccess(false)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="mt-3">
      {/* Contenedor principal */}
      <h3 className="text-primary mb-3 font-semibold tracking-wide">
        No hay stock disponible actualmente
      </h3>

      {/* Si el envío fue exitoso, muestra el mensaje de éxito */}
      {submitSuccess && (
        <span className="text-action font-medium">
          Le enviaremos un WhatsApp cuando vuelva a haber existencias de la planta.
        </span>
      )}

      {/* Si el formulario no es visible Y el envío no ha sido exitoso, muestra el botón para abrir el formulario */}
      {!isFormVisible && !submitSuccess && (
        <Link className="underline-link" href="#" role="button" onClick={handleShowForm}>
          Deseo recibir un WhatsApp cuando haya existencias de esta planta
        </Link>
      )}

      {/* Si el formulario es visible (y por ende, submitSuccess es false o irrelevante aquí), muestra el formulario */}
      {isFormVisible && (
        <form onSubmit={handleSubmit}>
          {hasVariants && (
            <div className="mb-4">
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-secondary font-semibold" htmlFor="whatsapp-notif-variant">
                  Maceta
                </label>
                {activeVariant && (
                  <span className="text-secondary fade-in text-xs font-semibold">
                    {PotSizeDimensions[activeVariant.size]}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2" id="whatsapp-notif-variant">
                {sortedVariants.map((variant) => {
                  const isSelected = activeVariant?.id === variant.id

                  return (
                    <button
                      key={variant.id}
                      className={clsx('pot-size-btn pot-size-available', {
                        'is-selected': isSelected,
                        'ring-1 ring-rose-700': variantError && !isSelected,
                      })}
                      type="button"
                      onClick={() => handleVariantSelect(variant)}
                    >
                      {PotSizeLabels[variant.size]}
                    </button>
                  )
                })}
              </div>

              {variantError && (
                <p
                  aria-live="polite"
                  className={clsx(
                    'mt-2 mb-0 text-xs leading-5 font-medium text-rose-700',
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    {
                      'max-h-10 opacity-100': variantError,
                      'max-h-0 opacity-0': !variantError,
                    },
                  )}
                  id="variant-error-whatsapp"
                >
                  {variantError}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-secondary font-semibold" htmlFor="whatsapp-notif-name">
              Nombre
            </label>

            <input
              aria-describedby={userNameError ? 'name-error-whatsapp' : undefined}
              className={clsx('focus-input mt-2', {
                // SI hay error
                'ring-1 ring-rose-700': userNameError,
              })}
              id="whatsapp-notif-name"
              name="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />

            {userNameError && (
              <p
                aria-live="polite"
                className={clsx(
                  // Clases base para el estilo del texto del error
                  'mt-2 mb-0 text-xs leading-5 font-medium text-rose-700',
                  // Clases para la transición
                  'overflow-hidden transition-all duration-300 ease-in-out', // overflow-hidden es importante con max-height
                  // Clases condicionales para mostrar u ocultar
                  {
                    'max-h-10 opacity-100': userNameError, // Estado visible: opacidad completa, altura suficiente
                    // Ajusta max-h-10 (40px) si tu mensaje puede ser más alto
                    'max-h-0 opacity-0': !userNameError, // Estado oculto: transparente y altura cero
                  },
                )}
                id="name-error-whatsapp"
              >
                {userNameError ? userNameError : <> </>}
              </p>
            )}
          </div>

          <div>
            <label
              className="text-secondary mt-3 block font-semibold"
              htmlFor="whatsapp-notif-phone"
            >
              WhatsApp
            </label>

            <input
              aria-describedby={phoneError ? 'phone-error-whatsapp' : undefined}
              className={clsx('focus-input mt-2', {
                'ring-1 ring-rose-700': phoneError,
                'mb-2': !phoneError,
              })}
              id="whatsapp-notif-phone"
              name="phoneNumber"
              placeholder="+58 414 1234567"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            {phoneError && (
              <p
                aria-live="polite"
                className={clsx(
                  // Clases base para el estilo del texto del error
                  'mt-2 mb-0 text-xs leading-5 font-medium text-rose-700',
                  // Clases para la transición
                  'overflow-hidden transition-all duration-300 ease-in-out', // overflow-hidden es importante con max-height
                  // Clases condicionales para mostrar u ocultar
                  {
                    'max-h-10 opacity-100': phoneError, // Estado visible: opacidad completa, altura suficiente
                    // Ajusta max-h-10 (40px) si tu mensaje puede ser más alto
                    'max-h-0 opacity-0': !phoneError, // Estado oculto: transparente y altura cero
                  },
                )}
                id="phone-error-whatsapp"
              >
                {phoneError ? phoneError : <> </>}
              </p>
            )}
          </div>

          {submitError &&
            !submitSuccess && ( // Solo muestra el error del formulario si no hubo éxito
              <p className="mt-2 mb-0 leading-5 font-medium text-rose-700" id="submit-error">
                {submitError}
              </p>
            )}

          <Button
            className="mt-4 w-full"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Enviando...' : 'Notifíquenme'}
          </Button>
        </form>
      )}
    </div>
  )
}
