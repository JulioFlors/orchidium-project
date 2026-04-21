'use client'

import type { User } from '@package/database'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { IoPeopleOutline, IoSettingsOutline, IoBugOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { UsersTable } from './UsersTable'
import { DeviceDebugger } from './components'

import { LogoutButton } from '@/app/(shop)/account/ui/LogoutButton'
import { Card, Badge } from '@/components'

interface Props {
  user: {
    name: string
    email: string
    image?: string
    role: string
  }
  users: User[]
  initialView: AdminView
}

export type AdminView = 'users' | 'iot_debug'

export function AdminDashboard({ user, users, initialView }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Sincronizamos con los parámetros de la URL para cambios posteriores,
  // pero usamos initialView para el renderizado inicial inmediato.
  const currentView = (searchParams.get('view') as AdminView) || initialView

  const setView = (view: AdminView) => {
    const params = new URLSearchParams(searchParams.toString())

    params.set('view', view)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* Sidebar: Perfil + Navegación Unificada */}
      <div className="space-y-6 lg:col-span-1">
        {/* Card 1: Perfil + Logout */}
        <Card className="flex flex-col overflow-hidden">
          {/* Header Perfil */}
          <div className="border-input-outline flex flex-col items-center border-b bg-zinc-50 p-6 text-center dark:bg-zinc-800/50">
            <div className="bg-surface text-primary flex h-20 w-20 items-center justify-center rounded-full">
              {user.image ? (
                <img
                  alt={user.name || 'Admin'}
                  className="h-full w-full rounded-full object-cover"
                  src={user.image}
                />
              ) : (
                <span className="text-xl font-bold">
                  {user.name?.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <h2 className="text-primary text-lg font-bold">{user.name || 'Administrador'}</h2>
            <p className="text-secondary text-sm">{user.email}</p>
            <Badge className="mt-2" variant="purple">
              {user.role}
            </Badge>
          </div>

          {/* Footer Logout (Ahora parte de la Card de Perfil) */}
          <div className="border-input-outline border-t bg-zinc-50 p-2 dark:bg-zinc-800/50">
            <div className="[&>button]:focus-sidebar-content [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-lg [&>button]:px-3 [&>button]:py-2 [&>button]:text-left [&>button]:text-sm [&>button]:font-medium [&>button]:transition-all">
              <LogoutButton />
            </div>
          </div>
        </Card>

        {/* Card 2: Menú de Navegación Independiente */}
        <Card className="p-2">
          {/* Configuración Primero (Solo Label y Separador) */}
          <div className="flex cursor-not-allowed items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider text-zinc-400 uppercase opacity-60">
            <IoSettingsOutline />
            <span>Configuración</span>
          </div>
          <div className="bg-input-outline mx-2 my-1 h-px" />

          {/* Botones */}
          <button
            className={clsx(
              'focus-sidebar-content flex w-full justify-start! gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all',
              currentView === 'iot_debug'
                ? 'bg-surface/60 text-primary shadow-sm'
                : 'text-secondary',
            )}
            type="button"
            onClick={() => setView('iot_debug')}
          >
            <IoBugOutline size={20} />
            Depuración IoT
          </button>

          <button
            className={clsx(
              'focus-sidebar-content flex w-full justify-start! gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all',
              currentView === 'users' ? 'bg-surface/60 text-primary shadow-sm' : 'text-secondary',
            )}
            type="button"
            onClick={() => setView('users')}
          >
            <IoPeopleOutline size={20} />
            Gestión de Usuarios
          </button>
        </Card>
      </div>

      {/* Contenido Principal */}
      <div className="space-y-8 lg:col-span-3">
        {currentView === 'users' && (
          <div className="fade-in">
            <div className="text-primary mb-4 flex items-center gap-3">
              <IoPeopleOutline size={28} />
              <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
            </div>
            <p className="text-secondary mb-6 text-sm">
              Control total sobre los usuarios registrados. Puedes promover usuarios a
              administradores o eliminar cuentas permanentemente.
            </p>
            <UsersTable users={users} />
          </div>
        )}

        {currentView === 'iot_debug' && (
          <div className="fade-in py-2">
            <DeviceDebugger />
          </div>
        )}
      </div>
    </div>
  )
}
