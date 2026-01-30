'use client'

import Link from 'next/link'
import { IoChevronForwardOutline, IoStorefrontOutline } from 'react-icons/io5'

import { adminRoutes } from '@/config'
import { PersonIcon, ThemeToggle } from '@/components'
import { useUIStore } from '@/store'

export function OrchidariumSidebar() {
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)
  const sidebarRoute = useUIStore((state) => state.sidebarRoute)

  // ---- NIVEL 2: sidebarItems ----
  if (sidebarRoute) {
    const route = adminRoutes.find((r) => r.slug === sidebarRoute)

    // Aplanamos items y grupos para la vista móvil
    const allItems = [...(route?.items || []), ...(route?.groups?.flatMap((g) => g.items) || [])]

    if (!route || allItems.length === 0) return null

    // ----------------------------------------
    //  Render (JSX)
    // ----------------------------------------
    return (
      <div className="tds-xl:hidden relative w-full">
        <div className="grid w-full grid-cols-1 gap-2.5">
          {allItems.map((item) => (
            <Link
              key={item.url}
              className="group hover:bg-hover-overlay focus:ring-accessibility flex flex-col rounded-md px-4 py-3 transition-colors focus:ring-2 focus:outline-none"
              href={item.url}
              onClick={closeSidebar}
            >
              <div className="text-primary group-hover:text-action flex items-center gap-3 font-semibold">
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </div>
              {item.description && (
                <p className="text-secondary/80 mt-1 ml-8 text-xs font-normal">
                  {item.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // ---- NIVEL 1: Root ----
  // ----------------------------------------
  //  Render (JSX)
  // ----------------------------------------
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full flex-1 flex-col">
        {adminRoutes.map((route) => (
          <button
            key={route.slug}
            className="focus-sidebar-content group px-3 py-2"
            type="button"
            onClick={() => setSidebarRoute(route.slug)}
          >
            {route.name}
            <span className="text-secondary group-hover:text-primary transition-colors duration-300">
              <IoChevronForwardOutline size={18} />
            </span>
          </button>
        ))}

        {/* ---- Store ----*/}
        <Link
          aria-label="Tienda"
          className="focus-sidebar-content mt-4 justify-start! px-3 py-2"
          href="/"
          type="button"
          onClick={() => closeSidebar()}
        >
          <IoStorefrontOutline className="h-5 w-5" />

          <span className="ml-2 font-semibold">Tienda</span>
        </Link>

        {/* ---- Theme ----*/}
        <ThemeToggle
          isSidebar
          className="justify-start! px-3 py-2"
          iconClassName="h-5 w-5"
          label="Tema"
        />

        {/* ---- Account ----*/}
        <Link
          aria-label="Cuenta"
          className="focus-sidebar-content mb-4! justify-start! px-3 py-2"
          href="/orchidarium/account"
          type="button"
          onClick={() => closeSidebar()}
        >
          <PersonIcon className="h-5 w-5" />

          <span className="ml-2 font-semibold">Cuenta</span>
        </Link>
      </div>
    </div>
  )
}
