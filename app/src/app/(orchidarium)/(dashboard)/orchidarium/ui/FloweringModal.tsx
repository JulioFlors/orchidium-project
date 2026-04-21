'use client'

import type { SelectOption } from '@/components/ui/select/SelectDropdown'

import { useState, useEffect } from 'react'
import { Flower2 } from 'lucide-react'

import { Modal, SelectDropdown, Button } from '@/components/ui'
import { registerFlowering, getPlantsByZone } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'
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

export function FloweringModal({ isOpen, onClose }: FloweringModalProps) {
  const [zone, setZone] = useState<string>(ZoneType.ZONA_A)
  const [plants, setPlants] = useState<Plant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlantId, setSelectedPlantId] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPlants, setIsLoadingPlants] = useState(false)
  const { addToast } = useToastStore()

  useEffect(() => {
    if (isOpen) {
      setIsLoadingPlants(true)
      getPlantsByZone(zone as ZoneType)
        .then((res) => {
          if (res.success && res.data) {
            setPlants(res.data)
            setSelectedPlantId(undefined)
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
      footer={
        <div className="flex gap-3">
          <Button disabled={isSubmitting} variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isSubmitting} onClick={handleSubmit}>
            Registrar Inicio
          </Button>
        </div>
      }
      icon={<Flower2 className="h-5 w-5 text-pink-500" />}
      isOpen={isOpen}
      subtitle="Marca el inicio del ciclo de floración para el seguimiento botánico."
      title="Registrar Floración"
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
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
      </div>
    </Modal>
  )
}
