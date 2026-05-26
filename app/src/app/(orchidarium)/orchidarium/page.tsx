import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { OrchidariumView } from './ui'

import { auth } from '@/lib/server'
import { getLatestOracleForecast } from '@/actions'

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

  // Obtenemos el pronóstico satelital
  const oracleRes = await getLatestOracleForecast()

  return (
    <OrchidariumView
      error={oracleRes.success ? undefined : oracleRes.error}
      forecast={oracleRes.success ? oracleRes.data : undefined}
    />
  )
}
