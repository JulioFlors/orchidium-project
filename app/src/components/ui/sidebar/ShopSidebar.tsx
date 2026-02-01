'use client'

import type { SearchSuggestion } from '@/actions'

import Link from 'next/link'
import Image from 'next/image'
import { TbPlant } from 'react-icons/tb'
import { IoChevronForwardOutline } from 'react-icons/io5'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import clsx from 'clsx'

import { PersonIcon, SearchBox, ThemeToggle } from '@/components'
import { shopRoutes } from '@/config'
import { useUIStore } from '@/store'

interface Props {
  suggestions?: SearchSuggestion[]
}

export function ShopSidebar({ suggestions = [] }: Props) {
  // ----- Hooks -----
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // ----- Store (Zustand) -----
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)
  const sidebarRoute = useUIStore((state) => state.sidebarRoute)

  // ----- Helpers de Auth -----
  const isAuthenticated = !!session?.user
  const isAdmin = session?.user?.role?.toUpperCase() === 'ADMIN'

  // ---- NIVEL 2: Category Content ----
  if (sidebarRoute) {
    const route = shopRoutes.find((r) => r.slug === sidebarRoute)

    if (!route || !route.categories || route.categories.length === 0) return null

    // ----------------------------------------
    //  Render (JSX)
    // ----------------------------------------
    return (
      <div className="tds-xl:hidden relative w-full">
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

  // ---- NIVEL 1: Root ----
  // ----------------------------------------
  //  Render (JSX)
  // ----------------------------------------
  return (
    <div className="flex h-full w-full flex-col">
      {/* SearchBox (Solo visible en Sidebar móvil) */}
      <div className="tds-xl:hidden relative w-full">
        <SearchBox suggestions={suggestions} />
      </div>

      <div className="flex w-full flex-1 flex-col">
        {shopRoutes.map((route) => {
          // No renderizar ruta del login Si estamos logeados
          if (route.slug === 'login' && isAuthenticated) return null

          // Construcción de href para login con callback
          let href = route.url || '#'

          if (route.slug === 'login' && !pathname.startsWith('/auth/')) {
            const paramsString = searchParams.toString()
            const redirectUrl = `${pathname}${paramsString ? `?${paramsString}` : ''}`

            if (redirectUrl !== '/') href += `?callbackUrl=${encodeURIComponent(redirectUrl)}`
          }

          // ----------------------------------------
          // Renderizado condicional
          // ----------------------------------------
          return (
            <div key={route.slug}>
              {route.categories && route.categories.length > 0 ? (
                /* Se oculta del sidebar porque se prevee que las rutas con categorias pertenezcan en el navbar en desktop */
                <div className="tds-xl:hidden relative">
                  {/* Botón con flecha */}
                  <button
                    className="focus-sidebar-content group px-3 py-2"
                    type="button"
                    onClick={() => setSidebarRoute(route.slug)}
                  >
                    {route.name}
                    <span className="text-secondary group-hover:text-primary transition-colors duration-300">
                      <IoChevronForwardOutline size={18} />
                    </span>
                  </button>
                </div>
              ) : (
                /* Link directo */
                <Link className="focus-sidebar-content p-2" href={href} onClick={closeSidebar}>
                  {route.name}
                </Link>
              )}
            </div>
          )
        })}

        {/* ---- Account ----*/}
        {isAuthenticated && !isAdmin && (
          <button
            className="focus-sidebar-content p-2"
            type="button"
            onClick={() => {
              closeSidebar() // Cierra el sidebar
              signOut() // Cierra la sesión y actualiza el hook useSession
            }}
          >
            Cerrar sesión
          </button>
        )}

        {/* ---- Orchidarium ----*/}
        {isAuthenticated && isAdmin && (
          <Link
            aria-label="Orquideario"
            className="focus-sidebar-content mt-4 justify-start! px-3 py-2"
            href="/orchidarium"
            type="button"
            onClick={() => closeSidebar()}
          >
            <TbPlant className="h-5 w-5" />

            <span className="ml-2 font-semibold">Orquideario</span>
          </Link>
        )}

        {/* ---- Theme ----*/}
        <ThemeToggle
          isSidebar
          className={clsx('justify-start! px-3 py-2', {
            'mt-4 mb-4!': !isAdmin,
          })}
          iconClassName="h-5 w-5"
          label="Tema"
        />

        {/* ---- Account ----*/}
        {isAuthenticated && isAdmin && (
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
        )}
      </div>
    </div>
  )
}
