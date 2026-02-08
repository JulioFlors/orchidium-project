import type { Metadata } from 'next'

import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { Footer, Header, Sidebar } from '@/components'

export const metadata: Metadata = {
  title: {
    default: 'Orchidarium',
    template: 'PristinoPlant | %s',
  },
}

export default async function OchidariumLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // 1. Verificación de Autenticación (¿Está logueado?)
  if (!session?.user) {
    // Redirigir al login y guardar la URL de retorno
    redirect('/auth/login?callbackUrl=/orchidarium')
  }

  // 2. Verificación de Autorización (¿Es Admin?)
  // Asegúrate de que tu objeto session tenga la propiedad role.
  // A veces viene como session.user.role o necesitas extender el tipo.
  if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
    // Si está logueado pero no es admin, lo mandamos al Home o a una página 403
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
