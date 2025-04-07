import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Route } from '@/interfaces'
import { useUIStore } from '@/store'

interface CategoryContentProps {
  routeId: string
  routes: Route[]
}

export function CategoryContent({ routeId, routes }: CategoryContentProps) {
  const closeMenu = useUIStore((state) => state.closeSideMenu)

  const activeRoute = useUIStore((state) => state.activeRoute)
  const route = routes.find((route) => route.id === activeRoute)

  if (!route || !route.categories) return null

  return (
    <div className="lg-small:hidden relative w-full">
      <div className="mb-5 pb-2 text-2xl font-bold">{route.title}</div>
      <div className="grid w-full grid-cols-1 gap-2.5">
        {route.categories.map((cat) => (
          <Link key={cat.id} className="focus-sidebar-img block" href={cat.url} onClick={closeMenu}>
            <div className="overflow-hidden rounded">
              <div className="relative aspect-video h-42 w-full">
                <Image
                  fill
                  alt={cat.title}
                  className="rounded object-cover"
                  src={cat.image || '/placeholder.svg'}
                />
              </div>
            </div>
            <div className="pt-2 pb-2.5 text-center text-lg leading-5 font-semibold">
              {cat.title}
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-2.5 mb-8 w-full">
        <Link
          className="btn-secondary focus-btn-secondary block"
          href={`/category/${routeId}`}
          onClick={closeMenu}
        >
          Ver todo
        </Link>
      </div>
    </div>
  )
}
