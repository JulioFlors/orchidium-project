'use client'

import type { Species as ProductSpecies } from '@/interfaces'

import Link from 'next/link'
import { PiLeafFill } from 'react-icons/pi'

import { useImageColor, getPresetForColorString } from '@/hooks/useImageColor'
import { getImageUrl } from '@/lib'
import { StockLabel, isProductAvailable } from '@/components'

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
  glowColor?: string | null
  variants?: Array<{
    id?: string
    size?: string
    price?: number
    available: boolean
    quantity: number
    speciesId?: string
  }>
}

interface CatalogSpeciesCardProps {
  species: Species
  index: number
}

export function CatalogSpeciesCard({ species, index }: CatalogSpeciesCardProps) {
  const rawImageUrl = species.images[0]?.url
  const formattedImageUrl = getImageUrl(rawImageUrl)

  const hasStock = species.variants
    ? isProductAvailable(species as unknown as ProductSpecies)
    : true

  // Obtenemos el color dinámico recomendado o de contraste
  const mode = species.glowColor === 'contrast' ? 'contrast' : 'recommended'
  const { lightRgbString, darkRgbString, isLoaded } = useImageColor(
    rawImageUrl ? formattedImageUrl : species.name,
    mode,
  )

  const isCustom = Boolean(
    species.glowColor && !['dynamic', 'recommended', 'contrast'].includes(species.glowColor),
  )

  const presetMatch = isCustom ? getPresetForColorString(species.glowColor!) : null

  const glowLight = isCustom
    ? presetMatch
      ? presetMatch.lightRgbString
      : species.glowColor!
    : lightRgbString

  const glowDark = isCustom
    ? presetMatch
      ? presetMatch.darkRgbString
      : species.glowColor!
    : darkRgbString

  const canShowGlow = isCustom || isLoaded

  return (
    <div
      className="fade-in group relative mb-4 flex flex-col px-1 pt-1"
      data-species-index={index}
      id={`catalog-species--${species.slug}`}
      style={
        {
          '--glow-color': glowLight,
          '--glow-light': glowLight,
          '--glow-dark': glowDark,
        } as React.CSSProperties
      }
    >
      {/* === AMBIENT GLOW === Identico a la tienda publica */}
      {canShowGlow && (
        <div
          aria-hidden="true"
          className="ambient-glow pointer-events-none absolute"
          style={{
            background: 'var(--glow-color)',
            zIndex: 0,
          }}
        />
      )}

      {/* Contenedor de la Imagen (aspect-square exacto a la tienda) */}
      <div className="focus-product-card relative z-5" id={`${species.slug}__container-image`}>
        <div
          className="relative aspect-square w-full overflow-hidden rounded-xl"
          id={`${species.slug}__main-image`}
        >
          <Link
            aria-label={`Editar taxonomía de ${species.name}`}
            className="relative block h-full w-full outline-none"
            href={`/catalog/${species.slug || species.id}`}
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

          {/* Etiqueta de Agotado si la especie no posee stock comercial disponible */}
          {!hasStock && <StockLabel label="Agotado" />}
        </div>
      </div>

      {/* Detalles del Catálogo (Identicos en tipografía y maquetación a la tienda, sin precio) */}
      <div
        className="relative z-5 flex flex-row justify-between pt-2 pb-1"
        id={`${species.slug}__container-details`}
      >
        <div className="flex flex-col font-bold antialiased" id={`${species.slug}__main-details`}>
          <Link
            className="glow-title tracking-tight text-balance"
            href={`/catalog/${species.slug || species.id}`}
            id={`${species.slug}__link`}
            tabIndex={-1}
          >
            {species.name}
          </Link>
          <div className="flex items-center gap-1">
            <span className="glow-meta font-semibold tracking-wide">
              {species.images.length} {species.images.length === 1 ? 'Foto' : 'Fotos'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
