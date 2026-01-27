import type { Metadata } from 'next'

import { Suspense } from 'react'

import { LoginForm } from './ui/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Ingresa a tu cuenta de PristinoPlant y sigue aumentando tu colección de plantas.',
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-start justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
