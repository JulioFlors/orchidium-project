'use client'

import type { SearchSuggestion } from '@/actions'

import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { IoChevronForwardOutline } from 'react-icons/io5'
import { TbPlant } from 'react-icons/tb'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'

import { authClient } from '@/lib/auth-client'
import { PersonIcon, SearchBox, ThemeToggle, buttonVariants } from '@/components'
import { shopRoutes } from '@/config'
import { useUIStore } from '@/store'

interface Props {
  suggestions?: SearchSuggestion[]
}

export function ShopSidebar({ suggestions = [] }: Props) {
  // ----- Hooks -----
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Better Auth SDK: Hook para obtener la sesión en componentes cliente
  // Se actualiza automáticamente cuando cambia el estado de autenticación
  const { data: session, isPending } = authClient.useSession()

  // ----- Store (Zustand) -----
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const setSidebarRoute = useUIStore((state) => state.setSidebarRoute)
  const sidebarRoute = useUIStore((state) => state.sidebarRoute)

  // ----- Helpers de Auth -----
  const isAuthenticated = !!session?.user
  // @ts-expect-error: Role might not be typed yet without generation, but exists in DB
  const isAdmin = session?.user?.role?.toUpperCase() === 'ADMIN'

  // ---- WAITING For data ----
  if (isPending) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex w-full flex-1 flex-col">
          {/* SearchBox Skeleton (Solo visible en Sidebar móvil) */}
          <div
            aria-hidden="true"
            className="tds-xl:hidden bg-input relative mb-4 h-10 w-full animate-pulse rounded"
            tabIndex={-1}
          />

          {/* Navigation Skeleton */}
          {[1, 2].map((i) => (
            <div
              key={`skeleton-nav-${i}`}
              aria-hidden="true"
              className="bg-surface mb-2 h-10 w-full animate-pulse rounded"
              tabIndex={-1}
            />
          ))}

          {/* Bottom Items Skeleton (Orchidarium, Theme, Account) */}
          <div className="mt-4 flex flex-col">
            {[1, 2, 3].map((i) => (
              <div
                key={`skeleton-sys-${i}`}
                aria-hidden="true"
                className="bg-surface mb-2 h-10 w-full animate-pulse rounded"
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const route = sidebarRoute ? shopRoutes.find((r) => r.slug === sidebarRoute) : null
  const showCategory = !!(route?.categories && route.categories.length > 0)

  return (
    <AnimatePresence mode="wait">
      {showCategory ? (
        // ---- NIVEL 2: Category Content ----
        <motion.div
          key="category-content"
          animate={{ opacity: 1 }}
          className="tds-xl:hidden relative w-full"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid w-full grid-cols-1 gap-2.5">
            {route!.categories!.map((cat) => (
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
                      unoptimized
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
              className={buttonVariants({
                variant: 'secondary',
                className: 'block w-full',
              })}
              href={`/category/${sidebarRoute}`}
              onClick={closeSidebar}
            >
              Ver todo
            </Link>
          </div>
        </motion.div>
      ) : (
        // ---- NIVEL 1: Root ----
        <motion.div
          key="root-content"
          animate={{ opacity: 1 }}
          className="flex h-full w-full flex-col"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
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
                'mt-4 mb-4!': !isAuthenticated,
              })}
              iconClassName="h-5 w-5"
              label="Tema"
            />

            {/* ---- Account ----*/}
            {isAuthenticated && (
              <Link
                aria-label="Cuenta"
                className="focus-sidebar-content mb-4! justify-start! px-3 py-2"
                href="/account"
                type="button"
                onClick={() => closeSidebar()}
              >
                <PersonIcon className="h-5 w-5" />

                <span className="ml-2 font-semibold">Cuenta</span>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
