import { ProductGridItem } from './ProductGridItem'

import { Species } from '@/interfaces/'

interface Props {
  products: Species[]
}

export function ProductGrid({ products }: Props) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-[4%] gap-y-6 sm:grid-cols-3 2xl:gap-x-[4.5%]">
      {products.map((product) => (
        <ProductGridItem key={product.slug} product={product} />
      ))}
    </div>
  )
}
