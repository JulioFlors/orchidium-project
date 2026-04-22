'use client'

import type { PlantsNavData, SearchSuggestion } from '@/actions'

import { useEffect, useState } from 'react'

import { Footer, Header, PageNotFound, Sidebar } from '@/components'
import { getPlantsNavigation, getSearchSuggestions } from '@/actions'
import { Logger } from '@/lib'
import { adminRoutes } from '@/config'

// Metadata se elimina porque no se puede exportar desde un Client Component
// export const metadata: Metadata = {
//   title: '404',
//   description: 'No pudimos encontrar la página | 404',
// }

export default function NotFoundPage() {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [plantsNavData, setPlantsNavData] = useState<PlantsNavData[]>([])

  useEffect(() => {
    document.title = '404'

    const pathname = window.location.pathname

    // Validar si la ruta coincide con un módulo administrativo del menú
    const isOrchidarium =
      adminRoutes.some((module) => {
        const allItems = [
          ...(module.items || []),
          ...(module.groups?.flatMap((g) => g.items) || []),
        ]

        return allItems.some((item) => pathname === item.url || pathname.startsWith(`${item.url}/`))
      }) ||
      pathname.startsWith('/orchidarium') ||
      pathname.startsWith('/admin')

    // Evitamos cargar datos masivos de la tienda si estamos en el modo Administrativo/Orquideario
    const isShopRoute = !isOrchidarium && !pathname.startsWith('/auth')

    if (isShopRoute) {
      const fetchData = async () => {
        try {
          const [suggestionsData, navData] = await Promise.all([
            getSearchSuggestions(),
            getPlantsNavigation(),
          ])

          setSuggestions(suggestionsData)
          setPlantsNavData(navData)
        } catch (err) {
          Logger.error('🚨 Error recovering navigation data:', err)
        }
      }

      fetchData()
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <Header plantsNavData={plantsNavData} suggestions={suggestions} />

      <Sidebar suggestions={suggestions} />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">
        <PageNotFound title="404" />
      </main>

      <Footer />
    </div>
  )
}
