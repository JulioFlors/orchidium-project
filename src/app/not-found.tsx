import type { Metadata } from 'next'

import { PageNotFound } from '@/components'
import { Footer, Sidebar, TopMenu } from '@/components'

export const metadata: Metadata = {
  title: 'PristinoPlant | 404',
  description: 'No pudimos encontrar la planta en nuestro vivero | 404',
}

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopMenu />

      <Sidebar />

      <main className="flex-grow px-6 sm:px-9 xl:px-12">
        <PageNotFound title="404" />
      </main>

      <Footer />
    </div>
  )
}
