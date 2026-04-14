import type { Metadata } from 'next'

import { SWRConfig } from 'swr'

import { QueueView } from './ui'

import { getQueueTasks } from '@/actions/operations/queue-actions'

export const metadata: Metadata = {
  title: 'Cola de Ejecución',
  description: 'Vista detallada de la línea de tiempo de las tareas del sistema de riego.',
}

export default async function QueuePage() {
  // Pre-cargamos la cola de tareas en el servidor para hidratación
  const res = await getQueueTasks()
  const initialData = res.success ? res.data : []

  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/planner/queue': initialData,
        },
      }}
    >
      <QueueView />
    </SWRConfig>
  )
}
