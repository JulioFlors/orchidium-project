'use client'

import { useState, useEffect } from 'react'
import { MdInfo } from 'react-icons/md'
import type { PlantType } from '@package/database'

import { Button, Modal, FormField, Input, SelectDropdown } from '@/components'
import { useFormDraftStore } from '@/store'

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
}

export function GenusFormModal({
  isOpen,
  onClose,
  editingGenus,
  isPending,
  onSave,
  plantTypeLabels,
  plantTypeSingleLabels,
}: GenusFormModalProps) {
  const [genusFormName, setGenusFormName] = useState('')
  const [genusFormType, setGenusFormType] = useState<PlantType>('ORCHID')

  // Cargar borradores o datos de edición al abrir
  useEffect(() => {
    if (isOpen) {
      if (editingGenus) {
        setGenusFormName(editingGenus.name)
        setGenusFormType(editingGenus.type)
      } else {
        const draft = useFormDraftStore.getState().getDraft('catalog-genus-form') as {
          name: string
          type: PlantType
        } | undefined
        if (draft) {
          setGenusFormName(draft.name)
          setGenusFormType(draft.type)
        } else {
          setGenusFormName('')
          setGenusFormType('ORCHID')
        }
      }
    }
  }, [isOpen, editingGenus])

  // Guardar borradores para creación de género en tiempo real
  useEffect(() => {
    if (isOpen && !editingGenus) {
      useFormDraftStore.getState().setDraft('catalog-genus-form', {
        name: genusFormName,
        type: genusFormType,
      })
    }
  }, [genusFormName, genusFormType, isOpen, editingGenus])

  const handleSubmit = () => {
    onSave(genusFormName, genusFormType)
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
            <FormField htmlFor="genusName" label="Nombre del Género">
              <Input
                id="genusName"
                placeholder="Ej: Cattleya"
                type="text"
                value={genusFormName}
                onChange={(e) => setGenusFormName(e.target.value)}
              />
            </FormField>
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-900/50">
              <MdInfo className="h-4 w-4 text-purple-500" />
              <span>Por seguridad, el tipo de planta ({plantTypeSingleLabels[editingGenus.type]}) no puede ser modificado.</span>
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
              <FormField htmlFor="create-genus-name" label="Nombre del Género">
                <Input
                  id="create-genus-name"
                  placeholder="Ej: Cattleya"
                  type="text"
                  value={genusFormName}
                  onChange={(e) => setGenusFormName(e.target.value)}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField htmlFor="create-genus-type" label="Tipo de Planta">
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
