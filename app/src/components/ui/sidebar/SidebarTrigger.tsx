'use client'

import clsx from 'clsx'

import { useUIStore } from '@/store'

interface Props {
  className?: string
}

export function SidebarTrigger({ className }: Props) {
  const openSidebar = useUIStore((state) => state.openSidebar)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)

  return (
    <button
      aria-expanded={isSidebarOpen}
      aria-label="Abrir menú"
      className={clsx('menu-button focus-link-hover', className)}
      type="button"
      onClick={openSidebar}
    >
      Menú
    </button>
  )
}
