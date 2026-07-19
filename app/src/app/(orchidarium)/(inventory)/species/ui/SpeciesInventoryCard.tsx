'use client'

import Link from 'next/link'
import { PiLeafFill, PiImagesFill } from 'react-icons/pi'

import { Badge, Card, CardHeader, CardTitle, CardContent } from '@/components'
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
  _count: {
    variants: number
    plants: number
  }
}

interface SpeciesInventoryCardProps {
  species: Species
  index: number
}

export function SpeciesInventoryCard({ species, index }: SpeciesInventoryCardProps) {
  // Obtenemos el color dominante de la imagen para el Ambient Glow
  const rawImageUrl = species.images[0]?.url
  const formattedImageUrl = getImageUrl(rawImageUrl)
  const { color } = useImageColor(rawImageUrl ? formattedImageUrl : '')

  const glowColor = color ? `rgb(${color.r}, ${color.g}, ${color.b})` : 'rgb(16, 185, 129)'

  return (
    <Link
      className="fade-in group relative flex flex-col px-1 pt-1 pb-1 outline-none"
      data-species-index={index}
      href={`/species/${species.id}`}
      id={`species-card--${species.slug}`}
      style={{
        '--glow-color': glowColor,
      } as React.CSSProperties}
    >
      {/* Ambient Glow de fondo */}
      <div
        aria-hidden="true"
        className="ambient-glow pointer-events-none absolute"
        style={{
          background: 'var(--glow-color)',
          zIndex: 0,
        }}
      />

      <Card className="bg-canvas border-input-outline relative z-1 flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg dark:hover:shadow-emerald-950/20">
        {/* Imagen / Miniatura */}
        <div className="bg-hover-overlay relative aspect-16/10 w-full overflow-hidden">
          {rawImageUrl ? (
            <img
              alt={species.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={formattedImageUrl}
            />
          ) : (
            <div className="text-secondary flex h-full items-center justify-center bg-zinc-100/50 opacity-20 dark:bg-zinc-900/50">
              <PiLeafFill size={48} />
            </div>
          )}

          {/* Badge de estado comercial en la imagen */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {species._count.variants > 0 ? (
              <Badge variant="green">En Tienda</Badge>
            ) : (
              <Badge variant="secondary">Solo Catálogo</Badge>
            )}
          </div>
        </div>

        <CardHeader className="border-none p-4 pb-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{species.genus.name}</Badge>
            </div>
            <CardTitle className="text-primary truncate text-lg font-bold transition-colors group-hover:text-emerald-500">
              {species.name}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="mt-auto p-4 pt-3">
          <div className="border-input-outline flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1.5">
              <PiImagesFill className="text-secondary opacity-40" />
              <span className="text-secondary text-xs font-medium">
                {species.images.length} {species.images.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-primary font-mono text-sm font-bold">
                {species._count.plants}
              </span>
              <span className="text-secondary text-[10px] font-semibold uppercase opacity-60">
                Plantas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
