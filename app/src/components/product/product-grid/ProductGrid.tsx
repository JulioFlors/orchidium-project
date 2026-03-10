import { ProductGridItem } from './ProductGridItem'

import { Species } from '@/interfaces/'

interface Props {
  products: Species[]
  index: number
}

/**
 * Grid de productos responsiva.
 * Breakpoints: 1col (mobile) → 2col (tds-sm/641px) → 3col (tds-lg/961px) → 4col (tds-2xl/1800px).
 */
export function ProductGrid({ products, index }: Props) {
  return (
    <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-2xl:grid-cols-4 mt-9 grid gap-x-4 gap-y-2">
      {products.map((product, i) => (
        <ProductGridItem key={product.slug} index={index < 0 ? -1 : index + i} product={product} />
      ))}
    </div>
  )
}
