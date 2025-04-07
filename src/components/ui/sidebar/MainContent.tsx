'use client'

import Link from 'next/link'
import { IoChevronForwardOutline } from 'react-icons/io5'

import { Searchbox } from '@/components'
import { Route, Category } from '@/interfaces'
import { useUIStore } from '@/store'

interface MainContentProps {
  searchResults: (Route | Category)[]
  routes: Route[]
}

export function MainContent({ searchResults, routes }: MainContentProps) {
  const closeMenu = useUIStore((state) => state.closeSideMenu)
  const setActiveRoute = useUIStore((state) => state.setActiveRoute)

  return (
    <>
      <div className="lg-small:hidden relative w-full">
        <Searchbox searchResults={searchResults} />
      </div>

      <div className="w-full" id="renderMainContent">
        {routes.map((route) => (
          <div key={route.id} className="mb-2">
            {route.categories ? (
              <div className="lg-small:hidden relative">
                <button
                  className="focus-sidebar-content group hover:bg-hover mb-2 flex w-full items-center justify-between rounded px-3 py-2 font-medium text-black transition-colors duration-300"
                  type="button"
                  onClick={() => setActiveRoute(route.id)}
                >
                  <span>{route.title}</span>
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
                <span>{route.title}</span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
