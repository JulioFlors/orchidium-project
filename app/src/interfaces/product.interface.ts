import { PlantType, PotSize } from '@package/database'

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

export interface Species {
  id: string
  name: string
  slug: string
  price: number
  description?: string | null

  // Propiedades que vienen de las relaciones de Prisma
  images: string[]
  genus: {
    name: string
    type: PlantType
  }
  stock: {
    quantity: number
    available: boolean
  }
}

export interface CartProduct {
  //id: string
  slug: string
  name: string
  price: number
  quantity: number
  //size: PotSize
  image: string
}
