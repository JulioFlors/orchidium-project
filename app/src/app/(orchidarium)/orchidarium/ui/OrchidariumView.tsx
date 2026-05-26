'use client'

import { PendingTasksBanner, OracleDecisionCard, QuickActionsGrid } from './components'

import { Heading } from '@/components'
import { OracleForecast } from '@/actions'

interface OrchidariumViewProps {
  forecast: OracleForecast | undefined
  error?: string
}

export function OrchidariumView({ forecast, error }: OrchidariumViewProps) {
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description="Monitoreo proactivo y decisiones asistidas por el Oráculo para todo el Orchidarium."
        title="Centro de Inteligencia Agronómica"
      />

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <PendingTasksBanner />
        </section>

        {error && (
          <div className="bg-surface/30 rounded-xl border border-dashed border-red-500/20 p-6 text-center">
            <p className="font-medium text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Oráculo */}
          <section className="flex flex-col gap-4">
            <OracleDecisionCard forecast={forecast} />
          </section>

          {/* Panel de Acciones Biológicas */}
          <section className="flex flex-col gap-4">
            <QuickActionsGrid />
          </section>
        </div>
      </div>
    </div>
  )
}
