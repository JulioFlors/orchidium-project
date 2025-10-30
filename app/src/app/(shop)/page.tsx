import { ProductGrid, Title, Subtitle } from '@/components'
import { initialData } from '@service/seeding'

const products = initialData.species

export default async function HomePage() {
  return (
    <>
      <Title title="Orquídeas" />

      <Subtitle subtitle="Todos los productos" />

      <ProductGrid index={0} products={products} />
    </>
  )
}
