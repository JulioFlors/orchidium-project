import type { Metadata } from 'next'

import { redirect } from 'next/navigation'

import { auth } from '@/auth.config'
import { Footer, Header, Sidebar } from '@/components'

export const metadata: Metadata = {
  title: {
    template: 'PristinoPlant | %s',
    default: 'PristinoPlant | Orchidarium',
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
    <div className="bg-canvas flex min-h-dvh flex-col">
      {/* Header Específico del Admin (Nivel 1) 
         Contiene la lógica del Mega Menú y Toolbar
      */}
      <Header />

      {/* Sidebar Global Derecho (Reutilizado de la tienda)
         Se activa con el botón "Menú" en móviles.
      */}
      <Sidebar />

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 pt-14">
        {/* Contenido Principal */}
        <main className="tds-lg:p-10 min-w-0 flex-1 overflow-x-hidden p-6">{children}</main>
      </div>

      {/* Footer (Opcional en dashboard, a veces se quita para ganar espacio vertical) */}
      <Footer />
    </div>
  )
}
