'use client'

import { useState } from 'react'
import { PiArrowUpBold, PiArrowDownBold, PiTrashBold, PiStarFill } from 'react-icons/pi'
import Image from 'next/image'
import { getImageUrl } from '@/lib'
import { Badge } from '@/components'

interface SpeciesItem {
  id: string
  name: string
  images: string[]
  genus: { name: string; type: string }
}

interface FeaturedSpeciesManagerProps {
  allSpecies: SpeciesItem[]
  featuredIds: string[]
  onChange: (newIds: string[]) => void
}

export function FeaturedSpeciesManager({
  allSpecies,
  featuredIds,
  onChange,
}: FeaturedSpeciesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Especies que están actualmente destacadas en orden
  const featuredSpecies = featuredIds
    .map((id) => allSpecies.find((s) => s.id === id))
    .filter((s): s is SpeciesItem => !!s)

  // Especies no destacadas, filtradas por búsqueda
  const availableSpecies = allSpecies
    .filter((s) => !featuredIds.includes(s.id))
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleAdd = (id: string) => {
    if (featuredIds.length >= 9) {
      alert('Máximo de 9 especies destacadas alcanzado.')
      return
    }
    const nextIds = [...featuredIds, id]
    onChange(nextIds)
  }

  const handleRemove = (id: string) => {
    const nextIds = featuredIds.filter((fid) => fid !== id)
    onChange(nextIds)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const nextIds = [...featuredIds]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= nextIds.length) return

    // Intercambiar
    const temp = nextIds[index]
    nextIds[index] = nextIds[targetIndex]
    nextIds[targetIndex] = temp

    onChange(nextIds)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de adición */}
      <div className="border-input-outline bg-surface/20 flex flex-col gap-4 rounded-xl border p-4">
        <h3 className="text-primary text-sm font-semibold flex items-center gap-2">
          <PiStarFill className="text-yellow-500" />
          Añadir a Destacados (Máximo 9)
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Buscar especie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base sm:max-w-xs"
          />
          <div className="flex-1">
            <select
              className="input-base w-full"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAdd(e.target.value)
                  e.target.value = ''
                }
              }}
            >
              <option value="" disabled>
                {featuredIds.length >= 9 ? 'Límite de 9 alcanzado' : 'Selecciona una especie para destacar...'}
              </option>
              {availableSpecies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.genus.name} {s.name} ({s.genus.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Destacados Reordenables */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuredSpecies.map((s, index) => {
          const imgUrl = s.images[0] || 'plants/orchids/orchids.webp'
          return (
            <div
              key={s.id}
              className="group relative overflow-hidden rounded-xl border border-input-outline bg-surface/10 p-4 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/5"
            >
              {/* Glow background on hover */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-300 group-hover:to-emerald-500/5 group-hover:opacity-100" />

              <div className="flex items-center gap-4">
                {/* Posición en el landing */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-mono text-sm font-black dark:text-emerald-400">
                  {index + 1}
                </div>

                {/* Miniatura */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-input-outline">
                  <Image
                    src={getImageUrl(imgUrl)}
                    alt={s.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                {/* Textos */}
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {s.genus.name}
                  </Badge>
                  <h4 className="text-primary truncate font-bold text-sm leading-tight mt-0.5 font-sans">
                    {s.name}
                  </h4>
                </div>

                {/* Botones de acción y reordenación */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-input-outline text-secondary hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-30 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    title="Subir posición"
                  >
                    <PiArrowUpBold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === featuredSpecies.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-input-outline text-secondary hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-30 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    title="Bajar posición"
                  >
                    <PiArrowDownBold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(s.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10"
                    title="Quitar de destacados"
                  >
                    <PiTrashBold className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {featuredSpecies.length === 0 && (
        <div className="text-secondary/50 py-8 text-center text-sm italic">
          No hay especies destacadas configuradas.
        </div>
      )}
    </div>
  )
}
