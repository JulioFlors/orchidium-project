import type { Metadata } from 'next'

import { RecipesView } from './ui'

import { getPrograms, getAgrochemicals } from '@/actions'

export const metadata: Metadata = {
  title: 'Recetas y Programas',
  description: 'Gestión de programas de fertilización y fitosanitarios.',
}

export default async function RecipesPage() {
  const [programsResult, agrochemicalsResult] = await Promise.all([
    getPrograms(),
    getAgrochemicals(),
  ])

  const fertilizationPrograms = programsResult.ok ? programsResult.fertilizationPrograms || [] : []
  const phytosanitaryPrograms = programsResult.ok ? programsResult.phytosanitaryPrograms || [] : []
  const availableAgrochemicals = agrochemicalsResult.ok
    ? agrochemicalsResult.agrochemicals || []
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <RecipesView
        availableAgrochemicals={availableAgrochemicals}
        fertilizationPrograms={fertilizationPrograms}
        phytosanitaryPrograms={phytosanitaryPrograms}
      />
    </div>
  )
}
