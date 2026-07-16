import { QuickActionsGrid, BiologicalAuditPanel } from './components'

import { Heading } from '@/components'

export function OrchidariumView() {
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description="Sistema de gestión automatizado, control de inventario y optimización biológica para el cultivo de orquídeas de PristinoPlant."
        title="Orquideario Inteligente"
      />

      <div className="flex flex-col gap-10">
        <div className="mt-4 flex flex-col gap-8">
          {/* Panel de Acciones Biológicas */}
          <section className="flex flex-col gap-4">
            <QuickActionsGrid />
          </section>

          {/* Panel de Auditoría Biológica en tiempo real */}
          <section className="border-input-outline flex flex-col gap-6 border-t pt-6">
            <h3 className="text-primary font-sans text-lg leading-tight font-bold">
              Monitoreo y Auditoría Biológica
            </h3>
            <BiologicalAuditPanel />
          </section>
        </div>
      </div>
    </div>
  )
}
