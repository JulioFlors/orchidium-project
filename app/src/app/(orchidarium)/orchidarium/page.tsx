import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { OrchidariumView } from './ui'

import { auth } from '@/lib/server'

export const metadata: Metadata = {
  title: 'Orquideario Inteligente',
  description:
    'Sistema de gestión automatizado, control de inventario y optimización biológica para el cultivo de orquídeas de PristinoPlant.',
}

export default async function OrchidariumDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/orchidarium')
  }

  return <OrchidariumView />
}
