'use client'

import { useEffect, useState } from 'react'
import { Flower2, Bug, Calendar, Clock, AlertTriangle, TrendingUp } from 'lucide-react'

import { getBiologicalAnalytics } from '@/actions'

interface BiologicalAnalyticsData {
  totalFloweringEvents: number
  lastYearFloweringCount: number
  avgFloweringDurationDays: number
  monthlyFloweringDistribution: Record<number, number>
  totalPestSightings: number
  monthlyPestDistribution: Record<number, number>
  pestFrequencyList: Array<{
    name: string
    count: number
    avgTemp30d: number | null
    avgHum30d: number | null
  }>
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

export function BiologicalAnalyticsGrid() {
  const [analytics, setAnalytics] = useState<BiologicalAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getBiologicalAnalytics()
      .then((res) => {
        if (res.success && res.data) {
          setAnalytics(res.data)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="bg-surface border-input-outline flex h-48 w-full items-center justify-center rounded-xl border p-6">
        <p className="text-secondary animate-pulse text-sm">
          Cargando analítica biológica de 30 días...
        </p>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const maxFloweringMonthCount = Math.max(
    1,
    ...Object.values(analytics.monthlyFloweringDistribution),
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Tarjetas Superiores de Métricas Clave */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Duración Promedio Floración */}
        <div className="bg-surface border-input-outline flex flex-col justify-between rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
              Duración Floración
            </span>
            <Clock className="h-5 w-5 text-pink-400 opacity-80" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {analytics.avgFloweringDurationDays > 0 ? analytics.avgFloweringDurationDays : '--'}
            </span>
            <span className="text-secondary text-sm font-medium">días prom.</span>
          </div>
          <p className="text-secondary mt-2 text-[11px]">
            Duración promedio que la flor se mantiene abierta
          </p>
        </div>

        {/* Frecuencia Anual Floraciones */}
        <div className="bg-surface border-input-outline flex flex-col justify-between rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
              Tasa Anual Floración
            </span>
            <Flower2 className="h-5 w-5 text-emerald-400 opacity-80" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {analytics.lastYearFloweringCount}
            </span>
            <span className="text-secondary text-sm font-medium">eventos / año</span>
          </div>
          <p className="text-secondary mt-2 text-[11px]">
            Total de floraciones registradas en los últimos 365 días
          </p>
        </div>

        {/* Total Avistamientos Plagas */}
        <div className="bg-surface border-input-outline flex flex-col justify-between rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
              Avistamientos Plaga
            </span>
            <Bug className="h-5 w-5 text-amber-400 opacity-80" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {analytics.totalPestSightings}
            </span>
            <span className="text-secondary text-sm font-medium">reportes</span>
          </div>
          <p className="text-secondary mt-2 text-[11px]">
            Historico total de detección de plagas registrado
          </p>
        </div>

        {/* Total Floraciones Históricas */}
        <div className="bg-surface border-input-outline flex flex-col justify-between rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
              Histórico Floraciones
            </span>
            <TrendingUp className="h-5 w-5 text-sky-400 opacity-80" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {analytics.totalFloweringEvents}
            </span>
            <span className="text-secondary text-sm font-medium">eventos</span>
          </div>
          <p className="text-secondary mt-2 text-[11px]">
            Registro acumulado histórico en el orquideario
          </p>
        </div>
      </div>

      {/* Gráfico de Estacionalidad de Floración por Mes */}
      <div className="bg-surface border-input-outline flex flex-col gap-4 rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-pink-400" />
            <h4 className="text-primary text-sm font-bold">
              Estacionalidad de Floración (Meses del Año)
            </h4>
          </div>
          <span className="text-secondary text-xs font-medium">Frecuencia por mes de inicio</span>
        </div>

        <div className="mt-2 grid grid-cols-12 items-end gap-2 pt-4">
          {MONTH_NAMES.map((mName, idx) => {
            const mNum = idx + 1
            const count = analytics.monthlyFloweringDistribution[mNum] || 0
            const heightPct = Math.round((count / maxFloweringMonthCount) * 100)

            return (
              <div key={mName} className="flex flex-col items-center gap-2">
                <span className="text-secondary text-[10px] font-semibold">
                  {count > 0 ? count : ''}
                </span>
                <div className="bg-surface/80 border-input-outline flex h-24 w-full flex-col justify-end rounded-md border p-1">
                  <div
                    className="w-full rounded bg-gradient-to-t from-pink-600 to-pink-400 transition-all duration-300"
                    style={{ height: `${count > 0 ? Math.max(12, heightPct) : 4}%` }}
                  />
                </div>
                <span className="text-secondary text-[11px] font-medium">{mName}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabla/Resumen de Plagas y Correlación Climática de 30 Días */}
      {analytics.pestFrequencyList.length > 0 && (
        <div className="bg-surface border-input-outline flex flex-col gap-4 rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h4 className="text-primary text-sm font-bold">
              Plagas Registradas y Climatología Previa (30 Días)
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {analytics.pestFrequencyList.map((item) => (
              <div
                key={item.name}
                className="border-input-outline bg-surface/50 flex flex-col justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary text-sm font-bold">{item.name}</span>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                      {item.count} reportes
                    </span>
                  </div>
                </div>
                <div className="text-secondary mt-3 flex justify-between border-t border-white/5 pt-2 text-xs">
                  <span>
                    Temp 30d:{' '}
                    <strong className="text-white">
                      {item.avgTemp30d !== null ? `${item.avgTemp30d.toFixed(1)}°C` : '--'}
                    </strong>
                  </span>
                  <span>
                    HR 30d:{' '}
                    <strong className="text-white">
                      {item.avgHum30d !== null ? `${item.avgHum30d.toFixed(1)}%` : '--'}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
