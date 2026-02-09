'use client'

import * as z from 'zod'
import clsx from 'clsx'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { IoAlertOutline } from 'react-icons/io5'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useSearchParams, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'

import { verifyEmailInDb } from '@/actions'
import { Backdrop } from '@/components'
import { authClient } from '@/lib/auth-client'

const loginSchema = z.object({
  email: z.string().email('No es un correo electrónico válido').min(1, 'Rellene este campo'),
  password: z
    .string({ required_error: 'No es un formato de contraseña válida' })
    .min(8, 'Ingrese al menos 8 caracteres'),
})

type FormInputs = z.infer<typeof loginSchema>

export function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  // Estados para validar el email (paso 1)
  const [loginStep, setLoginStep] = useState<'email' | 'password'>('email')
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  // Estado para autenticar (paso 2)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    clearErrors,
    control,
    handleSubmit,
    register,
    setError,
    setFocus,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(loginSchema),
  })

  // Monitoreamos ambos campos para validar botones
  const emailValue = useWatch({ control, name: 'email' })
  const passwordValue = useWatch({ control, name: 'password' })

  // Paso 2 -> Paso 1 con errores
  const handleGoBackToEmail = () => {
    setLoginStep('email')
    setErrorMessage(null)
    setValue('password', '')
  }

  // Paso 1: Validamos que el correo sea de un usuario de PristinoPlant
  const handleNextStep = async () => {
    clearErrors('email')

    // Validación de formato (Zod)
    const isFormatValid = await trigger('email')

    if (!isFormatValid) return

    // Validación de Base de Datos (Server Action - Opcional, pero mantiene UX)
    setIsCheckingEmail(true)

    try {
      const { ok, message } = await verifyEmailInDb(emailValue)

      if (ok) {
        setLoginStep('password')
        // Pequeño timeout para dar foco
        setTimeout(() => setFocus('password'), 100)
      } else {
        setError('email', { type: 'manual', message: message })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      setError('email', { type: 'manual', message: 'Error verificando correo' })
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Paso 2: Procesamos el submit del formulario
  const onSubmit = async (data: FormInputs) => {
    setIsPending(true)
    setErrorMessage(null)

    // Better Auth SDK: Inicio de sesión directo desde el cliente
    // Esto maneja cookies, sesiones y CSRF automáticamente
    await authClient.signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: callbackUrl,
      fetchOptions: {
        onSuccess: () => {
          setIsSuccess(true)
          router.push(callbackUrl)
        },
        onError: (ctx) => {
          const fallbackError =
            'No podemos identificar esta combinación de correo electrónico y contraseña'

          setErrorMessage(ctx.error.message || fallbackError)
          setIsPending(false)
          setValue('password', '')
          setFocus('password')
        },
      },
    })
  }

  // Login con Google
  const handleGoogleLogin = async () => {
    // Better Auth SDK: Inicio de sesión social (Google)
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: callbackUrl,
    })
  }

  // Permite usar ENTER para avanzar del Paso 1 al 2
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && loginStep === 'email') {
      e.preventDefault()
      handleNextStep()
    }
  }

  // Estado visual de carga (para el Backdrop)
  const isAuthenticating = isPending || isSuccess || isCheckingEmail
  const loadingText = isSuccess ? 'Redirigiendo' : isCheckingEmail ? 'Verificando' : 'Autenticando'

  return (
    <>
      {/* Backdrop de Carga Full Screen */}
      <Backdrop visible={isAuthenticating}>
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="text-primary h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <span className="text-primary text-lg font-medium tracking-wide">{loadingText}</span>
        </div>
      </Backdrop>

      <div className="tds-sm:mt-14 mt-0 flex w-full flex-col items-center justify-center px-5 py-4">
        {/* Título */}
        <div className="mt-2.5 mb-2 flex w-full max-w-[340px] items-start justify-start">
          <h1 className="text-primary tds-sm:text-3xl tds-sm:leading-11 text-2xl leading-8 font-semibold">
            {loginStep === 'email' ? 'Ingresar' : 'Iniciar sesión'}
          </h1>
        </div>

        {/* Error Message (Paso 2) */}
        {errorMessage && loginStep === 'password' && (
          <div className="bg-input fade-in my-2 flex w-full max-w-[340px] items-start rounded">
            <span className="my-4 mr-0 ml-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400">
              <IoAlertOutline className="h-4 w-4 text-white" />
            </span>
            <span className="text-secondary ml-1 grow pt-4.5 pr-6 pb-4 pl-[5px] font-medium">
              {errorMessage}
            </span>
          </div>
        )}

        {/* Label del usuario VALIDADO (Paso 2) */}
        <div
          className={clsx(
            loginStep === 'password' ? 'fade-in block w-full max-w-[340px] py-2' : 'hidden',
          )}
        >
          <div className="mt-2 flex w-full items-center justify-between leading-6 font-semibold">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="truncate pr-4 tracking-wide">{emailValue}</span>
            </div>

            <button className="underline-secondary" type="button" onClick={handleGoBackToEmail}>
              Cambiar
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[340px]">
          <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
            {/* ------------ Paso 1: Email ------------ */}
            <div className={clsx(loginStep === 'email' ? 'fade-in block py-4' : 'hidden')}>
              <label className="text-label text-sm font-semibold" htmlFor="email">
                Correo electrónico
              </label>

              <input
                required
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
                className={clsx(
                  'focus-input-form',
                  errors.email && [
                    'outline -outline-offset-1',
                    'outline-red-800/75',
                    'dark:outline-red-400/75',
                    'transition-colors duration-300 ease-in-out',
                  ],
                )}
                disabled={isCheckingEmail}
                id="email"
                type="email"
                onKeyDown={handleKeyDown}
                {...register('email')}
              />

              <div className="mt-2">
                {errors.email && (
                  <span
                    className="fade-in mt-1 text-xs font-medium tracking-wide text-red-800/75 dark:text-red-400/75"
                    id="email-error"
                  >
                    {errors.email.message}
                  </span>
                )}
              </div>
            </div>

            {/* ------------ Paso 2: Password ------------ */}
            <div className={clsx(loginStep === 'password' ? 'fade-in block py-4' : 'hidden')}>
              <label className="text-secondary font-semibold" htmlFor="password">
                Contraseña
              </label>

              <input
                aria-describedby={errors.password ? 'password-error' : undefined}
                autoComplete="current-password"
                className={clsx(
                  'focus-input-form',
                  errors.password && [
                    'outline -outline-offset-1',
                    'outline-red-800/75',
                    'dark:outline-red-400/75',
                    'transition-colors duration-300 ease-in-out',
                  ],
                )}
                id="password"
                required={loginStep === 'password'}
                type="password"
                {...register('password')}
              />
              <div className="mt-2">
                {errors.password && (
                  <span
                    className="fade-in mt-1 text-xs font-medium tracking-wide text-red-800/75 dark:text-red-400/75"
                    id="password-error"
                  >
                    {errors.password.message}
                  </span>
                )}
              </div>
            </div>

            {/* ------------ Submit Button ------------ */}
            {loginStep === 'email' ? (
              /* Paso 1: Verificar email en la DB */
              <button
                className={clsx('btn-primary my-2', {
                  'cursor-wait opacity-70': isCheckingEmail,
                  'cursor-not-allowed opacity-70': !emailValue,
                })}
                disabled={!emailValue || isCheckingEmail}
                type="button"
                onClick={handleNextStep}
              >
                Siguiente
              </button>
            ) : (
              /* Paso 2: Iniciar Sesión */
              <button
                className={clsx('btn-primary my-2', {
                  'cursor-wait opacity-70': isPending,
                  'cursor-not-allowed opacity-70': !passwordValue,
                })}
                disabled={isPending || !passwordValue}
                type="submit"
              >
                Ingresar
              </button>
            )}
          </form>

          {/* ------------ (Solo visible en paso 2) ------------ */}
          {loginStep === 'password' && (
            <div className="mt-4 text-center">
              <Link
                className="underline-secondary"
                href="#" // "/auth/forgot-password"
              >
                ¿Olvidaste la contraseña?
              </Link>
            </div>
          )}

          {/* ------------ (Solo visible en paso 1) ------------ */}
          {loginStep === 'email' && (
            <div className="fade-in">
              {/* Divisor -------------- */}
              <div className="relative my-6">
                <div className="inset-0 flex items-center">
                  <div className="border-input-outline w-full border-t" />
                </div>
              </div>

              {/* Google Button */}
              <button className="btn-border-none" type="button" onClick={handleGoogleLogin}>
                <FcGoogle className="text-secondary h-5 w-5" />
                Continúa con Google
              </button>

              {/* New to PristinoPlant? */}
              <div className="text-secondary mt-4 flex w-full max-w-[340px] flex-col items-center justify-center gap-2 p-4 text-center font-medium">
                <span>¿Eres nuevo en PristinoPlant? </span>

                <Link
                  className="underline-link"
                  href={
                    callbackUrl !== '/'
                      ? `/auth/new-account?callbackUrl=${encodeURIComponent(callbackUrl)}`
                      : '/auth/new-account'
                  }
                >
                  Crear una cuenta
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
