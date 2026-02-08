import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/new-account',
  },
  callbacks: {
    authorized({ auth: _auth, request: _nextUrl }) {
      return true
    },
    // Estos callbacks son placeholders para que el middleware no falle,
    // pero la lógica real de sesión está en auth.ts que sí tiene acceso a DB
    jwt({ token }) {
      return token
    },
    session({ session }) {
      return session
    },
  },
  providers: [], // Los providers se definen en auth.ts
} satisfies NextAuthConfig
