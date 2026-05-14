'use client'

import { useState, useMemo } from 'react'
import { Droplets, Sun, Moon, Thermometer } from 'lucide-react'
import useSWR from 'swr'

import { EnvironmentCard, EnvironmentDataChart } from '../../monitoring/ui/components'

import { ZoneType } from '@/config/mappings'
import { Heading, DeviceStatus } from '@/components'
import { useToast } from '@/hooks'

type BotanicalMetricType = 'dli' | 'vpd_avg' | 'dif' | 'high_humidity_hours'

interface BotanicalDataResponse {
  liveKPIs: {
    dli: number | null
    vpdAvg: number | null
    dif: number | null
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

export function BotanicalAnalysisView() {
  const [zone, setZone] = useState<string>(ZoneType.EXTERIOR)
  const [selectedMetric, setSelectedMetric] = useState<BotanicalMetricType | null>(null)

  // Rango estático para los datos del gráfico: 30d para análisis botánico.
  const chartRange = '30d'

  const { error: notifyError } = useToast()

  // 1. Consulta para "Current Status" / Tarjetas (Rango fijo 24h o 12h, usamos 24h para métricas diarias)
  const {
    data: statusResponse,
    error: statusError,
    isLoading: isStatusLoading,
  } = useSWR<BotanicalDataResponse>(`/api/environment/history?range=24h&zone=${zone}`, fetcher, {
    refreshInterval: 60000 * 60, // Refrescar cada hora, no cambia a menudo
    revalidateOnFocus: false,
  })

  const liveKPIs = statusResponse?.liveKPIs || null

  // 2. Consulta para "Chart Data"
  const {
    data: chartResponse,
    error: chartError,
    isLoading: isChartLoading,
  } = useSWR<{ data: Record<string, unknown>[] }>(
    selectedMetric ? `/api/environment/history?range=${chartRange}&zone=${zone}` : null,
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
          color: '#a855f7',
          unit: 'mol/m²/d',
          title: 'Integral de Luz Diaria (DLI)',
          icon: <Sun className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      case 'vpd_avg':
        return {
          dataKey: 'vpd_avg',
          color: '#06b6d4',
          unit: 'kPa',
          title: 'VPD Promedio',
          icon: <Droplets className="h-4 w-4" />,
        }
      case 'dif':
        return {
          dataKey: 'dif',
          color: '#f97316',
          unit: '°C',
          title: 'Diferencial Térmico (DIF)',
          icon: <Thermometer className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      case 'high_humidity_hours':
        return {
          dataKey: 'high_humidity_hours',
          color: '#ef4444',
          unit: 'h',
          title: 'Horas Humedad > 85%',
          icon: <Moon className="h-4 w-4" />,
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
          description="Análisis de métricas procesadas (ciclos de 24h) para evaluación biológica."
          title="Análisis Botánico"
        />

        <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-4 tds-xl:gap-6 grid grid-cols-1 gap-5">
          <EnvironmentCard
            color="purple"
            hasData={!!liveKPIs && liveKPIs.dli !== null}
            icon={<Sun className="h-6 w-6" />}
            isActive={selectedMetric === 'dli'}
            isLoading={isStatusLoading}
            isOffline={false}
            status="optimal"
            title="DLI (Luz Diaria)"
            trend="stable"
            unit="mol/m²/d"
            value={
              liveKPIs?.dli !== null && liveKPIs?.dli !== undefined ? liveKPIs.dli.toFixed(1) : '--'
            }
            onClick={() => setSelectedMetric('dli')}
          />

          <EnvironmentCard
            color="cyan"
            hasData={!!liveKPIs && liveKPIs.vpdAvg !== null}
            icon={<Droplets className="h-6 w-6" />}
            isActive={selectedMetric === 'vpd_avg'}
            isLoading={isStatusLoading}
            isOffline={false}
            status="optimal"
            title="VPD Promedio"
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
            color="orange"
            hasData={!!liveKPIs && liveKPIs.dif !== null}
            icon={<Thermometer className="h-6 w-6" />}
            isActive={selectedMetric === 'dif'}
            isLoading={isStatusLoading}
            isOffline={false}
            status="optimal"
            title="DIF Térmico"
            trend="stable"
            unit="°C"
            value={
              liveKPIs?.dif !== null && liveKPIs?.dif !== undefined ? liveKPIs.dif.toFixed(1) : '--'
            }
            onClick={() => setSelectedMetric('dif')}
          />

          <EnvironmentCard
            hasData
            color="red"
            icon={<Moon className="h-6 w-6" />}
            isActive={selectedMetric === 'high_humidity_hours'}
            isLoading={isStatusLoading}
            isOffline={false}
            status="optimal"
            title="Humedad Crítica"
            trend="stable"
            unit="h (>85%)"
            value="--" // Este dato no se incluye en liveKPIs por defecto, lo ajustaremos si es necesario o podemos poner '--' si no está en la API.
            onClick={() => setSelectedMetric('high_humidity_hours')}
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
                  <Sun className="text-primary h-6 w-6" />
                </div>
                <p className="text-sm font-medium">Seleccione una métrica para ver el historial</p>
              </div>
            </div>
          ) : chartProps ? (
            <EnvironmentDataChart
              data={normalizedChartData}
              {...chartProps}
              range={chartRange}
              onRangeChange={() => {}} // No hacemos range change por ahora, fijo en 30d
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
