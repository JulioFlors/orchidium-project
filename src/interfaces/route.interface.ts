// Route/ruta -> Representa las opciones asociadas a cada apartado del TopMenu/Sidebar
// route: Plant -> category: [Orchid, Adenium_Obesum, Cactus, Succulent]
// category: Orchid -> group: [Cattleya, Dendrobium, Dimerandra, Enciclea]

// se implemento la logica de group directamente en los pageComponent de category,
// filtrando directamente el modelo que funge de grupo para cada Producto.

export interface Route {
  name: string
  slug: string
  url: string
  categories?: Category[]
}

export interface Category {
  name: string
  slug: string
  url: string
  image?: string
}
