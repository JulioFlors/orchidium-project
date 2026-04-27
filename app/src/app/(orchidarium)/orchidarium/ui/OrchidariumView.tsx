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
  insights: Record<string, BotanicalInsights> | null
  forecast: OracleForecast | undefined
  error?: string
}

export function OrchidariumView({ insights, forecast, error }: OrchidariumViewProps) {
  const zonesToShow = [ZoneType.ZONA_A, ZoneType.EXTERIOR]

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

        {/* Scorecards por Zona */}
        <div className="flex flex-col gap-12">
          {zonesToShow.map((zone) => {
            const zoneInsights = insights?.[zone]
            const zoneLabel = ZoneTypeLabels[zone]

            if (!zoneInsights) return null

            return (
              <section key={zone} className="flex flex-col gap-5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                  <h2 className="text-lg font-bold tracking-tight uppercase">{zoneLabel}</h2>
                  <div className="bg-primary/10 text-primary h-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                    {zone === ZoneType.EXTERIOR ? 'Entorno Natural' : 'Estación Automatizada'}
                  </div>
                </div>
                <BotanicalInsightsGrid data={zoneInsights} />
              </section>
            )
          })}

          {!insights && (
            <div className="bg-surface/30 rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-secondary">
                {error || 'Aun no hay datos botánicos acumulados para las zonas seleccionadas.'}
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
