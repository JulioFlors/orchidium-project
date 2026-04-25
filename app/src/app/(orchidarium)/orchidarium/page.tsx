import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { OrchidariumView } from './ui'

import { auth } from '@/lib/server'
import { ZoneType } from '@/config/mappings'
import { getLatestBotanicalInsights, getLatestOracleForecast, BotanicalInsights } from '@/actions'

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

  return (
    <OrchidariumView
      error={insightsRes.error}
      forecast={oracleRes.success ? oracleRes.data : undefined}
      insights={insightsRes.success ? (insightsRes.data as BotanicalInsights) : null}
    />
  )
}
