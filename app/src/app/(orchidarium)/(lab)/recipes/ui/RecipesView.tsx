'use client'

import { type Agrochemical } from '@package/database'
import React, { useState, useTransition } from 'react'
import { IoAddOutline } from 'react-icons/io5'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'

import { type ProgramCycle } from './components'
import { ProgramForm, ProgramCard } from './components'

import { deleteFertilizationProgram, deletePhytosanitaryProgram } from '@/actions'
import { Button, Heading } from '@/components'

// Interfaces para los programas con sus ciclos poblados

interface FertilizationProgramWithCycles {
  id: string
  name: string
  weeklyFrequency?: number
  productsCycle: ProgramCycle[]
}

interface PhytosanitaryProgramWithCycles {
  id: string
  name: string
  monthlyFrequency?: number
  productsCycle: ProgramCycle[]
}

interface Props {
  fertilizationPrograms: FertilizationProgramWithCycles[]
  phytosanitaryPrograms: PhytosanitaryProgramWithCycles[]
  availableAgrochemicals: Agrochemical[]
}

type ModalType = 'fertilization' | 'phytosanitary'

export function RecipesView({
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

  // fix_this: delete isDeleting
  const [, startTransition] = useTransition()

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
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* SECCIÓN: FERTILIZACIÓN */}
      <section className="flex flex-col gap-6">
        <Heading
          action={
            <Button
              className="tds-sm:w-auto flex w-full items-center justify-center gap-2"
              variant="primary"
              onClick={() => handleOpenNew('fertilization')}
            >
              <IoAddOutline className="size-5" /> Nueva Receta
            </Button>
          }
          description="Ciclos de aplicación de nutrientes para el desarrollo, mantenimiento y floración de las orquideas."
          title="Programas de Fertilización"
        />

        {fertilizationPrograms.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-10">
            <MdOutlineHistoryToggleOff className="text-secondary/20 mb-3 h-12 w-12" />
            <p className="text-secondary text-sm">No hay programas de fertilización definidos.</p>
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 grid grid-cols-1 gap-4">
            {fertilizationPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                type="fertilization"
                onDelete={handleDelete}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN: FITOSANITARIOS */}
      <section className="flex flex-col gap-6">
        <Heading
          action={
            <Button
              className="tds-sm:w-auto flex w-full items-center justify-center gap-2"
              variant="primary"
              onClick={() => handleOpenNew('phytosanitary')}
            >
              <IoAddOutline className="size-5" /> Nuevo Programa
            </Button>
          }
          description="Ciclos de prevención y tratamiento contra plagas, hongos y virus."
          title="Programas Fitosanitarios"
        />

        {phytosanitaryPrograms.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-10">
            <MdOutlineHistoryToggleOff className="text-secondary/20 mb-3 h-12 w-12" />
            <p className="text-secondary text-sm">No hay programas fitosanitarios definidos.</p>
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 grid grid-cols-1 gap-4">
            {phytosanitaryPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                type="phytosanitary"
                onDelete={handleDelete}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}
      </section>

      <ProgramForm
        availableAgrochemicals={availableAgrochemicals}
        initialData={modalState.selectedData}
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={() => setModalState((s) => ({ ...s, isOpen: false }))}
        onSuccess={() => setModalState((s) => ({ ...s, isOpen: false }))}
      />
    </div>
  )
}
