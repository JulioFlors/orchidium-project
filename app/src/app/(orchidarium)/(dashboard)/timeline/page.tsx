import type { Metadata } from 'next'

import { TimelineView } from '@/components/admin/timeline/TimelineView'

export const metadata: Metadata = {
  title: 'Línea de Tiempo',
}

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Tareas</h1>
          <p className="mt-2 text-zinc-400">
            Visualiza y gestiona las tareas de riego automáticas y manuales.
          </p>
        </div>

        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          type="button"
        >
          + Nueva Tarea
        </button>
      </div>

      <TimelineView />
    </div>
  )
}
