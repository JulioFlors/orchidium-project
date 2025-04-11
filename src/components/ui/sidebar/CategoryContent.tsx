'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { staticRoutes } from '@/config'
import { useUIStore } from '@/store'

export function CategoryContent() {
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const sidebarRoute = useUIStore((state) => state.sidebarRoute)

  const route = staticRoutes.find((route) => route.slug === sidebarRoute)

  if (!route || !route.categories || route.categories.length === 0) return null

  return (
    <div className="lg-small:hidden relative w-full">
      <div className="mb-5 pb-2 text-2xl font-bold">{route.name}</div>
      <div className="grid w-full grid-cols-1 gap-2.5">
        {route.categories.map((cat) => (
          <Link
            key={cat.slug}
            className="focus-sidebar-img block"
            href={cat.url}
            onClick={closeSidebar}
          >
            <div className="overflow-hidden rounded">
              <div className="relative aspect-video h-42 w-full">
                <Image
                  fill
                  alt={cat.name}
                  className="rounded object-cover"
                  sizes="(max-width: 414px) calc(100vw * 0.823 - 16px), 414px"
                  src={cat.image || '/placeholder.svg'}
                />
              </div>
            </div>
            <div className="pt-2 pb-2.5 text-center text-lg leading-5 font-semibold">
              {cat.name}
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-2.5 mb-8 w-full">
        <Link
          className="btn-secondary focus-btn-secondary block"
          href={`/category/${sidebarRoute}`}
          onClick={closeSidebar}
        >
          Ver todo
        </Link>
      </div>
    </div>
  )
}
