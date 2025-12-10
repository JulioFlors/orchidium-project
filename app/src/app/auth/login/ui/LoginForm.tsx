'use client'

import { IoInformationOutline } from 'react-icons/io5'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { authenticate } from '@/actions'

const loginSchema = z.object({
  email: z.email('Email no válido').min(1, 'El email es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type FormInputs = z.infer<typeof loginSchema>

export function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (errorMessage === 'success') {
      window.location.replace('/')
    }
  }, [errorMessage])

  const onSubmit = async (data: FormInputs) => {
    setIsPending(true)
    setErrorMessage('')

    const formData = new FormData()

    formData.append('email', data.email)
    formData.append('password', data.password)

    const authResult = await authenticate(undefined, formData)

    if (authResult !== 'success') {
      setErrorMessage(authResult as string)
    } else {
      setErrorMessage('success')
    }
    setIsPending(false)
  }

  return (
    <form className="mx-auto flex max-w-md flex-col" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="email">Correo electrónico</label>
      <input
        autoComplete="email"
        className={clsx('mb-5 rounded border bg-gray-200 px-5 py-2', {
          'border-red-500': errors.email,
        })}
        {...register('email')}
        type="email"
      />
      {errors.email && <p className="text-red-500">{errors.email.message}</p>}

      <label htmlFor="password">Contraseña</label>
      <input
        className={clsx('mb-5 rounded border bg-gray-200 px-5 py-2', {
          'border-red-500': errors.password,
        })}
        {...register('password')}
        type="password"
      />
      {errors.password && <p className="text-red-500">{errors.password.message}</p>}

      <input name="redirectTo" type="hidden" value={callbackUrl} />
      <button
        aria-disabled={isPending}
        className={clsx({
          'btn-primary': !isPending,
          'btn-disabled': isPending,
        })}
        type="submit"
      >
        Ingresar
      </button>

      <div aria-atomic="true" aria-live="polite" className="flex h-8 items-end space-x-1">
        {errorMessage && errorMessage !== 'success' && (
          <div className="mb-2 flex flex-row">
            <IoInformationOutline className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* divisor l ine */}
      <div className="my-5 flex items-center">
        <div className="flex-1 border-t border-gray-500" />
        <div className="px-2 text-gray-800">O</div>
        <div className="flex-1 border-t border-gray-500" />
      </div>

      <Link className="btn-secondary text-center" href="/auth/new-account">
        Crear una nueva cuenta
      </Link>
    </form>
  )
}
