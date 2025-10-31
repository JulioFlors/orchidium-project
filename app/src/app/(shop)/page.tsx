import { ProductGrid, Title, Subtitle } from '@/components'
import { initialData } from '@service/seeding'

const products = initialData.species.map((species) => {
  const genus = initialData.genus.find((g) => g.name === species.genus.name);

  return {
    ...species,
    id: species.slug,
    genus: {
      name: species.genus.name,
      type: genus!.type, // ! non-null assertion operator
    },
  };
});

export default async function HomePage() {
  return (
    <>
      <Title title="Orquídeas" />

      <Subtitle subtitle="Todos los productos" />

      <ProductGrid index={0} products={products} />
    </>
  )
}
