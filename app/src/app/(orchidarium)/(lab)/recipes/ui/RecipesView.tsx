'use client'

import type { Agrochemical } from '@package/database'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IoAddOutline } from 'react-icons/io5'
import { MdOutlineHistoryToggleOff } from 'react-icons/md'

import { type ProgramCycle } from './components'
import { ProgramForm, ProgramCard } from './components'

import { deleteFertilizationProgram, deletePhytosanitaryProgram } from '@/actions'
import { Button, Heading, Modal } from '@/components'
import { Logger } from '@/lib'
import { useToastStore } from '@/store'

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

export function RecipesView({
  fertilizationPrograms = [],
  phytosanitaryPrograms = [],
  availableAgrochemicals = [],
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados de los modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<
    FertilizationProgramWithCycles | PhytosanitaryProgramWithCycles | null
  >(null)
  const [initialType, setInitialType] = useState<'fertilization' | 'phytosanitary'>('fertilization')
  const [programToDelete, setProgramToDelete] = useState<{
    id: string
    type: 'fertilization' | 'phytosanitary'
  } | null>(null)

  // Lista unificada ordenada alfabéticamente
  const allPrograms = React.useMemo(() => {
    const fert = fertilizationPrograms.map((p) => ({ ...p, programType: 'fertilization' as const }))
    const phyt = phytosanitaryPrograms.map((p) => ({ ...p, programType: 'phytosanitary' as const }))

    return [...fert, ...phyt].sort((a, b) => a.name.localeCompare(b.name))
  }, [fertilizationPrograms, phytosanitaryPrograms])

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setSelectedProgram(null)
    setInitialType('fertilization')
    setIsModalOpen(true)
  }

  // Abrir modal para editar
  const handleOpenEdit = (
    type: 'fertilization' | 'phytosanitary',
    program: FertilizationProgramWithCycles | PhytosanitaryProgramWithCycles,
  ) => {
    setSelectedProgram(program)
    setInitialType(type)
    setIsModalOpen(true)
  }

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    if (!programToDelete) return

    setIsDeleting(true)
    startTransition(async () => {
      try {
        const result =
          programToDelete.type === 'fertilization'
            ? await deleteFertilizationProgram(programToDelete.id)
            : await deletePhytosanitaryProgram(programToDelete.id)

        if (result.ok) {
          useToastStore.getState().addToast('Plan eliminado correctamente', 'success')
          setProgramToDelete(null)
          router.refresh()
        } else {
          useToastStore.getState().addToast(result.message || 'Error al eliminar el plan', 'error')
        }
      } catch (error) {
        Logger.error('Error al eliminar:', error)
        useToastStore.getState().addToast('Error al procesar la solicitud', 'error')
      } finally {
        setIsDeleting(false)
      }
    })
  }

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* HEADER PRINCIPAL */}
      <section className="flex flex-col gap-6">
        <Heading
          action={
            <Button
              className="tds-sm:w-auto flex w-full items-center justify-center gap-2"
              variant="primary"
              onClick={handleOpenCreate}
            >
              <IoAddOutline className="size-5" /> Nuevo Plan
            </Button>
          }
          description="Diseño y gestión de los planes nutricionales y fitosanitarios para el ciclo biológico de las orquídeas."
          title="Planificación de Dosificación"
        />

        {/* GRID UNIFICADO DE PROGRAMAS */}
        {allPrograms.length > 0 ? (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 grid grid-cols-1 gap-4">
            {allPrograms.map((program) => (
              <ProgramCard
                key={`${program.programType}-${program.id}`}
                program={program}
                type={program.programType}
                onDelete={(type, id) => setProgramToDelete({ id, type })}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        ) : (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <MdOutlineHistoryToggleOff className="text-secondary size-12 opacity-40" />
            <p className="text-secondary mt-2 text-sm">
              No hay planes de dosificación configurados.
            </p>
          </div>
        )}
      </section>

      {/* MODAL FORMULARIO DE PROGRAMA */}
      {isModalOpen && (
        <ProgramForm
          key={selectedProgram ? `edit-${selectedProgram.id}` : `new-${initialType}`}
          availableAgrochemicals={availableAgrochemicals}
          initialData={selectedProgram}
          initialType={initialType}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProgram(null)
          }}
          onSuccess={() => {
            setIsModalOpen(false)
            setSelectedProgram(null)
            router.refresh()
            useToastStore
              .getState()
              .addToast(
                selectedProgram ? 'Plan actualizado con éxito' : 'Plan creado con éxito',
                'success',
              )
          }}
        />
      )}

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {programToDelete && (
        <Modal
          isOpen={!!programToDelete}
          size="sm"
          title="Eliminar Plan"
          onClose={() => setProgramToDelete(null)}
        >
          <p className="text-secondary text-sm">
            ¿Estás seguro de que deseas eliminar este plan? Las rutinas que dependan de este plan
            quedarán sin receta asignada.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              disabled={isDeleting}
              variant="secondary"
              onClick={() => setProgramToDelete(null)}
            >
              Cancelar
            </Button>
            <Button disabled={isDeleting} variant="destructive" onClick={handleConfirmDelete}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
