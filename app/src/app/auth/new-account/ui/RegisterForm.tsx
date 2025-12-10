'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useState, useRef, useEffect } from 'react'

import { login, registerUser } from '@/actions'

type FormInputs = {
  name: string
  email: string
  password: string
}

export function RegisterForm() {
  const [errorMessage, setErrorMessage] = useState('')
  const nameRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>()

  const { ref, ...rest } = register('name', { required: true })

  useEffect(() => {
    // Sólo enfocar si ningún elemento tiene foco (evita robar foco)
    if (nameRef.current && document && document.activeElement === document.body) {
      nameRef.current.focus()
    }
  }, [])

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setErrorMessage('')
    const { name, email, password } = data

    // Server action
    const resp = await registerUser(name, email, password)

    if (!resp.ok) {
      setErrorMessage(resp.message)

      return
    }

    await login(email.toLowerCase(), password)
    window.location.replace('/')
  }

  return (
    <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
      {/* {
        errors.name?.type === 'required' && (
          <span className="text-red-500">* El nombre es obligatorio</span>
        )
      } */}

      <label htmlFor="email">Nombre completo</label>
      <input
        {...rest}
        ref={(e) => {
          ref(e)
          nameRef.current = e
        }}
        className={clsx('mb-5 rounded border bg-gray-200 px-5 py-2', {
          'border-red-500': errors.name,
        })}
        type="text"
      />

      <label htmlFor="email">Correo electrónico</label>
      <input
        className={clsx('mb-5 rounded border bg-gray-200 px-5 py-2', {
          'border-red-500': errors.email,
        })}
        type="email"
        {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
      />

      <label htmlFor="email">Contraseña</label>
      <input
        className={clsx('mb-5 rounded border bg-gray-200 px-5 py-2', {
          'border-red-500': errors.password,
        })}
        type="password"
        {...register('password', { required: true, minLength: 6 })}
      />

      <span className="text-red-500">{errorMessage} </span>

      <button className="btn-primary" type="submit">
        Crear cuenta
      </button>

      {/* divisor l ine */}
      <div className="my-5 flex items-center">
        <div className="flex-1 border-t border-gray-500" />
        <div className="px-2 text-gray-800">O</div>
        <div className="flex-1 border-t border-gray-500" />
      </div>

      <Link className="btn-secondary text-center" href="/auth/login">
        Ingresar
      </Link>
    </form>
  )
}
