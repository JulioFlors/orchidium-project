'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'

const categories = [
  {
    name: 'Orquídeas',
    slug: 'orchids',
    description: 'Especies exóticas de colección y cultivo de altura.',
    image: '/plants/orchids/orchids.webp',
  },
  {
    name: 'Rosas del Desierto',
    slug: 'adenium_obesum',
    description: 'Bonsáis naturales con floraciones espectaculares.',
    image: '/plants/adenium_obesum/marbella_0_2000.webp',
  },
  {
    name: 'Cactus',
    slug: 'cactus',
    description: 'Especies desérticas de bajo mantenimiento y formas únicas.',
    image: '/plants/cactus/mammillaria-vetula-ssp-gracilis_0_2000.webp',
  },
  {
    name: 'Suculentas',
    slug: 'succulents',
    description: 'Hojas carnosas y arreglos geométricos vibrantes.',
    image: '/plants/succulents/crassula-capitella-campfire_0_2000.webp',
  },
]

export function CategoriesSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-primary text-3xl font-bold tracking-tight sm:text-4xl">
            Explora Nuestras Colecciones
          </h2>
          <p className="text-secondary mt-4 text-lg">
            Selecciona tu variedad favorita y descubre plantas aclimatadas con garantía botánica de
            crecimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.slug}
              className="group border-input-outline/50 bg-surface dark:border-input-outline/20 relative overflow-hidden rounded-3xl border shadow-md"
              initial={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: '-50px' }}
              whileInView={{ opacity: 1, scale: 1 }}
            >
              {/* Imagen de fondo con zoom interactivo */}
              <div className="relative h-80 w-full overflow-hidden">
                <Image
                  fill
                  alt={category.name}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={index === 0}
                  sizes="(max-w-768px) 100vw, 25vw"
                  src={category.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>

              {/* Contenido flotante con Glassmorphism */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-black/10 p-6 text-white backdrop-blur-[2px]">
                <h3 className="text-xl font-bold tracking-tight">{category.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-300">
                  {category.description}
                </p>
                <div className="mt-4">
                  <Link
                    className="inline-flex items-center text-sm font-semibold text-emerald-400 transition-colors group-hover:text-emerald-300"
                    href={`/category/plants/${category.slug}`}
                  >
                    Ver Colección{' '}
                    <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
