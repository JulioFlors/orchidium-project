'use client'

import { useMemo } from 'react'
import {
  FaSun,
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaInfoCircle,
  FaExclamationTriangle,
} from 'react-icons/fa'

import { BotanicalInsights } from '@/actions/insights/insight-actions'
import { formatDateLong } from '@/utils/timeFormat'

export function BotanicalInsightsGrid({ data }: { data: BotanicalInsights }) {
  // Evaluaciones botánicas simplificadas para Cattleya/Orquídeas de luz media-alta

  // DLI Evaluation
  let dliStatus = 'ok'
  let dliMessage = 'Luz ideal.'
  const dliMin = 5
  const dliMax = 18

  if (!data.dli) {
    dliStatus = 'unknown'
    dliMessage = 'Sin datos'
  } else if (data.dli < dliMin) {
    dliStatus = 'critical'
    dliMessage = 'Luz insuficiente. Riesgo de no florecer.'
  } else if (data.dli > dliMax) {
    dliStatus = 'warning'
    dliMessage = 'Exceso de sol. Riesgo de quemaduras.'
  }

  // VPD Evaluation
  let vpdStatus = 'ok'
  let vpdMessage = 'Transpiración ideal.'
  const vpdMin = 0.4
  const vpdMax = 1.6

  if (!data.vpdAvg) {
    vpdStatus = 'unknown'
    vpdMessage = 'Sin datos'
  } else if (data.vpdAvg < vpdMin) {
    vpdStatus = 'warning'
    vpdMessage = 'VPD muy bajo. Planta no transpira bien.'
  } else if (data.vpdAvg > vpdMax) {
    vpdStatus = 'critical'
    vpdMessage = 'VPD alto. Estrés hídrico severo.'
  }

  // DIF Evaluation
  let difStatus = 'ok'
  let difMessage = 'Salto térmico óptimo para floración.'
  const difMin = 4

  if (data.dif === null || data.dif === undefined) {
    difStatus = 'unknown'
    difMessage = 'Sin datos'
  } else if (data.dif < difMin) {
    difStatus = 'warning'
    difMessage = 'Salto térmico pobre. Difícil inducción floral.'
  }

  // Botrytis Risk Evaluation
  let humStatus = 'ok'
  let humMessage = 'Humedad nocturna segura.'
  const humMax = 6

  if (data.highHumidityHours === null || data.highHumidityHours === undefined) {
    humStatus = 'unknown'
    humMessage = 'Sin datos'
  } else if (data.highHumidityHours > humMax) {
    humStatus = 'critical'
    humMessage = 'Riesgo alto de Botrytis (hr > 85% por muchas horas).'
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ok':
        return 'text-green-400 border-green-500/20 bg-green-500/5'
      case 'warning':
        return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
      case 'critical':
        return 'text-red-400 border-red-500/20 bg-red-500/5'
      default:
        return 'text-gray-400 border-white/5 bg-surface/50'
    }
  }

  const isStale = useMemo(() => {
    if (!data.date) return false

    // eslint-disable-next-line react-hooks/purity
    return Date.now() - new Date(data.date).getTime() > 1000 * 60 * 60 * 48
  }, [data.date])
  const dateStr = data.date ? formatDateLong(data.date) : ''

  return (
    <div className="flex flex-col gap-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="text-secondary flex items-center gap-2 text-xs font-medium">
          <FaInfoCircle className="h-3 w-3 opacity-60" />
          <span>
            Datos calculados correspondientes al:{' '}
            <span className="text-primary">{dateStr || 'N/A'}</span>
          </span>
        </div>

        {isStale && (
          <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-bold text-orange-400">
            <FaExclamationTriangle className="h-2.5 w-2.5" />
            <span>SENSOR OFFLINE - DATOS DESACTUALIZADOS</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Scorecard DLI */}
        <div
          className={`group relative flex flex-col gap-3 rounded-xl border p-5 transition-all hover:bg-white/5 ${getStatusColor(dliStatus)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaSun className="h-5 w-5 opacity-80" />
              <h3 className="text-sm font-semibold tracking-wide">DLI Acumulado</h3>
            </div>
            <span className="text-[10px] font-bold opacity-40">
              Óptimo: {dliMin}-{dliMax}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tighter">
              {data.dli !== null ? data.dli.toFixed(2) : '--'}
            </span>
            <span className="text-sm font-medium opacity-60">mol/m²/d</span>
          </div>
          <p className="mt-auto text-xs font-semibold opacity-90">{dliMessage}</p>
        </div>

        {/* Scorecard VPD */}
        <div
          className={`group relative flex flex-col gap-3 rounded-xl border p-5 transition-all hover:bg-white/5 ${getStatusColor(vpdStatus)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaTint className="h-5 w-5 opacity-80" />
              <h3 className="text-sm font-semibold tracking-wide">Déficit (VPD)</h3>
            </div>
            <span className="text-[10px] font-bold opacity-40">
              Óptimo: {vpdMin}-{vpdMax}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tighter">
              {data.vpdAvg !== null ? data.vpdAvg.toFixed(2) : '--'}
            </span>
            <span className="text-sm font-medium opacity-60">kPa (promedio)</span>
          </div>
          <p className="mt-auto text-xs font-semibold opacity-90">{vpdMessage}</p>
        </div>

        {/* Scorecard DIF */}
        <div
          className={`group relative flex flex-col gap-3 rounded-xl border p-5 transition-all hover:bg-white/5 ${getStatusColor(difStatus)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaThermometerHalf className="h-5 w-5 opacity-80" />
              <h3 className="text-sm font-semibold tracking-wide">Salto Térmico</h3>
            </div>
            <span className="text-[10px] font-bold opacity-40">Óptimo: &gt;{difMin}°C</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tighter">
              {data.dif !== null ? `${data.dif > 0 ? '+' : ''}${data.dif.toFixed(1)}` : '--'}
            </span>
            <span className="text-sm font-medium opacity-60">°C (Día vs Noche)</span>
          </div>
          <p className="mt-auto text-xs font-semibold opacity-90">{difMessage}</p>
        </div>

        {/* Scorecard Botrytis */}
        <div
          className={`group relative flex flex-col gap-3 rounded-xl border p-5 transition-all hover:bg-white/5 ${getStatusColor(humStatus)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaWater className="h-5 w-5 opacity-80" />
              <h3 className="text-sm font-semibold tracking-wide">Riesgo Fúngico</h3>
            </div>
            <span className="text-[10px] font-bold opacity-40">Óptimo: &lt;{humMax}h</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tighter">
              {data.highHumidityHours !== null ? data.highHumidityHours.toFixed(1) : '--'}
            </span>
            <span className="text-sm font-medium opacity-60">horas HR &gt; 85%</span>
          </div>
          <p className="mt-auto text-xs font-semibold opacity-90">{humMessage}</p>
        </div>
      </div>
    </div>
  )
}
