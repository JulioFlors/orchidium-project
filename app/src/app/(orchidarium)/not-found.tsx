import type { Metadata } from 'next'

import { Footer, Header, PageNotFound, Sidebar } from '@/components'

export const metadata: Metadata = {
  title: '404',
  description: 'No pudimos encontrar esta pagina | 404',
}

export default async function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <Sidebar />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">
        <PageNotFound title="404" />
      </main>

      <Footer />
    </div>
  )
}
