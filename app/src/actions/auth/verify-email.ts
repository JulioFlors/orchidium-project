'use server'

import { prisma } from '@package/database'

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
    // eslint-disable-next-line no-console
    console.log(error)

    return {
      ok: false,
      message: 'Error al verificar el correo',
    }
  }
}
