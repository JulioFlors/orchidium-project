'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IoLogOutOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { Backdrop } from '@/components'
import { authClient } from '@/lib/auth-client'

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    // Usamos el SDK Cliente de Better Auth para cerrar sesión y redirigir
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/auth/login')
        },
      },
    })
  }

  return (
    <>
      <Backdrop visible={isLoggingOut}>
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="text-primary h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <span className="text-lg font-medium tracking-wide text-white">Cerrando sesión</span>
        </div>
      </Backdrop>

      <button
        className={clsx(
          'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200',
          'text-secondary hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-800/10 dark:hover:text-red-400',
        )}
        type="button"
        onClick={handleLogout}
      >
        <IoLogOutOutline className="h-6 w-6" />
        <span className="font-medium">Cerrar Sesión</span>
      </button>
    </>
  )
}
