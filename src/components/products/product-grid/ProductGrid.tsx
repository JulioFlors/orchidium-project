import { ProductGridItem } from './ProductGridItem'

import { Species } from '@/interfaces/'

interface Props {
  products: Species[]
  index: number
}

export function ProductGrid({ products, index }: Props) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-[4%] gap-y-6 sm:grid-cols-3 2xl:gap-x-[4.5%]">
      {products.map((product) => (
        <ProductGridItem key={product.slug} index={index} product={product} />
      ))}
    </div>
  )
}
