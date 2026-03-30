'use client'

import type { User } from '@package/database'

import { useState } from 'react'
import { IoTrashOutline, IoShieldCheckmarkOutline } from 'react-icons/io5'

import { changeUserRole, deleteUser } from '@/actions'
import {
  Backdrop,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components'

interface Props {
  users: User[]
}

export function UsersTable({ users }: Props) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'

    if (
      !window.confirm(
        `¿Estás seguro de cambiar el rol a ${newRole === 'ADMIN' ? 'Administrador' : 'Usuario'}?`,
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
    <Card className="overflow-hidden">
      <Backdrop visible={loading}>
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="text-primary h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <span className="animate-pulse text-lg font-medium tracking-wide text-white">
            Procesando
          </span>
        </div>
      </Backdrop>

      {/* Header & Search */}
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-md w-full">Usuarios Registrados</CardTitle>
        <input
          className="focus-input bg-canvas border-input-outline w-full rounded-lg border-none px-4 py-2 text-sm outline-none sm:w-64"
          placeholder="Buscar usuario..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </CardHeader>

      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
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
              </TableCell>
              <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                {user.name || 'Sin nombre'}
              </TableCell>
              <TableCell className="text-secondary">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'ADMIN' ? 'purple' : 'success'}>{user.role}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    className="p-2"
                    title={user.role === 'ADMIN' ? 'Degradar a Usuario' : 'Promover a Admin'}
                    variant="ghost"
                    onClick={() => handleRoleChange(user.id, user.role)}
                  >
                    <IoShieldCheckmarkOutline size={18} />
                  </Button>
                  <Button
                    className="p-2"
                    title="Eliminar Usuario"
                    variant="ghost"
                    onClick={() => handleDelete(user.id)}
                  >
                    <IoTrashOutline size={18} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {filteredUsers.length === 0 && (
            <TableRow>
              <TableCell className="py-8 text-center text-zinc-500" colSpan={5}>
                No se encontraron usuarios
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
