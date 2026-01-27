import type { ReactNode } from 'react'

// Route/ruta -> Representa las opciones asociadas a cada apartado del Header/Sidebar
// route: Plant -> category: [Orchid, Adenium_Obesum, Cactus, Succulent]
// category: Orchid -> group: [Cattleya, Dendrobium, Dimerandra, Enciclea]

// se implemento la logica de group directamente en los pageComponent de category,
// filtrando directamente el modelo que funge de grupo para cada Producto.

export interface Route {
  name: string
  slug: string
  url: string
  protected?: boolean
  featuredItem?: FeaturedItem
  categories?: Category[]
}

// item destacado
export interface FeaturedItem {
  name: string
  image: string
  url: string
}

export interface Category {
  name: string
  slug: string
  url: string
  image?: string
}

export interface AdminNavModule {
  slug: string
  name: string
  basePath: string
  icon: ReactNode
  dropdownLayout: 'rich' | 'simple'
  sidebarItems: SidebarItem[]
}

export interface SidebarItem {
  name: string
  url: string
  icon?: ReactNode
  description?: string
  image?: string
}

// Interfaz unificada para los items del menú
export interface NavItem {
  key: string
  label: string
  href: string
  isActive: boolean
  hasDropdown?: boolean
  dropdownType?: 'shop' | 'rich' | 'simple'
  childrenData?: Route | SidebarItem[]
}
