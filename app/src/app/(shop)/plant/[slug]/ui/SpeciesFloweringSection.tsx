'use client'

import { useEffect, useState } from 'react'
import { Flower2, Calendar, Clock, Sparkles } from 'lucide-react'

import { getSpeciesFloweringAnalytics } from '@/actions'

interface Props {
  speciesSlug: string
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

export function SpeciesFloweringSection({ speciesSlug }: Props) {
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

  if (isLoading || !data || data.totalFloweringEvents === 0) {
    return null
  }

  const maxMonthCount = Math.max(1, ...Object.values(data.monthlyFloweringDistribution))

  return (
    <div className="bg-surface border-input-outline mt-4 flex w-full max-w-[75ch] flex-col gap-6 rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-pink-500/10 p-2 text-pink-400">
            <Flower2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-primary text-base font-bold">
              🌸 Ciclo de Floración y Estacionalidad
            </h3>
            <p className="text-secondary text-xs">
              Métricas botánicas individuales calculadas para{' '}
              <span className="text-white italic">{data.speciesName}</span>
            </p>
          </div>
        </div>
        <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-300">
          {data.totalFloweringEvents} floración(es) registrada(s)
        </span>
      </div>

      {/* Indicadores Clave de la Especie */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-surface/60 border-input-outline flex items-center gap-4 rounded-xl border p-4">
          <div className="rounded-full bg-pink-400/10 p-3 text-pink-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
              Duración de Flor
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white">
                {data.avgFloweringDurationDays > 0 ? data.avgFloweringDurationDays : '--'}
              </span>
              <span className="text-secondary text-xs font-medium">días prom.</span>
            </div>
          </div>
        </div>

        <div className="bg-surface/60 border-input-outline flex items-center gap-4 rounded-xl border p-4">
          <div className="rounded-full bg-emerald-400/10 p-3 text-emerald-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
              Frecuencia Anual
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white">
                {data.lastYearFloweringCount}
              </span>
              <span className="text-secondary text-xs font-medium">flores / año</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Estacionalidad de Floración por Mes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-pink-400" />
          <h4 className="text-primary text-xs font-bold tracking-wider uppercase">
            Épocas del Año en que Florece (Estacionalidad)
          </h4>
        </div>

        <div className="grid grid-cols-12 items-end gap-1.5 pt-2">
          {MONTH_NAMES.map((mName, idx) => {
            const mNum = idx + 1
            const count = data.monthlyFloweringDistribution[mNum] || 0
            const heightPct = Math.round((count / maxMonthCount) * 100)

            return (
              <div key={mName} className="flex flex-col items-center gap-1.5">
                <span className="text-secondary text-[10px] font-bold">
                  {count > 0 ? count : ''}
                </span>
                <div className="bg-surface/80 border-input-outline flex h-20 w-full flex-col justify-end rounded-md border p-0.5">
                  <div
                    className="w-full rounded bg-gradient-to-t from-pink-600 to-pink-400 transition-all duration-300"
                    style={{ height: `${count > 0 ? Math.max(15, heightPct) : 4}%` }}
                  />
                </div>
                <span className="text-secondary text-[10px] font-medium">{mName}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
