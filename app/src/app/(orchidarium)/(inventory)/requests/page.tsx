import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { StockRequestsView } from './ui/StockRequestsView'

import { auth } from '@/lib/server'

export const metadata: Metadata = {
  title: 'Solicitudes de Stock',
}

export default async function StockRequestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/requests')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const adminName = session.user.name || 'Administrador'

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StockRequestsView adminName={adminName} />
    </main>
  )
}
