import { AnimatePresence, motion } from 'motion/react'
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
  const route = sidebarRoute ? adminRoutes.find((r) => r.slug === sidebarRoute) : null
  const allItems = route
    ? [...(route?.items || []), ...(route?.groups?.flatMap((g) => g.items) || [])]
    : []
  const showSubMenu = !!(route && allItems.length > 0)

  return (
    <AnimatePresence mode="wait">
      {showSubMenu ? (
        // ----------------------------------------
        //  NIVEL 2: Render (JSX)
        // ----------------------------------------
        <motion.div
          key="orchidarium-items"
          animate={{ opacity: 1 }}
          className="tds-xl:hidden relative w-full"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid w-full grid-cols-1 gap-1">
            {allItems.map((item) => (
              <Link
                key={item.url}
                className="focus-sidebar-content flex flex-row justify-start! gap-4 rounded-md px-3 py-2 text-left"
                href={item.url}
                onClick={closeSidebar}
              >
                {/* Icono: Alineado al inicio (top) */}
                <span className="text-primary mt-0.5 shrink-0 text-base">{item.icon}</span>

                {/* Texto: Columna (Título + Descripción) */}
                <div className="flex flex-col gap-1">
                  <span className="text-primary text-sm leading-tight font-semibold">
                    {item.name}
                  </span>
                  {item.description && (
                    <p className="text-secondary text-xs leading-tight font-light">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      ) : (
        // ----------------------------------------
        //  NIVEL 1: Root Render (JSX)
        // ----------------------------------------
        <motion.div
          key="orchidarium-root"
          animate={{ opacity: 1 }}
          className="flex h-full w-full flex-col"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
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
              href="/admin"
              type="button"
              onClick={() => closeSidebar()}
            >
              <PersonIcon className="h-5 w-5" />

              <span className="ml-2 font-semibold">Cuenta</span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
