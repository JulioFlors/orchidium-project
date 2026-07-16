'use client'

import Image from 'next/image'
import clsx from 'clsx'
import { PiCheckCircleFill, PiImageSquareFill } from 'react-icons/pi'

import { getImageUrl } from '@/lib'

interface MediaPickerProps {
  images: string[]
  selectedImage: string | null
  onSelect: (url: string) => void
  aspectRatio?: 'video' | 'square' | 'hero' | 'category'
}

export function MediaPicker({
  images,
  selectedImage,
  onSelect,
  aspectRatio = 'video',
}: MediaPickerProps) {
  const previewClass = clsx(
    'relative overflow-hidden rounded-xl border border-input-outline bg-surface/20 transition-all duration-300 w-full',
    {
      'aspect-video': aspectRatio === 'video',
      'aspect-square': aspectRatio === 'square',
      'aspect-[21/9]': aspectRatio === 'hero',
      'aspect-[4/3]': aspectRatio === 'category',
    },
  )

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Galería de miniaturas */}
      <div className="flex flex-col gap-3">
        <span className="text-secondary text-sm font-semibold tracking-wide uppercase opacity-70">
          Imágenes disponibles en R2
        </span>
        {images.length === 0 ? (
          <div className="border-input-outline flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-sm text-zinc-500">
            <PiImageSquareFill className="mb-2 h-8 w-8 opacity-40" />
            No hay imágenes registradas para esta especie.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((url) => {
              const isSelected = selectedImage === url

              return (
                <button
                  key={url}
                  className={clsx(
                    'group bg-surface relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-300 focus:outline-none',
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-input-outline hover:border-zinc-400 dark:hover:border-zinc-600',
                  )}
                  type="button"
                  onClick={() => onSelect(url)}
                >
                  <Image
                    fill
                    alt="Miniatura"
                    className={clsx(
                      'object-cover transition-all duration-300 group-hover:scale-105',
                      selectedImage && !isSelected && 'opacity-50',
                    )}
                    sizes="(max-width: 768px) 33vw, 15vw"
                    src={getImageUrl(url)}
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 z-10 text-emerald-500">
                      <PiCheckCircleFill className="h-5 w-5 rounded-full bg-white dark:bg-zinc-900" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Previsualización del encuadre */}
      <div className="flex flex-col gap-3">
        <span className="text-secondary text-sm font-semibold tracking-wide uppercase opacity-70">
          Previsualización del encuadre
        </span>
        <div className={previewClass}>
          {selectedImage ? (
            <Image
              fill
              alt="Previsualización"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              src={getImageUrl(selectedImage)}
            />
          ) : (
            <div className="flex h-full min-h-[160px] w-full flex-col items-center justify-center p-6 text-center text-sm text-zinc-500">
              <PiImageSquareFill className="mb-2 h-8 w-8 opacity-30" />
              Selecciona una imagen de la galería para ver el encuadre
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
