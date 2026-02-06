'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  IoChevronDown,
  IoChevronUp,
  IoFlowerOutline,
  IoCartOutline,
  IoRibbonOutline,
} from 'react-icons/io5'
import { LuLoader } from 'react-icons/lu'

import { login, registerUser } from '@/actions'

// --- Types & Data ---

type FormInputs = {
  name: string
  email: string
  password: string
}

// 🌐 Características dirigidas a la tienda de orquídeas y plantas
const features = [
  {
    title: 'Colección Exclusiva',
    icon: <IoFlowerOutline className="h-4 w-4" />,
    desc: 'Acceso prioritario a nuestras orquídeas más raras y rosas del desierto de colección.',
  },
  {
    title: 'Compras Simplificadas',
    icon: <IoCartOutline className="h-4 w-4" />,
    desc: 'Guarda tu carrito de compras y gestiona tus pedidos desde cualquier dispositivo.',
  },
  {
    title: 'Asesoría Experta',
    icon: <IoRibbonOutline className="h-4 w-4" />,
    desc: 'Recibe guías de cuidado personalizadas y soporte directo para el mantenimiento de tus plantas.',
  },
]

// --- Sub-components ---

function FeatureAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="mt-8 space-y-4">
      {features.map((item, idx) => (
        <div
          key={item.title}
          className="group cursor-pointer"
          onClick={() => setOpenIndex(idx === openIndex ? null : idx)}
        >
          <div
            className={clsx(
              'flex items-center gap-3 text-lg font-semibold transition-colors',
              openIndex === idx ? 'text-primary' : 'text-secondary group-hover:text-action',
            )}
          >
            <span
              className={clsx(
                'transition-transform duration-300',
                openIndex === idx ? 'rotate-180' : '',
              )}
            >
              {openIndex === idx ? (
                <IoChevronUp className="h-5 w-5" />
              ) : (
                <IoChevronDown className="h-5 w-5" />
              )}
            </span>
            <span className="flex items-center gap-2">
              {item.icon}
              {item.title}
            </span>
          </div>

          <div
            className={clsx(
              'mt-2 overflow-hidden pl-8 transition-all duration-300 ease-in-out',
              openIndex === idx ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <p className="text-secondary text-sm leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function BackgroundElements() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-60 transition-opacity duration-500 dark:opacity-40">
      {/* Element 1: Large (Desktop XL) */}
      <div className="absolute -top-[5%] left-[5%] hidden h-[500px] w-[500px] animate-pulse rounded-full bg-purple-500/10 blur-3xl xl:block" />

      {/* Element 2: Medium (Desktop & Laptop) */}
      <div className="absolute -right-[5%] -bottom-[10%] hidden h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl lg:block" />

      {/* Element 3: Small (Always visible, central on mobile) */}
      <div className="absolute top-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl lg:top-[20%] lg:left-[40%]" />
    </div>
  )
}

// --- Main Component ---

export function RegisterForm() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('callbackUrl') ?? '/'

  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nameRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    mode: 'onTouched',
  })

  // Focus on name input on mount
  const { ref, ...rest } = register('name', { required: 'El nombre de usuario es obligatorio' })

  useEffect(() => {
    if (nameRef.current && document.activeElement === document.body) {
      nameRef.current.focus()
    }
  }, [])

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setErrorMessage('')
    setIsSubmitting(true)
    const { name, email, password } = data

    const resp = await registerUser(name, email, password)

    if (!resp.ok) {
      setErrorMessage(resp.message)
      setIsSubmitting(false)

      return
    }

    await login(email.toLowerCase(), password)
    window.location.replace(redirectUrl)
  }

  return (
    <div className="text-primary relative flex min-h-screen flex-col overflow-hidden font-sans lg:flex-row">
      {/* Responsive Background */}
      <BackgroundElements />

      {/* LEFT COLUMN: Info & Features (Hidden on small mobile, visible on lg) */}
      <div className="relative z-10 hidden w-full flex-col justify-center p-12 lg:flex lg:w-1/2">
        <div className="mx-auto max-w-md">
          <div className="mb-8">
            <h2 className="text-primary mt-6 text-5xl font-bold tracking-tight">
              Únete a <br />
              <span className="to-action bg-linear-to-r from-green-500 bg-clip-text text-transparent">
                PristinoPlant
              </span>
            </h2>
            <p className="text-secondary mt-4 text-xl font-medium">
              Crea tu cuenta y lleva la pasión por las orquídeas a un nuevo nivel.
            </p>
          </div>

          {/* Accordion */}
          <FeatureAccordion />
        </div>
      </div>

      {/* RIGHT COLUMN: Form */}
      <div className="z-10 flex w-full items-center justify-center p-4 lg:w-1/2">
        <div className="w-full max-w-[450px]">
          <div className="bg-transparent lg:p-8">
            {/* Title aligned with login */}
            <div className="text-primary mt-2.5 mb-8 flex w-full items-start justify-start">
              <h1 className="tds-sm:text-3xl tds-sm:leading-11 text-2xl leading-8 font-semibold">
                Crear una cuenta
              </h1>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Name */}
              <div>
                <label className="text-label text-sm font-semibold" htmlFor="name">
                  Nombre de usuario*
                </label>
                <input
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  autoComplete="name"
                  id="name"
                  placeholder="Ej: orquidea_fan"
                  type="text"
                  {...rest}
                  ref={(e) => {
                    ref(e)
                    nameRef.current = e
                  }}
                  className={clsx(
                    'focus-input-form',
                    errors.name && [
                      'outline -outline-offset-1',
                      'outline-red-800/75',
                      'dark:outline-red-400/75',
                    ],
                  )}
                />
                {errors.name && (
                  <p
                    className="fade-in mt-1 text-xs font-medium tracking-wide text-red-800/75 dark:text-red-400/75"
                    id="name-error"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-label text-sm font-semibold" htmlFor="email">
                  Correo electrónico*
                </label>
                <input
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  autoComplete="email"
                  className={clsx(
                    'focus-input-form',
                    errors.email && [
                      'outline -outline-offset-1',
                      'outline-red-800/75',
                      'dark:outline-red-400/75',
                    ],
                  )}
                  id="email"
                  placeholder="ejemplo@correo.com"
                  type="email"
                  {...register('email', {
                    required: 'El correo es obligatorio',
                    pattern: { value: /^\S+@\S+$/i, message: 'Correo no válido' },
                  })}
                />
                {errors.email && (
                  <p
                    className="fade-in mt-1 text-xs font-medium tracking-wide text-red-800/75 dark:text-red-400/75"
                    id="email-error"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-label text-sm font-semibold" htmlFor="password">
                  Contraseña*
                </label>
                <input
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  autoComplete="new-password"
                  className={clsx(
                    'focus-input-form',
                    errors.password && [
                      'outline -outline-offset-1',
                      'outline-red-800/75',
                      'dark:outline-red-400/75',
                    ],
                  )}
                  id="password"
                  placeholder="Al menos 6 caracteres"
                  type="password"
                  {...register('password', {
                    required: 'Contraseña requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                  })}
                />
                {errors.password && (
                  <p
                    className="fade-in mt-1 text-xs font-medium tracking-wide text-red-800/75 dark:text-red-400/75"
                    id="password-error"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="bg-input fade-in my-2 flex items-start rounded">
                  <p className="text-secondary grow px-6 py-4 font-medium">{errorMessage}</p>
                </div>
              )}

              <button
                className={clsx('btn-primary mt-4', {
                  'cursor-wait opacity-70': isSubmitting,
                })}
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <LuLoader className="animate-spin" /> Creando su cuenta
                  </div>
                ) : (
                  'Registrarse'
                )}
              </button>
            </form>

            <div className="text-secondary mt-6 text-center text-sm font-medium">
              ¿Ya tienes una cuenta?{' '}
              <Link
                className="underline-link"
                href={
                  redirectUrl === '/'
                    ? '/auth/login'
                    : `/auth/login?callbackUrl=${encodeURIComponent(redirectUrl)}`
                }
              >
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
