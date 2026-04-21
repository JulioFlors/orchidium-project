'use client'

import { useState } from 'react'
import { Bug, Flower2 } from 'lucide-react'

import { QuickActionCard } from './QuickActionCard'
import { PestSightingModal } from './PestSightingModal'
import { FloweringModal } from './FloweringModal'

export function QuickActionsGrid() {
  const [isPestModalOpen, setIsPestModalOpen] = useState(false)
  const [isFloweringModalOpen, setIsFloweringModalOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        <QuickActionCard
          color="orange"
          description="Reporta avistamientos de insectos o síntomas para alimentar el motor fitosanitario."
          icon={<Bug className="h-6 w-6" />}
          title="Avistamiento de Plaga"
          onClick={() => setIsPestModalOpen(true)}
        />
        <QuickActionCard
          color="pink"
          description="Registra el inicio de floración para sincronizar reportes de salud y tienda."
          icon={<Flower2 className="h-6 w-6" />}
          title="Registrar Floración"
          onClick={() => setIsFloweringModalOpen(true)}
        />
      </div>

      <PestSightingModal isOpen={isPestModalOpen} onClose={() => setIsPestModalOpen(false)} />
      <FloweringModal
        isOpen={isFloweringModalOpen}
        onClose={() => setIsFloweringModalOpen(false)}
      />
    </>
  )
}
