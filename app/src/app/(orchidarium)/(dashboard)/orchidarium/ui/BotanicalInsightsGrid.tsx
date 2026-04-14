'use client'

import { FaSun, FaThermometerHalf, FaTint, FaWater } from 'react-icons/fa'

import { BotanicalInsights } from '@/actions/insights/insight-actions'

export function BotanicalInsightsGrid({ data }: { data: BotanicalInsights }) {
  // Evaluaciones botánicas simplificadas para Cattleya/Orquídeas de luz media-alta

  // DLI Evaluation
  let dliStatus = 'ok'
  let dliMessage = 'Luz ideal.'

  if (!data.dli) {
    dliStatus = 'unknown'
    dliMessage = 'Sin datos'
  } else if (data.dli < 5) {
    dliStatus = 'critical'
    dliMessage = 'Luz insuficiente. Riesgo de no florecer.'
  } else if (data.dli > 18) {
    dliStatus = 'warning'
    dliMessage = 'Exceso de sol. Riesgo de quemaduras.'
  }

  // VPD Evaluation
  let vpdStatus = 'ok'
  let vpdMessage = 'Transpiración ideal.'

  if (!data.vpdAvg) {
    vpdStatus = 'unknown'
    vpdMessage = 'Sin datos'
  } else if (data.vpdAvg < 0.4) {
    vpdStatus = 'warning'
    vpdMessage = 'VPD muy bajo. Planta no transpira bien.'
  } else if (data.vpdAvg > 1.6) {
    vpdStatus = 'critical'
    vpdMessage = 'VPD alto. Estrés hídrico severo.'
  }

  // DIF Evaluation
  let difStatus = 'ok'
  let difMessage = 'Salto térmico óptimo para floración.'

  if (!data.dif) {
    difStatus = 'unknown'
    difMessage = 'Sin datos'
  } else if (data.dif < 4) {
    difStatus = 'warning'
    difMessage = 'Salto térmico pobre. Difícil inducción floral.'
  }

  // Botrytis Risk Evaluation
  let humStatus = 'ok'
  let humMessage = 'Humedad nocturna segura.'

  if (!data.highHumidityHours && data.highHumidityHours !== 0) {
    humStatus = 'unknown'
    humMessage = 'Sin datos'
  } else if (data.highHumidityHours && data.highHumidityHours > 6) {
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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Scorecard DLI */}
      <div
        className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors ${getStatusColor(dliStatus)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaSun className="h-5 w-5 opacity-80" />
            <h3 className="text-sm font-semibold tracking-wide">DLI Acumulado</h3>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tighter">{data.dli ? data.dli : '--'}</span>
          <span className="text-sm font-medium opacity-60">mol/m²/d</span>
        </div>
        <p className="mt-auto text-xs font-semibold opacity-90">{dliMessage}</p>
      </div>

      {/* Scorecard VPD */}
      <div
        className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors ${getStatusColor(vpdStatus)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaTint className="h-5 w-5 opacity-80" />
            <h3 className="text-sm font-semibold tracking-wide">Déficit (VPD)</h3>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tighter">
            {data.vpdAvg ? data.vpdAvg : '--'}
          </span>
          <span className="text-sm font-medium opacity-60">kPa (promedio)</span>
        </div>
        <p className="mt-auto text-xs font-semibold opacity-90">{vpdMessage}</p>
      </div>

      {/* Scorecard DIF */}
      <div
        className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors ${getStatusColor(difStatus)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaThermometerHalf className="h-5 w-5 opacity-80" />
            <h3 className="text-sm font-semibold tracking-wide">Salto Térmico</h3>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tighter">
            {data.dif !== null ? `+${data.dif}` : '--'}
          </span>
          <span className="text-sm font-medium opacity-60">°C (Día vs Noche)</span>
        </div>
        <p className="mt-auto text-xs font-semibold opacity-90">{difMessage}</p>
      </div>

      {/* Scorecard Botrytis */}
      <div
        className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors ${getStatusColor(humStatus)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaWater className="h-5 w-5 opacity-80" />
            <h3 className="text-sm font-semibold tracking-wide">Riesgo Fúngico</h3>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tighter">
            {data.highHumidityHours !== null ? data.highHumidityHours : '--'}
          </span>
          <span className="text-sm font-medium opacity-60">horas HR &gt; 85%</span>
        </div>
        <p className="mt-auto text-xs font-semibold opacity-90">{humMessage}</p>
      </div>
    </div>
  )
}
