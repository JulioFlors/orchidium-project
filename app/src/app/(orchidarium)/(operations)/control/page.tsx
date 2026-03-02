import type { Metadata } from 'next'

import { ControlPanel } from '@/components/operations/ControlPanel'

export const metadata: Metadata = {
  title: 'Centro de Control',
  description: 'Gestión manual de actuadores y sistemas de riego.',
}

export default function ControlPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <ControlPanel />
    </div>
  )
}
