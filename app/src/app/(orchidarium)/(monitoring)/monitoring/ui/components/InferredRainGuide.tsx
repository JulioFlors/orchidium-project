'use client'

import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

export function InferredRainGuide() {
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  return (
    <div className="border-input-outline bg-surface/30 focus-within:ring-accessibility focus-within:ring-offset-canvas mt-6 rounded-xl border backdrop-blur-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2">
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
        <div className="text-secondary grid grid-cols-1 gap-6 px-4 pt-4 pb-4 text-xs md:grid-cols-2">
          {/* Columna 1: Criterios de Inicio */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <span>
                🌧️ <span className="text-purple-400">Criterios de Inicio</span>
              </span>
            </div>
            <p className="leading-relaxed">
              Las reglas que determinan la apertura del evento según el horario son las siguientes:
            </p>

            <div className="mt-1 flex flex-col gap-4">
              <div>
                <h4 className="text-primary font-bold">
                  ☀️ Inferencia Diurna [7:00 am - 6:00 pm]:
                </h4>
                <p className="mt-1 leading-relaxed">
                  El sistema recibe telemetría en lotes de 10 muestras cada 10 minutos (B0
                  representa el lote actual de los últimos 10 min). Para detectar el choque térmico,
                  hídrico y lumínico de una tormenta, el motor compara B0 contra lotes anteriores
                  mediante dos pasos deslizantes:
                  <br />
                  • Paso 1: Compara B0 contra B1 (el lote de 10 a 20 min atrás).
                  <br />• Paso 2: Compara B0 contra B2 (el lote de 20 a 30 min atrás).
                </p>
                <p className="mt-2 leading-relaxed">
                  Cada paso evalúa las condiciones climáticas bajo tres ramas de luminosidad (según
                  la iluminancia base del lote de comparación anterior) y aplica dos niveles de
                  sensibilidad de humedad (Sensible y Robusta):
                </p>
                <ul className="mt-2 flex flex-col gap-3 pl-1 leading-relaxed">
                  <li>
                    <span className="text-primary font-semibold">
                      ☁️ Rama A (Cielo Nublado, ≤15 klx):
                    </span>
                    <br />
                    Apertura lumínica incondicional (no requiere caída abrupta de luz).
                    <ul className="mt-0.5 list-disc pl-4">
                      <li>
                        Paso 1 (10 min previos): Caída Temp ≤-1.5°C | Humedad Robusta ≥12.0% HR (o
                        Sensible ≥10.0% HR con Gradiente).
                      </li>
                      <li>
                        Paso 2 (20 min previos): Caída Temp ≤-2.5°C | Humedad Robusta ≥14.0% HR (o
                        Sensible ≥12.0% HR con Gradiente).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <span className="text-primary font-semibold">
                      ☀️ Rama B (Cielo Soleado, &gt;26 klx):
                    </span>
                    <br />
                    Exige caída lumínica ≤40% de su base. Si el mínimo de luz cae ≤15 klx:
                    <ul className="mt-0.5 list-disc pl-4">
                      <li>
                        Paso 1 (10 min previos): Caída Temp ≤-2.0°C | Humedad Robusta ≥10.0% HR (o
                        Sensible ≥8.0% HR con Gradiente).
                      </li>
                      <li>
                        Paso 2 (20 min previos): Caída Temp ≤-3.0°C | Humedad Robusta ≥12.0% HR (o
                        Sensible ≥10.0% HR con Gradiente).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <span className="text-primary font-semibold">
                      ⛅ Rama C (Cielo Intermedio, &gt;15 klx y ≤26 klx):
                    </span>
                    <br />
                    Exige caída lumínica ≤60% de su base. Si el mínimo de luz cae ≤15 klx:
                    <ul className="mt-0.5 list-disc pl-4">
                      <li>
                        Paso 1 (10 min previos): Caída Temp ≤-1.5°C | Humedad Robusta ≥10.0% HR (o
                        Sensible ≥8.0% HR con Gradiente).
                      </li>
                      <li>
                        Paso 2 (20 min previos): Caída Temp ≤-2.5°C | Humedad Robusta ≥12.0% HR (o
                        Sensible ≥10.0% HR con Gradiente).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <span className="text-primary font-semibold">💧 Puerta de Pre-Saturación:</span>{' '}
                    Si el aire ya está muy saturado antes de la lluvia, se aprueba la condición de
                    humedad incondicionalmente si la humedad actual alcanza ≥98% HR habiendo partido
                    de bases de 90% a 95% (Paso 1) u 88% a 95% (Paso 2).
                  </li>
                  <li>
                    <span className="text-primary font-semibold">🛡️ Protección por Gradiente:</span>{' '}
                    Si el incremento de humedad cumple con el umbral Sensible pero no alcanza el
                    Robusto de su rama correspondiente, se exige validación cruzada mediante un
                    cambio rápido minuto a minuto: humedad ≥1.8% en 1 min, ≥2.5% en 2 min, o caída
                    térmica ≤-0.5°C en 1 min.
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-800/40 pt-3">
                <h4 className="text-primary font-bold">
                  🌙 Inferencia Nocturna [6:00 pm - 7:00 am]:
                </h4>
                <p className="mt-1 leading-relaxed">
                  Caída térmica abrupta (≥ 1.6x de variabilidad previa de 30 min) con incremento
                  hídrico (≥ 1.4x de variabilidad previa) o presaturación (≥ 98% HR) sin
                  evaluaciones solares.
                </p>
              </div>
            </div>
          </div>

          {/* Columna 2: Criterios de Cese */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <span>
                ☁️ <span className="text-purple-400">Criterios de Cese</span>
              </span>
            </div>
            <p className="leading-relaxed">
              Las reglas se evalúan en orden de prioridad. Las tres primeras aplican solo durante el
              día; las dos últimas aplican las 24 h.
            </p>

            <ul className="mt-1 flex flex-col gap-2 leading-relaxed">
              <li>
                <span className="text-primary font-semibold">☀️ Recuperación Solar:</span> Cada
                muestra del lote (o las que existan) debe ser{' '}
                <span className="text-primary">&ge; 26k lux</span> sin excepción. Garantiza sol
                pleno y constante, descartando picos momentáneos entre nubes.
              </li>
              <li>
                <span className="text-primary font-semibold">🌤️ Recuperación Progresiva:</span>{' '}
                Despeje solar con validación cruzada simultánea: iluminancia promedio del lote{' '}
                <span className="text-primary">&ge; 15k lux</span> y por encima del umbral elástico
                de la tormenta, recuperación térmica de{' '}
                <span className="text-primary">&ge; 2.0°C</span> desde el mínimo del evento, y caída
                de humedad de <span className="text-primary">&ge; 3.0% HR</span> desde el máximo del
                evento.
              </li>
              <li>
                <span className="text-primary font-semibold">☁️ Variación Térmica:</span>{' '}
                Recuperación de <span className="text-primary">&ge; 0.6°C</span> desde la
                temperatura mínima del evento. Evaluada al final para dar prioridad a las reglas
                solares.
              </li>
              <li>
                <span className="text-primary font-semibold">☁️ Cese por Estancamiento:</span> Sin
                variación de temperatura (<span className="text-primary">&le; 0.4°C</span>) ni de
                humedad (<span className="text-primary">&le; 1.0% HR</span>) en el lote de 10 min.
                Disponible desde el primer batch acumulado del evento.
              </li>
              <li>
                <span className="text-primary font-semibold">🛡️ Protección Térmica:</span> Bloquea
                el Cese por Estancamiento mientras se detecte enfriamiento activo (caída neta{' '}
                <span className="text-primary">&gt; 0.4°C</span>) evaluando los últimos{' '}
                <span className="text-primary">30 min</span> previos (
                <span className="text-primary">50 min</span> si el aire está saturado al 100% HR).
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
