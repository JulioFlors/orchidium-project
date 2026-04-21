import type { Metadata } from 'next'

import { SuppliesView } from './ui'

import { getAgrochemicals } from '@/actions'

export const metadata: Metadata = {
  title: 'Insumos Químicos',
  description: 'Gestión del inventario de fertilizantes y fitosanitarios.',
}

export default async function SuppliesPage() {
  const result = await getAgrochemicals()

  const agrochemicals = result.ok ? result.agrochemicals || [] : []

  return <SuppliesView agrochemicals={agrochemicals} />
}
