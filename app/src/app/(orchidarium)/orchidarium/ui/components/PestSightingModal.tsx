'use client'

import type { ZoneType, Severity } from '@package/database'

import { Bug } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

import { getPestCatalog, registerPestSighting } from '@/actions/operations/biological-actions'
import {
  Modal,
  Button,
  Input,
  SelectDropdown,
  type SelectOption,
  FormField,
  Textarea,
} from '@/components'
import { ZoneTypeLabels } from '@/config/mappings'
import { VALIDATION_LIMITS } from '@/config'
import { useToastStore } from '@/store'

interface PestSightingModalProps {
  isOpen: boolean
  onClose: () => void
}

const ZONE_OPTIONS: SelectOption[] = [
  { label: ZoneTypeLabels.ZONA_A, value: 'ZONA_A' },
  { label: ZoneTypeLabels.ZONA_B, value: 'ZONA_B' },
  { label: ZoneTypeLabels.ZONA_C, value: 'ZONA_C' },
  { label: ZoneTypeLabels.ZONA_D, value: 'ZONA_D' },
  { label: ZoneTypeLabels.EXTERIOR, value: 'EXTERIOR' },
]

const SEVERITY_OPTIONS: SelectOption[] = [
  { label: 'Baja (Pocos ejemplares / Leve)', value: 'LOW' },
  { label: 'Media (Presencia notable)', value: 'MEDIUM' },
  { label: 'Alta (Foco infeccioso grave)', value: 'HIGH' },
  { label: 'Crítica (Cuarentena inmediata)', value: 'CRITICAL' },
]

export function PestSightingModal({ isOpen, onClose }: PestSightingModalProps) {
  const [pests, setPests] = useState<{ id: string; name: string }[]>([])
  const [selectedPestId, setSelectedPestId] = useState<string | undefined>(undefined)
  const [customPestName, setCustomPestName] = useState('')
  const [zone, setZone] = useState<ZoneType>('ZONA_A')
  const [severity, setSeverity] = useState<Severity>('LOW')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pestError, setPestError] = useState<string | null>(null)
  const { addToast } = useToastStore()

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setPestError(null)
    }
  }

  useEffect(() => {
    if (isOpen) {
      getPestCatalog().then((res) => {
        if (res.success && res.data) {
          setPests(res.data)
        }
      })
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!selectedPestId) {
      setPestError('Por favor selecciona una plaga de la lista o elige Otra.')

      return
    }

    if (selectedPestId === 'other' && !customPestName.trim()) {
      setPestError('Debes escribir el nombre de la plaga o síntoma.')

      return
    }

    setPestError(null)
    setIsSubmitting(true)
    try {
      const res = await registerPestSighting({
        pestId: selectedPestId === 'other' ? undefined : selectedPestId,
        pestName: selectedPestId === 'other' ? customPestName.trim() : undefined,
        zone,
        severity,
        notes: notes.trim() ? notes.trim() : undefined,
      })

      if (res.success) {
        addToast('Avistamiento registrado. El motor de inteligencia ha sido notificado.', 'success')
        onClose()
        // Reset form
        setSelectedPestId(undefined)
        setCustomPestName('')
        setNotes('')
        setPestError(null)
      } else {
        addToast(res.error || 'Error al registrar avistamiento', 'error')
      }
    } catch {
      addToast('Error de conexión con el servidor', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pestOptions: SelectOption[] = [
    ...pests.map((p) => ({ label: p.name, value: p.id })),
    { label: 'Otra (Especificar)', value: 'other' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      subtitle="Captura evidencia para la base de conocimientos fitosanitarios."
      title="Reportar Avistamiento de Plaga"
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <FormField
          required
          error={pestError ?? undefined}
          htmlFor="pest-select"
          label="Identificación de la Plaga"
        >
          <SelectDropdown
            error={!!pestError}
            id="pest-select"
            options={pestOptions}
            placeholder="Selecciona una plaga..."
            value={selectedPestId}
            onChange={(val) => {
              setSelectedPestId(val as string)
              setPestError(null)
            }}
          />
          {selectedPestId === 'other' && (
            <motion.div
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2"
              initial={{ height: 0, opacity: 0 }}
            >
              <Input
                error={pestError && !customPestName.trim() ? 'El nombre es obligatorio' : undefined}
                id="custom-pest-name"
                maxLength={VALIDATION_LIMITS.TITLE_NAME_MAX}
                placeholder="Nombre de la plaga o síntoma..."
                value={customPestName}
                onChange={(e) => {
                  setCustomPestName(e.target.value)
                  setPestError(null)
                }}
              />
            </motion.div>
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField required htmlFor="zone-select" label="Zona">
            <SelectDropdown
              id="zone-select"
              options={ZONE_OPTIONS}
              value={zone}
              onChange={(val) => setZone(val as ZoneType)}
            />
          </FormField>

          <FormField required htmlFor="severity-select" label="Severidad">
            <SelectDropdown
              id="severity-select"
              options={SEVERITY_OPTIONS}
              value={severity}
              onChange={(val) => setSeverity(val as Severity)}
            />
          </FormField>
        </div>

        <FormField htmlFor="sighting-notes" label="Notas / Observaciones">
          <Textarea
            id="sighting-notes"
            maxLength={VALIDATION_LIMITS.OBSERVATION_MAX}
            placeholder="Describe la ubicación exacta, el grado de infestación o cualquier detalle relevante..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        <div className="border-input-outline -mx-6 mt-2 grid grid-cols-2 gap-3 border-t px-6 pt-4">
          <Button disabled={isSubmitting} variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isSubmitting} onClick={handleSubmit}>
            <Bug className="mr-1.5 h-4 w-4" />
            Registrar Reporte
          </Button>
        </div>
      </div>
    </Modal>
  )
}
