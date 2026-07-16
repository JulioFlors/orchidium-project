'use client'

import Link from 'next/link'
import { PiLeafFill, PiImagesFill } from 'react-icons/pi'

import { useImageColor } from '@/hooks/useImageColor'
import { getImageUrl } from '@/lib'

interface SpeciesImage {
  id: string
  url: string
}

interface Genus {
  id: string
  name: string
}

interface Species {
  id: string
  name: string
  slug: string
  description: string | null
  genusId: string
  genus: Genus
  images: SpeciesImage[]
  glowColor?: string | null // Soporte para color estático guardado en base de datos
}

interface CatalogSpeciesCardProps {
  species: Species
  index: number
}

export function CatalogSpeciesCard({ species, index }: CatalogSpeciesCardProps) {
  const rawImageUrl = species.images[0]?.url
  const formattedImageUrl = getImageUrl(rawImageUrl)

  // Obtenemos el color dinámico por si no hay color guardado estáticamente
  const { color } = useImageColor(rawImageUrl ? formattedImageUrl : '')

  // Determinamos el color de hover (dando prioridad al color guardado en base de datos si existe)
  const glowColor = species.glowColor
    ? species.glowColor
    : color
      ? `rgb(${color.r}, ${color.g}, ${color.b})`
      : 'rgb(128, 128, 128)'

  return (
    <div
      className="fade-in group relative mb-4 flex flex-col px-1 pt-1"
      data-species-index={index}
      id={`catalog-species--${species.slug}`}
    >
      {/* === AMBIENT GLOW === Identico a la tienda publica */}
      <div
        aria-hidden="true"
        className="ambient-glow pointer-events-none absolute"
        style={{
          background: glowColor,
          zIndex: 0,
        }}
      />

      {/* Contenedor de la Imagen (aspect-square exacto a la tienda) */}
      <div className="focus-product-card relative z-5" id={`${species.slug}__container-image`}>
        <div
          className="relative aspect-square w-full overflow-hidden rounded-xl"
          id={`${species.slug}__main-image`}
        >
          <Link
            aria-label={`Editar taxonomía de ${species.name}`}
            className="relative block h-full w-full outline-none"
            href={`/catalog/${species.id}`}
          >
            {rawImageUrl ? (
              <img
                alt={species.name}
                className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                src={formattedImageUrl}
              />
            ) : (
              <div className="text-secondary flex h-full items-center justify-center bg-zinc-100/50 opacity-20 dark:bg-zinc-900/50">
                <PiLeafFill size={48} />
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Detalles del Catálogo (Identicos en tipografía y maquetación a la tienda, sin precio) */}
      <div
        className="relative z-5 flex flex-row justify-between pt-2 pb-1"
        id={`${species.slug}__container-details`}
      >
        <div className="flex flex-col font-bold antialiased" id={`${species.slug}__main-details`}>
          <Link
            className="text-primary tracking-tight text-balance transition-colors hover:text-emerald-500"
            href={`/catalog/${species.id}`}
            id={`${species.slug}__link`}
            tabIndex={-1}
          >
            {species.name}
          </Link>
          <div className="mt-1 flex items-center gap-1 opacity-55">
            <PiImagesFill className="text-secondary" size={10} />
            <span className="text-secondary text-[10px] font-semibold">
              {species.images.length} {species.images.length === 1 ? 'Foto' : 'Fotos'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
