'use client'

import type { Agrochemical } from '@package/database'

import React, { useState, useTransition } from 'react'
import { IoAddOutline } from 'react-icons/io5'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'

import { AgrochemicalForm, AgrochemicalCard } from './components'

import { deleteAgrochemical } from '@/actions'
import { Button, Heading } from '@/components'

interface Props {
  agrochemicals: Agrochemical[]
}

export function SuppliesView({ agrochemicals }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgrochemical, setSelectedAgrochemical] = useState<Agrochemical | null>(null)

  const [, startTransition] = useTransition()

  const handleOpenNew = () => {
    setSelectedAgrochemical(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (agro: Agrochemical) => {
    setSelectedAgrochemical(agro)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este insumo?')) return

    startTransition(async () => {
      const result = await deleteAgrochemical(id)

      if (!result.ok) {
        alert(result.message)
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
        initialData={selectedAgrochemical}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  )
}
