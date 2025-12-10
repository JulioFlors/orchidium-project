import type { Metadata } from 'next'

import { RegisterForm } from './ui/RegisterForm'

import { titleFont } from '@/config/fonts'

export const metadata: Metadata = {
  title: 'PristinoPlant | Crear Cuenta',
  description: 'Crea tu cuenta de PristinoPlant y empieza a construir tu colección de plantas.',
}

export default function NewAccountPage() {
  return (
    <div className="flex min-h-screen flex-col pt-32 sm:pt-52">
      <h1 className={`${titleFont.className} mb-5 text-4xl font-bold`}>Nueva cuenta</h1>

      <RegisterForm />
    </div>
  )
}
