'use client'

import type { PlantType } from '@package/database'

import { useState, useEffect } from 'react'
import { MdInfo } from 'react-icons/md'

import { Button, Modal, FormField, Input, SelectDropdown } from '@/components'
import { useFormDraftStore } from '@/store'
import { VALIDATION_LIMITS } from '@/config'

interface Genus {
  id: string
  name: string
  type: PlantType
}

interface GenusFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingGenus: Genus | null
  isPending: boolean
  onSave: (name: string, type: PlantType) => void
  plantTypeLabels: Record<PlantType, string>
  plantTypeSingleLabels: Record<PlantType, string>
  generaList?: Genus[]
}

export function GenusFormModal({
  isOpen,
  onClose,
  editingGenus,
  isPending,
  onSave,
  plantTypeLabels,
  plantTypeSingleLabels,
  generaList = [],
}: GenusFormModalProps) {
  const [genusFormName, setGenusFormName] = useState('')
  const [genusFormType, setGenusFormType] = useState<PlantType>('ORCHID')
  const [nameError, setNameError] = useState<string | null>(null)

  const { getDraft, setDraft } = useFormDraftStore()

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [prevEditingGenus, setPrevEditingGenus] = useState(editingGenus)

  if (isOpen !== prevIsOpen || editingGenus !== prevEditingGenus) {
    setPrevIsOpen(isOpen)
    setPrevEditingGenus(editingGenus)

    if (isOpen) {
      setNameError(null)
      if (editingGenus) {
        setGenusFormName(editingGenus.name)
        setGenusFormType(editingGenus.type)
      } else {
        const draft = getDraft('catalog-genus-form') as
          | {
              name: string
              type: PlantType
            }
          | undefined

        if (draft) {
          setGenusFormName(draft.name)
          setGenusFormType(draft.type)
        } else {
          setGenusFormName('')
          setGenusFormType('ORCHID')
        }
      }
    }
  }

  // Guardar borradores para creación de género en tiempo real
  useEffect(() => {
    if (isOpen && !editingGenus) {
      setDraft('catalog-genus-form', {
        name: genusFormName,
        type: genusFormType,
      })
    }
  }, [genusFormName, genusFormType, isOpen, editingGenus, setDraft])

  const handleNameChange = (val: string) => {
    // Sanitizar en tiempo real: permitir únicamente letras del abecedario y espacios simples
    const sanitized = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').replace(/\s{2,}/g, ' ')

    setGenusFormName(sanitized)
    if (nameError) {
      setNameError(null)
    }
  }

  const validateName = (nameToValidate: string): string | null => {
    const clean = nameToValidate.trim().replace(/\s+/g, ' ')

    if (!clean) {
      return 'El nombre del género es obligatorio.'
    }

    if (clean.length < (VALIDATION_LIMITS.GENUS_NAME_MIN ?? 4)) {
      return `El nombre del género debe tener al menos ${VALIDATION_LIMITS.GENUS_NAME_MIN ?? 4} letras.`
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(clean)) {
      return 'El nombre solo debe contener letras del abecedario.'
    }

    const isDuplicate = generaList.some(
      (g) =>
        g.name.trim().toLowerCase() === clean.toLowerCase() &&
        (!editingGenus || g.id !== editingGenus.id),
    )

    if (isDuplicate) {
      return `Ya existe un género registrado con el nombre "${clean}".`
    }

    return null
  }

  const handleSubmit = () => {
    const error = validateName(genusFormName)

    if (error) {
      setNameError(error)

      return
    }

    setNameError(null)
    onSave(genusFormName.trim().replace(/\s+/g, ' '), genusFormType)
  }

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title={editingGenus ? 'Editar Género' : 'Registrar Nuevo Género'}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {editingGenus ? (
          <div className="flex flex-col gap-3">
            <FormField
              required
              error={nameError ?? undefined}
              htmlFor="edit-genus-name"
              label="Nombre del Género"
            >
              <Input
                error={!!nameError}
                id="edit-genus-name"
                maxLength={VALIDATION_LIMITS.GENUS_NAME_MAX}
                placeholder="Ej. Cattleya"
                type="text"
                value={genusFormName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </FormField>
            <div className="text-secondary flex items-center gap-1.5 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-900/50">
              <MdInfo className="h-4 w-4 text-purple-500" />
              <span>
                Por seguridad, el tipo de planta ({plantTypeSingleLabels[editingGenus.type]}) no
                puede ser modificado.
              </span>
            </div>
            <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button isLoading={isPending} onClick={handleSubmit}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField required htmlFor="create-genus-type" label="Tipo de Planta">
                <SelectDropdown
                  id="create-genus-type"
                  options={Object.entries(plantTypeLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={genusFormType}
                  onChange={(val) => setGenusFormType(val as PlantType)}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                required
                error={nameError ?? undefined}
                htmlFor="create-genus-name"
                label="Nombre del Género"
              >
                <Input
                  error={!!nameError}
                  id="create-genus-name"
                  maxLength={VALIDATION_LIMITS.GENUS_NAME_MAX}
                  placeholder="Ej. Cattleya"
                  type="text"
                  value={genusFormName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </FormField>
            </div>

            <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4 sm:col-span-2">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button isLoading={isPending} onClick={handleSubmit}>
                Crear Género
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
