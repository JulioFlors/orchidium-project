'use client'

import type { Metadata } from 'next'

import { PageNotFound } from '@/components'
import { Footer, Sidebar, TopMenu } from '@/components'

export const metadata: Metadata = {
  title: 'PristinoPlant | Error',
  description: 'Ha ocurrido un accidente en nuestro vivero | Error',
}

export default function ErrorPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopMenu />

      <Sidebar />

      <main className="flex-grow px-6 sm:px-9 xl:px-12">
        <PageNotFound title="Error" />
      </main>

      <Footer />
    </div>
  )
}
