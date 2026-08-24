import type { Metadata } from 'next'

import { OrdersView } from './ui/OrdersView'

import { getAdminOrders } from '@/actions'

export const metadata: Metadata = {
  title: 'Gestión de Pedidos',
}

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const result = await getAdminOrders()
  const orders = result.orders || []

  return <OrdersView initialOrders={orders} />
}
