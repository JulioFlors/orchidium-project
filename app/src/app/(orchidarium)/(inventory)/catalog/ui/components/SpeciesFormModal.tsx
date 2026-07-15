'use client'

import { useState, useEffect } from 'react'
import type { PlantType } from '@package/database'

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
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType>('ORCHID')
  const [speciesFormGenusId, setSpeciesFormGenusId] = useState('')
  const [speciesFormGlowColor, setSpeciesFormGlowColor] = useState('rgb(16, 185, 129)')
  const [speciesFormDescription, setSpeciesFormDescription] = useState('')

  // Cargar borradores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const draft = useFormDraftStore.getState().getDraft('catalog-species-form') as {
        name: string
        type: PlantType
        genusId: string
        glowColor: string
        description: string
      } | undefined
      if (draft) {
        setSpeciesFormName(draft.name)
        setSelectedPlantType(draft.type)
        setSpeciesFormGenusId(draft.genusId)
        setSpeciesFormGlowColor(draft.glowColor)
        setSpeciesFormDescription(draft.description)
      } else {
        setSpeciesFormName('')
        setSelectedPlantType('ORCHID')
        const firstGenus = generaList.find((g) => g.type === 'ORCHID')
        setSpeciesFormGenusId(firstGenus ? firstGenus.id : '')
        setSpeciesFormGlowColor('rgb(16, 185, 129)')
        setSpeciesFormDescription('')
      }
    }
  }, [isOpen, generaList])

  // Guardar borradores en tiempo real
  useEffect(() => {
    if (isOpen) {
      useFormDraftStore.getState().setDraft('catalog-species-form', {
        name: speciesFormName,
        type: selectedPlantType,
        genusId: speciesFormGenusId,
        glowColor: speciesFormGlowColor,
        description: speciesFormDescription,
      })
    }
  }, [
    speciesFormName,
    selectedPlantType,
    speciesFormGenusId,
    speciesFormGlowColor,
    speciesFormDescription,
    isOpen,
  ])

  function handlePlantTypeChange(type: PlantType) {
    setSelectedPlantType(type)
    const firstGenus = generaList.find((g) => g.type === type)
    setSpeciesFormGenusId(firstGenus ? firstGenus.id : '')
  }

  function handleSubmit() {
    onSave({
      name: speciesFormName,
      genusId: speciesFormGenusId,
      description: speciesFormDescription,
      glowColor: speciesFormGlowColor,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Crear Nueva Especie"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField htmlFor="create-species-name" label="Nombre Científico *">
              <Input
                id="create-species-name"
                placeholder="Ej: Cattleya trianae"
                type="text"
                value={speciesFormName}
                onChange={(e) => setSpeciesFormName(e.target.value)}
              />
            </FormField>
          </div>

          <div>
            <FormField htmlFor="create-plant-type" label="Tipo de Planta *">
              <SelectDropdown
                id="create-plant-type"
                options={Object.entries(plantTypeLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={selectedPlantType}
                onChange={(val) => handlePlantTypeChange(val as PlantType)}
              />
            </FormField>
          </div>

          <div>
            <FormField htmlFor="create-species-genus" label="Género *">
              <SelectDropdown
                id="create-species-genus"
                emptyMessage="No hay géneros disponibles"
                options={generaList
                  .filter((g) => g.type === selectedPlantType)
                  .map((g) => ({
                    value: g.id,
                    label: g.name,
                  }))}
                placeholder="Selecciona un género..."
                value={speciesFormGenusId}
                onChange={(val) => setSpeciesFormGenusId(val as string)}
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField htmlFor="create-species-glow" label="Color de Hover (Ambient Glow)">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SelectDropdown
                    id="create-species-glow"
                    options={[
                      { value: 'rgb(16, 185, 129)', label: 'Verde Esmeralda' },
                      { value: 'rgb(236, 72, 153)', label: 'Magenta Vibrante' },
                      { value: 'rgb(249, 115, 22)', label: 'Naranja Sol' },
                      { value: 'rgb(168, 85, 247)', label: 'Púrpura Orquídea' },
                      { value: 'rgb(234, 179, 8)', label: 'Amarillo Cactus' },
                      { value: 'rgb(6, 182, 212)', label: 'Azul / Cian' },
                      { value: 'rgb(239, 68, 68)', label: 'Rojo Flor' },
                    ]}
                    value={speciesFormGlowColor}
                    onChange={(val) => setSpeciesFormGlowColor(val as string)}
                  />
                </div>
                <div
                  className="h-9 w-9 rounded-lg border border-input-outline shadow-inner transition-colors duration-300"
                  style={{ backgroundColor: speciesFormGlowColor }}
                />
              </div>
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField htmlFor="create-species-desc" label="Descripción">
              <Textarea
                className="resize-none"
                id="create-species-desc"
                placeholder="Detalles sobre cuidados, origen, hábitat..."
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
