import { notFound } from 'next/navigation'

import { initialData } from '@/seed/seed'

interface Props {
  params: {
    slug: string
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = params
  const product = initialData.species.find((species) => species.slug === slug)

  if (!product) notFound()

  return (
    <div className="mt-5 mb-20 grid grid-cols-1 gap-3 md:grid-cols-3">
      {/* Slideshow */}
      <div className="col-span-1 bg-rose-400 md:col-span-2">
        <h1>Product Page</h1>
      </div>

      {/* Detalles */}
      <div className="col-span-1 bg-fuchsia-400 px-5">
        <h1 className="text-primary text-xl font-bold antialiased">{product.name}</h1>
      </div>
    </div>
  )
}
