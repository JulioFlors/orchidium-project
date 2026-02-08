import type { JWT } from 'next-auth/jwt'
import type { User } from '@package/database'

import { PrismaAdapter } from '@auth/prisma-adapter'
import { z } from 'zod'
import bcryptjs from 'bcryptjs'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import NextAuth from 'next-auth'
import prisma from '@package/database'

import { authConfig } from './auth.config'

// Tipo local que representa el usuario almacenado en el token (sin password)
type SessionUser = Omit<User, 'password'>

// Tipar correctamente token con campo opcional `data`
type TokenWithData = JWT & { data?: SessionUser }

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // @ts-expect-error: NextAuth v5 beta type incompatibility with PrismaAdapter
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    // Callback jwt extendido para sincronizar con DB (solo funciona con adaptador/Node)
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line prettier/prettier
        ; (token as TokenWithData).data = user as SessionUser
      }

      // ⚠️ IMPORTANTE: Si el usuario se loguea con Google, el objeto 'user' NO trae el rol de la BD.
      // Buscamos siempre en la BD por email para asegurar que tenemos los datos más recientes.
      if (token.data?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.data.email },
        })

        if (dbUser) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _, ...rest } = dbUser

          token.data = { ...token.data, ...rest } as SessionUser
        }
      }

      return token
    },
    async session({ session, token }) {
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
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) return null

        const { email, password } = parsedCredentials.data

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (!user) return null

        const { password: dbPassword, ...rest } = user

        if (!bcryptjs.compareSync(password, dbPassword)) return null

        return rest
      },
    }),
  ],
})
