'use client'

import { FaCloudSunRain, FaSatelliteDish, FaTintSlash } from 'react-icons/fa'

import { OracleForecast } from '@/actions/insights/insight-actions'

export function OracleDecisionCard({ forecast }: { forecast: OracleForecast | undefined }) {
  if (!forecast) {
    return (
      <div className="bg-surface/50 flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-white/10 p-6 text-center">
        <FaSatelliteDish className="text-secondary h-8 w-8 opacity-50" />
        <h3 className="text-secondary font-semibold">Oráculo Desconectado</h3>
        <p className="text-secondary/70 text-sm">
          No hay datos satelitales recientes en la base de datos.
        </p>
      </div>
    )
  }

  // Lógica básica de decisión simulada para entendimiento humano
  const willRain = forecast.precipProb > 0.6
  const drySoil = forecast.soilMoisture !== null && forecast.soilMoisture < 0.2

  let decisionTitle = 'Riego Permitido'
  let decisionDesc = 'No se preven lluvias fuertes inminentes y la humedad satelital está en rango.'
  let decisionColor = 'text-green-400'

  if (willRain) {
    decisionTitle = 'Riego Bloqueado (Lluvia Inminente)'
    decisionDesc = `El oráculo predice lluvia con una probabilidad del ${(forecast.precipProb * 100).toFixed(0)}%.`
    decisionColor = 'text-blue-400'
  } else if (!drySoil && forecast.soilMoisture !== null) {
    decisionTitle = 'Riego Innecesario (Suelo Húmedo)'
    decisionDesc = `Las imágenes satelitales reportan un suelo con suficiente humedad (${(forecast.soilMoisture * 100).toFixed(0)}%).`
    decisionColor = 'text-yellow-400'
  }

  return (
    <div className="from-surface to-surface/80 relative flex h-full flex-col gap-5 overflow-hidden rounded-xl border border-white/10 bg-linear-to-br p-6">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <FaCloudSunRain className="h-32 w-32" />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <div className="bg-primary/20 border-primary/30 rounded-lg border p-2.5">
          <FaSatelliteDish className="text-primary h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Weather Oracle</h2>
          <p className="text-secondary text-xs font-medium tracking-wide">
            ASISTENTE DE DECISIONES AGRONÓMICAS
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-2 rounded-lg border border-white/5 bg-black/20 p-4">
        <div className="mb-1 flex items-center gap-2">
          {willRain || (!drySoil && forecast.soilMoisture !== null) ? (
            <FaTintSlash className={`h-4 w-4 ${decisionColor}`} />
          ) : (
            <div className="h-2 w-2 rounded-full bg-green-400" />
          )}
          <span className={`font-bold ${decisionColor}`}>{decisionTitle}</span>
        </div>
        <p className="text-secondary/90 text-sm leading-relaxed">{decisionDesc}</p>
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
            Temp. Satelital
          </span>
          <span className="font-medium">{forecast.temperature.toFixed(1)} °C</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
            Humedad Ext.
          </span>
          <span className="font-medium">{forecast.humidity.toFixed(0)}%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
            Prob. Precipit.
          </span>
          <span className="font-medium">{(forecast.precipProb * 100).toFixed(0)}%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
            Humedad Suelo
          </span>
          <span className="font-medium">
            {forecast.soilMoisture ? `${(forecast.soilMoisture * 100).toFixed(0)}%` : '--'}
          </span>
        </div>
      </div>
    </div>
  )
}
