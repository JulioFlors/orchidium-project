import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { OrderDetailAdminView, AdminOrderDetail } from './ui/OrderDetailAdminView'

import { getOrderById } from '@/actions'

export const metadata: Metadata = {
  title: 'Detalle de Pedido',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getOrderById(id)

  if (!result.ok || !result.order) {
    notFound()
  }

  return <OrderDetailAdminView order={result.order as unknown as AdminOrderDetail} />
}
