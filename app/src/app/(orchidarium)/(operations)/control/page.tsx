import type { Metadata } from 'next'

import { ControlView } from './ui'

export const metadata: Metadata = {
  title: 'Centro de Control',
  description: 'Gestión manual del sistema de riego.',
}

export default function ControlPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <ControlView />
    </div>
  )
}
