import { ProductGridItem } from './ProductGridItem'

import { Species } from '@/interfaces/'

interface Props {
  products: Species[]
}

export function ProductGrid({ products }: Props) {
  return (
    <div className="mb-10 grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-9 xl:gap-12">
      {products.map((product) => (
        <ProductGridItem key={product.slug} product={product} />
      ))}
    </div>
  )
}
