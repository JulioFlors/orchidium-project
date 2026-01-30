'use client'

import type { PlantsNavData } from '@/actions'

import Link from 'next/link'
import Image from 'next/image'

import { NavbarItem } from '@/interfaces'

// Helper del Header (Hardcoded mapping for catalog layout)
const categoryWrapper: Record<string, string> = {
  orchids: 'orchid',
  adenium_obesum: 'adenium_obesum',
  cactus: 'cactus',
  succulents: 'succulent',
  bromeliads: 'bromeliad',
}

interface Props {
  activeItem: NavbarItem
  onClose: () => void
  plantsNavData: PlantsNavData[]
}

export function NavbarDropdown({ activeItem, onClose, plantsNavData }: Props) {
  const { layout, children } = activeItem

  if (!children) return null

  // ===========================================================================
  // A. CATALOG LAYOUT (e.g. Plants)
  // ===========================================================================
  if (layout === 'catalog' && children.categories) {
    return (
      <div className="mx-auto flex w-full justify-between px-20 py-15">
        {/* Columna Izquierda: Categorías */}
        <div className="-mx-4 flex flex-1">
          {children.categories.map((category) => {
            const groupsInCategory = plantsNavData.filter(
              (gen) => gen.type.toLowerCase() === categoryWrapper[category.slug],
            )

            if (groupsInCategory.length === 0) return null

            return (
              <div key={category.slug} className="flex-1 px-4">
                <p className="text-primary tds-sm:text-sm mb-2 w-full font-semibold tracking-wide lg:text-base">
                  <Link href={category.url} tabIndex={-1} onClick={onClose}>
                    {category.name}
                  </Link>
                </p>
                <div className="mb-5 h-1 w-full bg-neutral-300" />
                <ul className="max-h-61 w-full space-y-2 overflow-hidden">
                  {groupsInCategory.map((group) => (
                    <li key={group.name}>
                      <Link
                        className="text-secondary hover:text-primary leading-6 font-medium tracking-wide transition-colors duration-500"
                        href={`${category.url}#${group.name.toLowerCase()}`}
                        tabIndex={-1}
                        onClick={onClose}
                      >
                        {group.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Columna Derecha: Featured Item */}
        {children.featuredItem && (
          <div className="ml-15 w-1/3 shrink-0">
            <Link href={children.featuredItem.url} tabIndex={-1} onClick={onClose}>
              <div className="h-[90%] overflow-hidden rounded">
                <div className="relative aspect-video h-full w-full">
                  <Image
                    fill
                    priority
                    alt={children.featuredItem.name}
                    className="object-cover"
                    src={children.featuredItem.image}
                  />
                </div>
              </div>
              <p className="mt-3 block text-center text-xl font-semibold tracking-tighter antialiased">
                {children.featuredItem.name}
              </p>
            </Link>
          </div>
        )}
      </div>
    )
  }

  // ===========================================================================
  // B. HYBRID LAYOUT (e.g. Inventory with Cards)
  // ===========================================================================
  if (layout === 'hybrid' && children.items) {
    return (
      <div className="mx-auto max-w-[1400px] px-12 py-10">
        <div className="grid grid-cols-4 gap-6">
          {children.items.map((item) => (
            <Link
              key={item.url}
              className="group flex flex-col items-center gap-3 text-center"
              href={item.url}
              onClick={onClose}
            >
              <div className="bg-surface relative aspect-video w-full overflow-hidden rounded-md border border-transparent transition-colors group-hover:border-neutral-200 dark:group-hover:border-white/10">
                {item.image ? (
                  <Image
                    fill
                    alt={item.name}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    src={item.image}
                  />
                ) : (
                  <div className="text-secondary/30 flex h-full w-full items-center justify-center text-4xl">
                    {item.icon}
                  </div>
                )}
              </div>
              <span className="text-primary text-lg font-bold decoration-2 underline-offset-4 group-hover:underline">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // ===========================================================================
  // C. INFORMATIONAL LAYOUT (e.g. Dashboard, Admin)
  // ===========================================================================
  if (layout === 'informational') {
    // 1. Renderizado por Grupos (Columnas)
    if (children.groups) {
      return (
        <div className="mx-auto flex max-w-[1400px] justify-center gap-16 px-12 py-10">
          {children.groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h3 className="text-primary font-bold tracking-wide uppercase opacity-90">
                {group.title}
              </h3>
              <div className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <Link
                    key={item.url}
                    className="text-secondary hover:text-primary transition-colors"
                    href={item.url}
                    onClick={onClose}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // 2. Renderizado Plano Simple (Icon + Text)
    if (children.items) {
      return (
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="grid grid-cols-4 gap-x-12 gap-y-6">
            {children.items.map((item) => (
              <Link
                key={item.url}
                className="group flex items-start gap-3"
                href={item.url}
                onClick={onClose}
              >
                <span className="text-secondary group-hover:text-primary mt-1 transition-colors">
                  {item.icon}
                </span>
                <div>
                  <h3 className="text-primary mb-1 text-sm font-bold decoration-2 underline-offset-4 group-hover:underline">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-secondary text-xs leading-relaxed opacity-80">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )
    }
  }

  return null
}
