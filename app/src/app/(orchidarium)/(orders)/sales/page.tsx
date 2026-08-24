import type { Metadata } from 'next'

import { SalesView, SaleRecordItem } from './ui/SalesView'

import { getSalesRecords } from '@/actions'

export const metadata: Metadata = {
  title: 'Historial de Ventas',
}

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const result = await getSalesRecords()
  const sales = (result.sales || []) as unknown as SaleRecordItem[]

  return <SalesView initialSales={sales} />
}
