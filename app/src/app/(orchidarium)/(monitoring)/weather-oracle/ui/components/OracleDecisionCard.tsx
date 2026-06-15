'use client'

import { useState } from 'react'
import { FaCloudSunRain, FaSatelliteDish, FaInfoCircle } from 'react-icons/fa'
import { motion, AnimatePresence } from 'motion/react'

import { OracleForecast } from '@/actions'

export function OracleDecisionCard({ forecast }: { forecast: OracleForecast | undefined }) {
  const [showPressureInfo, setShowPressureInfo] = useState(false)

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

  const owmProb = forecast.sources.owm?.precipProb ?? 0
  const omProb = forecast.sources.om?.precipProb ?? 0

  // Promedio de probabilidad de lluvia
  const avgRainProb = (owmProb + omProb) / 2
  let forecastStatus = 'Cielo Despejado'
  let forecastDesc = 'Las condiciones meteorológicas son estables y no se prevén precipitaciones.'
  let forecastColor = 'text-green-400'
  let forecastBg = 'bg-green-500/10 border-green-500/20'

  if (avgRainProb >= 0.7) {
    forecastStatus = 'Lluvia Inminente / Alta Probabilidad'
    forecastDesc = `Consenso meteorológico indica alta probabilidad de lluvia (${(avgRainProb * 100).toFixed(0)}%). Se recomiendan previsiones.`
    forecastColor = 'text-blue-400'
    forecastBg = 'bg-blue-500/10 border-blue-500/20'
  } else if (avgRainProb >= 0.4) {
    forecastStatus = 'Probabilidad de Lluvia Moderada'
    forecastDesc = `Nubosidad variable con posibilidad moderada de precipitaciones (${(avgRainProb * 100).toFixed(0)}%).`
    forecastColor = 'text-yellow-400'
    forecastBg = 'bg-yellow-500/10 border-yellow-500/20'
  } else if (avgRainProb >= 0.15) {
    forecastStatus = 'Parcialmente Nublado'
    forecastDesc = `Nubosidad leve con baja probabilidad de precipitaciones (${(avgRainProb * 100).toFixed(0)}%).`
    forecastColor = 'text-amber-400'
    forecastBg = 'bg-amber-500/10 border-amber-500/20'
  }

  return (
    <div className="from-surface to-surface/80 relative z-0 flex h-full flex-col gap-5 overflow-hidden rounded-xl border border-white/10 bg-linear-to-br p-6">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <FaCloudSunRain className="h-32 w-32" />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <div className="bg-primary/20 border-primary/30 rounded-lg border p-2.5">
          <FaSatelliteDish className="text-primary h-5 w-5 animate-pulse" />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Weather Oracle v2</h2>
            <div className="bg-secondary/10 text-secondary rounded-full border border-white/5 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
              Consenso de Fuentes
            </div>
          </div>
          <p className="text-secondary text-xs font-medium tracking-wide">
            IA AGRONÓMICA SATELITAL
          </p>
        </div>
      </div>

      <div className={`relative z-10 flex flex-col gap-2 rounded-lg border p-4 ${forecastBg}`}>
        <div className="mb-1 flex items-center gap-2">
          <FaCloudSunRain className={`h-4 w-4 ${forecastColor}`} />
          <span className={`font-bold ${forecastColor}`}>{forecastStatus}</span>
        </div>
        <p className="text-secondary/90 text-sm leading-relaxed">{forecastDesc}</p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4">
        {/* Desglose de Consenso */}
        <div className="flex flex-col gap-2 rounded-lg bg-white/5 p-3">
          <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">
            Fuentes (Lluvia)
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-secondary/80 text-[11px]">OpenWeather</span>
              <span
                className={`text-[11px] font-bold ${owmProb > 0.6 ? 'text-blue-400' : 'text-white'}`}
              >
                {(owmProb * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary/80 text-[11px]">Open-Meteo</span>
              <span
                className={`text-[11px] font-bold ${omProb > 0.6 ? 'text-blue-400' : 'text-white'}`}
              >
                {(omProb * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Datos Atmosféricos */}
        <div className="flex flex-col gap-2 rounded-lg bg-white/5 p-3">
          <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">
            Atmósfera
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <button
                className="flex items-center gap-1 text-left"
                type="button"
                onClick={() => setShowPressureInfo(!showPressureInfo)}
              >
                <span className="text-secondary/80 text-[11px] underline decoration-white/20 underline-offset-2">
                  Presión
                </span>
                <FaInfoCircle className="text-secondary/40 h-2.5 w-2.5" />
              </button>
              <span className="text-[11px] font-bold">
                {forecast.pressure?.toFixed(0) ?? '--'} hPa
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary/80 text-[11px]">Viento</span>
              <span className="text-[11px] font-bold">
                {forecast.windSpeed !== null && forecast.windSpeed !== undefined
                  ? `${forecast.windSpeed.toFixed(1)} km/h`
                  : '-- km/h'}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {showPressureInfo && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
                  onClick={() => setShowPressureInfo(false)}
                />
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="bg-surface absolute right-0 bottom-full z-50 mb-2 w-48 rounded-lg border border-white/10 p-3 shadow-2xl md:right-[-10%] md:w-56"
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                >
                  <h4 className="mb-2 text-[10px] font-bold tracking-widest text-white uppercase">
                    Guía de Presión
                  </h4>
                  <ul className="flex flex-col gap-2">
                    <li className="flex flex-col">
                      <span className="text-[10px] font-bold text-green-400 underline underline-offset-2">
                        {'>'} 1013 hPa
                      </span>
                      <span className="text-secondary/80 text-[9px]">
                        Alta Presión. Tiempo stable y despejado.
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="text-[10px] font-bold text-amber-400 underline underline-offset-2">
                        1005 - 1012 hPa
                      </span>
                      <span className="text-secondary/80 text-[9px]">
                        Transición. Tiempo variable o nubosidad.
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="text-[10px] font-bold text-red-400 underline underline-offset-2">
                        {'<'} 1005 hPa
                      </span>
                      <span className="text-secondary/80 text-[9px]">
                        Baja Presión. Riesgo de tormentas y viento.
                      </span>
                    </li>
                  </ul>
                  <button
                    className="text-primary mt-3 w-full border-t border-white/5 pt-2 text-[9px] font-bold uppercase"
                    type="button"
                    onClick={() => setShowPressureInfo(false)}
                  >
                    Cerrar
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-secondary/60 text-[10px] font-bold uppercase">Temp. Sat</span>
          <span className="text-sm font-medium">{forecast.temperature.toFixed(1)} °C</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-secondary/60 text-[10px] font-bold uppercase">Hum. Sat</span>
          <span className="text-sm font-medium">{forecast.humidity.toFixed(0)}%</span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-secondary/60 text-[10px] font-bold uppercase">Suelo VWC</span>
          <span className="text-sm font-medium">
            {forecast.soilMoisture ? `${(forecast.soilMoisture * 100).toFixed(0)}%` : '--'}
          </span>
        </div>
      </div>
    </div>
  )
}
