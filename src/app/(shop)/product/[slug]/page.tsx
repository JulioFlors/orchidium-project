import { notFound } from 'next/navigation'

import { initialData } from '@/seed'

type Params = Promise<{ slug: string }>

export async function generateMetadata(props: { params: Params }) {
  const params = await props.params
  const slug = params.slug

  const product = initialData.species.find((species) => species.slug === slug)

  if (!product) {
    return {
      title: '404 - Not Found',
    }
  }

  return {
    title: product.name,
    description: product.genus.name,
  }
}

export default async function ProductBySlugPage(props: { params: Params }) {
  const params = await props.params
  const slug = params.slug
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
