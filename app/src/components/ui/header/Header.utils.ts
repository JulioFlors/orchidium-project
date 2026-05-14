import { AdminRoute, NavbarItem, ShopRoute } from '@/interfaces'

/**
 * Transforma los módulos de administración en ítems de navegación para el Header.
 */
export const getAdminNavItems = (modules: AdminRoute[], pathname: string): NavbarItem[] => {
  return [...modules]
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    .map((module) => {
      // Recopilamos todos los items para verificar actividad
      const allItems = [...(module.items || []), ...(module.groups?.flatMap((g) => g.items) || [])]

      const isActive = allItems.some(
        (item) => pathname === item.url || pathname.startsWith(`${item.url}/`),
      )

      // Ordenamos los sub-items y grupos alfabéticamente
      const sortedItems = module.items
        ? [...module.items].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
          )
        : undefined

      const sortedGroups = module.groups
        ? [...module.groups]
            .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }))
            .map((g) => ({
              ...g,
              items: [...g.items].sort((a, b) =>
                a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
              ),
            }))
        : undefined

      return {
        key: module.slug,
        label: module.name,
        isActive,
        layout: module.layout,
        children: {
          items: sortedItems,
          groups: sortedGroups,
        },
      }
    })
}

/**
 * Transforma las rutas de la tienda en ítems de navegación para el Header.
 */
export const getShopNavItems = (routes: ShopRoute[], pathname: string): NavbarItem[] => {
  return [...routes]
    .filter(
      (route) =>
        (route.categories && route.categories.length > 0) ||
        (route.items && route.items.length > 0) ||
        (route.groups && route.groups.length > 0),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    .map((route) => {
      // Ordenamos categorías, items y grupos alfabéticamente
      const sortedCategories = route.categories
        ? [...route.categories].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
          )
        : undefined

      const sortedItems = route.items
        ? [...route.items].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
          )
        : undefined

      const sortedGroups = route.groups
        ? [...route.groups]
            .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }))
            .map((g) => ({
              ...g,
              items: [...g.items].sort((a, b) =>
                a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
              ),
            }))
        : undefined

      return {
        key: route.slug,
        label: route.name,
        href: route.url,
        isActive: pathname === route.url || pathname.startsWith(`${route.url}/`),
        layout: route.layout,
        children: {
          featuredItem: route.featuredItem,
          categories: sortedCategories,
          items: sortedItems,
          groups: sortedGroups,
        },
      }
    })
}
