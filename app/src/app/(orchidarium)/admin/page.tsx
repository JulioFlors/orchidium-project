import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { AdminDashboard, type AdminView } from './ui/AdminDashboard'

import { getPaginatedUsers } from '@/actions'
import { auth } from '@/lib/server'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminPage({ searchParams }: Props) {
  // ---- Obtenemos los parámetros de búsqueda (Next.js 15) ----
  const params = await searchParams
  const initialView = (params.view as AdminView) || ('iot_debug' as AdminView)

  // ---- Obtenemos los datos de la session ----
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // ---- Está logueado? ----
  if (!session?.user) {
    // Redirigimos al login y guardamos la URL de retorno
    redirect('/auth/login?callbackUrl=/admin')
  }

  // ---- Es Admin? ----
  if (session.user.role !== 'ADMIN') {
    // Si está logueado pero no es admin, lo redirigimos al Home
    redirect('/')
  }

  const { users = [] } = await getPaginatedUsers()

  // Preparamos el objeto user seguro (sin nulls o undefineds peligrosos para el cliente)
  const safeUser = {
    name: session.user.name || 'Admin',
    email: session.user.email || '',
    image: session.user.image || undefined,
    role: session.user.role || 'USER',
  }

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* 
          Eliminamos el Suspense con fallback "Cargando" aquí
          para que el servidor entregue la página completa con los datos inyectados.
       */}
      <AdminDashboard initialView={initialView} user={safeUser} users={users} />
    </div>
  )
}
