'use client'

import type { Metadata } from 'next'

import { Footer, Header, PageNotFound, Sidebar } from '@/components'
import { getPlantsNavigation, getSearchSuggestions } from '@/actions'

export const metadata: Metadata = {
  title: 'Error',
  description: 'Ha ocurrido un accidente en nuestro Orquideario | Error',
}

export default async function ErrorPage() {
  // Usamos Promise.all para cargar todos los datos en paralelo.
  const [suggestions, plantsNavData] = await Promise.all([
    getSearchSuggestions(),
    getPlantsNavigation(),
  ])

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
