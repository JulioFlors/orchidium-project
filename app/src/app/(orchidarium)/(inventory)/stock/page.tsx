import type { Metadata } from 'next'

import { StockView } from './ui/StockView'

import { getStoreData } from '@/actions'

export const metadata: Metadata = {
  title: 'Gestión de Stock',
}

export default async function StockPage() {
  const result = await getStoreData()
  const species = result.species || []

  return (
    <div className="mx-auto mt-8 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <StockView initialData={species} />
      </div>
    </div>
  )
}
