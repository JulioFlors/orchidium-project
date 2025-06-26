'use client'

import { clsx } from 'clsx'
import Link from 'next/link'
import { useState, FormEvent, MouseEvent } from 'react'
// Importar tu Server Action cuando esté lista
// import { requestStockNotificationWhatsapp } from '@/actions/notify-stock';

interface Props {
  productName: string
}

export function StockNotificationWhatsapp({ productName }: Props) {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [userName, setUserName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [userNameError, setUserNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false) // Este estado indicará si mostrar el mensaje de éxito
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleShowForm = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsFormVisible(true)
    setSubmitSuccess(false) // Resetea el mensaje de éxito si el usuario vuelve a abrir el formulario
    setSubmitError(null) // Resetea cualquier error anterior
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let isValid = true

    setUserNameError(null)
    setPhoneError(null)
    setSubmitError(null)

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

    // --- SIMULACIÓN DE LLAMADA AL BACKEND ---
    // eslint-disable-next-line no-console
    console.log('Enviando datos para notificación por WhatsApp:', {
      userName,
      phoneNumber,
      productName,
    })
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const wasSuccessful = Math.random() > 0.3 // Simular éxito

    if (wasSuccessful) {
      setSubmitSuccess(true) // Indica que el envío fue exitoso
      setIsFormVisible(false) // Oculta el formulario
      // Los campos se mantendrán, pero el formulario no será visible.
      // Si quisieras resetearlos por si el usuario vuelve a interactuar de alguna forma:
      // setUserName('');
      // setPhoneNumber('');
    } else {
      setSubmitError(
        'Hubo un problema al registrar tu notificación. Por favor, inténtalo más tarde.',
      )
      setSubmitSuccess(false) // Asegúrate de que el éxito esté en false
    }
    // --- FIN DE SIMULACIÓN ---

    setIsSubmitting(false)
  }

  return (
    <div className="mt-3">
      {/* Contenedor principal */}
      <h3 className="text-primary -tracking-2 mb-3 font-semibold">
        Este artículo no está disponible
      </h3>

      {/* Si el envío fue exitoso, muestra el mensaje de éxito */}
      {submitSuccess && (
        <span className="text-blue-tesla font-medium">
          Le enviaremos un WhatsApp cuando vuelva a haber existencias del artículo.
        </span>
      )}

      {/* Si el formulario no es visible Y el envío no ha sido exitoso, muestra el botón para abrir el formulario */}
      {!isFormVisible && !submitSuccess && (
        <Link className="underline-link" href="#" role="button" onClick={handleShowForm}>
          Deseo recibir un WhatsApp cuando haya existencias de este artículo
        </Link>
      )}

      {/* Si el formulario es visible (y por ende, submitSuccess es false o irrelevante aquí), muestra el formulario */}
      {isFormVisible && (
        <form onSubmit={handleSubmit}>
          <div>
            <label className="text-secondary-404 font-semibold" htmlFor="whatsapp-notif-name">
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
              className="text-secondary-404 mt-3 block font-semibold"
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

          <button
            className="btn-primary mt-4 w-full justify-center py-2 font-semibold"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Enviando...' : 'Notifíquenme'}
          </button>
        </form>
      )}
    </div>
  )
}
