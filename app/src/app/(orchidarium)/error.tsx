'use client'

import { useEffect } from 'react'

import { Footer, Header, PageNotFound, Sidebar } from '@/components'

export default function ErrorPage() {
  useEffect(() => {
    document.title = 'PristinoPlant | Error'
  }, [])

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
