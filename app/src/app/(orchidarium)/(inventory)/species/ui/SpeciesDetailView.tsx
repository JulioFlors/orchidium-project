'use client'

import type { PlantType } from '@package/database'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PiLeafFill, PiImagesFill, PiArrowLeftBold } from 'react-icons/pi'
import { MdSave, MdClose, MdDelete } from 'react-icons/md'

import { Button, ImageUploader } from '@/components'
import {
  createSpecies,
  updateSpecies,
  deleteSpecies,
  addSpeciesImage,
  deleteSpeciesImage,
} from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'
import { getImageUrl } from '@/lib'

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

interface SpeciesImage {
  id: string
  url: string
}

interface Genus {
  id: string
  name: string
  type: PlantType
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

interface SpeciesDetailViewProps {
  initialSpecies?: Species | null
  genera: Genus[]
}

const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'Adenium',
  BROMELIAD: 'Bromelia',
  CACTUS: 'Cactus',
  ORCHID: 'Orquídea',
  SUCCULENT: 'Suculenta',
}

export function SpeciesDetailView({ initialSpecies, genera }: SpeciesDetailViewProps) {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  // Estado del Tipo de Planta seleccionado
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType>(() => {
    if (initialSpecies) {
      return initialSpecies.genus.type
    }

    return genera[0]?.type ?? 'ORCHID'
  })

  // Estado del formulario inicializado con props
  const [form, setForm] = useState(() => {
    if (initialSpecies) {
      return {
        name: initialSpecies.name,
        genusId: initialSpecies.genusId,
        description: initialSpecies.description ?? '',
      }
    }

    return {
      name: '',
      genusId: genera[0]?.id ?? '',
      description: '',
    }
  })

  const [images, setImages] = useState<SpeciesImage[]>(() => initialSpecies?.images ?? [])

  // Filtrar los géneros por el tipo de planta seleccionado
  const filteredGenera = genera.filter((g) => g.type === selectedPlantType)

  // Cambiar el tipo de planta y actualizar automáticamente el género
  function handlePlantTypeChange(type: PlantType) {
    setSelectedPlantType(type)
    const firstGenusOfType = genera.find((g) => g.type === type)

    setForm((p) => ({ ...p, genusId: firstGenusOfType?.id ?? '' }))
  }

  // Detección de cambios (isDirty)
  const isDirty = initialSpecies
    ? form.name !== initialSpecies.name ||
      form.genusId !== initialSpecies.genusId ||
      form.description !== (initialSpecies.description ?? '')
    : form.name !== '' || form.genusId !== (genera[0]?.id ?? '') || form.description !== ''

  // Manejar Salir / Cancelar
  function handleBack() {
    if (isDirty) {
      if (!confirm('Tienes cambios sin guardar. ¿Seguro que deseas salir?')) {
        return
      }
    }
    router.push('/species')
    router.refresh()
  }

  // Guardar Cambios / Crear
  function handleSave() {
    if (!form.name.trim()) {
      addToast('El nombre es obligatorio.', 'warning')

      return
    }
    if (!form.genusId) {
      addToast('El género es obligatorio.', 'warning')

      return
    }

    startTransition(async () => {
      const result = initialSpecies
        ? await updateSpecies(initialSpecies.id, form)
        : await createSpecies(form)

      if (!result.ok) {
        addToast(result.message ?? 'Error al guardar.', 'error')

        return
      }

      addToast(
        initialSpecies
          ? 'Especie actualizada correctamente.'
          : 'Especie creada correctamente. Ahora puedes añadir imágenes.',
        'success',
      )

      if (!initialSpecies && result.species) {
        // Redirigir a la edición de la especie recién creada para poder subir imágenes
        router.push(`/species/${result.species.id}`)
      } else {
        router.push('/species')
        router.refresh()
      }
    })
  }

  // Eliminar Especie
  function handleDelete() {
    if (!initialSpecies) return

    if (initialSpecies._count.plants > 0) {
      addToast(
        `No se puede eliminar: tiene ${initialSpecies._count.plants} activos biológicos asociados.`,
        'warning',
      )

      return
    }

    if (!confirm(`¿Eliminar definitivamente "${initialSpecies.name}" y todas sus imágenes?`)) {
      return
    }

    startTransition(async () => {
      const result = await deleteSpecies(initialSpecies.id)

      if (!result.ok) {
        addToast(result.message ?? 'Error al eliminar.', 'error')

        return
      }

      addToast('Especie eliminada correctamente.', 'success')
      router.push('/species')
      router.refresh()
    })
  }

  // Gestión de Imágenes
  async function onImageUploaded(image: { url: string; key: string }) {
    if (!initialSpecies) return

    const result = await addSpeciesImage(initialSpecies.id, image.url)

    if (result.ok && result.image) {
      const newImg = result.image as SpeciesImage

      setImages((prev) => [...prev, newImg])
      addToast('Imagen vinculada exitosamente.', 'success')
      router.refresh()
    } else {
      addToast(result.message ?? 'Error al vincular imagen.', 'error')
    }
  }

  async function handleRemoveImage(imageId: string) {
    if (!confirm('¿Seguro que deseas eliminar esta imagen?')) return

    const result = await deleteSpeciesImage(imageId)

    if (result.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      addToast('Imagen eliminada correctamente.', 'info')
      router.refresh()
    } else {
      addToast(result.message ?? 'Error al eliminar imagen.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            className="border-input-outline bg-canvas text-primary hover:bg-hover-overlay rounded-xl border p-2.5 transition-colors"
            title="Volver"
            type="button"
            onClick={handleBack}
          >
            <PiArrowLeftBold className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-secondary text-xs font-semibold tracking-wider uppercase opacity-60">
              {initialSpecies ? 'Editar Especie' : 'Nueva Especie'}
            </span>
            <h1 className="text-primary text-2xl font-black tracking-tight sm:text-3xl">
              {initialSpecies ? initialSpecies.name : 'Crear Nueva Especie'}
            </h1>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-3">
          {initialSpecies && (
            <Button disabled={isPending} size="sm" variant="destructive" onClick={handleDelete}>
              <MdDelete className="mr-1.5 h-4 w-4" />
              Eliminar
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleBack}>
            {isDirty ? 'Cancelar' : 'Salir'}
          </Button>
          <Button
            isLoading={isPending}
            size="sm"
            variant={isDirty ? 'primary' : 'secondary'}
            onClick={handleSave}
          >
            <MdSave className="mr-1.5 h-4 w-4" />
            {initialSpecies ? 'Guardar Cambios' : 'Crear Especie'}
          </Button>
        </div>
      </div>

      {/* Grid del Formulario */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario de Información */}
        <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-2xl border p-6 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800/50">
            <PiLeafFill className="text-xl text-emerald-500" />
            <h2 className="text-primary text-lg font-bold">Información Taxonómica</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label className="text-secondary text-sm font-medium" htmlFor="species-name">
                Nombre Científico *
              </label>
              <input
                className="input-base"
                id="species-name"
                placeholder="Ej: Cattleya trianae"
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="plant-type">
                Tipo de Planta *
              </label>
              <select
                className="input-base"
                id="plant-type"
                value={selectedPlantType}
                onChange={(e) => handlePlantTypeChange(e.target.value as PlantType)}
              >
                {Object.entries(PLANT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="species-genus">
                Género *
              </label>
              <select
                className="input-base"
                id="species-genus"
                value={form.genusId}
                onChange={(e) => setForm((p) => ({ ...p, genusId: e.target.value }))}
              >
                {filteredGenera.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-secondary text-sm font-medium" htmlFor="species-desc">
              Descripción
            </label>
            <textarea
              className="input-base min-h-[140px] resize-none"
              id="species-desc"
              placeholder="Detalles sobre cuidados, origen, hábitat..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>

        {/* Galería de Fotos */}
        <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-2xl border p-6">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800/50">
            <PiImagesFill className="text-xl text-emerald-500" />
            <h2 className="text-primary text-lg font-bold">Galería de Fotos</h2>
          </div>

          {!initialSpecies ? (
            <div className="bg-surface border-input-outline flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <span className="mb-2 text-3xl">📸</span>
              <p className="text-secondary px-4 text-xs">
                Primero debes registrar la especie para habilitar la subida de imágenes a R2.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <ImageUploader
                folder={`species/${initialSpecies.slug}`}
                onUploaded={onImageUploaded}
              />

              {images.length === 0 ? (
                <p className="text-secondary text-center text-xs italic opacity-60">
                  No hay imágenes registradas para esta especie.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="bg-surface border-input-outline group relative aspect-square overflow-hidden rounded-xl border"
                    >
                      <img
                        alt="Especie"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        src={getImageUrl(img.url)}
                      />
                      <button
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow-md transition-opacity duration-200 hover:bg-red-600 focus:outline-none"
                        title="Eliminar imagen"
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                      >
                        <MdClose className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
