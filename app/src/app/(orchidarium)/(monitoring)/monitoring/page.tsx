import type { Metadata } from 'next'

import { SWRConfig } from 'swr'

import { MonitoringView } from './ui'

import { getSensorHistory, getRainHistory } from '@/actions'
import { getLastHeartbeat } from '@/lib/server/environment'

export const metadata: Metadata = {
  title: 'Monitor Ambiental',
  description: 'Condiciones ambientales del orquideario en tiempo real e históricos.',
}

export default async function Page() {
  // Pre-cargamos los datos para las tarjetas por defecto (EXTERIOR, 12h)
  const [historyRes, rainRes, hbExterior, hbZonaA] = await Promise.all([
    getSensorHistory('12h', 'EXTERIOR'),
    getRainHistory('EXTERIOR'),
    getLastHeartbeat('Actuator_Controller'),
    getLastHeartbeat('Environmental_Monitoring', 'ZONA_A'),
  ])

  const initialHeartbeats: Record<string, { timestamp: number; status: string }> = {}

  if (hbExterior) initialHeartbeats['PristinoPlant/Actuator_Controller/status'] = hbExterior
  if (hbZonaA) initialHeartbeats['PristinoPlant/Environmental_Monitoring/Zona_A/status'] = hbZonaA

  const fallback: Record<string, unknown> = {}

  if (historyRes.success) {
    fallback['/api/environment/history?range=12h&zone=EXTERIOR'] = historyRes.data
  }

  if (rainRes.success) {
    fallback['/api/environment/rain?range=12h&zone=EXTERIOR'] = rainRes.data
  }

  return (
    <SWRConfig value={{ fallback }}>
      <MonitoringView initialHeartbeats={initialHeartbeats} />
    </SWRConfig>
  )
}
