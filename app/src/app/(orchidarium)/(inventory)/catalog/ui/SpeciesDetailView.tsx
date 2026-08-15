'use client'

import type { PlantType } from '@package/database'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PiTrashFill } from 'react-icons/pi'
import { MdSave, MdClose } from 'react-icons/md'

import {
  Heading,
  Button,
  ImageUploader,
  FormField,
  Input,
  SelectDropdown,
  Textarea,
  Modal,
} from '@/components'
import {
  createSpecies,
  updateSpecies,
  deleteSpecies,
  addSpeciesImage,
  deleteSpeciesImage,
  reorderSpeciesImages,
} from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'
import { getImageUrl } from '@/lib'
import { getDominantVibrantColor, useImageColor, PRESET_COLORS } from '@/hooks/useImageColor'

interface SpeciesImage {
  id: string
  url: string
  position?: number
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
  glowColor?: string | null
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

const PLANT_TYPE_FOLDERS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'adenium_obesum',
  BROMELIAD: 'bromeliads',
  CACTUS: 'cactus',
  ORCHID: 'orchids',
  SUCCULENT: 'succulents',
}

interface SpeciesImageCardProps {
  img: SpeciesImage
  index: number
  isDragging: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDrop: () => void
  onMakePrimary: () => void
  onMarkToDelete: () => void
}

function SpeciesImageCard({
  img,
  index,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onMakePrimary,
  onMarkToDelete,
}: SpeciesImageCardProps) {
  const imageUrl = getImageUrl(img.url)

  return (
    <div
      className={`isolate bg-surface border-input-outline group relative aspect-square cursor-grab overflow-hidden rounded-xl border transition-all active:cursor-grabbing ${
        isDragging
          ? 'scale-95 border-dashed border-emerald-500 opacity-30'
          : 'hover:scale-[1.02] hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
      draggable="true"
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <img
        alt="Especie"
        className="pointer-events-none h-full w-full object-cover select-none"
        src={imageUrl}
      />

      {/* Footer no interactivo para la foto Principal */}
      {index === 0 && (
        <div className="bg-canvas/95 text-primary border-input-outline absolute bottom-0 left-0 z-2 w-full truncate border-t px-1 py-1 text-center text-[10px] font-semibold tds-xs:text-xs">
          Principal
        </div>
      )}

      {/* Footer interactivo para Destacar una foto */}
      {index !== 0 && (
        <button
          className="bg-canvas/95 hover:bg-canvas text-primary border-input-outline absolute bottom-0 left-0 z-2 w-full cursor-pointer truncate border-t px-1 py-1 text-center text-[10px] font-semibold opacity-100 transition-all focus:outline-none tds-sm:opacity-0 tds-sm:group-hover:opacity-100 tds-xs:text-xs"
          title="Establecer como imagen de portada"
          type="button"
          onClick={onMakePrimary}
        >
          Destacar
        </button>
      )}

      {/* Botón de Eliminar */}
      <button
        className="bg-canvas/95 hover:bg-canvas text-primary absolute top-2 right-2 z-3 cursor-pointer rounded-full p-1 opacity-100 shadow-md transition-all focus:outline-none tds-sm:opacity-0 tds-sm:group-hover:opacity-100 tds-xs:p-1.5"
        title="Eliminar imagen"
        type="button"
        onClick={onMarkToDelete}
      >
        <MdClose className="h-3.5 w-3.5 tds-xs:h-4 tds-xs:w-4" />
      </button>
    </div>
  )
}

export function SpeciesDetailView({ initialSpecies, genera }: SpeciesDetailViewProps) {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  // Carpeta estructurada en R2 para subidas
  const plantTypeFolder = initialSpecies
    ? PLANT_TYPE_FOLDERS[initialSpecies.genus.type] || 'others'
    : 'others'
  const genusSlug = initialSpecies
    ? initialSpecies.genus.name.toLowerCase().replace(/\s+/g, '-')
    : ''
  const speciesSlug = initialSpecies ? initialSpecies.slug : ''
  const uploaderFolder = `plants/${plantTypeFolder}/${genusSlug}/${speciesSlug}`

  // Estado del Tipo de Planta seleccionado
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType>(() => {
    if (initialSpecies) {
      return initialSpecies.genus.type
    }

    return genera[0]?.type ?? 'ORCHID'
  })

  // Estado del formulario
  const [form, setForm] = useState(() => {
    if (initialSpecies) {
      return {
        name: initialSpecies.name,
        genusId: initialSpecies.genusId,
        description: initialSpecies.description ?? '',
        glowColor: initialSpecies.glowColor ?? 'dynamic',
      }
    }

    return {
      name: '',
      genusId: genera[0]?.id ?? '',
      description: '',
      glowColor: 'dynamic',
    }
  })

  // Estado local de imágenes y pendientes de eliminación
  const [images, setImages] = useState<SpeciesImage[]>(() => initialSpecies?.images ?? [])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [isOrderDirty, setIsOrderDirty] = useState(false)

  // Estados de Modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)

  // Filtrar los géneros por tipo de planta
  const filteredGenera = genera.filter((g) => g.type === selectedPlantType)

  function handlePlantTypeChange(type: PlantType) {
    setSelectedPlantType(type)
    const firstGenusOfType = genera.find((g) => g.type === type)

    setForm((p) => ({ ...p, genusId: firstGenusOfType?.id ?? '' }))
  }

  // Detección de cambios (isDirty)
  const isFormDirty = initialSpecies
    ? form.name !== initialSpecies.name ||
      form.genusId !== initialSpecies.genusId ||
      form.description !== (initialSpecies.description ?? '') ||
      form.glowColor !== (initialSpecies.glowColor ?? 'dynamic')
    : form.name !== '' ||
      form.genusId !== (genera[0]?.id ?? '') ||
      form.description !== '' ||
      form.glowColor !== 'dynamic'

  const isDirty = isFormDirty || isOrderDirty || imagesToDelete.length > 0

  // Salir / Cancelar
  function handleBackClick() {
    if (isDirty) {
      setIsExitModalOpen(true)
    } else {
      const targetHash = initialSpecies?.slug ? `#catalog-species--${initialSpecies.slug}` : ''

      router.push(`/catalog${targetHash}`)
      router.refresh()
    }
  }

  function handleConfirmExit() {
    setIsExitModalOpen(false)

    const targetHash = initialSpecies?.slug ? `#catalog-species--${initialSpecies.slug}` : ''

    router.push(`/catalog${targetHash}`)
    router.refresh()
  }

  // Guardar Cambios / Crear Especie
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
      // 1. Procesar eliminaciones pendientes de imágenes
      if (imagesToDelete.length > 0) {
        for (const imgId of imagesToDelete) {
          await deleteSpeciesImage(imgId)
        }
        setImagesToDelete([])
      }

      // 2. Procesar reordenamiento de imágenes si cambió
      if (isOrderDirty && initialSpecies) {
        const orderedIds = images.map((img) => img.id)

        await reorderSpeciesImages(initialSpecies.id, orderedIds)
        setIsOrderDirty(false)
      }

      // 3. Guardar datos de la especie
      const result = initialSpecies
        ? await updateSpecies(initialSpecies.id, form)
        : await createSpecies(form)

      if (!result.ok) {
        addToast(result.message ?? 'Error al guardar.', 'error')

        return
      }

      addToast(
        initialSpecies
          ? 'Especie y galería actualizadas correctamente.'
          : 'Especie creada correctamente. Ahora puedes añadir imágenes.',
        'success',
      )

      if (!initialSpecies && result.species) {
        router.push(`/catalog/${result.species.slug || result.species.id}`)
      } else {
        const targetSlug = result.species?.slug || initialSpecies?.slug
        const targetHash = targetSlug ? `#catalog-species--${targetSlug}` : ''

        router.push(`/catalog${targetHash}`)
        router.refresh()
      }
    })
  }

  // Eliminar Especie
  function handleConfirmDeleteSpecies() {
    if (!initialSpecies) return

    if (initialSpecies._count.plants > 0) {
      addToast(
        `No se puede eliminar: tiene ${initialSpecies._count.plants} activos biológicos asociados.`,
        'warning',
      )
      setIsDeleteModalOpen(false)

      return
    }

    startTransition(async () => {
      const result = await deleteSpecies(initialSpecies.id)

      if (!result.ok) {
        addToast(result.message ?? 'Error al eliminar.', 'error')

        return
      }

      addToast('Especie eliminada correctamente.', 'success')
      setIsDeleteModalOpen(false)
      router.push('/catalog')
      router.refresh()
    })
  }

  // Subida de imagen
  async function onImageUploaded(image: { url: string; key: string }) {
    if (!initialSpecies) return

    const result = await addSpeciesImage(initialSpecies.id, image.url)

    if (result.ok && result.image) {
      const newImg = result.image as SpeciesImage

      setImages((prev) => [...prev, newImg])
      addToast('Imagen vinculada exitosamente.', 'success')

      // Sugerir color si es la primera
      if (images.length === 0) {
        const img = new Image()

        img.crossOrigin = 'anonymous'
        img.src = getImageUrl(image.url)
        img.onload = () => {
          const rgb = getDominantVibrantColor(img)

          if (rgb) {
            const suggestedColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`

            setForm((p) => ({ ...p, glowColor: suggestedColor }))
          }
        }
      }

      router.refresh()
    } else {
      addToast(result.message ?? 'Error al vincular imagen.', 'error')
    }
  }

  // Marcar imagen para eliminar (sin borrar de BD hasta Guardar Cambios)
  function handleMarkImageToDelete(imageId: string) {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
    setImagesToDelete((prev) => [...prev, imageId])
  }

  // Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  function handleDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null)

      return
    }

    const updatedImages = [...images]
    const [movedImage] = updatedImages.splice(draggedIndex, 1)

    updatedImages.splice(index, 0, movedImage)

    setImages(updatedImages)
    setDraggedIndex(null)
    setIsOrderDirty(true)
  }

  function handleMakePrimary(index: number) {
    if (index === 0) return

    const updatedImages = [...images]
    const [movedImage] = updatedImages.splice(index, 1)

    updatedImages.unshift(movedImage)

    setImages(updatedImages)
    setIsOrderDirty(true)
  }

  // Extraer el color recomendado y de contraste de la primera foto de la lista local
  const primaryImageUrl = images[0] ? getImageUrl(images[0].url) : ''
  const recommendedResult = useImageColor(primaryImageUrl, 'recommended')
  const contrastResult = useImageColor(primaryImageUrl, 'contrast')

  // Mapeo retrocompatible para 'dynamic'
  const selectedGlowValue = form.glowColor === 'dynamic' ? 'recommended' : form.glowColor

  const activePreviewColor =
    selectedGlowValue === 'recommended'
      ? recommendedResult.lightColor
        ? `rgb(${recommendedResult.lightColor.r}, ${recommendedResult.lightColor.g}, ${recommendedResult.lightColor.b})`
        : 'rgb(5, 150, 105)'
      : selectedGlowValue === 'contrast'
        ? contrastResult.lightColor
          ? `rgb(${contrastResult.lightColor.r}, ${contrastResult.lightColor.g}, ${contrastResult.lightColor.b})`
          : 'rgb(192, 38, 211)'
        : form.glowColor

  const glowColorOptions = [
    {
      value: 'recommended',
      label: `Recomendado: ${recommendedResult.presetName || 'Cargando...'}`,
      color: recommendedResult.lightColor
        ? `rgb(${recommendedResult.lightColor.r}, ${recommendedResult.lightColor.g}, ${recommendedResult.lightColor.b})`
        : 'rgb(5, 150, 105)',
    },
    {
      value: 'contrast',
      label: `Contraste: ${contrastResult.presetName || 'Cargando...'}`,
      color: contrastResult.lightColor
        ? `rgb(${contrastResult.lightColor.r}, ${contrastResult.lightColor.g}, ${contrastResult.lightColor.b})`
        : 'rgb(192, 38, 211)',
    },
    ...PRESET_COLORS.map((preset) => ({
      value: preset.lightRgbString,
      label: preset.name,
      color: preset.lightRgbString,
    })),
    ...(form.glowColor &&
    !['dynamic', 'recommended', 'contrast'].includes(form.glowColor) &&
    !PRESET_COLORS.some((p) => p.lightRgbString === form.glowColor)
      ? [
          {
            value: form.glowColor,
            label: `Personalizado: ${form.glowColor}`,
            color: form.glowColor,
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header estandarizado */}
      <Heading
        action={
          initialSpecies ? (
            <Button
              className="tds-sm:w-auto flex w-full items-center justify-center gap-2"
              disabled={isPending}
              size="sm"
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <PiTrashFill className="mr-1.5 h-4 w-4" />
              Eliminar Especie
            </Button>
          ) : null
        }
        description={
          initialSpecies
            ? 'Gestión taxonómica y jerarquía de imágenes'
            : 'Ficha taxonómica para catálogo'
        }
        title={initialSpecies ? initialSpecies.name : 'Crear Nueva Especie'}
      />

      {/* Grid del Formulario (Galería a la izquierda, Formulario a la derecha) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Galería de Fotos (Columna Izquierda) */}
        <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-2xl border p-6 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800/50">
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
              <ImageUploader folder={uploaderFolder} onUploaded={onImageUploaded} />

              {images.length === 0 ? (
                <p className="text-secondary text-center text-xs italic opacity-60">
                  No hay imágenes registradas para esta especie.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, index) => (
                    <SpeciesImageCard
                      key={img.id}
                      img={img}
                      index={index}
                      isDragging={draggedIndex === index}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragStart={() => handleDragStart(index)}
                      onDrop={() => handleDrop(index)}
                      onMakePrimary={() => handleMakePrimary(index)}
                      onMarkToDelete={() => handleMarkImageToDelete(img.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formulario de Información (Columna Derecha) */}
        <div className="bg-canvas border-input-outline flex flex-col gap-6 rounded-2xl border p-6 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800/50">
            <h2 className="text-primary text-lg font-bold">Información Taxonómica</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField htmlFor="species-name" label="Nombre Científico *">
                <Input
                  id="species-name"
                  placeholder="Ej: Cattleya trianae"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </FormField>
            </div>

            <div>
              <FormField htmlFor="plant-type" label="Tipo de Planta *">
                <SelectDropdown
                  id="plant-type"
                  options={Object.entries(PLANT_TYPE_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={selectedPlantType}
                  onChange={(val) => handlePlantTypeChange(val as PlantType)}
                />
              </FormField>
            </div>

            <div>
              <FormField htmlFor="species-genus" label="Género *">
                <SelectDropdown
                  emptyMessage="No hay géneros disponibles"
                  id="species-genus"
                  options={filteredGenera.map((g) => ({
                    value: g.id,
                    label: g.name,
                  }))}
                  placeholder="Selecciona un género..."
                  value={form.genusId}
                  onChange={(val) => setForm((p) => ({ ...p, genusId: val as string }))}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField htmlFor="species-glow" label="Color de fondo">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <SelectDropdown
                      id="species-glow"
                      options={glowColorOptions}
                      value={selectedGlowValue}
                      onChange={(val) => setForm((p) => ({ ...p, glowColor: val as string }))}
                    />
                  </div>
                  <div
                    className="border-input-outline flex h-9 w-9 items-center justify-center rounded-lg border shadow-inner transition-colors duration-300"
                    style={{ backgroundColor: activePreviewColor }}
                    title={`Color activo: ${activePreviewColor}`}
                  />
                </div>
              </FormField>
            </div>
          </div>

          <FormField htmlFor="species-desc" label="Descripción">
            <Textarea
              className="min-h-35 resize-none"
              id="species-desc"
              placeholder="Detalles sobre cuidados, origen, hábitat"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </FormField>
        </div>
      </div>

      {/* Botones de acción modulares al final */}
      <div className="flex w-full items-center justify-end gap-2 border-t border-zinc-100 pt-6 tds-xs:gap-3 dark:border-zinc-800/50">
        <Button
          className="w-auto! shrink-0 text-xs font-semibold whitespace-nowrap tds-xs:text-sm"
          size="default"
          variant="ghost"
          onClick={handleBackClick}
        >
          {isDirty ? 'Cancelar' : 'Salir'}
        </Button>
        <Button
          className="w-auto! shrink-0 text-xs font-semibold whitespace-nowrap tds-xs:text-sm"
          disabled={!isDirty || isPending}
          isLoading={isPending}
          size="default"
          variant="primary"
          onClick={handleSave}
        >
          <MdSave className="mr-1.5 hidden h-4 w-4 tds-xs:inline-block" />
          {initialSpecies ? 'Guardar Cambios' : 'Crear Especie'}
        </Button>
      </div>

      {/* Modal de Confirmación de Eliminación de Especie */}
      <Modal
        isOpen={isDeleteModalOpen}
        size="md"
        title="Eliminar Especie"
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-secondary text-sm">
            Esta acción eliminará permanentemente la especie
            <br />
            <strong>{initialSpecies?.name}</strong>
            <br />
            ¿Estás seguro de que deseas continuar?
          </p>
          <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              isLoading={isPending}
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteSpecies}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación de Salida con Cambios sin Guardar */}
      <Modal
        isOpen={isExitModalOpen}
        size="md"
        title="Descartar Cambios"
        onClose={() => setIsExitModalOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-secondary text-sm">
            Tienes modificaciones sin guardar.
            <br />
            Si sales ahora, se perderán estos cambios.
          </p>
          <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsExitModalOpen(false)}>
              Continuar Editando
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmExit}>
              Salir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
