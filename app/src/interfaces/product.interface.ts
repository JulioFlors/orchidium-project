import { PlantType, PotSize } from '@package/database/enums'

export { PlantType, PotSize }

export interface SpeciesImage {
  id: string
  url: string
  speciesId: string
}

export interface Genus {
  id: string
  name: string
  type: PlantType
}

export interface ProductVariant {
  id: string
  size: PotSize
  price: number
  quantity: number
  available: boolean
  speciesId: string
}

export interface Species {
  id: string
  name: string
  slug: string
  description?: string | null

  // Propiedades que vienen de las relaciones de Prisma
  images: string[]

  genus: {
    name: string
    type: PlantType
  }

  variants: ProductVariant[]
}

export interface CartProduct {
  //id: string
  slug: string
  name: string
  price: number
  quantity: number
  size: PotSize // Ahora size es obligatorio si viene de una variante
  image: string
}
