'use client'

import { type Agrochemical } from '@package/database'
import React, { useState, useTransition } from 'react'
import {
  IoAddOutline,
  IoFlaskOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoLeafOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'

import { ProgramForm } from './ProgramForm'

import { deleteFertilizationProgram, deletePhytosanitaryProgram } from '@/actions'
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

// Interfaces para los programas con sus ciclos poblados
interface ProgramCycle {
  id: string
  sequence: number
  agrochemical: Agrochemical
  agrochemicalId: string
}

interface FertilizationProgramWithCycles {
  id: string
  name: string
  weeklyFrequency: number
  productsCycle: ProgramCycle[]
}

interface PhytosanitaryProgramWithCycles {
  id: string
  name: string
  monthlyFrequency: number
  productsCycle: ProgramCycle[]
}

interface Props {
  fertilizationPrograms: FertilizationProgramWithCycles[]
  phytosanitaryPrograms: PhytosanitaryProgramWithCycles[]
  availableAgrochemicals: Agrochemical[]
}

type ModalType = 'fertilization' | 'phytosanitary'

export function RecipesClient({
  fertilizationPrograms,
  phytosanitaryPrograms,
  availableAgrochemicals,
}: Props) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: ModalType
    selectedData: FertilizationProgramWithCycles | PhytosanitaryProgramWithCycles | null
  }>({
    isOpen: false,
    type: 'fertilization',
    selectedData: null,
  })

  const [isDeleting, startTransition] = useTransition()

  const handleOpenNew = (type: ModalType) => {
    setModalState({ isOpen: true, type, selectedData: null })
  }

  const handleOpenEdit = (
    type: ModalType,
    data: FertilizationProgramWithCycles | PhytosanitaryProgramWithCycles,
  ) => {
    setModalState({ isOpen: true, type, selectedData: data })
  }

  const handleDelete = (type: ModalType, id: string) => {
    if (!confirm('¿Estás seguro de eliminar este programa?')) return

    startTransition(async () => {
      const result =
        type === 'fertilization'
          ? await deleteFertilizationProgram(id)
          : await deletePhytosanitaryProgram(id)

      if (!result.ok) {
        alert(result.message)
      }
    })
  }

  return (
    <div className="space-y-10">
      {/* SECCIÓN: FERTILIZACIÓN */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30">
              <IoLeafOutline className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-primary text-xl font-bold">Programas de Fertilización</h2>
              <p className="text-secondary text-sm">
                Mezclas de nutrientes para el crecimiento y floración.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => handleOpenNew('fertilization')}>
            <IoAddOutline className="mr-2 h-5 w-5" />
            Nueva Receta
          </Button>
        </div>

        <div className="bg-canvas border-input-outline overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Programa</TableHead>
                <TableHead>Frecuencia Semanal</TableHead>
                <TableHead>Ciclo de Productos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fertilizationPrograms.length === 0 ? (
                <TableRow>
                  <TableCell className="text-secondary h-24 text-center" colSpan={4}>
                    No hay programas de fertilización definidos.
                  </TableCell>
                </TableRow>
              ) : (
                fertilizationPrograms.map((program) => (
                  <TableRow key={program.id} className="group">
                    <TableCell className="font-semibold">{program.name}</TableCell>
                    <TableCell>{program.weeklyFrequency} vez/semana</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {program.productsCycle.map((pc) => (
                          <Badge key={pc.id} size="sm" variant="outline">
                            {pc.agrochemical.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit('fertilization', program)}
                        >
                          <IoPencilOutline className="h-4 w-4" />
                        </Button>
                        <Button
                          className="text-red-500"
                          disabled={isDeleting}
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete('fertilization', program.id)}
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
      </section>

      {/* SECCIÓN: FITOSANITARIOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30">
              <IoShieldCheckmarkOutline className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-primary text-xl font-bold">Programas Fitosanitarios</h2>
              <p className="text-secondary text-sm">
                Ciclos de prevención y tratamiento (Plagas/Hongos).
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => handleOpenNew('phytosanitary')}>
            <IoAddOutline className="mr-2 h-5 w-5" />
            Nuevo Programa
          </Button>
        </div>

        <div className="bg-canvas border-input-outline overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Programa</TableHead>
                <TableHead>Frecuencia Mensual</TableHead>
                <TableHead>Ciclo de Productos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phytosanitaryPrograms.length === 0 ? (
                <TableRow>
                  <TableCell className="text-secondary h-24 text-center" colSpan={4}>
                    No hay programas fitosanitarios definidos.
                  </TableCell>
                </TableRow>
              ) : (
                phytosanitaryPrograms.map((program) => (
                  <TableRow key={program.id} className="group">
                    <TableCell className="font-semibold">{program.name}</TableCell>
                    <TableCell>{program.monthlyFrequency} vez/mes</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {program.productsCycle.map((pc) => (
                          <Badge key={pc.id} size="sm" variant="outline">
                            {pc.agrochemical.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit('phytosanitary', program)}
                        >
                          <IoPencilOutline className="h-4 w-4" />
                        </Button>
                        <Button
                          className="text-red-500"
                          disabled={isDeleting}
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete('phytosanitary', program.id)}
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
      </section>

      <Modal
        icon={<IoFlaskOutline className="h-5 w-5" />}
        isOpen={modalState.isOpen}
        subtitle={
          modalState.type === 'fertilization' ? 'Programa de Nutrientes' : 'Programa Fitosanitario'
        }
        title={modalState.selectedData ? 'Editar Receta' : 'Nueva Receta'}
        onClose={() => setModalState((s) => ({ ...s, isOpen: false }))}
      >
        <ProgramForm
          availableAgrochemicals={availableAgrochemicals}
          initialData={modalState.selectedData}
          type={modalState.type}
          onCancel={() => setModalState((s) => ({ ...s, isOpen: false }))}
          onSuccess={() => setModalState((s) => ({ ...s, isOpen: false }))}
        />
      </Modal>
    </div>
  )
}
