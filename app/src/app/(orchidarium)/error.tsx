'use client'

import type { Metadata } from 'next'

import { Footer, Header, PageNotFound, Sidebar } from '@/components'

export const metadata: Metadata = {
  title: 'Error',
  description: 'Ha ocurrido un Error',
}

export default async function ErrorPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <Sidebar />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">
        <PageNotFound title="Error" />
      </main>

      <Footer />
    </div>
  )
}
