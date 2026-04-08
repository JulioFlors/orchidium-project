'use client'

import type { Agrochemical } from '@package/database'

import React, { useState, useTransition } from 'react'
import { IoAddOutline, IoPricetagsOutline, IoTrashOutline, IoPencilOutline } from 'react-icons/io5'

import { AgrochemicalForm } from './AgrochemicalForm'

import { deleteAgrochemical } from '@/actions'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Modal,
  Badge,
} from '@/components/ui'

interface Props {
  agrochemicals: Agrochemical[]
}

export function SuppliesClient({ agrochemicals }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgrochemical, setSelectedAgrochemical] = useState<Agrochemical | null>(null)
  const [isDeleting, startTransition] = useTransition()

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

  const getBadgeVariant = (type: string) => {
    return type === 'FERTILIZANTE' ? 'purple' : 'green'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">Insumos Químicos</h1>
          <p className="text-secondary text-sm">
            Gestiona el inventario de fertilizantes y fitosanitarios del orchidarium.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <IoAddOutline className="mr-2 h-5 w-5" />
          Nuevo Insumo
        </Button>
      </div>

      <div className="bg-canvas border-input-outline overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Propósito</TableHead>
              <TableHead>Dosis / Preparación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agrochemicals.length === 0 ? (
              <TableRow>
                <TableCell className="h-40 text-center text-zinc-500" colSpan={5}>
                  <div className="flex flex-col items-center gap-2">
                    <IoPricetagsOutline className="h-8 w-8 opacity-20" />
                    <p>No hay insumos registrados aún.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              agrochemicals.map((agro) => (
                <TableRow key={agro.id} className="group">
                  <TableCell className="font-semibold">{agro.name}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(agro.type)}>{agro.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{agro.purpose}</Badge>
                  </TableCell>
                  <TableCell className="text-secondary text-sm">{agro.preparation}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(agro)}>
                        <IoPencilOutline className="h-4 w-4" />
                      </Button>
                      <Button
                        className="text-red-500 hover:text-red-600 focus:text-red-600"
                        disabled={isDeleting}
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(agro.id)}
                      >
                        <IoTrashOutline className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        icon={<IoPricetagsOutline className="h-5 w-5" />}
        isOpen={isModalOpen}
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
