import type { Metadata } from 'next'

import { StockView } from './ui'

import { getStoreData } from '@/actions'

export const metadata: Metadata = {
  title: 'Stock',
}

export default async function StockPage() {
  const result = await getStoreData()
  const species = result.species || []

  return <StockView initialData={species} />
}
