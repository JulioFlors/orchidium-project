'use server'

import { signOut } from '@/auth.config'

/**
 * Cierra la sesión del usuario **en el servidor**.
 *
 * @ADVERTENCIA
 * Esta es una Server Action que utiliza el `signOut` de `auth.config.ts`.
 * Su única responsabilidad es invalidar la cookie o token de sesión en el **servidor**.
 *
 * **NO** actualiza el estado del cliente (el hook `useSession`).
 *
 * Si necesitas cerrar sesión y actualizar la UI en un componente de cliente
 * (un archivo con `'use client'`), **no uses esta acción**.
 *
 * En su lugar, importa y usa `signOut` directamente desde `'next-auth/react'`
 * en tu componente de cliente.
 */
export const logout = async () => {
  await signOut()
}
