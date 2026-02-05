'use client'

import type { PlantsNavData, SearchSuggestion } from '@/actions'

import { useEffect, useState } from 'react'

import { Footer, Header, PageNotFound, Sidebar } from '@/components'
import { getPlantsNavigation, getSearchSuggestions } from '@/actions'

// La Metadata no se puede exportar desde un Componente Cliente (error.tsx debe ser cliente).
// Generalmente se aplica la metadata del layout raíz, o un layout específico puede definirla.

interface ErrorProps {
  error: Error & { digest?: string }
  // reset: () => void
}

export default function ErrorPage({ error }: ErrorProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [plantsNavData, setPlantsNavData] = useState<PlantsNavData[]>([])

  // Fetch de datos en el cliente para preservar la funcionalidad de Header/Sidebar
  useEffect(() => {
    // Ajuste manual del título ya que no hay metadata de servidor
    document.title = 'PristinoPlant | Error'

    // Loguear el error en la consola del navegador para que tú (el dev) sepas qué pasó
    // eslint-disable-next-line no-console
    console.error('🚨 Application Error:', error)

    const fetchData = async () => {
      try {
        const [suggestionsData, navData] = await Promise.all([
          getSearchSuggestions(),
          getPlantsNavigation(),
        ])

        setSuggestions(suggestionsData)
        setPlantsNavData(navData)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('🚨 Error recovering navigation data:', err)
      }
    }

    fetchData()
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col">
      <Header plantsNavData={plantsNavData} suggestions={suggestions} />

      <Sidebar suggestions={suggestions} />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">
        <PageNotFound title="Error" />
      </main>

      <Footer />
    </div>
  )
}
