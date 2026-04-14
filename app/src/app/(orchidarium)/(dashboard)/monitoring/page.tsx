import type { Metadata } from 'next'

import { SWRConfig } from 'swr'

import { MonitoringView } from './ui'

import { getSensorHistory, getRainHistory } from '@/actions/sensors/sensor-actions'

export const metadata: Metadata = {
  title: 'Monitor Ambiental',
  description: 'Condiciones ambientales del orquideario en tiempo real e históricos.',
}

export default async function Page() {
  // Pre-cargamos los datos para las tarjetas por defecto (EXTERIOR, 24h)
  // Utilizamos Promise.all para máxima velocidad en el servidor
  const [historyRes, rainRes] = await Promise.all([
    getSensorHistory('24h', 'EXTERIOR'),
    getRainHistory('24h', 'EXTERIOR'),
  ])

  // Preparamos el fallback solo si las peticiones fueron exitosas
  // Si fallan, SWR simplemente iniciará su carga normal en el cliente
  const fallback: Record<string, unknown> = {}

  if (historyRes.success) {
    // Este fallback alimenta la consulta de "cardStatusData" en el MonitoringView
    fallback['/api/sensors/history?range=24h&zone=EXTERIOR'] = historyRes.data
  }

  if (rainRes.success) {
    // Nota: rain historical data solo se precarga si es necesario para el estado inicial,
    // pero como no hay métrica seleccionada, rainData estará en null por defecto en el cliente.
    // Sin embargo, tener el fallback agiliza la visualización si el usuario hace clic rápido.
    fallback['/api/sensors/rain?range=24h&zone=EXTERIOR'] = rainRes.data
  }

  return (
    <SWRConfig value={{ fallback }}>
      <MonitoringView />
    </SWRConfig>
  )
}
