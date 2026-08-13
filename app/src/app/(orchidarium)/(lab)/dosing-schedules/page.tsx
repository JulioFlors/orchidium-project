import type { Metadata } from 'next'

import { DosingSchedulesView } from './ui'

export const metadata: Metadata = {
  title: 'Rutinas de Dosificación',
  description: 'Programación de ciclos de fertilización y control fitosanitario.',
}

export default function DosingSchedulesPage() {
  return <DosingSchedulesView />
}
