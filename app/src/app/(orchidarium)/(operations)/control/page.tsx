import type { Metadata } from 'next'

import { ControlView } from './ui'

export const metadata: Metadata = {
  title: 'Centro de Control',
  description: 'Gestión manual del sistema de riego.',
}

export default function ControlPage() {
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <ControlView />
    </div>
  )
}
