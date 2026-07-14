import type { Metadata } from 'next'

import { CatalogView } from './ui/CatalogView'

import { getSpecies, getGenera } from '@/actions'

export const metadata: Metadata = {
  title: 'Catálogo Unificado',
}

export default async function CatalogPage() {
  // Carga paralela de datos de catálogo
  const [speciesRes, generaRes] = await Promise.all([getSpecies(), getGenera()])

  const species = speciesRes.species || []
  const genera = generaRes.genera || []

  return <CatalogView initialSpecies={species} initialGenera={genera} />
}
