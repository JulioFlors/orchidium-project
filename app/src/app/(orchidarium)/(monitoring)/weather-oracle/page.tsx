import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { WeatherOracleView } from './ui'

import { auth } from '@/lib/server'
import { getLatestOracleForecast } from '@/actions'

export const metadata: Metadata = {
  title: 'Pronósticos Meteorológicos',
  description: "Datos obtenidos desde API's meteorológicas.",
}

export default async function WeatherOraclePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/weather-oracle')
  }

  const oracleRes = await getLatestOracleForecast()

  return (
    <WeatherOracleView
      error={oracleRes.success ? undefined : oracleRes.error}
      forecast={oracleRes.success ? oracleRes.data : undefined}
    />
  )
}
