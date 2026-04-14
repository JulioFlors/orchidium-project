import type { Metadata } from 'next'

import { SchedulesView } from './ui'

export const metadata: Metadata = {
  title: 'Rutinas',
  description: 'Configuración de las rutinas de riego programadas.',
}

export default function SchedulesPage() {
  return (
    <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 pb-12">
      <SchedulesView />
    </div>
  )
}
