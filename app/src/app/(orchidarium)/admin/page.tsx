import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { AdminDashboard } from './ui/AdminDashboard'

import { getPaginatedUsers } from '@/actions'
import { auth } from '@/lib/auth'

export default async function AdminPage() {
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
    <div className="mx-auto mt-8 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Cargando</div>}>
        <AdminDashboard user={safeUser} users={users} />
      </Suspense>
    </div>
  )
}
