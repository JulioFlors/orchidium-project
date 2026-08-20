'use client'

import type { PlantType } from '@package/database'

import { useState, useEffect } from 'react'

import { Button, Modal, FormField, Input, SelectDropdown, Textarea } from '@/components'
import { useFormDraftStore } from '@/store'
import { VALIDATION_LIMITS } from '@/config'

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
  const [errors, setErrors] = useState<{
    type?: string
    genus?: string
    name?: string
  }>({})

  const { getDraft, setDraft } = useFormDraftStore()

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)

    if (isOpen) {
      setErrors({})
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
    setSpeciesFormName('')
    setErrors((prev) => ({ ...prev, type: undefined, genus: undefined }))
  }

  function handleGenusChange(genusId: string) {
    setSpeciesFormGenusId(genusId)
    setErrors((prev) => ({ ...prev, genus: undefined }))

    const genusObj = generaList.find((g) => g.id === genusId)

    if (!genusObj) return

    const genusCapitalized =
      genusObj.name.charAt(0).toUpperCase() + genusObj.name.slice(1).toLowerCase()
    const prefix = `${genusCapitalized} `

    if (!speciesFormName || speciesFormName.trim() === '') {
      setSpeciesFormName(prefix)
    } else {
      const prevGenusObj = generaList.find((g) => g.id === speciesFormGenusId)

      if (prevGenusObj) {
        const prevPrefix = `${prevGenusObj.name.charAt(0).toUpperCase() + prevGenusObj.name.slice(1).toLowerCase()} `

        if (speciesFormName.startsWith(prevPrefix)) {
          setSpeciesFormName(speciesFormName.replace(prevPrefix, prefix))
        } else if (speciesFormName.toLowerCase().startsWith(prevGenusObj.name.toLowerCase())) {
          setSpeciesFormName(
            speciesFormName.replace(new RegExp(`^${prevGenusObj.name}\\s*`, 'i'), prefix),
          )
        }
      }
    }
  }

  function handleNameChange(value: string) {
    // Evitar dos o más espacios en blanco consecutivos
    const sanitized = value.replace(/\s{2,}/g, ' ')

    setSpeciesFormName(sanitized)
    if (sanitized.trim()) {
      setErrors((prev) => ({ ...prev, name: undefined }))
    }
  }

  function handleSubmit() {
    const newErrors: typeof errors = {}

    if (!selectedPlantType) {
      newErrors.type = 'Debes seleccionar un tipo de planta'
    }
    if (!speciesFormGenusId) {
      newErrors.genus = 'Debes seleccionar un género'
    }
    const cleanName = speciesFormName.trim().replace(/\s+/g, ' ')

    if (!cleanName || cleanName.length < 2) {
      newErrors.name = 'El nombre científico es obligatorio (mínimo 2 caracteres)'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)

      return
    }

    onSave({
      name: cleanName,
      genusId: speciesFormGenusId,
      description: speciesFormDescription.trim(),
      glowColor: 'dynamic',
    })
  }

  return (
    <Modal isOpen={isOpen} size="lg" title="Crear Nueva Especie" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <FormField
              required
              error={errors.type}
              htmlFor="create-plant-type"
              label="Tipo de Planta"
            >
              <SelectDropdown
                error={!!errors.type}
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
            <FormField required error={errors.genus} htmlFor="create-species-genus" label="Género">
              <SelectDropdown
                emptyMessage={selectedPlantType ? 'No hay géneros disponibles' : 'Tipo de planta'}
                error={!!errors.genus}
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
                onChange={(val) => handleGenusChange(val as string)}
              />
            </FormField>
          </div>

          <div>
            <FormField
              required
              error={errors.name}
              htmlFor="create-species-name"
              label="Nombre Científico"
            >
              <Input
                disabled={!speciesFormGenusId}
                error={errors.name}
                id="create-species-name"
                maxLength={VALIDATION_LIMITS.SPECIES_NAME_MAX}
                placeholder={speciesFormGenusId ? '' : 'Selecciona primero un género'}
                type="text"
                value={speciesFormName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </FormField>
          </div>

          <div>
            <FormField htmlFor="create-species-desc" label="Descripción">
              <Textarea
                className="resize-none"
                id="create-species-desc"
                maxLength={VALIDATION_LIMITS.LONG_DESC_MAX}
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
