import type { Metadata } from 'next'

import { Footer, Sidebar, TopMenu } from '@/components'
import { getPlantsNavigation, getSearchSuggestions } from '@/actions'

export const metadata: Metadata = {
  title: 'PristinoPlant | Tienda',
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Usamos Promise.all para cargar todos los datos en paralelo.
  const [suggestions, plantsNavData] = await Promise.all([
    getSearchSuggestions(),
    getPlantsNavigation(),
  ])

  return (
    <div className="flex min-h-dvh flex-col">
      <TopMenu plantsNavData={plantsNavData} suggestions={suggestions} />

      <Sidebar />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">{children}</main>

      <Footer />
    </div>
  )
}
