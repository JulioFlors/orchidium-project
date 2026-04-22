'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@package/database'
import { headers } from 'next/headers'

import { Logger } from '@/lib'
import { auth } from '@/lib/server'

export const getPaginatedUsers = async (limit: number = 50, skip: number = 0) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user.role !== 'ADMIN') {
    return { ok: false, message: 'No tiene privilegios de administrador' }
  }

  try {
    const users = await prisma.user.findMany({
      take: limit,
      skip: skip,
      orderBy: { createdAt: 'desc' },
    })

    return {
      ok: true,
      users,
    }
  } catch (err) {
    Logger.error('Error al obtener usuarios:', err)

    return { ok: false, message: 'Error al obtener usuarios' }
  }
}

export const changeUserRole = async (userId: string, newRole: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user.role !== 'ADMIN') {
    return { ok: false, message: 'No tiene privilegios de administrador' }
  }

  try {
    // Verificamos que el rol sea válido
    if (newRole !== 'ADMIN' && newRole !== 'USER') {
      return { ok: false, message: 'Rol no válido' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    revalidatePath('/admin')

    return { ok: true }
  } catch (err) {
    Logger.error('Error al cambiar rol de usuario:', err)

    return { ok: false, message: 'No se pudo actualizar el rol' }
  }
}

export const deleteUser = async (userId: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user.role !== 'ADMIN') {
    return { ok: false, message: 'No tiene privilegios de administrador' }
  }

  try {
    // TODO: Verificar si el usuario tiene relaciones vitales antes de eliminar
    // Por ahora borrado directo
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath('/admin')

    return { ok: true }
  } catch (err) {
    Logger.error('Error al eliminar usuario:', err)

    return { ok: false, message: 'Error al eliminar usuario' }
  }
}
