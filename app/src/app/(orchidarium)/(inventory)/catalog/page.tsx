import type { Metadata } from 'next'

import { CatalogView } from './ui'

import { getSpecies, getGenera } from '@/actions'

export const metadata: Metadata = {
  title: 'Catálogo',
}

export default async function CatalogPage() {
  // Carga paralela de datos de catálogo
  const [speciesRes, generaRes] = await Promise.all([getSpecies(), getGenera()])

  const species = speciesRes.species || []
  const genera = generaRes.genera || []

  return <CatalogView initialGenera={genera} initialSpecies={species} />
}
