import type { ActiveFloweringEvent } from '@/actions'

import { BiologicalAuditPanel } from './components'

import { Heading } from '@/components'

interface OrchidariumViewProps {
  initialEvents?: ActiveFloweringEvent[]
}

export function OrchidariumView({ initialEvents = [] }: OrchidariumViewProps) {
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description="Supervisión centralizada y conclusión de eventos de floración activa en todos los ejemplares del orquideario."
        title="Floraciones"
      />

      <div className="flex flex-col gap-8">
        <BiologicalAuditPanel initialEvents={initialEvents} />
      </div>
    </div>
  )
}
