import type { Metadata } from 'next'

import { ControlPanel } from '@/components/operations/ControlPanel'
import { Title } from '@/components'

export const metadata: Metadata = {
  title: 'Centro de Control',
  description: 'Gestión manual de actuadores y sistemas de riego.',
}

export default function ControlPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Title className="text-xl" title="Control de Riego" />

        <p className="text-secondary max-w-2xl">
          Control directo sobre los actuadores del orquideario. Utilice estas herramientas para
          mantenimiento, pruebas o correcciones puntuales del microclima.
        </p>
      </div>

      <ControlPanel />
    </div>
  )
}
