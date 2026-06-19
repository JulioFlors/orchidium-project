'use client'

import type { PlantType } from '@package/database'

import { useState, useTransition } from 'react'
import { PiPlantFill } from 'react-icons/pi'
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md'

import {
  Modal,
  Button,
  Heading,
  Title,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ActionMenu,
} from '@/components'
import { createGenus, updateGenus, deleteGenus } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

interface Genus {
  id: string
  name: string
  type: PlantType
  _count: { species: number }
}

interface GenusViewProps {
  initialGenera: Genus[]
}

const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  ADENIUM_OBESUM: 'Adenium',
  BROMELIAD: 'Bromelia',
  CACTUS: 'Cactus',
  ORCHID: 'Orquídea',
  SUCCULENT: 'Suculenta',
}

const EMPTY_FORM = { name: '', type: 'ORCHID' as PlantType }

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────

export function GenusView({ initialGenera }: GenusViewProps) {
  const [genera, setGenera] = useState<Genus[]>(initialGenera)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Genus | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { addToast } = useToastStore()

  // ── Abrir modal ────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError(null)
    setIsModalOpen(true)
  }

  function openEdit(genus: Genus) {
    setEditTarget(genus)
    setForm({ name: genus.name, type: genus.type })
    setError(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditTarget(null)
    setError(null)
  }

  // ── Guardar ─────────────────────────────────────────────────
  function handleSave() {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')

      return
    }
    setError(null)

    startTransition(async () => {
      const result = editTarget ? await updateGenus(editTarget.id, form) : await createGenus(form)

      if (!result.ok) {
        setError(result.message ?? 'Error desconocido.')
        addToast(result.message ?? 'Error al guardar el género.', 'error')

        return
      }

      // Actualización optimista local
      if (editTarget) {
        setGenera((prev) =>
          prev.map((g) =>
            g.id === editTarget.id ? { ...g, name: form.name, type: form.type } : g,
          ),
        )
        addToast('Género actualizado correctamente.', 'success')
      } else if (result.genus) {
        setGenera((prev) =>
          [...prev, { ...result.genus!, _count: { species: 0 } }].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        )
        addToast('Género creado correctamente.', 'success')
      }

      closeModal()
    })
  }

  // ── Eliminar ─────────────────────────────────────────────────
  function handleDelete(genus: Genus) {
    if (genus._count.species > 0) {
      addToast(
        `No se puede eliminar "${genus.name}": tiene ${genus._count.species} especie(s).`,
        'warning',
      )

      return
    }
    if (!confirm(`¿Eliminar el género "${genus.name}"? Esta acción no se puede deshacer.`)) return

    startTransition(async () => {
      const result = await deleteGenus(genus.id)

      if (!result.ok) {
        addToast(result.message ?? 'Error al eliminar.', 'error')

        return
      }
      setGenera((prev) => prev.filter((g) => g.id !== genus.id))
      addToast('Género eliminado correctamente.', 'success')
    })
  }

  // ── Agrupamiento ─────────────────────────────────────────────
  const generaByType = genera.reduce<Record<PlantType, Genus[]>>(
    (acc, genus) => {
      const type = genus.type

      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(genus)

      return acc
    },
    {} as Record<PlantType, Genus[]>,
  )

  const sortedTypes = (Object.keys(generaByType) as PlantType[]).sort((a, b) =>
    PLANT_TYPE_LABELS[a].localeCompare(PLANT_TYPE_LABELS[b]),
  )

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* Header Limpio */}
      <Heading
        action={
          <Button id="btn-create-genus" size="sm" onClick={openCreate}>
            <MdAdd className="mr-1.5 h-4 w-4" />
            Nuevo Género
          </Button>
        }
        description={`${genera.length} géneros registrados en la taxonomía`}
        title="Géneros"
      />

      {genera.length === 0 ? (
        <div className="bg-canvas border-input-outline rounded-xl border border-dashed py-24 text-center">
          <span className="text-secondary text-sm">No hay géneros registrados.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {sortedTypes.map((type) => {
            const generaList = generaByType[type]

            return (
              <div
                key={type}
                className="flex flex-col border-b border-zinc-100 pb-8 last:border-none last:pb-0 dark:border-zinc-800/50"
              >
                {/* Título del Tipo de Planta */}
                <Title className="ml-1" title={PLANT_TYPE_LABELS[type]} />

                {/* Grid de Cards de Géneros */}
                <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-2xl:grid-cols-4 mt-9 grid gap-x-4 gap-y-2">
                  {generaList.map((genus) => (
                    <div key={genus.id} className="group relative flex flex-col px-1 pt-1 pb-1">
                      <Card className="bg-canvas border-input-outline relative z-1 flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg dark:hover:shadow-emerald-950/20">
                        <CardHeader className="flex flex-row items-start justify-between border-none pb-2">
                          <div className="flex flex-col gap-1">
                            <CardTitle className="text-primary text-xl font-bold">
                              {genus.name}
                            </CardTitle>
                          </div>

                          <ActionMenu
                            items={[
                              {
                                label: 'Editar',
                                icon: <MdEdit />,
                                onClick: () => openEdit(genus),
                              },
                              {
                                label: 'Eliminar',
                                icon: <MdDelete />,
                                onClick: () => handleDelete(genus),
                                variant: 'destructive',
                              },
                            ]}
                          />
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-mono text-xl font-bold">
                              {genus._count.species}
                            </span>
                            <span className="text-secondary text-xs tracking-wider uppercase opacity-60">
                              Especies asociadas
                            </span>
                          </div>
                        </CardContent>

                        {/* Decoración sutil */}
                        <div className="text-primary absolute right-[-10%] bottom-[-10%] rotate-12 opacity-[0.03] transition-transform group-hover:scale-110">
                          <PiPlantFill size={100} />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        footer={
          <>
            <Button disabled={isPending} variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button id="btn-save-genus" isLoading={isPending} onClick={handleSave}>
              {editTarget ? 'Guardar cambios' : 'Crear género'}
            </Button>
          </>
        }
        icon={<PiPlantFill />}
        isOpen={isModalOpen}
        size="sm"
        title={editTarget ? `Editar: ${editTarget.name}` : 'Nuevo Género'}
        onClose={closeModal}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-secondary text-sm font-medium" htmlFor="genus-name">
              Nombre *
            </label>
            <input
              className="input-base"
              id="genus-name"
              placeholder="Ej: Cattleya"
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-secondary text-sm font-medium" htmlFor="genus-type">
              Tipo de planta *
            </label>
            <select
              className="input-base"
              id="genus-type"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as PlantType }))}
            >
              {Object.entries(PLANT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
