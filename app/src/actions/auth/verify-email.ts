'use server'

import { prisma } from '@package/database'

import { Logger } from '@/lib'

export const verifyEmailInDb = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      select: { email: true },
    })

    if (!user) {
      return {
        ok: false,
        message: 'No es un correo electrónico válido',
      }
    }

    return {
      ok: true,
      message: 'Usuario encontrado',
    }
  } catch (error) {
    Logger.error('Error al verificar el correo:', error)

    return {
      ok: false,
      message: 'Error al verificar el correo',
    }
  }
}
