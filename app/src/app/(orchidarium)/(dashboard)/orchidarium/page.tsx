import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { PendingTasksBanner } from '../../ui/PendingTasksBanner'

import { BotanicalInsightsGrid } from './ui/BotanicalInsightsGrid'
import { OracleDecisionCard } from './ui/OracleDecisionCard'
import { QuickActionsGrid } from './ui/QuickActionsGrid'

import { auth } from '@/lib/auth'
import { ZoneType, ZoneTypeLabels } from '@/config/mappings'
import { getLatestBotanicalInsights, getLatestOracleForecast, BotanicalInsights } from '@/actions'
import { Heading } from '@/components'

export const metadata: Metadata = {
  title: 'Centro de Inteligencia Agronómica',
  description: 'Salud botánica, insights agronómicos y oráculo climático.',
}

export default async function OrchidariumDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/orchidarium')
  }

  // Obtenemos de forma paralela los insights de la Zona A y el pronóstico satelital
  const [insightsRes, oracleRes] = await Promise.all([
    getLatestBotanicalInsights(ZoneType.ZONA_A),
    getLatestOracleForecast(),
  ])

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
          {insightsRes.success && insightsRes.data ? (
            <section className="flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                <h2 className="text-lg font-bold tracking-tight uppercase">{zoneLabel}</h2>
                <div className="bg-primary/10 text-primary h-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                  Estación Automatizada
                </div>
              </div>
              <BotanicalInsightsGrid data={insightsRes.data as BotanicalInsights} />
            </section>
          ) : (
            <div className="bg-surface/30 rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-secondary">
                {insightsRes.error || `Aun no hay datos botánicos acumulados para el ${zoneLabel}.`}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Oráculo */}
          <section className="flex flex-col gap-4">
            {oracleRes.success ? (
              <OracleDecisionCard forecast={oracleRes.data} />
            ) : (
              <OracleDecisionCard forecast={undefined} />
            )}
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
