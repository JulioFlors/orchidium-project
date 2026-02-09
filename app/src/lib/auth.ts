import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@package/database'

// ---- Detectamos el entorno ----
const isVercel = process.env.VERCEL === '1'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false, // Se establece en falso porque se confiará en el valor por defecto y no se requiere entrada del usuario
        defaultValue: 'USER',
        input: false, // No permitir que el usuario asigne el rol al registrarse
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: isVercel ? process.env.BETTER_AUTH_URL : 'http://localhost:3000',
})
