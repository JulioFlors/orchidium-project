import type { Metadata } from 'next'

import { ControlPanel } from '@/components/operations/ControlPanel'
import { Subtitle, Title } from '@/components'

export const metadata: Metadata = {
  title: 'Centro de Control',
  description: 'Gestión manual de actuadores y sistemas de riego.',
}

export default function ControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Title title="Centro de Control" />

        <Subtitle subtitle="Operaciones Manuales" />

        <p className="max-w-2xl text-zinc-400">
          Control directo sobre los actuadores del invernadero. Utilice estas herramientas para
          mantenimiento, pruebas o correcciones puntuales del microclima.
        </p>
      </div>

      <ControlPanel />
    </div>
  )
}
