'use client'

import { useTheme } from 'next-themes'
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5'
import clsx from 'clsx'

interface Props {
  className?: string
}

export function ThemeIcon({ className }: Props) {
  const { resolvedTheme } = useTheme()

  // Como este componente se cargará con ssr: false,
  // aquí "resolvedTheme" ya tendrá el valor correcto del cliente.
  return resolvedTheme === 'light' ? (
    <IoSunnyOutline className={clsx('text-primary', className)} />
  ) : (
    <IoMoonOutline className={clsx('text-primary', className)} />
  )
}
