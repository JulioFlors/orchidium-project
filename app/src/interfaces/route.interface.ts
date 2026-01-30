import type { ReactNode } from 'react'

// =====================================================================
// TIPOS DE LAYOUT (DISEÑO DEL DROPDOWN)
// =====================================================================
export type DropdownLayout = 'catalog' | 'informational' | 'hybrid'

// =====================================================================
// COMUNES
// =====================================================================

export interface SubRoute {
  name: string
  url: string
  icon?: ReactNode
  description?: string
  image?: string
}

export interface LinkGroup {
  title: string
  items: SubRoute[]
}

// =====================================================================
// 1. SHOP CONTEXT (Tienda Pública)
// =====================================================================

export interface ShopRoute {
  name: string
  slug: string
  url: string
  layout: DropdownLayout

  // Específico Layout 'catalog'
  featuredItem?: ShopFeaturedItem
  categories?: ShopCategory[]

  // Específico Layout 'informational' | 'hybrid'
  items?: SubRoute[]
  groups?: LinkGroup[]
}

export interface ShopFeaturedItem {
  name: string
  image: string
  url: string
}

export interface ShopCategory {
  name: string
  slug: string
  url: string
  image?: string
}

// =====================================================================
// 2. ADMIN CONTEXT (Orchidarium)
// =====================================================================

export interface AdminRoute {
  slug: string
  name: string
  icon: ReactNode // Obligatorio en Admin
  layout: DropdownLayout

  // Contenido
  items?: SubRoute[]
  groups?: LinkGroup[]
}

// =====================================================================
// 3. UI ADAPTER (Navbar & Sidebar unificados)
// =====================================================================

// Interfaz unificada que consume el componente Navbar
export interface NavbarItem {
  key: string
  label: string
  href?: string
  isActive: boolean
  layout: DropdownLayout

  // Payload Unificado
  children?: {
    // Catalog
    featuredItem?: ShopFeaturedItem
    categories?: ShopCategory[]
    // Generic
    items?: SubRoute[]
    groups?: LinkGroup[]
  }
}
