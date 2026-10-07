'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PiLeafFill } from 'react-icons/pi'
import { MdOutlineStickyNote2 } from 'react-icons/md'
import { IoLocationOutline, IoCalendarOutline, IoTimeOutline } from 'react-icons/io5'

import { FloweringEventModal, type FloweringFormValues } from '@/components'
import { closeFloweringEvent, type ActiveFloweringEvent } from '@/actions'
import { useToastStore } from '@/store'
import { getImageUrl } from '@/lib'
import { formatCalendarDate } from '@/utils'
import { ZoneTypeLabels, type ZoneType } from '@/config'

interface BiologicalAuditPanelProps {
  initialEvents?: ActiveFloweringEvent[]
}

export function BiologicalAuditPanel({ initialEvents = [] }: BiologicalAuditPanelProps) {
  const router = useRouter()
  const [floweringEvents, setFloweringEvents] = useState<ActiveFloweringEvent[]>(initialEvents)
  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()
  const [eventToClose, setEventToClose] = useState<ActiveFloweringEvent | null>(null)

  const handleOpenCloseFlowering = (event: ActiveFloweringEvent) => {
    setEventToClose(event)
  }

  const handleSaveFlowering = (values: FloweringFormValues) => {
    if (!values.eventId || !values.endDate) return

    startTransition(async () => {
      const res = await closeFloweringEvent({
        eventId: values.eventId!,
        endDate: values.endDate!,
        notes: values.notes,
      })

      if (res.ok) {
        addToast('Floración finalizada correctamente.', 'success')
        setEventToClose(null)
        setFloweringEvents((prev) => prev.filter((e) => e.id !== values.eventId))
        router.refresh()
      } else {
        addToast(res.message || 'No se pudo finalizar la floración.', 'error')
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {floweringEvents.map((event) => {
          const rawImageUrl = event.plant.species.images?.[0]?.url
          const formattedImageUrl = getImageUrl(rawImageUrl)

          const startObj = new Date(event.startDate)
          const nowObj = new Date()
          const daysElapsed = Math.max(
            0,
            Math.floor((nowObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)),
          )

          const zoneLabel = event.plant.location?.zone
            ? ZoneTypeLabels[event.plant.location.zone as ZoneType] || event.plant.location.zone
            : 'Sin Ubicación'

          return (
            <div
              key={event.id}
              className="bg-surface border-input-outline group hover:bg-hover-overlay hover:border-zinc-300 dark:hover:border-zinc-700 focus-visible:ring-primary relative flex min-w-0 w-full cursor-pointer flex-col justify-between gap-3.5 rounded-xl border p-4 shadow-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
              role="button"
              tabIndex={0}
              onClick={() => handleOpenCloseFlowering(event)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleOpenCloseFlowering(event)
                }
              }}
            >
              <div className="flex flex-col gap-3.5">
                {/* Cabecera con Foto y Detalles Principales */}
                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Miniatura de la Planta / Especie */}
                  <div className="border-input-outline/50 bg-input/20 relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl border">
                    {formattedImageUrl ? (
                      <img
                        alt={event.plant.species.name}
                        className="size-full object-cover"
                        src={formattedImageUrl}
                      />
                    ) : (
                      <div className="text-secondary/40 flex size-full items-center justify-center bg-zinc-100/50 dark:bg-zinc-900/50">
                        <PiLeafFill className="size-8 opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Información Principal */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    {/* Fila superior: Código ID del Ejemplar destacado y Fecha */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-primary bg-surface/80 border-input-outline rounded-lg border px-2.5 py-0.5 font-mono text-xs font-black tracking-tight shadow-2xs tds-sm:text-sm">
                        #{event.plant.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-secondary flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold">
                        <IoCalendarOutline className="text-secondary size-3.5 opacity-60" />
                        {formatCalendarDate(event.startDate)}
                      </span>
                    </div>

                    {/* Nombre de la especie */}
                    <h4 className="text-primary mt-1 font-sans text-base leading-tight font-bold sm:text-lg">
                      {event.plant.species.name}
                    </h4>

                    {/* Zona con icono secondary + Días Transcurridos */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <div className="text-secondary flex items-center gap-1 text-[11px] font-medium opacity-80">
                        <IoLocationOutline className="text-secondary h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span>{zoneLabel}</span>
                      </div>
                      <span className="text-secondary font-mono text-[11px] opacity-30">•</span>
                      <div className="text-primary flex items-center gap-1 font-mono text-[11px] font-bold">
                        <IoTimeOutline className="text-secondary size-3.5 opacity-70" />
                        <span>
                          {daysElapsed} {daysElapsed === 1 ? 'día' : 'días'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas Observacionales si existen */}
                {event.notes && event.notes.trim().length > 0 && (
                  <div className="border-black-and-white/5 border-t border-dashed pt-2.5 w-full">
                    <div className="flex items-start gap-2">
                      <MdOutlineStickyNote2 className="text-secondary mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                      <p className="text-secondary text-[12px] leading-relaxed italic opacity-80 whitespace-pre-wrap break-words">
                        {event.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {floweringEvents.length === 0 && (
          <div className="text-secondary/50 border-input-outline col-span-2 rounded-xl border border-dashed py-12 text-center text-sm italic">
            No hay plantas en floración activa en este momento.
          </div>
        )}
      </div>

      {/* Modal para Concluir Floración */}
      <FloweringEventModal
        isOpen={!!eventToClose}
        isPending={isPending}
        targetPlant={
          eventToClose
            ? {
                id: eventToClose.plant.id,
                FloweringEvent: [
                  {
                    id: eventToClose.id,
                    startDate: eventToClose.startDate,
                    notes: eventToClose.notes,
                  },
                ],
              }
            : null
        }
        onClose={() => setEventToClose(null)}
        onSave={handleSaveFlowering}
      />
    </div>
  )
}
