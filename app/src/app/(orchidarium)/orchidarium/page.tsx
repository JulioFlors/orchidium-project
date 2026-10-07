import type { Metadata } from 'next'

import { OrchidariumView } from './ui'

import { getActiveFloweringEvents } from '@/actions'

export const metadata: Metadata = {
  title: 'Floraciones',
  description:
    'Supervisión centralizada y conclusión de eventos de floración activa en todos los ejemplares del orquideario.',
}

export default async function OrchidariumDashboardPage() {
  const res = await getActiveFloweringEvents()
  const initialEvents = res.success && res.data ? res.data : []

  return <OrchidariumView initialEvents={initialEvents} />
}
