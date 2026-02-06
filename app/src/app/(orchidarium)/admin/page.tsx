import { redirect } from 'next/navigation'
import { IoPeopleOutline, IoPersonOutline, IoSettingsOutline } from 'react-icons/io5'

import { UsersTable } from './ui/UsersTable'

import { getPaginatedUsers } from '@/actions'
import { LogoutButton } from '@/app/(shop)/account/ui/LogoutButton'
import { auth } from '@/auth.config'
import { Title } from '@/components'

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  // Doble check de seguridad por si acaso
  if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const { users = [] } = await getPaginatedUsers()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Title className="mb-0" title="Panel de Administración" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar / Perfil Admin */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-canvas border-input-outline rounded-xl border p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/5 mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl text-zinc-400 dark:text-zinc-600">
                {session.user.image ? (
                  <img
                    alt={session.user.name || 'Admin'}
                    className="h-full w-full rounded-full object-cover"
                    src={session.user.image}
                  />
                ) : (
                  <IoPersonOutline />
                )}
              </div>
              <h2 className="text-primary text-lg font-bold">
                {session.user.name || 'Administrador'}
              </h2>
              <p className="text-secondary text-sm">{session.user.email}</p>
              <span className="mt-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold tracking-wider text-purple-800 uppercase dark:bg-purple-900/30 dark:text-purple-300">
                {session.user.role}
              </span>
            </div>

            <div className="border-input-outline mt-6 border-t pt-6">
              <LogoutButton />
            </div>
          </div>

          {/* Configuración Rápida */}
          <div className="bg-canvas border-input-outline rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <IoSettingsOutline />
              <h3 className="text-sm font-semibold tracking-wider uppercase">Sistema</h3>
            </div>
            <button
              disabled
              className="text-secondary hover:text-primary w-full cursor-not-allowed py-2 text-left text-sm font-medium opacity-50 transition-colors"
              type="button"
            >
              Ajustes Globales IoT (Próximamente)
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="space-y-8 lg:col-span-3">
          {/* Sección Usuarios */}
          <div className="space-y-4">
            <div className="text-primary flex items-center gap-3">
              <IoPeopleOutline size={24} />
              <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
            </div>
            <p className="text-secondary text-sm">
              Control total sobre los usuarios registrados. Puedes promover usuarios a
              administradores o eliminar cuentas permanentemente.
            </p>

            <UsersTable users={users} />
          </div>
        </div>
      </div>
    </div>
  )
}
