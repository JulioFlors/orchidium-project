import type { Metadata } from 'next'

import { SWRConfig } from 'swr'

import { MonitoringView } from './ui'

import { getSensorData, getRainData } from '@/actions'
import { getLastHeartbeat } from '@/lib/server/environment'
import { ZoneType } from '@/config/mappings'

export const metadata: Metadata = {
  title: 'Monitor Ambiental',
  description: 'Condiciones ambientales del orquideario en tiempo real e históricos.',
}

export default async function Page() {
  // Pre-cargamos los datos para las tarjetas por defecto (EXTERIOR, 12h)
  const [historyRes, rainRes, hbExterior, hbZonaA] = await Promise.all([
    getSensorData('12h', ZoneType.EXTERIOR),
    getRainData(ZoneType.EXTERIOR),
    getLastHeartbeat('Actuator_Controller'),
    getLastHeartbeat('Weather_Station', ZoneType.ZONA_A),
  ])

  const initialHeartbeats: Record<string, { timestamp: number; status: string }> = {}

  if (hbExterior) initialHeartbeats['PristinoPlant/Actuator_Controller/status'] = hbExterior
  if (hbZonaA)
    initialHeartbeats[`PristinoPlant/Weather_Station/${ZoneType.ZONA_A}/status`] = hbZonaA

  const fallback: Record<string, unknown> = {}

  if (historyRes.success) {
    fallback[`/api/environment/data?range=12h&zone=${ZoneType.EXTERIOR}`] = {
      data: historyRes.data,
      liveKPIs: historyRes.liveKPIs,
      lastRainState: historyRes.lastRainState,
    }
  }

  if (rainRes.success) {
    fallback[`/api/environment/rain?range=12h&zone=${ZoneType.EXTERIOR}`] = rainRes.data
  }

  return (
    <SWRConfig value={{ fallback }}>
      <MonitoringView initialHeartbeats={initialHeartbeats} />
    </SWRConfig>
  )
}
