import { BiologicalAuditPanel } from './components'

import { Heading } from '@/components'

export function OrchidariumView() {
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description="Supervisión centralizada y conclusión de eventos de floración activa en todos los ejemplares del orquideario."
        title="Floraciones"
      />

      <div className="flex flex-col gap-8">
        <BiologicalAuditPanel />
      </div>
    </div>
  )
}
