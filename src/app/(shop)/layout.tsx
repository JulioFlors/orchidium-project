import type { Metadata } from 'next'

import { Footer, Sidebar, TopMenu } from '@/components'

export const metadata: Metadata = {
  title: 'PristinoPlant | Tienda',
  description: 'Tienda virtual de plantas',
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopMenu />

      <Sidebar />

      <main className="mx-6 mt-14 grow sm:mx-9 xl:mx-12">{children}</main>

      <Footer />
    </div>
  )
}
