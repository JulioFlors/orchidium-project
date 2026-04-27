import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { OrchidariumView } from './ui'

import { auth } from '@/lib/server'
import { getAllLatestBotanicalInsights, getLatestOracleForecast } from '@/actions'

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

  // Obtenemos de forma paralela los insights de todas las zonas y el pronóstico satelital
  const [insightsRes, oracleRes] = await Promise.all([
    getAllLatestBotanicalInsights(),
    getLatestOracleForecast(),
  ])

  return (
    <OrchidariumView
      error={insightsRes.error}
      forecast={oracleRes.success ? oracleRes.data : undefined}
      insights={insightsRes.success ? insightsRes.data || null : null}
    />
  )
}
