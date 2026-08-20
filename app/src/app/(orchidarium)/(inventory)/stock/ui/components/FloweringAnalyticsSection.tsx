'use client'

import { useMemo } from 'react'
import { MdLocalFlorist, MdOutlineInfo, MdAdd } from 'react-icons/md'

import { PlantInstance } from './PlantInstanceCard'
import { FloweringRecordCard, FloweringRecord } from './FloweringRecordCard'

import { SelectorGroup, type SelectorGroupItem, Button } from '@/components'
import { SpeciesFloweringAnalyticsData } from '@/interfaces'

interface FloweringAnalyticsSectionProps {
  speciesName: string
  selectedPlant: PlantInstance | null
  championPlant: PlantInstance | null
  analytics: SpeciesFloweringAnalyticsData | null
  onClearSelection?: () => void
  onOpenFloweringModal: (plant: PlantInstance) => void
  onCloseFloweringRecord: (record: FloweringRecord) => void
}

const FULL_MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

function getElapsedDaysFromDate(startDate: Date | string) {
  const startMs = new Date(startDate).getTime()
  const diffMs = new Date().setHours(0, 0, 0, 0) - new Date(startMs).setHours(0, 0, 0, 0)

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export function FloweringAnalyticsSection({
  speciesName,
  selectedPlant,
  championPlant,
  analytics,
  onClearSelection,
  onOpenFloweringModal,
  onCloseFloweringRecord,
}: FloweringAnalyticsSectionProps) {
  // Determinar métricas activas según si hay un ejemplar seleccionado o la vista de especie
  const currentStats = useMemo(() => {
    if (selectedPlant) {
      const pStat = analytics?.plantsStats[selectedPlant.id]

      if (pStat) {
        return {
          durationDays: pStat.avgFloweringDurationDays,
          frequencyCount: pStat.lastYearFloweringCount,
          totalEvents: pStat.totalFloweringEvents,
          monthlyDist: pStat.monthlyFloweringDistribution,
          events: pStat.events,
        }
      }

      // Si aún no está en analytics pero tiene eventos locales
      const localEvents = selectedPlant.FloweringEvent || []
      const oneYearAgo = new Date()

      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const closedEvents = localEvents.filter((e) => e.endDate)
      let totalD = 0

      for (const ce of closedEvents) {
        const ms = new Date(ce.endDate!).getTime() - new Date(ce.startDate).getTime()

        totalD += Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
      }
      const avgD = closedEvents.length > 0 ? Math.ceil(totalD / closedEvents.length) : 0
      const lastYearC = localEvents.filter((e) => new Date(e.startDate) >= oneYearAgo).length

      const pDist: Record<number, number> = {}

      for (let i = 1; i <= 12; i++) pDist[i] = 0
      for (const le of localEvents) {
        const m = new Date(le.startDate).getMonth() + 1

        pDist[m] = (pDist[m] || 0) + 1
      }

      const formattedEvents: FloweringRecord[] = localEvents.map((le) => ({
        id: le.id,
        startDate: le.startDate,
        endDate: le.endDate,
        notes: le.notes,
        durationDays: le.endDate
          ? Math.max(
              1,
              Math.round(
                (new Date(le.endDate).getTime() - new Date(le.startDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : undefined,
        isActive: !le.endDate,
        daysElapsed: !le.endDate ? getElapsedDaysFromDate(le.startDate) : undefined,
      }))

      return {
        durationDays: avgD,
        frequencyCount: lastYearC,
        totalEvents: localEvents.length,
        monthlyDist: pDist,
        events: formattedEvents,
      }
    }

    // Vista de Especie / Champion
    return {
      durationDays: analytics?.avgFloweringDurationDays || 0,
      frequencyCount: analytics?.lastYearFloweringCount || 0,
      totalEvents: analytics?.totalFloweringEvents || 0,
      monthlyDist: analytics?.monthlyFloweringDistribution || {},
      events: analytics?.events || [],
    }
  }, [selectedPlant, analytics])

  // Meses activos para el SelectorGroup
  const activeMonthsData = useMemo(() => {
    return FULL_MONTH_NAMES.map((mName, idx) => {
      const monthNum = idx + 1
      const count = currentStats.monthlyDist[monthNum] || 0

      return { monthNum, mName, count }
    }).filter((item) => item.count > 0)
  }, [currentStats.monthlyDist])

  const maxMonthCount = useMemo(() => {
    if (activeMonthsData.length === 0) return 1

    return Math.max(1, ...activeMonthsData.map((d) => d.count))
  }, [activeMonthsData])

  const selectorItems = useMemo<SelectorGroupItem[]>(() => {
    return activeMonthsData.map(({ mName, count }) => {
      const heightPct = Math.max(20, Math.round((count / maxMonthCount) * 100))

      return {
        id: mName,
        label: mName,
        subtitle: mName,
        value: count,
        percentage: heightPct,
      }
    })
  }, [activeMonthsData, maxMonthCount])

  const isSelectedChampion = selectedPlant && championPlant && selectedPlant.id === championPlant.id

  return (
    <div
      className="bg-canvas border-input-outline flex w-full flex-col gap-6 rounded-xl border p-6"
      id="flowering-analytics-section"
    >
      {/* 1. Header Contextual de la Sección */}
      <div className="flex flex-col gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-primary text-lg font-bold">Ciclo de Floración</h2>
            {selectedPlant ? (
              <span className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-xs font-bold">
                <MdLocalFlorist className="size-3.5" />
                Ejemplar #{selectedPlant.id.slice(-8).toUpperCase()}
                {isSelectedChampion && ' (Mejor Rendimiento)'}
              </span>
            ) : (
              <span className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold">
                Récord de la Especie{' '}
                {championPlant ? `(#${championPlant.id.slice(-8).toUpperCase()})` : ''}
              </span>
            )}
          </div>
          <p className="text-secondary text-xs">
            {selectedPlant
              ? `Estadísticas y bitácora de floración exclusivas del ejemplar #${selectedPlant.id.slice(-8).toUpperCase()}.`
              : `Estadísticas de referencia botánica de ${speciesName} basadas en el ejemplar con mejor rendimiento.`}
          </p>
        </div>

        {selectedPlant && onClearSelection && (
          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            Ver Récord Global de Especie
          </Button>
        )}
      </div>

      {/* 2. Tarjetas de Métricas Simplificadas (Math.ceil) */}
      <div className="grid grid-cols-1 gap-3.5 tds-xs:grid-cols-2 tds-sm:grid-cols-3">
        <div className="bg-surface/60 border-input-outline flex flex-col justify-center rounded-xl border p-3.5 sm:p-4">
          <span className="text-secondary text-xs font-semibold">Duración Promedio</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-primary text-lg font-bold font-mono">
              {currentStats.durationDays > 0
                ? `${currentStats.durationDays} ${currentStats.durationDays === 1 ? 'día' : 'días'}`
                : '--'}
            </span>
          </div>
        </div>

        <div className="bg-surface/60 border-input-outline flex flex-col justify-center rounded-xl border p-3.5 sm:p-4">
          <span className="text-secondary text-xs font-semibold">Frecuencia Anual</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-primary text-lg font-bold font-mono">
              {currentStats.frequencyCount}{' '}
              {currentStats.frequencyCount === 1 ? 'floración / año' : 'floraciones / año'}
            </span>
          </div>
        </div>

        <div className="bg-surface/60 border-input-outline flex flex-col justify-center rounded-xl border p-3.5 sm:p-4">
          <span className="text-secondary text-xs font-semibold">Registros Totales</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-primary text-lg font-bold font-mono">
              {currentStats.totalEvents} {currentStats.totalEvents === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Calendario Floral */}
      {selectorItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-primary text-xs font-bold tracking-wider uppercase">
            Calendario floral {selectedPlant ? 'del ejemplar' : 'de la especie'}
          </h4>
          <SelectorGroup items={selectorItems} mode="info" shape="circle" />
        </div>
      )}

      {/* 4. Subsección: Historial de Floraciones y Bitácora de Notas */}
      <div className="flex flex-col gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-primary text-base font-bold">Historial de Floraciones</h3>
            <span className="text-secondary text-xs font-semibold opacity-70">
              ({currentStats.events.length})
            </span>
          </div>

          {selectedPlant && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenFloweringModal(selectedPlant)}
            >
              <MdAdd className="mr-1 size-4" />
              Nueva Floración
            </Button>
          )}
        </div>

        {currentStats.events.length === 0 ? (
          <div className="bg-surface/30 border-input-outline flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
            <MdOutlineInfo className="text-secondary mb-2 size-6 opacity-40" />
            <p className="text-secondary text-xs font-medium">
              {selectedPlant
                ? 'Este ejemplar no posee eventos de floración registrados aún.'
                : 'No se encontraron eventos de floración registrados para esta especie.'}
            </p>
            {selectedPlant && (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() => onOpenFloweringModal(selectedPlant)}
              >
                Registrar Primera Floración
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {currentStats.events.map((record) => (
              <FloweringRecordCard
                key={record.id}
                record={record}
                onCloseFlowering={() => onCloseFloweringRecord(record)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
