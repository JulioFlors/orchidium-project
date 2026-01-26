'use server'

import { AuthError } from 'next-auth'

import { signIn } from '@/auth.config'

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirect: false,
    })

    return 'success'
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'No podemos identificar esta combinación de correo electrónico y contraseña'
        default:
          return 'Algo salió mal'
      }
    }
    throw error
  }
}

export const login = async (email: string, password: string) => {
  try {
    await signIn('credentials', { email, password })

    return { ok: true }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)

    return {
      ok: false,
      message: 'No se pudo iniciar sesión',
    }
  }
}
