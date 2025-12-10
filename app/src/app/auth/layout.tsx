import type { Metadata } from 'next'

import { redirect } from 'next/navigation'

import { auth } from '@/auth.config'
import { AuthHeader, Footer } from '@/components'

export const metadata: Metadata = {
  title: 'PristinoPlant | Autenticación',
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center">
      <AuthHeader />
      <main className="tds-sm:w-87.5 tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 w-full py-7">
        {children}
      </main>
      <Footer />
    </div>
  )
}
