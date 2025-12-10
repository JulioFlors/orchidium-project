import type { Metadata } from 'next'

import { Suspense } from 'react'

import { LoginForm } from './ui/LoginForm'

import { titleFont } from '@/config/fonts'

export const metadata: Metadata = {
  title: 'PristinoPlant | Iniciar Sesión',
  description: 'Ingresa a tu cuenta de PristinoPlant y sigue aumentando tu colección de plantas.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center">
      <div className="tds-xl:px-8 mx-auto flex w-full max-w-132.5 shrink-0 grow flex-col items-start px-6 py-4">
        <div className="mx-auto max-w-83 py-4">
          <h1
            className={`${titleFont.className} tracking-6 text-primary mb-5 pt-2.5 pb-2 text-left text-[28px] leading-9 font-bold antialiased`}
          >
            iniciar sesión
          </h1>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
