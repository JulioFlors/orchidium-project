'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Navigation } from '@/config/navigation'

export function ContextSidebar() {
  const pathname = usePathname()

  // 1. LÓGICA DE DETECCIÓN DE MÓDULO
  // Busca qué módulo de la configuración coincide con la URL actual.
  const activeModule =
    Navigation.find((module) => {
      // Caso especial: Dashboard (Root)
      // Si la ruta es exactamente '/orchidarium', es el dashboard.
      if (module.slug === 'dashboard') {
        return pathname === '/orchidarium' || pathname === '/orchidarium/'
      }

      // Caso general: Si la ruta empieza con el basePath del módulo (ej: /orchidarium/inventory...)
      return pathname.startsWith(module.basePath)
    }) || Navigation[0] // Fallback al primero (Dashboard) si no encuentra nada

  return (
    // SE OCULTA EN MÓVIL (< tds-lg)
    // En escritorio es pegajoso (sticky) y ocupa la altura restante menos el header (top-14)
    <aside className="tds-lg:block sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[260px] overflow-y-auto py-8 pr-4 pl-8">
      {/* LISTA DE ENLACES CONTEXTUALES */}
      <nav className="flex flex-col gap-1">
        {activeModule.sidebarItems.map((item) => {
          const isActive = pathname === item.url

          return (
            <Link
              key={item.url}
              className={clsx(
                'group flex items-center gap-3 rounded-md px-3 py-2 outline-transparent transition-all duration-200',
                {
                  // ESTADO ACTIVO: Fondo sutil + Texto Primario + Negrita
                  'bg-hover-overlay text-primary font-bold shadow-sm': isActive,
                  // ESTADO INACTIVO: Texto Secundario + Hover suave
                  'text-secondary hover:text-primary hover:bg-hover-overlay/50 font-medium':
                    !isActive,
                },
              )}
              href={item.url}
            >
              {/* ICONO */}
              <span
                className={clsx(
                  'text-xl transition-colors',
                  // Si está activo, el icono toma el color de acción (azul/negro), si no, gris.
                  isActive ? 'text-action' : 'text-secondary group-hover:text-primary',
                )}
              >
                {item.icon}
              </span>

              {/* TEXTO */}
              <span className="text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
