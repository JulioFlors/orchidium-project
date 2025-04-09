'use client'

import Link from 'next/link'
import { IoChevronForwardOutline } from 'react-icons/io5'

import { Searchbox } from '@/components'
import { staticRoutes } from '@/config'
import { useUIStore } from '@/store'

export function MainContent() {
  const closeMenu = useUIStore((state) => state.closeSideMenu)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)

  return (
    <>
      <div className="lg-small:hidden relative w-full">
        <Searchbox />
      </div>

      <div className="w-full" id="renderMainContent">
        {staticRoutes.map((route) => (
          <div key={route.slug} className="mb-2">
            {route.categories && route.categories.length > 0 ? (
              <div className="lg-small:hidden relative">
                <button
                  className="focus-sidebar-content group hover:bg-hover mb-2 flex w-full items-center justify-between rounded px-3 py-2 font-medium text-black transition-colors duration-300"
                  type="button"
                  onClick={() => setSidebarRoute(route.slug)}
                >
                  <span>{route.name}</span>
                  <span className="text-secondary group-hover:text-primary transition-colors duration-300">
                    <IoChevronForwardOutline size={16} />
                  </span>
                </button>
              </div>
            ) : (
              <Link
                className="focus-sidebar-content hover:bg-hover mb-2 flex items-center justify-between rounded p-2 font-medium text-black transition-colors duration-300"
                href={route.url || '#'}
                onClick={closeMenu}
              >
                <span>{route.name}</span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
