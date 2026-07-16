'use client'

import { Modal, Button } from '@/components'

interface TypeManagerModalProps {
  isOpen: boolean
  onClose: () => void
  plantTypeSingleLabels: Record<string, string>
}

export function TypeManagerModal({
  isOpen,
  onClose,
  plantTypeSingleLabels,
}: TypeManagerModalProps) {
  return (
    <Modal isOpen={isOpen} size="md" title="Tipos de Plantas" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-secondary text-sm">
          Los tipos de plantas definen las categorías taxonómicas generales del orquidario y
          determinan el comportamiento del riego y la fertilización.
        </p>
        <div className="border-input-outline divide-input-outline flex flex-col divide-y rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
          {Object.entries(plantTypeSingleLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-3.5">
              <span className="text-primary text-sm font-semibold">{label}</span>
              <span className="text-secondary font-mono text-xs opacity-60">{key}</span>
            </div>
          ))}
        </div>
        <div className="border-input-outline -mx-6 mt-2 flex justify-end border-t px-6 pt-4">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
