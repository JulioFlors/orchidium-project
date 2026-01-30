import { AdminRoute, NavbarItem, ShopRoute } from '@/interfaces'

/**
 * Transforma los módulos de administración en ítems de navegación para el Header.
 */
export const getAdminNavItems = (modules: AdminRoute[], pathname: string): NavbarItem[] => {
  return modules.map((module) => {
    // Recopilamos todos los items para verificar actividad
    const allItems = [...(module.items || []), ...(module.groups?.flatMap((g) => g.items) || [])]

    const isActive = allItems.some(
      (item) => pathname === item.url || pathname.startsWith(`${item.url}/`),
    )

    return {
      key: module.slug,
      label: module.name,
      isActive,
      layout: module.layout,
      children: {
        items: module.items,
        groups: module.groups,
      },
    }
  })
}

/**
 * Transforma las rutas de la tienda en ítems de navegación para el Header.
 */
export const getShopNavItems = (routes: ShopRoute[], pathname: string): NavbarItem[] => {
  return routes
    .filter(
      (route) =>
        (route.categories && route.categories.length > 0) ||
        (route.items && route.items.length > 0) ||
        (route.groups && route.groups.length > 0),
    )
    .map((route) => ({
      key: route.slug,
      label: route.name,
      href: route.url,
      isActive: pathname === route.url || pathname.startsWith(`${route.url}/`),
      layout: route.layout,
      children: {
        featuredItem: route.featuredItem,
        categories: route.categories,
        items: route.items,
        groups: route.groups,
      },
    }))
}
