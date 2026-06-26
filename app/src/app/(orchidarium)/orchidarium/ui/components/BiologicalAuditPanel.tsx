'use client'

import { useState, useEffect, useTransition } from 'react'
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

  const loadData = async () => {
    setIsLoading(true)
    const res = await getActiveBiologicalEvents()
    if (res.success && res.data) {
      setFloweringEvents(res.data.floweringEvents as unknown as FloweringEvent[])
      setPestSightings(res.data.pestSightings as unknown as PestSighting[])
    } else {
      addToast(res.error || 'Error al cargar datos biológicos.', 'error')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

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
        <div className="flex items-center gap-2 border-input-outline border pb-1 rounded-lg p-1 bg-surface/20">
          <button
            type="button"
            onClick={() => setActiveTab('flowering')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'flowering'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <PiFlowerFill className="h-4 w-4" />
            Floración Activa ({floweringEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pests')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'pests'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <PiBugFill className="h-4 w-4" />
            Plagas Recientes ({pestSightings.length})
          </button>
        </div>

        <Button size="sm" variant="secondary" onClick={loadData} disabled={isLoading}>
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
                    className="border-input-outline bg-surface/10 hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col justify-between rounded-xl border p-5 transition-all duration-300"
                  >
                    <div>
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
                        <div>
                          <Badge variant="secondary">
                            {event.plant.species.genus.name}
                          </Badge>
                          <h4 className="text-primary mt-1 font-bold text-lg leading-tight font-sans">
                            {event.plant.species.name}
                          </h4>
                          <span className="text-secondary font-mono text-[10px] opacity-40">
                            Planta ID: {event.plant.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-secondary text-xs font-semibold flex items-center gap-1">
                          <PiCalendarFill className="text-emerald-500" />
                          {new Date(event.startDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      {/* Climatología de Inducción */}
                      <div className="py-4">
                        <span className="text-secondary text-[10px] font-bold tracking-wider uppercase opacity-55 block mb-2">
                          Métricas de Inducción (Últimos 7 días)
                        </span>

                        {hasWeather ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-surface/30 rounded-lg p-2.5 border border-input-outline">
                              <span className="text-secondary text-[9px] font-semibold block uppercase opacity-50">
                                Luz (DLI)
                              </span>
                              <span className="text-primary font-mono text-xs font-black">
                                {event.dliAtInduction !== null
                                  ? `${event.dliAtInduction.toFixed(1)} mol/m²/d`
                                  : 'N/D'}
                              </span>
                            </div>
                            <div className="bg-surface/30 rounded-lg p-2.5 border border-input-outline">
                              <span className="text-secondary text-[9px] font-semibold block uppercase opacity-50">
                                Temp Día/Noc
                              </span>
                              <span className="text-primary font-mono text-xs font-black">
                                {event.tempDayAverage !== null && event.tempNightAverage !== null
                                  ? `${event.tempDayAverage.toFixed(1)}° / ${event.tempNightAverage.toFixed(1)}°`
                                  : 'N/D'}
                              </span>
                            </div>
                            <div className="bg-surface/30 rounded-lg p-2.5 border border-input-outline">
                              <span className="text-secondary text-[9px] font-semibold block uppercase opacity-50">
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
                          <div className="text-secondary/40 text-xs italic bg-surface/20 rounded-lg p-3 text-center border border-dashed border-input-outline">
                            Sin datos de telemetría climatológica de inducción
                          </div>
                        )}

                        {event.notes && (
                          <p className="text-secondary text-xs italic mt-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-input-outline font-mono">
                            "{event.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botón Finalizar */}
                    <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800/50 flex items-center justify-between">
                      <span className="text-secondary text-[10px] font-semibold opacity-55 uppercase">
                        Zona: {event.plant.location?.zone || 'EXTERIOR'} / Mesa {event.plant.location?.table || 'N/A'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEndFlowering(event.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/10 focus:outline-none"
                      >
                        <PiCalendarXFill className="h-4 w-4" />
                        Finalizar Floración
                      </button>
                    </div>
                  </div>
                )
              })}

              {floweringEvents.length === 0 && (
                <div className="text-secondary/50 col-span-2 py-12 text-center text-sm italic border border-dashed border-input-outline rounded-xl">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-primary font-bold text-base leading-tight font-sans">
                            {pestLabel}
                          </h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getSeverityColor(sighting.severity)}`}>
                            {sighting.severity}
                          </span>
                        </div>
                        <p className="text-secondary text-xs mt-1">
                          Zona: <span className="font-bold">{sighting.zone}</span>
                          {sighting.plant && (
                            <>
                              {' '}• Planta: <span className="font-bold">{sighting.plant.species.name}</span>
                            </>
                          )}
                        </p>
                        {sighting.notes && (
                          <p className="text-secondary/70 text-xs italic mt-1 bg-surface/20 p-2 rounded font-sans">
                            "{sighting.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-secondary shrink-0 text-xs font-semibold flex items-center gap-1 self-end sm:self-center">
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
                <div className="text-secondary/50 py-12 text-center text-sm italic border border-dashed border-input-outline rounded-xl">
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
