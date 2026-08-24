'use client'

import { useMemo } from 'react'
import { clsx } from 'clsx'
import { MdOutlineInfo, MdAdd } from 'react-icons/md'

import { PlantInstance } from './PlantInstanceCard'
import { FloweringRecordCard, FloweringRecord } from './FloweringRecordCard'

import { SelectorGroup, type SelectorGroupItem, Button } from '@/components'
import { PotSizeColors as POT_SIZE_COLORS } from '@/config/mappings'
import { SpeciesFloweringAnalyticsData } from '@/interfaces'

interface FloweringAnalyticsSectionProps {
  speciesName: string
  selectedPlant: PlantInstance | null
  championPlant: PlantInstance | null
  analytics: SpeciesFloweringAnalyticsData | null
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
  onOpenFloweringModal,
  onCloseFloweringRecord,
}: FloweringAnalyticsSectionProps) {
  const activePlant = selectedPlant || championPlant
  const potColor = activePlant ? POT_SIZE_COLORS[activePlant.currentSize] : null

  // Métricas activas enfocadas en el ejemplar
  const currentStats = useMemo(() => {
    if (activePlant) {
      const pStat = analytics?.plantsStats[activePlant.id]

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
      const localEvents = activePlant.FloweringEvent || []
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

    return {
      durationDays: 0,
      frequencyCount: 0,
      totalEvents: 0,
      monthlyDist: {},
      events: [],
    }
  }, [activePlant, analytics])

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
            {activePlant && (
              <span
                className={clsx(
                  'inline-flex items-center rounded-full border px-3 py-0.5 font-mono text-xs font-bold',
                  potColor?.border || 'border-input-outline',
                  potColor?.bg || 'bg-surface',
                  potColor?.text || 'text-primary',
                )}
              >
                #{activePlant.id.slice(-8).toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-secondary text-xs leading-relaxed">
            Estadísticas y bitácora de floración de{' '}
            <span className="text-black-and-white shrink-0 rounded bg-zinc-200/50 px-1.5 py-0.5 text-[13px] font-bold tracking-widest dark:bg-zinc-800/80">
              {speciesName}
            </span>
            .
          </p>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas */}
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
            Calendario floral
          </h4>
          <SelectorGroup items={selectorItems} mode="info" shape="circle" />
        </div>
      )}

      {/* 4. Subsección: Historial de Floraciones y Bitácora de Notas */}
      <div className="flex flex-col gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-primary text-base font-bold">Historial de Floraciones</h3>
          </div>

          {activePlant && (
            <Button size="sm" variant="ghost" onClick={() => onOpenFloweringModal(activePlant)}>
              <MdAdd className="mr-1 size-4" />
              Nueva Floración
            </Button>
          )}
        </div>

        {currentStats.events.length === 0 ? (
          <div className="bg-surface/30 border-input-outline flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
            <MdOutlineInfo className="text-secondary mb-2 size-6 opacity-40" />
            <p className="text-secondary text-xs font-medium">
              {activePlant
                ? 'Este ejemplar no posee eventos de floración registrados aún.'
                : 'No se encontraron ejemplares registrados para esta especie.'}
            </p>
            {activePlant && (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() => onOpenFloweringModal(activePlant)}
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
