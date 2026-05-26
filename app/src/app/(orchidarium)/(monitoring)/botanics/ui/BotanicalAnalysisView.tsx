'use client'

import { useState, useMemo } from 'react'
import { Sun, Thermometer, ChevronDown, ChevronUp, Info, Wind } from 'lucide-react'
import { IoWaterOutline } from 'react-icons/io5'
import { FaChartLine } from 'react-icons/fa6'
import { BsThermometerSun } from 'react-icons/bs'
import useSWR from 'swr'

import { EnvironmentCard, EnvironmentDataChart } from '../../monitoring/ui/components'

import { ZoneType } from '@/config/mappings'
import { Heading, DeviceStatus } from '@/components'
import { useToast } from '@/hooks'

type BotanicalMetricType = 'dli' | 'vpd_avg' | 'dif' | 'high_humidity_hours' | 'deficit_hidrico'

interface BotanicalDataResponse {
  liveKPIs: {
    dli: number | null
    vpdAvg: number | null
    dif: number | null
    highHumidityHours?: number | null
    deficitHidricoHours?: number | null
    isLive: boolean
  } | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))

    throw new Error(errorData.error || 'Error al obtener datos botánicos')
  }

  return res.json()
}

const formatHoursToHhMm = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '--'
  const hoursInt = Math.floor(value)
  const mins = Math.round((value - hoursInt) * 60)

  if (hoursInt === 0) return `${mins}min`
  if (mins === 0) return `${hoursInt}h`

  return `${hoursInt}h ${mins}min`
}

const getInterpretation = (
  metric: BotanicalMetricType,
  value: number | null | undefined,
  zone: string,
): string => {
  if (value === null || value === undefined) return 'Esperando datos'

  if (zone === ZoneType.ZONA_A) {
    // Orquideario (Cattleyas)
    switch (metric) {
      case 'dli':
        if (value < 4.0) return 'Luz insuficiente para floración'
        if (value <= 12.0) return 'Luz diaria óptima para Cattleyas'
        if (value <= 18.0) return 'Luz alta (monitorear estrés)'

        return 'Exceso (riesgo de quemaduras)'
      case 'vpd_avg':
        if (value < 0.4) return 'Muy húmedo (planta no transpira)'
        if (value <= 1.2) return 'Transpiración óptima'
        if (value <= 1.6) return 'Aire seco (transpira rápido)'

        return 'Estrés hídrico (estomas cerrados)'
      case 'dif':
        if (value < 6.0) return 'Bajo (dificulta floración)'
        if (value <= 12.0) return 'Diferencial térmico óptimo'

        return 'Diferencial amplio (estrés)'
      case 'high_humidity_hours':
        if (value > 3.0) return 'Alerta: Aire saturado (riesgo pudrición)'
        if (value > 0) return 'Saturación temporal (normal)'

        return 'Sin saturación (óptimo)'
      case 'deficit_hidrico':
        if (value > 4.0) return 'Sequía: Pérdida de agua (sin fotosíntesis)'
        if (value > 0) return 'Déficit moderado'

        return 'Humedad óptima'
      default:
        return ''
    }
  } else {
    // Exterior (Cactus, suculentas, rosas del desierto)
    switch (metric) {
      case 'dli':
        if (value < 10.0) return 'Luz baja para sol directo'
        if (value <= 22.0) return 'Luz óptima para suculentas'

        return 'Excelente radiación solar'
      case 'vpd_avg':
        if (value < 0.5) return 'Demasiado húmedo para cactus'
        if (value <= 1.8) return 'Transpiración y clima óptimo'

        return 'Ambiente árido y seco'
      case 'dif':
        if (value < 8.0) return 'Salto térmico moderado'

        return 'Diferencial óptimo para cactus'
      case 'high_humidity_hours':
        if (value > 2.0) return 'Alerta: Saturación crítica para exterior'
        if (value > 0) return 'Humedad alta'

        return 'Seco / Óptimo'
      case 'deficit_hidrico':
        if (value > 4.0) return 'Alerta: Sequía prolongada en exterior'
        if (value > 0) return 'Ambiente seco'

        return 'Humedad óptima'
      default:
        return ''
    }
  }
}

export function BotanicalAnalysisView() {
  const [zone, setZone] = useState<string>(ZoneType.EXTERIOR)
  const [selectedMetric, setSelectedMetric] = useState<BotanicalMetricType | null>(null)

  // Rangos de gráfica independientes por zona y por métrica
  const [metricRanges, setMetricRanges] = useState<
    Record<string, Record<BotanicalMetricType, string>>
  >(() => {
    const initial: Record<string, Record<BotanicalMetricType, string>> = {}

    Object.values(ZoneType).forEach((z) => {
      initial[z] = {
        dli: '7d',
        vpd_avg: '7d',
        dif: '7d',
        high_humidity_hours: '7d',
        deficit_hidrico: '7d',
      }
    })

    return initial
  })

  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const { error: notifyError } = useToast()

  const currentRange =
    selectedMetric && metricRanges[zone] ? metricRanges[zone][selectedMetric] : '7d'

  const handleRangeChange = (newRange: string) => {
    if (selectedMetric && zone) {
      setMetricRanges((prev) => ({
        ...prev,
        [zone]: {
          ...(prev[zone] || {}),
          [selectedMetric]: newRange,
        },
      }))
    }
  }

  // 1. Consulta para "Current Status" / Tarjetas (Consumimos estadísticas procesadas del día anterior)
  const {
    data: statusResponse,
    error: statusError,
    isLoading: isStatusLoading,
  } = useSWR<BotanicalDataResponse>(
    `/api/environment/history?range=yesterday&zone=${zone}`,
    fetcher,
    {
      refreshInterval: 60000 * 60, // Refrescar cada hora, no cambia a menudo
      revalidateOnFocus: false,
    },
  )

  const liveKPIs = statusResponse?.liveKPIs || null

  // 2. Consulta para "Chart Data"
  const {
    data: chartResponse,
    error: chartError,
    isLoading: isChartLoading,
  } = useSWR<{ data: Record<string, unknown>[] }>(
    selectedMetric
      ? `/api/environment/history?range=${currentRange}&zone=${zone}&metric=${selectedMetric}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  const chartData = useMemo(() => chartResponse?.data || [], [chartResponse])

  if (statusError) notifyError(`Error en métricas botánicas: ${statusError.message}`)
  if (chartError) notifyError(`Error en historial: ${chartError.message}`)

  // Normalizar datos del gráfico
  const normalizedChartData = useMemo(() => {
    if (!chartData || !Array.isArray(chartData)) return []

    return chartData.map((row) => {
      const normalizedRow: Record<string, string | number | boolean | undefined> = {}

      Object.entries(row).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          value === undefined
        ) {
          normalizedRow[key] = value
        } else if (value instanceof Date) {
          normalizedRow[key] = value.toISOString()
        } else if (value !== null && typeof value === 'object' && 'toString' in value) {
          normalizedRow[key] = String(value)
        }
      })

      return normalizedRow
    })
  }, [chartData])

  const getChartProps = () => {
    if (!selectedMetric) return null

    switch (selectedMetric) {
      case 'dli':
        return {
          dataKey: 'dli',
          color: '#facc15',
          unit: 'mol/m²/d',
          title: 'DLI',
          icon: <Sun className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      case 'vpd_avg':
        return {
          dataKey: 'vpd_avg',
          color: '#22d3ee',
          unit: 'kPa',
          title: 'VPD',
          icon: <Wind className="h-4 w-4" />,
        }
      case 'dif':
        return {
          dataKey: 'dif',
          color: '#f97316',
          unit: '°C',
          title: 'DIF Térmico',
          icon: <Thermometer className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      case 'high_humidity_hours':
        return {
          dataKey: 'high_humidity_hours',
          color: '#3b82f6',
          unit: 'h',
          title: 'Saturación Hídrica',
          icon: <IoWaterOutline className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      case 'deficit_hidrico':
        return {
          dataKey: 'deficit_hidrico',
          color: '#ef4444',
          unit: 'h',
          title: 'Déficit Hídrico',
          icon: <BsThermometerSun className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      default:
        return null
    }
  }

  const chartProps = getChartProps()

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <div className="flex flex-col gap-6">
        <Heading
          action={
            <DeviceStatus
              connectionState="online" // Simulamos online ya que son datos históricos
              dropdownTitle="Zona de Análisis"
              selectedZone={zone}
              zones={[ZoneType.EXTERIOR, ZoneType.ZONA_A]}
              onZoneChanged={(newZone) => {
                setZone(newZone)
                setSelectedMetric(null)
              }}
            />
          }
          description="Métricas procesadas en ciclos de 24h, para su evaluación agronómica."
          title="Análisis Botánico"
        />

        {/* Grid estructurado de cards botánicas */}
        <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-6 grid grid-cols-1 gap-5">
          {/* Fila 1 (Desktop) / Fila 1 & 2 (Intermedio): DLI, VPD y DIF Térmico */}
          <EnvironmentCard
            className="tds-sm:col-span-1 tds-lg:col-span-2"
            color="yellow"
            description={getInterpretation('dli', liveKPIs?.dli, zone)}
            icon={<Sun className="h-6 w-6" />}
            isActive={selectedMetric === 'dli'}
            isLoading={isStatusLoading}
            title="DLI"
            trend="stable"
            unit="mol/m²/d"
            value={
              liveKPIs?.dli !== null && liveKPIs?.dli !== undefined ? liveKPIs.dli.toFixed(1) : '--'
            }
            onClick={() => setSelectedMetric('dli')}
          />

          <EnvironmentCard
            className="tds-sm:col-span-1 tds-lg:col-span-2"
            color="cyan"
            description={getInterpretation('vpd_avg', liveKPIs?.vpdAvg, zone)}
            icon={<Wind className="h-6 w-6" />}
            isActive={selectedMetric === 'vpd_avg'}
            isLoading={isStatusLoading}
            title="VPD"
            trend="stable"
            unit="kPa"
            value={
              liveKPIs?.vpdAvg !== null && liveKPIs?.vpdAvg !== undefined
                ? liveKPIs.vpdAvg.toFixed(2)
                : '--'
            }
            onClick={() => setSelectedMetric('vpd_avg')}
          />

          <EnvironmentCard
            className="tds-sm:col-span-2 tds-lg:col-span-2"
            color="orange"
            description={getInterpretation('dif', liveKPIs?.dif, zone)}
            icon={<Thermometer className="h-6 w-6" />}
            isActive={selectedMetric === 'dif'}
            isLoading={isStatusLoading}
            title="DIF Térmico"
            trend="stable"
            unit="°C"
            value={
              liveKPIs?.dif !== null && liveKPIs?.dif !== undefined ? liveKPIs.dif.toFixed(1) : '--'
            }
            onClick={() => setSelectedMetric('dif')}
          />

          {/* Fila 2 (Desktop) / Fila 3 (Intermedio): Saturación Hídrica y Déficit Hídrico */}
          <EnvironmentCard
            className="tds-sm:col-span-1 tds-lg:col-span-3"
            color="blue"
            description={getInterpretation(
              'high_humidity_hours',
              liveKPIs?.highHumidityHours,
              zone,
            )}
            icon={<IoWaterOutline className="h-6 w-6" />}
            isActive={selectedMetric === 'high_humidity_hours'}
            isLoading={isStatusLoading}
            title="Saturación Hídrica"
            trend="stable"
            unit=""
            value={
              liveKPIs?.highHumidityHours !== null && liveKPIs?.highHumidityHours !== undefined
                ? formatHoursToHhMm(liveKPIs.highHumidityHours)
                : '--'
            }
            onClick={() => setSelectedMetric('high_humidity_hours')}
          />

          <EnvironmentCard
            className="tds-sm:col-span-1 tds-lg:col-span-3"
            color="red"
            description={getInterpretation('deficit_hidrico', liveKPIs?.deficitHidricoHours, zone)}
            icon={<BsThermometerSun className="h-6 w-6" />}
            isActive={selectedMetric === 'deficit_hidrico'}
            isLoading={isStatusLoading}
            title="Déficit Hídrico"
            trend="stable"
            unit=""
            value={
              liveKPIs?.deficitHidricoHours !== null && liveKPIs?.deficitHidricoHours !== undefined
                ? formatHoursToHhMm(liveKPIs.deficitHidricoHours)
                : '--'
            }
            onClick={() => setSelectedMetric('deficit_hidrico')}
          />
        </div>

        <div className="mt-2 w-full">
          {isChartLoading && !chartData.length ? (
            <div className="border-input-outline bg-surface/50 flex h-[400px] w-full animate-pulse items-center justify-center rounded-xl border border-dashed">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-primary/10 h-10 w-10 rounded-full" />
                <div className="bg-primary/10 h-3 w-32 rounded-md" />
              </div>
            </div>
          ) : !selectedMetric ? (
            <div className="bg-surface/50 border-input-outline flex h-[400px] w-full items-center justify-center rounded-md border border-dashed">
              <div className="text-secondary flex flex-col items-center gap-3">
                <div className="bg-hover-overlay flex h-12 w-12 items-center justify-center rounded-full">
                  <FaChartLine className="text-primary h-6 w-6" />
                </div>
                <p className="text-sm font-medium">Seleccione una métrica</p>
              </div>
            </div>
          ) : chartProps ? (
            <EnvironmentDataChart
              data={normalizedChartData}
              {...chartProps}
              allowedRanges={['7d', '30d', 'all']}
              range={currentRange}
              onRangeChange={handleRangeChange}
            />
          ) : null}
        </div>

        {/* Guía de consulta botánica colapsable */}
        <div className="border-input-outline bg-surface mt-6 overflow-hidden rounded-xl border transition-all duration-300">
          <button
            className="hover:bg-hover-overlay focus-visible:bg-hover-overlay focus-visible:ring-primary/50 flex w-full cursor-pointer items-center justify-between rounded-t-xl p-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            type="button"
            onClick={() => setIsInfoOpen(!isInfoOpen)}
          >
            <div className="flex items-center gap-3">
              <Info className="text-primary h-5 w-5" />
              <span className="text-primary text-base font-semibold">
                Guía de Interpretación Botánica
              </span>
            </div>
            {isInfoOpen ? (
              <ChevronUp className="text-secondary h-5 w-5" />
            ) : (
              <ChevronDown className="text-secondary h-5 w-5" />
            )}
          </button>

          {isInfoOpen && (
            <div className="border-input-outline text-secondary bg-surface/30 rounded-b-xl border-t p-6 text-sm leading-relaxed">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* DLI */}
                <div className="bg-surface/50 border-input-outline flex flex-col gap-3 rounded-lg border p-5">
                  <h4 className="text-primary flex items-center gap-2 text-sm font-bold uppercase">
                    <Sun className="h-4 w-4 text-yellow-400" /> DLI (Daily Light Integral)
                  </h4>
                  <p className="text-xs">
                    Mide la cantidad total de luz útil (moles de fotones) recibida en 1 m² durante
                    un día completo (24h). Es el &quot;litraje&quot; diario de sol acumulado.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-2 text-xs">
                    <div>
                      <span className="text-primary block font-semibold">
                        🌿 Orquideario (Cattleyas)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Óptimo: 4.0 - 12.0 mol/m²/d</li>
                        <li>Bajo (&lt; 4): Afecta floración</li>
                        <li>Alto (&gt; 18): Riesgo quemaduras</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-primary block font-semibold">
                        🌵 Exterior (Cactus & Suc)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Óptimo: 10.0 - 22.0 mol/m²/d</li>
                        <li>Soportan &gt; 22 mol/m²/d</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* VPD */}
                <div className="bg-surface/50 border-input-outline flex flex-col gap-3 rounded-lg border p-5">
                  <h4 className="text-primary flex items-center gap-2 text-sm font-bold uppercase">
                    <Wind className="h-4 w-4 text-cyan-400" /> VPD (Vapor Pressure Deficit)
                  </h4>
                  <p className="text-xs">
                    Déficit de Presión de Vapor. Mide la diferencia de humedad entre el interior de
                    la hoja y el aire exterior. Indica la fuerza con que el aire succiona el agua de
                    la planta para hacerla transpirar.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-2 text-xs">
                    <div>
                      <span className="text-primary block font-semibold">
                        🌿 Orquideario (Cattleyas)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Óptimo: 0.4 - 1.2 kPa</li>
                        <li>Bajo (&lt; 0.4): Hongo/no transpira</li>
                        <li>Alto (&gt; 1.6): Estrés hídrico</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-primary block font-semibold">
                        🌵 Exterior (Cactus & Suc)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Óptimo: 0.5 - 1.8 kPa</li>
                        <li>Seco (&gt; 1.8): Clima árido</li>
                        <li>Húmedo (&lt; 0.5): Riesgo pudrición</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* DIF */}
                <div className="bg-surface/50 border-input-outline flex flex-col gap-3 rounded-lg border p-5">
                  <h4 className="text-primary flex items-center gap-2 text-sm font-bold uppercase">
                    <Thermometer className="h-4 w-4 text-orange-400" /> DIF Térmico (Día/Noche)
                  </h4>
                  <p className="text-xs">
                    Diferencia de temperatura promedio entre el día y la noche. Un diferencial de
                    temperatura pronunciado es el estímulo natural que activa la floración en
                    Cattleyas.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-2 text-xs">
                    <div>
                      <span className="text-primary block font-semibold">
                        🌿 Orquideario (Cattleyas)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Óptimo: 6.0 - 12.0 °C</li>
                        <li>Bajo (&lt; 6.0): Poca inducción floral</li>
                        <li>Alto (&gt; 12.0): Estrés térmico</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-primary block font-semibold">
                        🌵 Exterior (Cactus & Suc)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Óptimo: &gt; 8.0 °C</li>
                        <li>Excelente para desarrollo</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Saturación Hídrica */}
                <div className="bg-surface/50 border-input-outline flex flex-col gap-3 rounded-lg border p-5">
                  <h4 className="text-primary flex items-center gap-2 text-sm font-bold uppercase">
                    <IoWaterOutline className="h-4 w-4 text-blue-400" /> Saturación Hídrica
                  </h4>
                  <p className="text-xs">
                    Tiempo acumulado diario con humedad relativa superior al umbral crítico (HR
                    &gt;= 90% en Orquideario, &gt;= 98% en Exterior). Si se prolonga más del umbral
                    seguro (3h en Orquideario, 2h en Exterior), activa una alerta ya que las raíces
                    no pueden respirar y se favorece la pudrición.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-2 text-xs">
                    <div>
                      <span className="text-primary block font-semibold">
                        🌿 Orquideario (Cattleyas)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Límite Seguro: &lt;= 3 horas</li>
                        <li>Crítico (&gt; 3h): Alerta fúngica activa</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-primary block font-semibold">
                        🌵 Exterior (Cactus & Suc)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Límite Seguro: &lt;= 2 horas</li>
                        <li>Crítico (&gt; 2h): Riesgo de pudrición</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Déficit Hídrico */}
                <div className="bg-surface/50 border-input-outline flex flex-col gap-3 rounded-lg border p-5">
                  <h4 className="text-primary flex items-center gap-2 text-sm font-bold uppercase">
                    <BsThermometerSun className="h-4 w-4 text-red-400" /> Déficit Hídrico
                  </h4>
                  <p className="text-xs">
                    Tiempo acumulado diario con sequedad extrema (HR &lt; 50% en Orquideario, &lt;=
                    45% en Exterior). Si supera las 4 horas continuas, la Cattleya pierde agua a
                    través de las hojas demasiado rápido y detiene su fotosíntesis para no
                    deshidratarse.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-2 text-xs">
                    <div>
                      <span className="text-primary block font-semibold">
                        🌿 Orquideario (Cattleyas)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Umbral Seco: HR &lt; 50%</li>
                        <li>Límite Seguro: &lt;= 4 horas</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-primary block font-semibold">
                        🌵 Exterior (Cactus & Suc)
                      </span>
                      <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 opacity-85">
                        <li>Umbral Seco: HR &lt;= 45%</li>
                        <li>Límite Seguro: &lt;= 4 horas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
