import type { Metadata } from 'next'

import { Footer, Sidebar, TopMenu } from '@/components'
import { getPlantsNavigation, getSearchSuggestions } from '@/actions'

export const metadata: Metadata = {
  title: 'PristinoPlant | Iniciar Sesión',
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [suggestions, plantsNavData] = await Promise.all([
    getSearchSuggestions(),
    getPlantsNavigation(),
  ])

  return (
    <div className="flex min-h-dvh flex-col">
      <TopMenu plantsNavData={plantsNavData} suggestions={suggestions} />

      <Sidebar />

      <main className="mx-6 mt-14 grow sm:mx-9 xl:mx-12">{children}</main>

      <Footer />
    </div>
  )
}
