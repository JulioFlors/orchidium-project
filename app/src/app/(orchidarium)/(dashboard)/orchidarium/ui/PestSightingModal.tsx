'use client'

import type { SelectOption } from '@/components/ui/select/SelectDropdown'

import { useState, useEffect } from 'react'
import { Bug } from 'lucide-react'
import { motion } from 'motion/react'

import { Modal, SelectDropdown, Button, Input } from '@/components/ui'
import { registerPestSighting, getPestCatalog } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'
import { ZoneType, ZoneTypeLabels, Severity, SeverityLabels } from '@/config/mappings'

interface Pest {
  id: string
  name: string
}

interface PestSightingModalProps {
  isOpen: boolean
  onClose: () => void
}

const ZONE_OPTIONS: SelectOption[] = Object.values(ZoneType).map((z) => ({
  label: ZoneTypeLabels[z],
  value: z,
}))

const SEVERITY_OPTIONS: SelectOption[] = Object.values(Severity).map((s) => ({
  label: SeverityLabels[s],
  value: s,
}))

export function PestSightingModal({ isOpen, onClose }: PestSightingModalProps) {
  const [pests, setPests] = useState<Pest[]>([])
  const [selectedPestId, setSelectedPestId] = useState<string | undefined>()
  const [customPestName, setCustomPestName] = useState('')
  const [zone, setZone] = useState<string>(ZoneType.ZONA_A)
  const [severity, setSeverity] = useState<string>('LOW')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToastStore()

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
    if (!selectedPestId && !customPestName) {
      addToast('Por favor selecciona una plaga o escribe el nombre.', 'error')

      return
    }

    setIsSubmitting(true)
    try {
      const res = await registerPestSighting({
        pestId: selectedPestId,
        pestName: selectedPestId === 'other' ? customPestName : undefined,
        zone: zone as ZoneType,
        severity: severity as Severity,
        notes,
      })

      if (res.success) {
        addToast('Avistamiento registrado. El motor de inteligencia ha sido notificado.', 'success')
        onClose()
        // Reset form
        setSelectedPestId(undefined)
        setCustomPestName('')
        setNotes('')
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
      footer={
        <div className="flex gap-3">
          <Button disabled={isSubmitting} variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button isLoading={isSubmitting} onClick={handleSubmit}>
            Registrar Reporte
          </Button>
        </div>
      }
      icon={<Bug className="h-5 w-5 text-orange-500" />}
      isOpen={isOpen}
      subtitle="Captura evidencia para la base de conocimientos fitosanitarios."
      title="Reportar Avistamiento de Plaga"
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="text-secondary text-sm font-medium">
            Identificación de la Plaga
            <SelectDropdown
              id="pest-select"
              options={pestOptions}
              placeholder="Selecciona una plaga..."
              value={selectedPestId}
              onChange={(val) => setSelectedPestId(val as string)}
            />
          </label>
          {selectedPestId === 'other' && (
            <motion.div
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2"
              initial={{ height: 0, opacity: 0 }}
            >
              <Input
                id="custom-pest-name"
                placeholder="Nombre de la plaga o síntoma..."
                value={customPestName}
                onChange={(e) => setCustomPestName(e.target.value)}
              />
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-secondary text-sm font-medium">
              Zona
              <SelectDropdown
                id="zone-select"
                options={ZONE_OPTIONS}
                value={zone}
                onChange={(val) => setZone(val as string)}
              />
            </label>
          </div>
          <div className="space-y-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-secondary text-sm font-medium">
              Severidad
              <SelectDropdown
                id="severity-select"
                options={SEVERITY_OPTIONS}
                value={severity}
                onChange={(val) => setSeverity(val as string)}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-secondary text-sm font-medium">
            Notas / Observaciones
            <textarea
              className="bg-surface border-input-outline focus:outline-primary mt-2 min-h-[100px] w-full resize-none rounded-md border p-3 text-sm transition-all"
              id="sighting-notes"
              placeholder="Describe la ubicación exacta, el grado de infestación o cualquier detalle relevante..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}
