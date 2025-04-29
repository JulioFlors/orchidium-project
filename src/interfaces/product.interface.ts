export interface SpeciesImage {
  id: string
  url: string
  speciesId: string
}

export interface Genus {
  //todo: id: string
  name: string
  type: PlantType
}

export interface Species {
  //todo: id: string
  name: string
  genus: {
    name: string
  }
  price: number
  slug: string
  stock: {
    quantity: number
    available: boolean
  }
  images: string[]
}

export type PlantType = 'Orchid' | 'Adenium_Obesum' | 'Cactus' | 'Succulent' | 'Bromeliad'

export type PotSize = 'Nro 5' | 'Nro 7' | 'Nro 10' | 'Nro 14'

export interface CartProduct {
  id: string
  slug: string
  title: string
  price: number
  quantity: number
  size: PotSize
  image: string
}
