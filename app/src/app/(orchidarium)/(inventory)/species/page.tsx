import type { Metadata } from 'next'

import { SpeciesView } from './ui/SpeciesView'

import { getSpecies, getGenera } from '@/actions'

export const metadata: Metadata = {
  title: 'Especies',
}

export default async function SpeciesPage() {
  // Fetch paralelo para velocidad
  const [speciesRes, generaRes] = await Promise.all([getSpecies(), getGenera()])

  const species = speciesRes.species || []
  const genera = generaRes.genera || []

  return <SpeciesView genera={genera} initialSpecies={species} />
}
