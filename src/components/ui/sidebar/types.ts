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
