'use client'

import type { AgrochemicalWithMix } from './components'

import React, { useState, useTransition } from 'react'
import { IoAddOutline } from 'react-icons/io5'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'

import { AgrochemicalForm, AgrochemicalCard } from './components'

import { deleteAgrochemical } from '@/actions'
import { Button, Heading, Modal } from '@/components'
import { useToastStore } from '@/store/toast/toast.store'

interface Props {
  agrochemicals: AgrochemicalWithMix[]
}

export function SuppliesView({ agrochemicals }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgrochemical, setSelectedAgrochemical] = useState<AgrochemicalWithMix | null>(null)
  const { addToast } = useToastStore()
  const [agrochemicalToDelete, setAgrochemicalToDelete] = useState<AgrochemicalWithMix | null>(null)
  const [isDeleting, startTransition] = useTransition()

  const handleOpenNew = () => {
    setSelectedAgrochemical(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (agro: AgrochemicalWithMix) => {
    setSelectedAgrochemical(agro)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    const agro = agrochemicals.find((a) => a.id === id)

    if (agro) {
      setAgrochemicalToDelete(agro)
    }
  }

  const handleConfirmDelete = () => {
    if (!agrochemicalToDelete) return

    startTransition(async () => {
      const result = await deleteAgrochemical(agrochemicalToDelete.id)

      if (result.ok) {
        addToast('Insumo eliminado con éxito.', 'success')
        setAgrochemicalToDelete(null)
      } else {
        addToast(result.message || 'Error al eliminar el insumo.', 'error')
      }
    })
  }

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* HEADER INDUSTRIAL */}
      <section className="flex flex-col gap-6">
        <Heading
          action={
            <Button
              className="tds-sm:w-auto flex w-full items-center justify-center gap-2"
              variant="primary"
              onClick={handleOpenNew}
            >
              <IoAddOutline className="h-5 w-5" /> Nuevo Insumo
            </Button>
          }
          description="Listado de productos válidos para aplicar en programas de fertilización y fumigación."
          title="Insumos Agroquímicos"
        />

        {/* GRID DE CARDS */}
        {agrochemicals.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-16 shadow-sm">
            <MdOutlineHistoryToggleOff className="text-secondary/20 mb-3 h-16 w-16" />
            <p className="text-secondary text-base font-medium">El inventario está vacío</p>
            <p className="text-secondary mt-1 text-sm opacity-60">
              Aún no se ha registrado ningún agroquímico en el laboratorio.
            </p>
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 grid grid-cols-1 gap-4">
            {[...agrochemicals]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((agro) => (
                <AgrochemicalCard
                  key={agro.id}
                  agrochemical={agro}
                  onDelete={handleDelete}
                  onEdit={handleOpenEdit}
                />
              ))}
          </div>
        )}
      </section>

      <AgrochemicalForm
        key={selectedAgrochemical ? `edit-${selectedAgrochemical.id}` : 'new'}
        availableAgrochemicals={agrochemicals}
        initialData={selectedAgrochemical}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAgrochemical(null)
        }}
        onSuccess={() => {
          setIsModalOpen(false)
          setSelectedAgrochemical(null)
        }}
      />

      <Modal
        isOpen={!!agrochemicalToDelete}
        size="md"
        title="Eliminar Insumo"
        onClose={() => setAgrochemicalToDelete(null)}
      >
        <div className="flex flex-col gap-5">
          <div className="bg-surface/50 rounded-lg border border-dashed border-red-500/30 p-4">
            <p className="text-primary text-xs leading-relaxed">
              <span className="font-bold text-red-500 uppercase">Nota:</span> Esta acción no se
              puede deshacer. Se eliminará permanentemente el insumo &quot;
              {agrochemicalToDelete?.name}&quot;.
            </p>
          </div>

          <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
            <Button variant="ghost" onClick={() => setAgrochemicalToDelete(null)}>
              Volver
            </Button>
            <Button isLoading={isDeleting} variant="destructive" onClick={handleConfirmDelete}>
              Eliminar Insumo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
