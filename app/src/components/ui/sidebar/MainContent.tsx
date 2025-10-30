'use client'

import Link from 'next/link'
import { IoChevronForwardOutline } from 'react-icons/io5'

import { SearchBox } from '@/components'
import { staticRoutes } from '@/config'
import { useUIStore } from '@/store'

export function MainContent() {
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)

  return (
    <>
      <div className="tds-xl:hidden relative w-full">
        <SearchBox />
      </div>

      <div className="w-full" id="renderMainContent">
        {staticRoutes.map((route) => (
          <div key={route.slug} className="mb-2">
            {route.categories && route.categories.length > 0 ? (
              <div className="tds-xl:hidden relative">
                <button
                  className="focus-sidebar-content group w-full px-3 py-2"
                  type="button"
                  onClick={() => setSidebarRoute(route.slug)}
                >
                  <span>{route.name}</span>
                  <span className="text-secondary group-hover:text-primary transition-colors duration-200">
                    <IoChevronForwardOutline size={16} />
                  </span>
                </button>
              </div>
            ) : (
              <Link
                className="focus-sidebar-content p-2"
                href={route.url || '#'}
                onClick={closeSidebar}
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
