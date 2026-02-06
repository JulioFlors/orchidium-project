'use client'

import type { User } from '@package/database'

import clsx from 'clsx'
import { useState } from 'react'
import { IoTrashOutline, IoShieldCheckmarkOutline } from 'react-icons/io5'

import { changeUserRole, deleteUser } from '@/actions'
import { Backdrop } from '@/components'

interface Props {
  users: User[]
}

export function UsersTable({ users }: Props) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'user' : 'admin'

    if (
      !window.confirm(
        `¿Estás seguro de cambiar el rol a ${newRole === 'admin' ? 'Administrador' : 'Usuario'}?`,
      )
    )
      return

    setLoading(true)
    const { ok, message } = await changeUserRole(userId, newRole)

    if (!ok) {
      alert(message)
    }
    setLoading(false)
  }

  const handleDelete = async (userId: string) => {
    if (
      !window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')
    )
      return

    setLoading(true)
    const { ok, message } = await deleteUser(userId)

    if (!ok) {
      alert(message)
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="bg-canvas border-input-outline overflow-hidden rounded-xl border shadow-sm">
      <Backdrop visible={loading}>
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="text-primary h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <span className="text-lg font-medium tracking-wide text-white">Procesando...</span>
        </div>
      </Backdrop>

      {/* Header & Search */}
      <div className="border-input-outline flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-primary text-md w-full font-semibold">Usuarios Registrados</h3>
        <input
          className="focus-input bg-canvas border-input-outline w-full rounded-lg border-none px-4 py-2 text-sm outline-none sm:w-64"
          placeholder="Buscar usuario..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="text-secondary px-6 py-3 font-semibold">Avatar</th>
              <th className="text-secondary px-6 py-3 font-semibold">Nombre</th>
              <th className="text-secondary px-6 py-3 font-semibold">Email</th>
              <th className="text-secondary px-6 py-3 font-semibold">Rol</th>
              <th className="text-secondary px-6 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-input-outline divide-y">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-6 py-4">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500">
                    {user.image ? (
                      <img
                        alt={user.name || ''}
                        className="h-full w-full rounded-full object-cover"
                        src={user.image}
                      />
                    ) : (
                      <span className="text-xs font-bold">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {user.name || 'Sin nombre'}
                </td>
                <td className="text-secondary px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                    )}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="text-secondary rounded-lg p-2 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-700/50"
                      title={user.role === 'ADMIN' ? 'Degradar a Usuario' : 'Promover a Admin'}
                      type="button"
                      onClick={() => handleRoleChange(user.id, user.role)}
                    >
                      <IoShieldCheckmarkOutline size={18} />
                    </button>
                    <button
                      className="text-secondary rounded-lg p-2 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/10"
                      title="Eliminar Usuario"
                      type="button"
                      onClick={() => handleDelete(user.id)}
                    >
                      <IoTrashOutline size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td className="py-8 text-center text-zinc-500" colSpan={5}>
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
