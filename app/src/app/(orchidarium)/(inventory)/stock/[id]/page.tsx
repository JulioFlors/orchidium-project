import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { StockDetailView } from '../ui/StockDetailView'

import { getSpeciesById, getSpeciesFloweringAnalytics } from '@/actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Gestión de Stock e Inventario Físico',
}

export default async function StockDetailPage({ params }: PageProps) {
  const { id } = await params

  // Carga paralela en el servidor de la especie y su analítica completa de floración
  const [speciesRes, analyticsRes] = await Promise.all([
    getSpeciesById(id),
    getSpeciesFloweringAnalytics(id),
  ])

  const species = speciesRes.species

  if (!species) {
    notFound()
  }

  const initialAnalytics = analyticsRes.success && analyticsRes.data ? analyticsRes.data : null

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StockDetailView initialAnalytics={initialAnalytics} species={species} />
    </main>
  )
}
