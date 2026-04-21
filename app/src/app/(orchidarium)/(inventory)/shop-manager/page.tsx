import type { Metadata } from 'next'

import { ShopView } from './ui/ShopView'

import { getStoreData } from '@/actions'

export const metadata: Metadata = {
  title: 'Gestor de Tienda',
}

export default async function ShopManagerPage() {
  const result = await getStoreData()
  const species = result.species || []

  return (
    <main className="p-4 sm:p-8">
      <ShopView initialData={species} />
    </main>
  )
}
