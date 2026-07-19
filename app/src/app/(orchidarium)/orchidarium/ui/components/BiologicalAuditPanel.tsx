'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import {
  PiFlowerFill,
  PiBugFill,
  PiCalendarFill,
  PiCalendarXFill,
  PiArrowClockwiseBold,
} from 'react-icons/pi'

import { Badge, Button } from '@/components'
import { getActiveBiologicalEvents, endFlowering } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

interface FloweringEvent {
  id: string
  startDate: string
  dliAtInduction: number | null
  difAtInduction: number | null
  tempDayAverage: number | null
  tempNightAverage: number | null
  humDayAverage: number | null
  humNightAverage: number | null
  notes: string | null
  plant: {
    id: string
    location: {
      zone: string
      table: string
    } | null
    species: {
      name: string
      genus: {
        name: string
      }
    }
  }
}

interface PestSighting {
  id: string
  capturedAt: string
  zone: string
  severity: string
  notes: string | null
  pest: {
    name: string
  } | null
  pestName: string | null
  plant: {
    species: {
      name: string
    }
  } | null
}

export function BiologicalAuditPanel() {
  const [floweringEvents, setFloweringEvents] = useState<FloweringEvent[]>([])
  const [pestSightings, setPestSightings] = useState<PestSighting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'flowering' | 'pests'>('flowering')

  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  const loadData = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true)
      }
      const res = await getActiveBiologicalEvents()

      if (res.success && res.data) {
        setFloweringEvents(res.data.floweringEvents as unknown as FloweringEvent[])
        setPestSightings(res.data.pestSightings as unknown as PestSighting[])
      } else {
        addToast(res.error || 'Error al cargar datos biológicos.', 'error')
      }
      setIsLoading(false)
    },
    [addToast],
  )

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData(false)
    })
  }, [loadData])

  const handleEndFlowering = (eventId: string) => {
    if (!confirm('¿Confirmas que deseas dar por terminada la floración de esta planta hoy?')) return

    startTransition(async () => {
      const res = await endFlowering(eventId, new Date())

      if (res.success) {
        addToast('Floración finalizada correctamente.', 'success')
        loadData()
      } else {
        addToast(res.error || 'No se pudo finalizar la floración.', 'error')
      }
    })
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
      case 'MEDIUM':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
      default:
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera y controles de pestaña */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="border-input-outline bg-surface/20 flex items-center gap-2 rounded-lg border p-1 pb-1">
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'flowering'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
            type="button"
            onClick={() => setActiveTab('flowering')}
          >
            <PiFlowerFill className="h-4 w-4" />
            Floración Activa ({floweringEvents.length})
          </button>
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'pests'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
            type="button"
            onClick={() => setActiveTab('pests')}
          >
            <PiBugFill className="h-4 w-4" />
            Plagas Recientes ({pestSightings.length})
          </button>
        </div>

        <Button disabled={isLoading} size="sm" variant="secondary" onClick={() => loadData()}>
          <PiArrowClockwiseBold className={`mr-1.5 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Panel
        </Button>
      </div>

      {isLoading ? (
        <div className="text-secondary/50 py-12 text-center text-sm italic">
          Cargando eventos biológicos...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Floración Activa */}
          {activeTab === 'flowering' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {floweringEvents.map((event) => {
                const hasWeather =
                  event.tempDayAverage !== null ||
                  event.tempNightAverage !== null ||
                  event.dliAtInduction !== null

                return (
                  <div
                    key={event.id}
                    className="border-input-outline bg-surface/10 flex flex-col justify-between rounded-xl border p-5 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div>
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
                        <div>
                          <Badge variant="secondary">{event.plant.species.genus.name}</Badge>
                          <h4 className="text-primary mt-1 font-sans text-lg leading-tight font-bold">
                            {event.plant.species.name}
                          </h4>
                          <span className="text-secondary font-mono text-[10px] opacity-40">
                            Planta ID: {event.plant.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-secondary flex items-center gap-1 text-xs font-semibold">
                          <PiCalendarFill className="text-emerald-500" />
                          {new Date(event.startDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      {/* Climatología de Inducción */}
                      <div className="py-4">
                        <span className="text-secondary mb-2 block text-[10px] font-bold tracking-wider uppercase opacity-55">
                          Métricas de Inducción (Últimos 7 días)
                        </span>

                        {hasWeather ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-surface/30 border-input-outline rounded-lg border p-2.5">
                              <span className="text-secondary block text-[9px] font-semibold uppercase opacity-50">
                                Luz (DLI)
                              </span>
                              <span className="text-primary font-mono text-xs font-black">
                                {event.dliAtInduction !== null
                                  ? `${event.dliAtInduction.toFixed(1)} mol/m²/d`
                                  : 'N/D'}
                              </span>
                            </div>
                            <div className="bg-surface/30 border-input-outline rounded-lg border p-2.5">
                              <span className="text-secondary block text-[9px] font-semibold uppercase opacity-50">
                                Temp Día/Noc
                              </span>
                              <span className="text-primary font-mono text-xs font-black">
                                {event.tempDayAverage !== null && event.tempNightAverage !== null
                                  ? `${event.tempDayAverage.toFixed(1)}° / ${event.tempNightAverage.toFixed(1)}°`
                                  : 'N/D'}
                              </span>
                            </div>
                            <div className="bg-surface/30 border-input-outline rounded-lg border p-2.5">
                              <span className="text-secondary block text-[9px] font-semibold uppercase opacity-50">
                                Hum Día/Noc
                              </span>
                              <span className="text-primary font-mono text-xs font-black">
                                {event.humDayAverage !== null && event.humNightAverage !== null
                                  ? `${event.humDayAverage.toFixed(0)}% / ${event.humNightAverage.toFixed(0)}%`
                                  : 'N/D'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-secondary/40 bg-surface/20 border-input-outline rounded-lg border border-dashed p-3 text-center text-xs italic">
                            Sin datos de telemetría climatológica de inducción
                          </div>
                        )}

                        {event.notes && (
                          <p className="text-secondary border-input-outline mt-3 rounded border bg-zinc-50 p-2 font-mono text-xs italic dark:bg-zinc-900">
                            &ldquo;{event.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botón Finalizar */}
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/50">
                      <span className="text-secondary text-[10px] font-semibold uppercase opacity-55">
                        Zona: {event.plant.location?.zone || 'EXTERIOR'} / Mesa{' '}
                        {event.plant.location?.table || 'N/A'}
                      </span>
                      <button
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/10 focus:outline-none"
                        disabled={isPending}
                        type="button"
                        onClick={() => handleEndFlowering(event.id)}
                      >
                        <PiCalendarXFill className="h-4 w-4" />
                        Finalizar Floración
                      </button>
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
          )}

          {/* Plagas Recientes */}
          {activeTab === 'pests' && (
            <div className="flex flex-col gap-4">
              {pestSightings.map((sighting) => {
                const pestLabel = sighting.pest?.name || sighting.pestName || 'Plaga Desconocida'

                return (
                  <div
                    key={sighting.id}
                    className="border-input-outline bg-surface/10 flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icono e indicador de gravedad */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                        <PiBugFill className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-primary font-sans text-base leading-tight font-bold">
                            {pestLabel}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${getSeverityColor(sighting.severity)}`}
                          >
                            {sighting.severity}
                          </span>
                        </div>
                        <p className="text-secondary mt-1 text-xs">
                          Zona: <span className="font-bold">{sighting.zone}</span>
                          {sighting.plant && (
                            <>
                              {' '}
                              • Planta:{' '}
                              <span className="font-bold">{sighting.plant.species.name}</span>
                            </>
                          )}
                        </p>
                        {sighting.notes && (
                          <p className="text-secondary/70 bg-surface/20 mt-1 rounded p-2 font-sans text-xs italic">
                            &ldquo;{sighting.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-secondary flex shrink-0 items-center gap-1 self-end text-xs font-semibold sm:self-center">
                      <PiCalendarFill className="text-zinc-500" />
                      {new Date(sighting.capturedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )
              })}

              {pestSightings.length === 0 && (
                <div className="text-secondary/50 border-input-outline rounded-xl border border-dashed py-12 text-center text-sm italic">
                  No hay avistamientos de plagas registrados recientemente.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
