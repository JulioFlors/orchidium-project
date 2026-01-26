import type { Metadata } from 'next'

import { RegisterForm } from './ui/RegisterForm'

export const metadata: Metadata = {
  title: 'Crear Cuenta',
  description: 'Crea tu cuenta de PristinoPlant y empieza a construir tu colección de plantas.',
}

export default function NewAccountPage() {
  return <RegisterForm />
}
