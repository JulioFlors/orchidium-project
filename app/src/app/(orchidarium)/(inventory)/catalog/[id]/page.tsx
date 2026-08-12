import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { SpeciesDetailView } from '../ui/SpeciesDetailView'

import { getSpeciesById, getGenera } from '@/actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Editar Especie',
}

export default async function EditSpeciesPage({ params }: PageProps) {
  const { id } = await params

  // Realizar fetches paralelos
  const [speciesRes, generaRes] = await Promise.all([getSpeciesById(id), getGenera()])

  const species = speciesRes.species
  const genera = generaRes.genera || []

  if (!species) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SpeciesDetailView genera={genera} initialSpecies={species} />
    </main>
  )
}
