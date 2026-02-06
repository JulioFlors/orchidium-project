import { usePathname } from 'next/navigation'

import { adminRoutes } from '@/config'

export const useNavigationContext = () => {
  const pathname = usePathname()

  // Determinamos si es una ruta de Orchidarium (Admin)
  const isOrchidarium =
    adminRoutes.some((module) => {
      // Recopilamos todos los items (planos o agrupados)
      const allItems = [...(module.items || []), ...(module.groups?.flatMap((g) => g.items) || [])]

      return allItems.some((item) => pathname === item.url || pathname.startsWith(`${item.url}/`))
    }) ||
    pathname.startsWith('/orchidarium') ||
    pathname.startsWith('/admin')

  const isAuthLayout = pathname.startsWith('/auth')

  // La tienda es el contexto por defecto
  const isShop = !isOrchidarium && !isAuthLayout

  return {
    isOrchidarium,
    isShop,
    isAuthLayout,
    pathname,
  }
}
