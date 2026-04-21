'use client'

import { useState, useTransition } from 'react'
import { PiLeafFill, PiImagesFill } from 'react-icons/pi'
import { MdEdit, MdDelete, MdAdd, MdClose } from 'react-icons/md'

import {
  Modal,
  Button,
  Badge,
  ImageUploader,
  Heading,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ActionMenu,
} from '@/components'
import {
  createSpecies,
  updateSpecies,
  deleteSpecies,
  addSpeciesImage,
  deleteSpeciesImage,
} from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

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

interface SpeciesViewProps {
  initialSpecies: Species[]
  genera: Genus[]
}

const EMPTY_FORM = {
  name: '',
  genusId: '',
  description: '',
}

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────

export function SpeciesView({ initialSpecies, genera }: SpeciesViewProps) {
  const [speciesList, setSpeciesList] = useState<Species[]>(initialSpecies)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Species | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const { addToast } = useToastStore()

  // ── Abrir modal ────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, genusId: genera[0]?.id ?? '' })
    setIsModalOpen(true)
  }

  function openEdit(species: Species) {
    setEditTarget(species)
    setForm({
      name: species.name,
      genusId: species.genusId,
      description: species.description ?? '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditTarget(null)
  }

  // ── Guardar Info (Texto) ───────────────────────────────────
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
      const result = editTarget
        ? await updateSpecies(editTarget.id, form)
        : await createSpecies(form)

      if (!result.ok) {
        addToast(result.message ?? 'Error al guardar.', 'error')

        return
      }

      const updatedSpecies = result.species as Species

      if (editTarget) {
        setSpeciesList((prev) =>
          prev.map((s) =>
            s.id === editTarget.id
              ? { ...s, ...updatedSpecies, genus: genera.find((g) => g.id === form.genusId)! }
              : s,
          ),
        )
        addToast('Especie actualizada correctamente.', 'success')
      } else {
        setSpeciesList((prev) =>
          [
            ...prev,
            {
              ...updatedSpecies,
              genus: genera.find((g) => g.id === form.genusId)!,
              images: [],
              _count: { variants: 0, plants: 0 },
            },
          ].sort((a, b) => a.name.localeCompare(b.name)),
        )
        addToast('Especie creada. Ahora puedes añadir imágenes.', 'success')
        // Si acabamos de crear, podemos abrir el target para editar imágenes
        setEditTarget({
          ...updatedSpecies,
          genus: genera.find((g) => g.id === form.genusId)!,
          images: [],
          _count: { variants: 0, plants: 0 },
        })
      }
    })
  }

  // ── Eliminar Especie ────────────────────────────────────────
  function handleDelete(species: Species) {
    if (species._count.plants > 0) {
      addToast(
        `No se puede eliminar: tiene ${species._count.plants} activos biológicos asociados.`,
        'warning',
      )

      return
    }
    if (!confirm(`¿Eliminar "${species.name}" y todas sus imágenes de R2?`)) return

    startTransition(async () => {
      const result = await deleteSpecies(species.id)

      if (!result.ok) {
        addToast(result.message ?? 'Error al eliminar.', 'error')

        return
      }
      setSpeciesList((prev) => prev.filter((s) => s.id !== species.id))
      addToast('Especie y sus imágenes eliminadas correctamente.', 'success')
    })
  }

  // ── Gestión de Imágenes ─────────────────────────────────────
  async function onImageUploaded(image: { url: string; key: string }) {
    if (!editTarget) return

    const result = await addSpeciesImage(editTarget.id, image.url)

    if (result.ok && result.image) {
      const newImg = result.image as SpeciesImage
      const updatedImages = [...editTarget.images, newImg]

      // Actualizar estado local
      const updatedTarget = { ...editTarget, images: updatedImages }

      setEditTarget(updatedTarget)
      setSpeciesList((prev) => prev.map((s) => (s.id === editTarget.id ? updatedTarget : s)))
      addToast('Imagen vinculada exitosamente.', 'success')
    } else {
      addToast(result.message ?? 'Error al vincular imagen en BD.', 'error')
    }
  }

  async function handleRemoveImage(imageId: string) {
    if (!editTarget) return

    const result = await deleteSpeciesImage(imageId)

    if (result.ok) {
      const updatedImages = editTarget.images.filter((img) => img.id !== imageId)
      const updatedTarget = { ...editTarget, images: updatedImages }

      setEditTarget(updatedTarget)
      setSpeciesList((prev) => prev.map((s) => (s.id === editTarget.id ? updatedTarget : s)))
      addToast('Imagen eliminada.', 'info')
    } else {
      addToast(result.message ?? 'Error al eliminar imagen.', 'error')
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Header Limpio */}
      <Heading
        action={
          <Button id="btn-create-species" size="sm" onClick={openCreate}>
            <MdAdd className="mr-1.5 h-4 w-4" />
            Nueva Especie
          </Button>
        }
        description={`${speciesList.length} especies registradas en el catálogo biológico`}
        title="Especies"
      />

      {/* Grid de Cards */}
      <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-xl:grid-cols-4 grid grid-cols-1 gap-6">
        {speciesList.length === 0 ? (
          <div className="bg-canvas border-input-outline tds-sm:col-span-full rounded-xl border border-dashed py-24 text-center">
            <span className="text-secondary text-sm">No hay especies registradas.</span>
          </div>
        ) : (
          speciesList.map((species) => (
            <Card
              key={species.id}
              className="bg-canvas border-input-outline group relative flex flex-col overflow-hidden"
            >
              {/* Imagen / Miniatura */}
              <div className="bg-hover-overlay relative aspect-16/10 w-full overflow-hidden">
                {species.images[0] ? (
                  <img
                    alt={species.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={species.images[0].url}
                  />
                ) : (
                  <div className="text-secondary flex h-full items-center justify-center opacity-20">
                    <PiLeafFill size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <ActionMenu
                    items={[
                      {
                        label: 'Editar / Imágenes',
                        icon: <MdEdit />,
                        onClick: () => openEdit(species),
                      },
                      {
                        label: 'Eliminar',
                        icon: <MdDelete />,
                        onClick: () => handleDelete(species),
                        variant: 'destructive',
                      },
                    ]}
                    triggerClassName="bg-white/80 dark:bg-black/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              <CardHeader className="border-none p-4 pb-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{species.genus.name}</Badge>
                    {species._count.variants > 0 && (
                      <Badge className="animate-in fade-in fill-mode-both" variant="green">
                        En Tienda
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-primary truncate text-lg">{species.name}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="mt-auto p-4 pt-3">
                <div className="border-input-outline flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    <PiImagesFill className="text-secondary opacity-40" />
                    <span className="text-secondary text-xs font-medium">
                      {species.images.length} fotos
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-mono text-xs font-bold">
                      {species._count.plants}
                    </span>
                    <span className="text-secondary text-[10px] font-medium uppercase opacity-60">
                      Plantas
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Modal
        footer={
          <>
            <Button disabled={isPending} variant="secondary" onClick={closeModal}>
              Cerrar
            </Button>
            <Button id="btn-save-species" isLoading={isPending} onClick={handleSave}>
              {editTarget ? 'Guardar Cambios' : 'Crear Especie'}
            </Button>
          </>
        }
        icon={<PiLeafFill />}
        isOpen={isModalOpen}
        size="lg"
        title={editTarget ? `Especie: ${editTarget.name}` : 'Nueva Especie'}
        onClose={closeModal}
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Columna Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-primary text-sm font-black tracking-widest uppercase opacity-60">
              Base Info
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="species-name">
                Nombre Completo *
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
              <label className="text-secondary text-sm font-medium" htmlFor="species-genus">
                Género *
              </label>
              <select
                className="input-base"
                id="species-genus"
                value={form.genusId}
                onChange={(e) => setForm((p) => ({ ...p, genusId: e.target.value }))}
              >
                {genera.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-secondary text-sm font-medium" htmlFor="species-desc">
                Descripción (Opcional)
              </label>
              <textarea
                className="input-base min-h-[100px] resize-none"
                id="species-desc"
                placeholder="Detalles sobre cuidados, origen..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Columna Imágenes */}
          <div className="flex flex-col gap-4">
            <h3 className="text-primary text-sm font-black tracking-widest uppercase opacity-60">
              Galería de Imágenes
            </h3>

            {!editTarget ? (
              <div className="border-input-outline bg-hover-overlay flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8">
                <span className="mb-2 text-3xl">📸</span>
                <p className="text-secondary text-center text-xs">
                  Primero crea la especie para poder subir imágenes.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ImageUploader folder={`species/${editTarget.slug}`} onUploaded={onImageUploaded} />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {editTarget.images.map((img) => (
                    <div
                      key={img.id}
                      className="bg-surface relative aspect-square overflow-hidden rounded-lg"
                    >
                      <img alt="Especie" className="h-full w-full object-cover" src={img.url} />
                      <button
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
                        title="Eliminar imagen"
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                      >
                        <MdClose className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
