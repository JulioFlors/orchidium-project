'use client'

import type { PlantType } from '@package/database'

import { useState, useEffect } from 'react'

import { Button, Modal, FormField, Input, SelectDropdown, Textarea } from '@/components'
import { useFormDraftStore } from '@/store'

interface Genus {
  id: string
  name: string
  type: PlantType
}

interface SpeciesFormModalProps {
  isOpen: boolean
  onClose: () => void
  isPending: boolean
  generaList: Genus[]
  plantTypeLabels: Record<PlantType, string>
  onSave: (data: { name: string; genusId: string; description: string; glowColor: string }) => void
}

export function SpeciesFormModal({
  isOpen,
  onClose,
  isPending,
  generaList,
  plantTypeLabels,
  onSave,
}: SpeciesFormModalProps) {
  const [speciesFormName, setSpeciesFormName] = useState('')
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | ''>('')
  const [speciesFormGenusId, setSpeciesFormGenusId] = useState('')
  const [speciesFormDescription, setSpeciesFormDescription] = useState('')

  const { getDraft, setDraft } = useFormDraftStore()

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)

    if (isOpen) {
      const draft = getDraft('catalog-species-form') as
        | {
            name: string
            type: PlantType | ''
            genusId: string
            description: string
          }
        | undefined

      if (draft) {
        setSpeciesFormName(draft.name)
        setSelectedPlantType(draft.type)
        setSpeciesFormGenusId(draft.genusId)
        setSpeciesFormDescription(draft.description)
      } else {
        setSpeciesFormName('')
        setSelectedPlantType('')
        setSpeciesFormGenusId('')
        setSpeciesFormDescription('')
      }
    }
  }

  // Guardar borradores en tiempo real
  useEffect(() => {
    if (isOpen) {
      setDraft('catalog-species-form', {
        name: speciesFormName,
        type: selectedPlantType,
        genusId: speciesFormGenusId,
        description: speciesFormDescription,
      })
    }
  }, [
    speciesFormName,
    selectedPlantType,
    speciesFormGenusId,
    speciesFormDescription,
    isOpen,
    setDraft,
  ])

  function handlePlantTypeChange(type: PlantType | '') {
    setSelectedPlantType(type)
    setSpeciesFormGenusId('')
  }

  function handleSubmit() {
    onSave({
      name: speciesFormName,
      genusId: speciesFormGenusId,
      description: speciesFormDescription,
      glowColor: 'dynamic',
    })
  }

  return (
    <Modal isOpen={isOpen} size="lg" title="Crear Nueva Especie" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField htmlFor="create-species-name" label="Nombre Científico">
              <Input
                id="create-species-name"
                placeholder=""
                type="text"
                value={speciesFormName}
                onChange={(e) => setSpeciesFormName(e.target.value)}
              />
            </FormField>
          </div>

          <div>
            <FormField htmlFor="create-plant-type" label="Tipo de Planta">
              <SelectDropdown
                id="create-plant-type"
                options={Object.entries(plantTypeLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                placeholder="Seleccionar tipo"
                value={selectedPlantType}
                onChange={(val) => handlePlantTypeChange(val as PlantType)}
              />
            </FormField>
          </div>

          <div>
            <FormField htmlFor="create-species-genus" label="Género">
              <SelectDropdown
                emptyMessage={selectedPlantType ? 'No hay géneros disponibles' : 'Tipo de planta'}
                id="create-species-genus"
                options={
                  selectedPlantType
                    ? generaList
                        .filter((g) => g.type === selectedPlantType)
                        .map((g) => ({
                          value: g.id,
                          label: g.name,
                        }))
                    : []
                }
                placeholder="Seleccionar género"
                value={speciesFormGenusId}
                onChange={(val) => setSpeciesFormGenusId(val as string)}
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField htmlFor="create-species-desc" label="Descripción">
              <Textarea
                className="resize-none"
                id="create-species-desc"
                placeholder="Detalles sobre la especie."
                value={speciesFormDescription}
                onChange={(e) => setSpeciesFormDescription(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isPending} onClick={handleSubmit}>
            Crear Especie
          </Button>
        </div>
      </div>
    </Modal>
  )
}
