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

export type PlantType = 'Orchid' | 'Adenium_Obesum' | 'Cactus' | 'Succulent'

export interface Category {
  id: string
  title: string
  subcategories?: Subcategory[]
  url?: string
}

export interface Subcategory {
  id: string
  title: string
  image: string
  url: string
}
