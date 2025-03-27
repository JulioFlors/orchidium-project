import { notFound } from 'next/navigation'

import { ProductGrid, Title, Subtitle } from '@/components'
import { initialData } from '@/seed/seed'

const products = initialData.species

interface Props {
  params: {
    category: string
  }
  searchParams: {
    page?: string
  }
}

export default function CategoryPage({ params }: Props) {
  const { category } = params

  if (category === 'cactus') {
    notFound()
  }

  return (
    <>
      <Title title={category} />

      <Subtitle subtitle="Todos los productos" />

      <ProductGrid products={products} />
    </>
  )
}
