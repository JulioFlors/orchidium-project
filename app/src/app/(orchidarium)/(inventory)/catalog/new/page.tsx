import type { Metadata } from 'next'

import { SpeciesDetailView } from '../../species/ui/SpeciesDetailView'

import { getGenera } from '@/actions'

export const metadata: Metadata = {
  title: 'Nueva Especie',
}

export default async function NewSpeciesPage() {
  const generaRes = await getGenera()
  const genera = generaRes.genera || []

  return (
    <main className="p-4 sm:p-8">
      <SpeciesDetailView genera={genera} />
    </main>
  )
}
