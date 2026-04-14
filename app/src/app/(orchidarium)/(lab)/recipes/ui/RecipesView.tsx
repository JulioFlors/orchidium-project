'use client'

import { type Agrochemical } from '@package/database'
import React, { useState, useTransition } from 'react'
import {
  IoAddOutline,
  IoFlaskOutline,
  IoLeafOutline,
  IoShieldCheckmarkOutline,
  IoCalendarOutline,
  IoRepeatOutline,
} from 'react-icons/io5'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'

import { ProgramForm } from './components'

import { deleteFertilizationProgram, deletePhytosanitaryProgram } from '@/actions'
import { Button, Modal, Badge } from '@/components'

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
    <div className="flex flex-col gap-12">
      {/* SECCIÓN: FERTILIZACIÓN */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-canvas border-input-outline flex h-12 w-12 items-center justify-center rounded-xl border text-purple-500 shadow-sm">
              <IoLeafOutline className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-primary text-xl font-bold tracking-tight antialiased">
                Programas de Fertilización
              </h2>
              <p className="text-secondary text-sm">
                Mezclas de nutrientes para el crecimiento y floración.
              </p>
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-auto">
            <Button
              className="flex w-full items-center justify-center gap-2 sm:w-auto"
              variant="primary"
              onClick={() => handleOpenNew('fertilization')}
            >
              <IoAddOutline className="h-5 w-5" /> Nueva Receta
            </Button>
          </div>
        </div>

        {fertilizationPrograms.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-10">
            <MdOutlineHistoryToggleOff className="text-secondary/20 mb-3 h-12 w-12" />
            <p className="text-secondary text-sm">No hay programas de fertilización definidos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fertilizationPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-surface border-input-outline group hover:bg-hover-overlay flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-primary line-clamp-1 text-sm font-bold"
                      title={program.name}
                    >
                      {program.name}
                    </h3>
                    <div className="text-secondary mt-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase opacity-60">
                      <IoRepeatOutline className="h-3 w-3" />
                      <span>{program.weeklyFrequency} vez/semana</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <span className="text-secondary text-[9px] font-bold tracking-tighter uppercase opacity-40">
                    Ciclo de Productos
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {program.productsCycle.map((pc) => (
                      <Badge
                        key={pc.id}
                        className="font-mono text-[9px]"
                        size="sm"
                        variant="outline"
                      >
                        {pc.agrochemical.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN: FITOSANITARIOS */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-canvas border-input-outline flex h-12 w-12 items-center justify-center rounded-xl border text-emerald-500 shadow-sm">
              <IoShieldCheckmarkOutline className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-primary text-xl font-bold tracking-tight antialiased">
                Programas Fitosanitarios
              </h2>
              <p className="text-secondary text-sm">
                Ciclos de prevención y tratamiento (Plagas/Hongos).
              </p>
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-auto">
            <Button
              className="flex w-full items-center justify-center gap-2 sm:w-auto"
              variant="primary"
              onClick={() => handleOpenNew('phytosanitary')}
            >
              <IoAddOutline className="h-5 w-5" /> Nuevo Programa
            </Button>
          </div>
        </div>

        {phytosanitaryPrograms.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-10">
            <MdOutlineHistoryToggleOff className="text-secondary/20 mb-3 h-12 w-12" />
            <p className="text-secondary text-sm">No hay programas fitosanitarios definidos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {phytosanitaryPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-surface border-input-outline group hover:bg-hover-overlay flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-primary line-clamp-1 text-sm font-bold"
                      title={program.name}
                    >
                      {program.name}
                    </h3>
                    <div className="text-secondary mt-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase opacity-60">
                      <IoCalendarOutline className="h-3 w-3" />
                      <span>{program.monthlyFrequency} vez/mes</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <span className="text-secondary text-[9px] font-bold tracking-tighter uppercase opacity-40">
                    Ciclo de Productos
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {program.productsCycle.map((pc) => (
                      <Badge
                        key={pc.id}
                        className="font-mono text-[9px]"
                        size="sm"
                        variant="outline"
                      >
                        {pc.agrochemical.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        icon={<IoFlaskOutline className="h-5 w-5" />}
        isOpen={modalState.isOpen}
        size="lg"
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
