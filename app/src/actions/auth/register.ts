'use server'

import bcryptjs from 'bcryptjs'
import { Prisma, prisma } from '@package/database'

export const registerUser = async (name: string, email: string, password: string) => {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return {
        ok: false,
        message: 'El correo electrónico ya está registrado',
      }
    }

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email.toLowerCase(),
        password: bcryptjs.hashSync(password),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return {
      ok: true,
      user: user,
      message: 'Usuario creado',
    }
  } catch (error: unknown) {
    // Comprobamos si el error es un PrismaClientKnownRequestError antes de acceder a .code
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Manejo de error específico para violación de restricción única (ej. email duplicado)
      if (error.code === 'P2002') {
        return {
          ok: false,
          message: 'El correo electrónico ya está registrado',
        }
      }
    }

    return {
      ok: false,
      message: 'No se pudo crear el usuario',
    }
  }
}
