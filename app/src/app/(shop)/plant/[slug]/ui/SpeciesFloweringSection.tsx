'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

import { getSpeciesFloweringAnalytics } from '@/actions'
import { SelectorGroup, type SelectorGroupItem } from '@/components'

interface Props {
  speciesSlug: string
  className?: string
  fullWidth?: boolean
}

interface AnalyticsData {
  speciesName: string
  totalFloweringEvents: number
  lastYearFloweringCount: number
  avgFloweringDurationDays: number
  monthlyFloweringDistribution: Record<number, number>
}

const MONTH_NAMES = [
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

export function SpeciesFloweringSection({ speciesSlug, className, fullWidth = false }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSpeciesFloweringAnalytics(speciesSlug)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data)
        }
      })
      .finally(() => setIsLoading(false))
  }, [speciesSlug])

  // Obtener únicamente los meses que presentan actividad registrada (conteo > 0)
  const activeMonthsData = useMemo(() => {
    if (!data) return []

    return MONTH_NAMES.map((mName, idx) => {
      const monthNum = idx + 1
      const count = data.monthlyFloweringDistribution[monthNum] || 0

      return { monthNum, mName, count }
    }).filter((item) => item.count > 0)
  }, [data])

  // Máximo conteo mensual para el porcentaje de relleno
  const maxMonthCount = useMemo(() => {
    if (activeMonthsData.length === 0) return 1

    return Math.max(1, ...activeMonthsData.map((d) => d.count))
  }, [activeMonthsData])

  // Adaptación de los ítems al componente reusable SelectorGroup
  const selectorItems = useMemo<SelectorGroupItem[]>(() => {
    return activeMonthsData.map(({ mName, count }) => {
      const heightPct = Math.max(20, Math.round((count / maxMonthCount) * 100))

      return {
        id: mName,
        label: mName,
        subtitle: fullWidth ? mName : undefined,
        value: fullWidth ? count : undefined,
        percentage: heightPct,
      }
    })
  }, [activeMonthsData, maxMonthCount, fullWidth])

  if (isLoading || !data || data.totalFloweringEvents === 0) {
    return null
  }

  // ─────────────────────────────────────────────────────────────
  // VISTA 1: TIENDA (/plant/[slug]) — Layout nativo fluido
  // ─────────────────────────────────────────────────────────────
  if (!fullWidth) {
    return (
      <div className={clsx('mt-6 mb-6 max-w-[75ch] w-full', className)}>
        {/* Título de sección (Mismo estilo y separación pb-3 que Descripción) */}
        <h3 className="text-primary pb-3 font-bold">Ciclo de Floración</h3>

        {/* Métricas en líneas horizontales (Layout idéntico a SizeSelector / Maceta 10cm) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-start">
            <span className="text-primary font-semibold">Duración</span>
            <span className="text-secondary fade-in ml-4 font-semibold transition-all">
              {data.avgFloweringDurationDays > 0
                ? `${data.avgFloweringDurationDays} días promedio`
                : '--'}
            </span>
          </div>

          <div className="flex items-baseline justify-start">
            <span className="text-primary font-semibold">Frecuencia</span>
            <span className="text-secondary fade-in ml-4 font-semibold transition-all">
              {data.lastYearFloweringCount}{' '}
              {data.lastYearFloweringCount === 1 ? 'floración / año' : 'floraciones / año'}
            </span>
          </div>
        </div>

        {/* Título Calendario floral */}
        <h3 className="text-primary pt-5 pb-3 font-bold">Calendario floral</h3>

        {/* Círculos flexibles SelectorGroup de meses únicamente activos */}
        <SelectorGroup items={selectorItems} mode="info" shape="circle" />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // VISTA 2: INVENTARIO (/stock/[slug]) — Contenedor de Administración
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={clsx(
        'bg-canvas border-input-outline mt-4 flex w-full flex-col gap-6 rounded-xl border p-6',
        className,
      )}
    >
      {/* Header Contextual Limpio */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-primary text-base font-bold">Ciclo de Floración</h3>
      </div>

      {/* 3 Tarjetas de Métricas Simplificadas (Exclusivas de Stock) */}
      <div className="grid grid-cols-1 gap-3.5 tds-xs:grid-cols-2 tds-sm:grid-cols-3">
        <div className="bg-surface/60 border-input-outline flex flex-col justify-center rounded-xl border p-3.5 sm:p-4">
          <span className="text-secondary text-xs font-semibold">Duración</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-primary text-sm font-bold">
              {data.avgFloweringDurationDays > 0
                ? `${data.avgFloweringDurationDays} días prom.`
                : '--'}
            </span>
          </div>
        </div>

        <div className="bg-surface/60 border-input-outline flex flex-col justify-center rounded-xl border p-3.5 sm:p-4">
          <span className="text-secondary text-xs font-semibold">Frecuencia</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-primary text-sm font-bold">
              {data.lastYearFloweringCount}{' '}
              {data.lastYearFloweringCount === 1 ? 'floración / año' : 'floraciones / año'}
            </span>
          </div>
        </div>

        <div className="bg-surface/60 border-input-outline flex flex-col justify-center rounded-xl border p-3.5 sm:p-4">
          <span className="text-secondary text-xs font-semibold">Registros</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-primary text-sm font-bold">
              {data.totalFloweringEvents}{' '}
              {data.totalFloweringEvents === 1 ? 'floración' : 'floraciones'}
            </span>
          </div>
        </div>
      </div>

      {/* Calendario floral en Stock */}
      <div className="flex flex-col gap-3">
        <h4 className="text-primary text-xs font-bold tracking-wider uppercase">
          Calendario floral
        </h4>

        <SelectorGroup items={selectorItems} mode="info" shape="circle" />
      </div>
    </div>
  )
}
