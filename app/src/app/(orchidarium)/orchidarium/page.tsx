import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { OrchidariumView } from './ui'

import { auth } from '@/lib/server'

export const metadata: Metadata = {
  title: 'Floraciones',
  description:
    'Supervisión centralizada y conclusión de eventos de floración activa en todos los ejemplares del orquideario.',
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
