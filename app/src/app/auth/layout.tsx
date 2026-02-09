import type { Metadata } from 'next'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { Header, Footer } from '@/components'

export const metadata: Metadata = {
  title: {
    // %s se sustituye por el título que definas en cada página
    template: 'PristinoPlant | %s',
    default: 'PristinoPlant | Auth', // Título por defecto si una página no define uno propio
  },
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between">
      <Header />
      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 flex w-full grow flex-col">{children}</main>
      <Footer />
    </div>
  )
}
