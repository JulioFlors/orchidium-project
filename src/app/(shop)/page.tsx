import { ProductGrid, Title, Subtitle } from '@/components'
import { initialData } from '@/seed/seed'

const products = initialData.species

export default async function HomePage() {
  return (
    <>
      <Title title="Orquídeas" />

      <Subtitle subtitle="Todos los productos" />

      <ProductGrid products={products} />
    </>
  )
}
