import type { Metadata } from 'next'

import { SchedulesView } from './ui'

export const metadata: Metadata = {
  title: 'Rutinas',
  description: 'Configuración de las rutinas de riego programadas.',
}

export default function SchedulesPage() {
  return <SchedulesView />
}
