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
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components'
import { useToastStore } from '@/store/toast/toast.store'

interface Props {
  users: User[]
}

export function UsersTable({ users }: Props) {
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: User; newRole: string } | null>(
    null,
  )
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const handleRoleChange = (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'

    setRoleChangeTarget({ user, newRole })
  }

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return

    setLoading(true)
    const { ok, message } = await changeUserRole(roleChangeTarget.user.id, roleChangeTarget.newRole)

    if (ok) {
      addToast('Rol de usuario actualizado con éxito.', 'success')
      setRoleChangeTarget(null)
    } else {
      addToast(message || 'Error al cambiar el rol.', 'error')
    }
    setLoading(false)
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return

    setLoading(true)
    const { ok, message } = await deleteUser(userToDelete.id)

    if (ok) {
      addToast('Usuario eliminado con éxito.', 'success')
      setUserToDelete(null)
    } else {
      addToast(message || 'Error al eliminar el usuario.', 'error')
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
                    onClick={() => handleRoleChange(user)}
                  >
                    <IoShieldCheckmarkOutline size={18} />
                  </Button>
                  <Button
                    className="p-2"
                    title="Eliminar Usuario"
                    variant="ghost"
                    onClick={() => handleDelete(user)}
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

      <Modal
        isOpen={!!roleChangeTarget}
        size="md"
        title="Cambiar Rol de Usuario"
        onClose={() => setRoleChangeTarget(null)}
      >
        <div className="flex flex-col gap-5">
          <div className="bg-surface/50 rounded-lg border border-dashed border-amber-500/30 p-4">
            <p className="text-primary text-xs leading-relaxed">
              <span className="font-bold text-amber-500 uppercase">Nota:</span> ¿Estás seguro de
              cambiar el rol de &quot;{roleChangeTarget?.user.name || roleChangeTarget?.user.email}
              &quot; a {roleChangeTarget?.newRole === 'ADMIN' ? 'Administrador' : 'Usuario'}?
            </p>
          </div>

          <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button variant="ghost" onClick={() => setRoleChangeTarget(null)}>
              Volver
            </Button>
            <Button isLoading={loading} variant="primary" onClick={handleConfirmRoleChange}>
              Confirmar Cambio
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!userToDelete}
        size="md"
        title="Eliminar Usuario"
        onClose={() => setUserToDelete(null)}
      >
        <div className="flex flex-col gap-5">
          <div className="bg-surface/50 rounded-lg border border-dashed border-red-500/30 p-4">
            <p className="text-primary text-xs leading-relaxed">
              <span className="font-bold text-red-500 uppercase">Nota:</span> Esta acción no se
              puede deshacer. Se eliminará permanentemente la cuenta de &quot;
              {userToDelete?.name || userToDelete?.email}&quot;.
            </p>
          </div>

          <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button variant="ghost" onClick={() => setUserToDelete(null)}>
              Volver
            </Button>
            <Button isLoading={loading} variant="destructive" onClick={handleConfirmDeleteUser}>
              Eliminar Usuario
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
