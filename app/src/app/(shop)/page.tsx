import { ProductGrid, Title, Subtitle } from '@/components'
import { initialData } from '@service/seeding'

const products = initialData.species.map((species) => ({
  ...species,
  id: species.slug,
}));

export default async function HomePage() {
  return (
    <>
      <Title title="Orquídeas" />

      <Subtitle subtitle="Todos los productos" />

      <ProductGrid index={0} products={products} />
    </>
  )
}
