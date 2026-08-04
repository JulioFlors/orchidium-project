import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { StockDetailView } from '../ui/StockDetailView'

import { getSpeciesById } from '@/actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Gestión de Stock e Inventario Físico',
}

export default async function StockDetailPage({ params }: PageProps) {
  const { id } = await params
  const { species } = await getSpeciesById(id)

  if (!species) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StockDetailView species={species} />
    </main>
  )
}
