import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

export default async function DashboardPage() {
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
    <div>
      <h1>Dashboard de Administrador</h1>
      <p>Bienvenido, {session.user.name}.</p>
      <p>Este contenido solo es visible para administradores.</p>
    </div>
  )
}
