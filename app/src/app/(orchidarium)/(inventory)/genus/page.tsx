import type { Metadata } from 'next'

import { GenusView } from './ui/GenusView'

import { getGenera } from '@/actions'

export const metadata: Metadata = {
  title: 'Géneros',
}

export default async function GenusPage() {
  const { genera = [] } = await getGenera()

  return <GenusView initialGenera={genera} />
}
