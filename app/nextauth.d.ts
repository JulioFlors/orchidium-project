import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface User extends DefaultUser {
    role: string
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      emailVerified?: boolean
      role: string
      image?: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    data?: {
      id: string
      name: string
      email: string
      role: string
      image?: string | null
    }
  }
}
