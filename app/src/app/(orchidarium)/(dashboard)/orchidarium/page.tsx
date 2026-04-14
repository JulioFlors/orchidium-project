import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { PendingTasksBanner } from '../../ui/PendingTasksBanner'

import { BotanicalInsightsGrid } from './ui/BotanicalInsightsGrid'
import { OracleDecisionCard } from './ui/OracleDecisionCard'

import { auth } from '@/lib/auth'
import {
  getLatestBotanicalInsights,
  getLatestOracleForecast,
} from '@/actions/insights/insight-actions'

export const metadata: Metadata = {
  title: 'Gemelo Digital',
  description: 'Salud botánica, insights agronómicos y oráculo climático.',
}

export default async function OrchidariumDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/orchidarium')
  }

  // Obtenemos de forma paralela los insights y el pronóstico satelital
  const [insightsRes, oracleRes] = await Promise.all([
    getLatestBotanicalInsights('EXTERIOR'), // Por defecto asumimos la zona principal o se puede abstraer
    getLatestOracleForecast(),
  ])

  return (
    <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 pb-12">
      <div>
        <h1 className="text-primary flex items-center gap-2 text-2xl font-bold tracking-tight antialiased">
          Centro de Inteligencia Agronómica
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Resumen procesado de las últimas 24 horas y notificaciones de acciones operativas
          requeridas.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Sección de Acción / Notificaciones delimitada */}
        <section className="flex flex-col gap-4">
          <PendingTasksBanner />
        </section>

        {/* Scorecards */}
        <section className="flex flex-col gap-4">
          <h2 className="border-b border-white/5 pb-2 text-lg font-semibold">
            Salud de la Planta (Último Día)
          </h2>
          {insightsRes.success && insightsRes.data ? (
            <BotanicalInsightsGrid data={insightsRes.data} />
          ) : (
            <div className="bg-surface/30 rounded-xl border border-dashed border-white/10 p-4 text-center">
              <p className="text-secondary">
                {insightsRes.error || 'Aun no hay datos botánicos acumulados.'}
              </p>
            </div>
          )}
        </section>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Oráculo */}
          <section className="flex flex-col gap-4">
            {oracleRes.success ? (
              <OracleDecisionCard forecast={oracleRes.data} />
            ) : (
              <OracleDecisionCard forecast={undefined} />
            )}
          </section>

          {/* Panel Futuro (Para integración de recetas o control de inventario/crecimiento) */}
          <section className="bg-surface/20 flex flex-col items-center justify-center gap-4 rounded-xl border border-white/5 p-6 text-center">
            <div className="bg-surface/50 mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
              <span className="text-2xl">🌱</span>
            </div>
            <h3 className="font-semibold text-white">Diario de Fenología (Próximamente)</h3>
            <p className="text-secondary max-w-sm text-sm">
              Aquí registraremos los ciclos de floración de tus orquídeas para cruzarlo con el DIF y
              el DLI.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
