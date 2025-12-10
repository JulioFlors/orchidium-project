import type { JWT } from 'next-auth/jwt'
import type { NextAuthConfig } from 'next-auth'
import type { User } from '@package/database'

import prisma from '@package/database'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcryptjs from 'bcryptjs'
import { z } from 'zod'

// Tipo local que representa el usuario almacenado en el token (sin password)
type SessionUser = Omit<User, 'password'>

// Tipar correctamente token con campo opcional `data`
type TokenWithData = JWT & { data?: SessionUser }

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/new-account',
  },

  callbacks: {
    authorized({ auth: _auth, request: _nextUrl }) {
      return true
    },

    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line prettier/prettier
        ; (token as TokenWithData).data = user as SessionUser
      }

      return token
    },

    session({ session, token }) {
      if (session.user && token.data) {
        session.user.id = token.data.id
        session.user.name = token.data.name
        session.user.email = token.data.email
        session.user.role = token.data.role
        session.user.image = token.data.image
      }

      return session
    },
  },

  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) return null

        const { email, password } = parsedCredentials.data

        // Buscamos el correo
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (!user) return null

        // Extraemos la contraseña para validación y devolvemos el usuario (sin el password)
        const { password: dbPassword, ...rest } = user

        // Compararamos las contraseñas
        if (!bcryptjs.compareSync(password, dbPassword)) return null

        // regresamos el usuario
        return rest
      },
    }),
  ],
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
})
