import type { Metadata } from 'next'

import { Footer, Sidebar, TopMenu } from '@/components'

export const metadata: Metadata = {
  title: 'PristinoPlant | Tienda',
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopMenu />

      <Sidebar />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">{children}</main>

      <Footer />
    </div>
  )
}
