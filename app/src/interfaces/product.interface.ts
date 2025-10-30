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

export type PlantType = 'Orchid' | 'Adenium_Obesum' | 'Cactus' | 'Succulent' | 'Bromeliad'

export type PotSize = 'Nro 5' | 'Nro 7' | 'Nro 10' | 'Nro 14'

export interface CartProduct {
  //id: string
  slug: string
  name: string
  price: number
  quantity: number
  //size: PotSize
  image: string
}
