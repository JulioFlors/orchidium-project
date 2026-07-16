'use client'

import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

export function InferredRainGuide() {
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  return (
    <div className="border-input-outline bg-surface/30 mt-6 rounded-xl border backdrop-blur-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-accessibility focus-within:ring-offset-2 focus-within:ring-offset-canvas">
      <button
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left font-semibold text-slate-200 focus:outline-none"
        type="button"
        onClick={() => setIsInfoOpen(!isInfoOpen)}
      >
        <div className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-purple-400" />
          <span>Guía de Interpretación de Lluvia Inferida</span>
        </div>
        {isInfoOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isInfoOpen && (
        <div className="px-4 pb-4 pt-4 grid grid-cols-1 gap-6 text-xs text-secondary md:grid-cols-2">
          {/* Columna 1: Criterios de Inicio */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>🌧️ <span className="text-purple-400">Criterios de Inicio</span></span>
            </div>
            <p className="leading-relaxed">
              Las reglas que determinan la apertura del evento según el horario son las siguientes:
            </p>
            
            <div className="flex flex-col gap-4 mt-1">
              <div>
                <h4 className="text-primary font-bold">☀️ Inferencia Diurna [7:00 am - 6:00 pm]:</h4>
                <p className="leading-relaxed mt-1">
                  Choque térmico, hídrico y lumínico. Exige caídas de temperatura (base de -1.5°C e incrementos de -0.5°C por paso temporal) y ascensos de humedad bajo dos configuraciones:
                </p>
                <ul className="list-disc space-y-1 pl-4 mt-1 leading-relaxed">
                  <li>
                    <span className="text-primary font-semibold">Configuración Sensible:</span>
                    <br />
                    Paso 1 (20 min): -1.5°C | +10.0% HR (Nublado, ≤15 klx) o +8.0% HR (Intermedio/Soleado).
                    <br />
                    Paso 2 (30 min): -2.0°C | +12.0% HR (Nublado) o +10.0% HR.
                    <br />
                    Paso 3 (40 min): -2.5°C | +14.0% HR (Nublado) o +12.0% HR.
                  </li>
                  <li>
                    <span className="text-primary font-semibold">Protección por Gradiente:</span> Si la humedad no alcanza la configuración robusta (+12%, +14% o +16% HR), se requiere un gradiente rápido minuto a minuto: humedad ≥1.8% en 1 min, ≥2.5% en 2 min, o caída térmica ≤-0.5°C en 1 min.
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-800/40 pt-3">
                <h4 className="text-primary font-bold">🌙 Inferencia Nocturna [6:00 pm - 7:00 am]:</h4>
                <p className="leading-relaxed mt-1">
                  Caída térmica abrupta (≥ 1.6x de variabilidad previa de 30 min) con incremento hídrico (≥ 1.4x de variabilidad previa) o presaturación (≥ 98% HR) sin evaluaciones solares.
                </p>
              </div>
            </div>
          </div>

          {/* Columna 2: Criterios de Cese */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>☁️ <span className="text-purple-400">Criterios de Cese</span></span>
            </div>
            <p className="leading-relaxed">
              Las reglas se evalúan en orden de prioridad. Las tres primeras aplican solo durante
              el día; las dos últimas aplican las 24 h.
            </p>

            <ul className="flex flex-col gap-2 mt-1 leading-relaxed">
              <li>
                <span className="text-primary font-semibold">☀️ Recuperación Solar:</span>{' '}
                Cada muestra del lote (o las que existan) debe ser{' '}
                <span className="text-primary">&ge; 26k lux</span> sin excepción.
                Garantiza sol pleno y constante, descartando picos momentáneos entre nubes.
              </li>
              <li>
                <span className="text-primary font-semibold">🌤️ Recuperación Progresiva:</span>{' '}
                Despeje solar con validación cruzada simultánea: iluminancia promedio del lote{' '}
                <span className="text-primary">&ge; 15k lux</span> y por encima del umbral
                elástico de la tormenta, recuperación térmica de{' '}
                <span className="text-primary">&ge; 2.0°C</span> desde el mínimo del evento,
                y caída de humedad de{' '}
                <span className="text-primary">&ge; 3.0% HR</span> desde el máximo del evento.
              </li>
              <li>
                <span className="text-primary font-semibold">☁️ Variación Térmica:</span>{' '}
                Recuperación de <span className="text-primary">&ge; 0.6°C</span> desde la
                temperatura mínima del evento. Evaluada al final para dar prioridad
                a las reglas solares.
              </li>
              <li>
                <span className="text-primary font-semibold">☁️ Cese por Estancamiento:</span>{' '}
                Sin variación de temperatura{' '}
                (<span className="text-primary">&le; 0.4°C</span>) ni de humedad{' '}
                (<span className="text-primary">&le; 1.0% HR</span>) en el lote de 10 min.
                Disponible desde el primer batch acumulado del evento.
              </li>
              <li>
                <span className="text-primary font-semibold">🛡️ Protección Térmica:</span>{' '}
                Bloquea el Cese por Estancamiento mientras se detecte enfriamiento activo
                (caída neta <span className="text-primary">&gt; 0.4°C</span>) evaluando
                los últimos <span className="text-primary">30 min</span> previos{' '}
                (<span className="text-primary">50 min</span> si el aire está saturado
                al 100% HR).
              </li>
            </ul>
          </div>

        </div>
      )}
    </div>
  )
}
