'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@package/database'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

export const getPaginatedUsers = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user.role !== 'ADMIN') {
    return { ok: false, message: 'No tiene privilegios de administrador' }
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'desc' },
    })

    return {
      ok: true,
      users,
    }
  } catch {
    return { ok: false, message: 'Error al obtener usuarios' }
  }
}

export const changeUserRole = async (userId: string, role: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user.role !== 'ADMIN') {
    return { ok: false, message: 'No tiene privilegios de administrador' }
  }

  try {
    const newRole = role === 'ADMIN' ? 'USER' : 'ADMIN'

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    revalidatePath('/admin')

    return { ok: true }
  } catch {
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
  } catch {
    return { ok: false, message: 'Error al eliminar usuario' }
  }
}
