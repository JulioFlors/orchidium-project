import type { Metadata } from 'next'

import { SWRConfig } from 'swr'

import { BotanicalAnalysisView } from './ui'

import { getSensorData } from '@/actions'
import { ZoneType } from '@/config/mappings'

export const metadata: Metadata = {
  title: 'Análisis Botánico',
  description: 'Análisis de métricas procesadas (ciclos de 24h) para evaluación biológica.',
}

export default async function Page() {
  const [historyRes] = await Promise.all([getSensorData('24h', ZoneType.EXTERIOR)])

  const fallback: Record<string, unknown> = {}

  if (historyRes.success) {
    fallback[`/api/environment/history?range=24h&zone=${ZoneType.EXTERIOR}`] = {
      data: historyRes.data,
      liveKPIs: historyRes.liveKPIs,
    }
  }

  return (
    <SWRConfig value={{ fallback }}>
      <BotanicalAnalysisView />
    </SWRConfig>
  )
}
