import type { Metadata } from 'next'

import { Footer, Sidebar, Header } from '@/components'
import { getPlantsNavigation, getSearchSuggestions } from '@/actions'

export const metadata: Metadata = {
  title: {
    template: 'PristinoPlant | %s',
    default: 'PristinoPlant | Shop',
  },
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Usamos Promise.all para cargar todos los datos en paralelo.
  const [suggestions, plantsNavData] = await Promise.all([
    getSearchSuggestions(),
    getPlantsNavigation(),
  ])

  return (
    <div className="flex min-h-dvh flex-col">
      <Header plantsNavData={plantsNavData} suggestions={suggestions} />

      <Sidebar suggestions={suggestions} />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">{children}</main>

      <Footer />
    </div>
  )
}
