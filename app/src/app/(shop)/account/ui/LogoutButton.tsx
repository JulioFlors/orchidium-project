'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { IoLogOutOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { Backdrop } from '@/components'

export function LogoutButton() {
  const { status } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    // Redirigir al inicio o login tras logout
    await signOut({ callbackUrl: '/auth/login' })
  }

  if (status === 'loading') {
    return (
      <button
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
        type="button"
      >
        <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      </button>
    )
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
