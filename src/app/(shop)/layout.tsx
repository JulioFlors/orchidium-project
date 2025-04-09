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

      <main className="flex-grow px-6 sm:px-9 xl:px-12">{children}</main>

      <Footer />
    </div>
  )
}
