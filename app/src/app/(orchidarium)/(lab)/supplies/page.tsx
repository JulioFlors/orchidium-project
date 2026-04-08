import type { Metadata } from 'next'

import { getAgrochemicals } from '@/actions'
import { SuppliesClient } from '@/components/lab'

export const metadata: Metadata = {
  title: 'Insumos Químicos',
  description: 'Gestión de fertilizantes y fitosanitarios para el cuidado de las orquídeas.',
}

export default async function SuppliesPage() {
  const result = await getAgrochemicals()

  const agrochemicals = result.ok ? result.agrochemicals || [] : []

  return (
    <div className="container mx-auto px-4 py-8">
      <SuppliesClient agrochemicals={agrochemicals} />
    </div>
  )
}
