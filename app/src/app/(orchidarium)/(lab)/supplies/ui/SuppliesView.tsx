'use client'

import type { Agrochemical } from '@package/database'

import React, { useState, useTransition } from 'react'
import {
  IoAddOutline,
  IoPricetagsOutline,
  IoFlaskOutline,
  IoLeafOutline,
  IoCreateOutline,
  IoTrashOutline,
} from 'react-icons/io5'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'
import { clsx } from 'clsx'

import { AgrochemicalForm } from './components'

import { deleteAgrochemical } from '@/actions'
import { Modal, Badge, Button, ActionMenu } from '@/components'

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
    <div className="flex flex-col gap-8">
      {/* HEADER INDUSTRIAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold tracking-tight antialiased">
            Insumos Químicos
          </h1>
          <p className="text-secondary mt-1 text-sm">
            Gestiona el inventario de fertilizantes y fitosanitarios del orchidarium.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <Button
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
            variant="primary"
            onClick={handleOpenNew}
          >
            <IoAddOutline className="h-5 w-5" /> Nuevo Insumo
          </Button>
        </div>
      </div>

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agrochemicals.map((agro) => (
            <div
              key={agro.id}
              className="hover:bg-hover-overlay bg-surface border-input-outline group flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'bg-canvas border-input-outline flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-sm',
                      agro.type === 'FERTILIZANTE' ? 'text-purple-500' : 'text-emerald-500',
                    )}
                  >
                    {agro.type === 'FERTILIZANTE' ? <IoFlaskOutline /> : <IoLeafOutline />}
                  </div>
                  <div>
                    <h3 className="text-primary line-clamp-1 text-sm font-bold" title={agro.name}>
                      {agro.name}
                    </h3>
                    <p className="text-secondary text-[10px] font-bold tracking-widest uppercase opacity-60">
                      {agro.purpose}
                    </p>
                  </div>
                </div>

                <ActionMenu
                  items={[
                    {
                      label: 'Editar',
                      icon: <IoCreateOutline />,
                      onClick: () => handleOpenEdit(agro),
                    },
                    {
                      label: 'Eliminar',
                      icon: <IoTrashOutline />,
                      onClick: () => handleDelete(agro.id),
                      variant: 'danger',
                    },
                  ]}
                />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-secondary text-[9px] font-bold tracking-tighter uppercase opacity-40">
                    Dosis sugerida
                  </span>
                  <span className="text-primary font-mono text-xs font-bold tracking-tight">
                    {agro.preparation}
                  </span>
                </div>
                <Badge
                  className="font-bold tracking-tight"
                  size="sm"
                  variant={agro.type === 'FERTILIZANTE' ? 'purple' : 'green'}
                >
                  {agro.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        icon={<IoPricetagsOutline className="h-5 w-5" />}
        isOpen={isModalOpen}
        size="lg"
        subtitle={
          selectedAgrochemical
            ? `Editando ${selectedAgrochemical.name}`
            : 'Añade un nuevo producto al inventario de laboratorio.'
        }
        title={selectedAgrochemical ? 'Editar Insumo' : 'Nuevo Insumo'}
        onClose={() => setIsModalOpen(false)}
      >
        <AgrochemicalForm
          initialData={selectedAgrochemical}
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
