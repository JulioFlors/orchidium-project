import type { Metadata } from 'next'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { Footer, Header, Sidebar } from '@/components'

export const metadata: Metadata = {
  title: {
    default: 'Orchidarium',
    template: 'PristinoPlant | %s',
  },
}

export default async function OchidariumLayout({ children }: { children: React.ReactNode }) {
  // ---- Obtenemos los datos de la session ----
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // ---- Está logueado? ----
  if (!session?.user) {
    // Redirigimos al login y guardamos la URL de retorno
    redirect('/auth/login?callbackUrl=/orchidarium')
  }

  // ---- Es Admin? ----
  if (session.user.role !== 'ADMIN') {
    // Si está logueado pero no es admin, lo redirigimos al Home
    redirect('/')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <Sidebar />

      <main className="tds-sm:mx-9 tds-xl:mx-12 mx-6 mt-14 grow">{children}</main>

      <Footer />
    </div>
  )
}
