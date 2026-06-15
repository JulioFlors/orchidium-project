'use client'

import { QuickActionsGrid } from './components'

import { Heading } from '@/components'

export function OrchidariumView() {
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description="Sistema de gestión automatizado, control de inventario y optimización biológica para el cultivo de orquídeas de PristinoPlant."
        title="Orquideario Inteligente"
      />

      <div className="flex flex-col gap-10">
        <div className="mt-4">
          {/* Panel de Acciones Biológicas */}
          <section className="flex flex-col gap-4">
            <QuickActionsGrid />
          </section>
        </div>
      </div>
    </div>
  )
}
