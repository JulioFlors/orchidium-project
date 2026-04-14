import type { Metadata } from 'next'

import { SWRConfig } from 'swr'

import { HistoryView } from './ui'

import { getHistoryTasks } from '@/actions/operations/history-actions'

export const metadata: Metadata = {
  title: 'Historial de Operaciones',
  description: 'Registro auditable de todas las tareas del sistema de riego.',
}

export default async function Page() {
  // Pre-cargamos la primera página de tareas en el servidor
  const res = await getHistoryTasks(20, 0)
  const initialData = res.success ? res.data : []

  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/tasks/history?limit=20&offset=0': initialData,
        },
      }}
    >
      <HistoryView />
    </SWRConfig>
  )
}
