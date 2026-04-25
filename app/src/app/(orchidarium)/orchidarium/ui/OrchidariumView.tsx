'use client'

import {
  PendingTasksBanner,
  BotanicalInsightsGrid,
  OracleDecisionCard,
  QuickActionsGrid,
} from './components'

import { Heading } from '@/components'
import { ZoneTypeLabels, ZoneType } from '@/config/mappings'
import { BotanicalInsights, OracleForecast } from '@/actions'

interface OrchidariumViewProps {
  insights: BotanicalInsights | null
  forecast: OracleForecast | undefined
  error?: string
}

export function OrchidariumView({ insights, forecast, error }: OrchidariumViewProps) {
  const zoneLabel = ZoneTypeLabels[ZoneType.ZONA_A]

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description={`Monitoreo proactivo del ${zoneLabel} Principal y decisiones asistidas por el Oráculo.`}
        title="Centro de Inteligencia Agronómica"
      />

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <PendingTasksBanner />
        </section>

        {/* Scorecard Zona A */}
        <div className="flex flex-col gap-12">
          {insights ? (
            <section className="flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                <h2 className="text-lg font-bold tracking-tight uppercase">{zoneLabel}</h2>
                <div className="bg-primary/10 text-primary h-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                  Estación Automatizada
                </div>
              </div>
              <BotanicalInsightsGrid data={insights} />
            </section>
          ) : (
            <div className="bg-surface/30 rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-secondary">
                {error || `Aun no hay datos botánicos acumulados para el ${zoneLabel}.`}
              </p>
            </div>
          )}
        </div>

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
