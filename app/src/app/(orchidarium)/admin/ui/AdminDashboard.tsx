'use client'

import type { User } from '@package/database'

import clsx from 'clsx'
import { useState } from 'react'
import { IoPeopleOutline, IoSettingsOutline, IoBugOutline } from 'react-icons/io5'

import { UsersTable } from './UsersTable'

import { LogoutButton } from '@/app/(shop)/account/ui/LogoutButton'
import { DeviceDebugger } from '@/components/admin/DeviceDebugger'

interface Props {
  user: {
    name: string
    email: string
    image?: string
    role: string
  }
  users: User[]
}

type AdminView = 'users' | 'iot_debug'

export function AdminDashboard({ user, users }: Props) {
  const [currentView, setCurrentView] = useState<AdminView>('users')

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* Sidebar: Perfil + Navegación Unificada */}
      <div className="space-y-6 lg:col-span-1">
        {/* Card 1: Perfil + Logout */}
        <div className="bg-canvas border-input-outline flex flex-col overflow-hidden rounded-xl border shadow-sm">
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
            <span className="mt-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold tracking-wider text-purple-800 uppercase dark:bg-purple-900/30 dark:text-purple-300">
              {user.role}
            </span>
          </div>

          {/* Footer Logout (Ahora parte de la Card de Perfil) */}
          <div className="border-input-outline border-t bg-zinc-50 p-2 dark:bg-zinc-800/50">
            <div className="[&>button]:focus-sidebar-content [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-lg [&>button]:px-3 [&>button]:py-2 [&>button]:text-left [&>button]:text-sm [&>button]:font-medium [&>button]:transition-all">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Card 2: Menú de Navegación Independiente */}
        <div className="bg-canvas border-input-outline rounded-xl border p-2 shadow-sm">
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
              currentView === 'users' ? 'bg-surface/60 text-primary shadow-sm' : 'text-secondary',
            )}
            type="button"
            onClick={() => setCurrentView('users')}
          >
            <IoPeopleOutline size={20} />
            Gestión de Usuarios
          </button>

          <button
            className={clsx(
              'focus-sidebar-content flex w-full justify-start! gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all',
              currentView === 'iot_debug'
                ? 'bg-surface/60 text-primary shadow-sm'
                : 'text-secondary',
            )}
            type="button"
            onClick={() => setCurrentView('iot_debug')}
          >
            <IoBugOutline size={20} />
            Debugging IoT
          </button>
        </div>
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
