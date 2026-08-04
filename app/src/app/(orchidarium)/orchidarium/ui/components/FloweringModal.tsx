'use client'

import type { SelectOption } from '@/components/ui/select/SelectDropdown'

import { useState, useEffect } from 'react'
import { Flower2 } from 'lucide-react'

import { Modal, SelectDropdown, Button } from '@/components/ui'
import { registerFlowering, getPlantsByZone } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'
import { useFormDraftStore } from '@/store/ui/form-draft.store'
import { ZoneType, ZoneTypeLabels } from '@/config/mappings'

interface Plant {
  id: string
  species: {
    name: string
  }
}

interface FloweringModalProps {
  isOpen: boolean
  onClose: () => void
}

const ZONE_OPTIONS: SelectOption[] = Object.values(ZoneType).map((z) => ({
  label: `${ZoneTypeLabels[z]} (${z.replace('_', ' ')})`,
  value: z,
}))

const FORM_DRAFT_KEY = 'orchidarium-flowering-modal'

export function FloweringModal({ isOpen, onClose }: FloweringModalProps) {
  const [zone, setZone] = useState<string>(ZoneType.ZONA_A)
  const [plants, setPlants] = useState<Plant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlantId, setSelectedPlantId] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPlants, setIsLoadingPlants] = useState(false)

  const { addToast } = useToastStore()
  const { getDraft, setDraft, clearDraft } = useFormDraftStore()

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  // Cargar borrador de Zustand al abrir el modal
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)

    if (isOpen) {
      const draft = getDraft(FORM_DRAFT_KEY) as
        | {
            zone?: string
            searchTerm?: string
            selectedPlantId?: string
          }
        | undefined

      if (draft) {
        if (draft.zone) setZone(draft.zone)
        if (draft.searchTerm) setSearchTerm(draft.searchTerm)
        if (draft.selectedPlantId) setSelectedPlantId(draft.selectedPlantId)
      }
    }
  }

  // Guardar borrador en Zustand al cambiar campos
  useEffect(() => {
    if (isOpen) {
      setDraft(FORM_DRAFT_KEY, {
        zone,
        searchTerm,
        selectedPlantId,
      })
    }
  }, [isOpen, zone, searchTerm, selectedPlantId, setDraft])

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingPlants(true)
      getPlantsByZone(zone as ZoneType)
        .then((res) => {
          if (res.success && res.data) {
            setPlants(res.data)
          }
        })
        .finally(() => setIsLoadingPlants(false))
    }
  }, [isOpen, zone])

  const filteredPlants = plants.filter(
    (p) =>
      p.species.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = async () => {
    if (!selectedPlantId) {
      addToast('Por favor selecciona la planta que está floreciendo.', 'error')

      return
    }

    setIsSubmitting(true)
    try {
      const res = await registerFlowering({
        plantId: selectedPlantId,
        startDate: new Date(),
      })

      if (res.success) {
        addToast('Evento de floración registrado exitosamente.', 'success')
        clearDraft(FORM_DRAFT_KEY)
        setSelectedPlantId(undefined)
        setSearchTerm('')
        onClose()
      } else {
        addToast(res.error || 'Error al registrar floración', 'error')
      }
    } catch {
      addToast('Error de conexión con el servidor', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const plantOptions: SelectOption[] = filteredPlants.map((p) => ({
    label: `${p.species.name} (${p.id.substring(0, 8)})`,
    value: p.id,
  }))

  return (
    <Modal
      icon={<Flower2 className="h-5 w-5 text-pink-400" />}
      isOpen={isOpen}
      size="md"
      subtitle="Marca el inicio del ciclo de floración para el seguimiento botánico."
      title="Registrar Floración"
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-secondary text-sm font-medium">
              Zona / Ubicación
              <SelectDropdown
                id="flowering-zone"
                options={ZONE_OPTIONS}
                value={zone}
                onChange={(val) => setZone(val as string)}
              />
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-secondary text-sm font-medium">
              Filtrar por nombre/ID
              <input
                className="bg-surface border-input-outline focus:outline-primary mt-2 w-full rounded px-3 py-2 text-sm"
                id="flowering-filter"
                placeholder="Ej: Violacea..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="text-secondary text-sm font-medium">
            Seleccionar Planta
            <SelectDropdown
              disabled={isLoadingPlants || (plantOptions.length === 0 && searchTerm === '')}
              emptyMessage={
                searchTerm !== ''
                  ? 'No se encontraron coincidencias para la búsqueda.'
                  : 'No se encontraron plantas en esta zona.'
              }
              id="plant-select"
              options={plantOptions}
              placeholder={isLoadingPlants ? 'Cargando plantas...' : 'Busca la orquídea...'}
              value={selectedPlantId}
              onChange={(val) => setSelectedPlantId(val as string)}
            />
          </label>
        </div>

        <div className="bg-surface/50 rounded-lg border border-dashed border-white/10 p-4">
          <p className="text-secondary text-xs leading-relaxed">
            <span className="font-bold text-pink-400 uppercase">Nota:</span> Al registrar el inicio
            de floración, el gemelo digital ajustará automáticamente las métricas de DLI y DIF
            deseadas para esta planta en los reportes de salud.
          </p>
        </div>

        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button disabled={isSubmitting} variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isSubmitting} onClick={handleSubmit}>
            <Flower2 className="mr-1.5 h-4 w-4" />
            Registrar Inicio
          </Button>
        </div>
      </div>
    </Modal>
  )
}
