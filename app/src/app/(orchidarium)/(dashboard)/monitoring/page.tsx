'use client'

import { useEffect, useState } from 'react'
import { CloudRain, Droplets, Thermometer, Sun } from 'lucide-react'
import { FaChartLine } from 'react-icons/fa6'

import { SmartDeviceHeader } from '@/components/dashboard/SmartDeviceHeader'
import { EnvironmentCard } from '@/components/dashboard/EnvironmentCard'
import { SensorHistoryChart } from '@/components/dashboard/SensorHistoryChart'
import { useDeviceHeartbeat } from '@/hooks'

interface SensorData {
  time: string
  temperature: number
  humidity: number
  illuminance: number
  external_illuminance: number
  [key: string]: string | number
}

interface RainData {
  totalDurationSeconds: number
  averageIntensity: number
}

type MetricType = 'temperature' | 'humidity' | 'illuminance' | 'external_illuminance' | 'rain'

export default function MonitoringPage() {
  const [data, setData] = useState<SensorData[]>([])
  const [rainData, setRainData] = useState<RainData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [range, setRange] = useState('24h')
  const [zone, setZone] = useState('ZONA_A')
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null)

  const formatTopicZone = (z: string) => {
    return z
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_')
  }

  const statusTopic =
    zone === 'EXTERIOR'
      ? 'PristinoPlant/Actuator_Controller/status'
      : `PristinoPlant/Environmental_Monitoring/${formatTopicZone(zone)}/status`

  // Trigger full skeleton reload ONLY when changing zones
  useEffect(() => {
    setInitialLoading(true)
  }, [zone])

  // Polling data every 30 seconds para métricas históricas de base de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel data fetching
        const [histRes, rainRes] = await Promise.all([
          fetch(`/api/sensors/history?range=${range}&zone=${zone}`),
          fetch(`/api/sensors/rain?range=${range}&zone=${zone}`),
        ])

        if (histRes.ok) {
          const jsonData = await histRes.json()

          setData(jsonData)
        }

        if (rainRes.ok) {
          const rainJson = await rainRes.json()

          setRainData(rainJson)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [range, zone])

  // Handle metric reset when changing zones to start clean
  useEffect(() => {
    setSelectedMetric(null)
  }, [zone])

  // Derive current values from the last data point
  const current =
    data.length > 0
      ? data[data.length - 1]
      : {
          time: new Date(0).toISOString(),
          temperature: 0,
          humidity: 0,
          illuminance: 0,
          external_illuminance: 0,
        }

  // 1. Estado de Conexión Unificado (para el Badge y Dashboard) usando el custom hook
  const { connectionState } = useDeviceHeartbeat(statusTopic)

  // 2. Cargando Global:
  //    - Si la API REST está buscando historial (loading)
  //    - O si MQTT todavía no nos entrega el estatus ('unknown') PERO solo durante los primeros 3 segundos.
  //      Esto evita que áreas que no existen se queden en Skeleton eterno.
  const [hasMqttTimedOut, setHasMqttTimedOut] = useState(false)

  useEffect(() => {
    setHasMqttTimedOut(false)
    const timer = setTimeout(() => {
      setHasMqttTimedOut(true)
    }, 30000) // 30 segundos de gracia para que MQTT despierte. Coincide con PUBLISH_INTERVAL del firmware.

    return () => clearTimeout(timer)
  }, [zone])

  const isMqttLoading = connectionState === 'unknown' && !hasMqttTimedOut

  // 2. Estado Offline (para las cards):
  //    Se considera offline si es explícitamente offline, zombie, o si ya pasó el tiempo de gracia y sigue 'unknown'.
  const isOffline =
    connectionState === 'offline' ||
    connectionState === 'zombie' ||
    (connectionState === 'unknown' && hasMqttTimedOut)

  // Format rain duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) return `${hours}h ${minutes}m`

    return `${minutes}m`
  }

  // Simple trend calculation (last vs average of last 5)
  const calculateTrend = (key: 'temperature' | 'humidity' | 'illuminance') => {
    if (data.length < 5) return 'stable'
    const last = data[data.length - 1][key]
    const prev = data[data.length - 5][key]

    if (last > prev + 0.5) return 'up'
    if (last < prev - 0.5) return 'down'

    return 'stable'
  }

  // Helper to get chart props based on selected metric
  const getChartProps = () => {
    if (!selectedMetric) {
      return {
        dataKey: 'temperature',
        color: '#f97316',
        unit: '°C',
        title: 'Seleccione una métrica',
        icon: <Thermometer className="h-4 w-4" />,
      }
    }

    switch (selectedMetric) {
      case 'temperature':
        return {
          dataKey: 'temperature',
          color: '#f97316',
          unit: '°C',
          title: 'Temperatura',
          icon: <Thermometer className="h-4 w-4" />,
        }
      case 'humidity':
        return {
          dataKey: 'humidity',
          color: '#3b82f6',
          unit: '%',
          title: 'Humedad Relativa',
          icon: <Droplets className="h-4 w-4" />,
        }
      case 'illuminance':
        return {
          dataKey: 'illuminance',
          color: '#eab308',
          unit: 'lx',
          title: 'Iluminancia',
          icon: <Sun className="h-4 w-4" />,
        }
      case 'external_illuminance':
        return {
          dataKey: 'external_illuminance',
          color: '#ca8a04', // A slightly different yellow/amber for external
          unit: 'lx',
          title: 'Iluminancia',
          icon: <Sun className="h-4 w-4" />,
        }
      case 'rain':
        return {
          dataKey: 'temperature',
          color: '#06b6d4',
          unit: '',
          title: 'Lluvia',
          icon: <CloudRain className="h-4 w-4" />,
        }
      default:
        return {
          dataKey: 'temperature',
          color: '#f97316',
          unit: '°C',
          title: 'Temperatura',
          icon: <Thermometer className="h-4 w-4" />,
        }
    }
  }

  const chartProps = selectedMetric ? getChartProps() : null

  // Lógica de clasificación de iluminancia (basada en docs/specs/02-light-standards-orchids.md)
  const getInteriorLuxStatus = (
    val: number,
  ): { status: 'optimal' | 'warning' | 'critical'; label: string } => {
    if (val < 10000) return { status: 'warning', label: 'Bajo' }

    if (val <= 45000) return { status: 'optimal', label: 'Óptimo' }

    if (val <= 60000) return { status: 'warning', label: 'Alto' }

    return { status: 'critical', label: 'Peligro' }
  }

  const getExteriorLuxStatus = (
    val: number,
  ): { status: 'optimal' | 'warning' | 'critical'; label: string } => {
    if (val < 20000) return { status: 'optimal', label: 'Sombra' }

    if (val < 60000) return { status: 'optimal', label: 'Nublado' }

    if (val < 90000) return { status: 'optimal', label: 'Soleado' }

    return { status: 'warning', label: 'Extremo' }
  }

  const intLux = getInteriorLuxStatus(current.illuminance)
  const extLux = getExteriorLuxStatus(current.external_illuminance)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="flex flex-col gap-6">
        {/* Cabecera Tipo Dynamic Island */}
        <SmartDeviceHeader
          connectionState={connectionState}
          deviceDescription="Condiciones ambientales del orquideario en tiempo real e históricos."
          deviceName="Monitor Ambiental"
          dropdownTitle="Estación Meteorológica"
          isLoadingStatus={isMqttLoading}
          selectedZone={zone}
          zones={['ZONA_A', 'EXTERIOR']}
          onZoneChanged={setZone}
        />

        {/* Tarjetas de Parámetros Dinámicas */}
        {zone !== 'EXTERIOR' ? (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-xl:gap-6 grid grid-cols-1 gap-5">
            {/* Temperature Card */}
            <EnvironmentCard
              color="orange"
              hasData={data.length > 0}
              icon={<Thermometer className="h-6 w-6" />}
              isActive={selectedMetric === 'temperature'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={current.temperature > 28 || current.temperature < 18 ? 'warning' : 'optimal'}
              title="Temperatura"
              trend={calculateTrend('temperature')}
              unit="°C"
              value={current.temperature.toFixed(1)}
              onClick={() => setSelectedMetric('temperature')}
            />

            {/* Humidity Card */}
            <EnvironmentCard
              color="blue"
              hasData={data.length > 0}
              icon={<Droplets className="h-6 w-6" />}
              isActive={selectedMetric === 'humidity'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={current.humidity < 50 ? 'warning' : 'optimal'}
              title="Humedad Relativa"
              trend={calculateTrend('humidity')}
              unit="%"
              value={current.humidity.toFixed(1)}
              onClick={() => setSelectedMetric('humidity')}
            />

            {/* Illuminance Card (Internal) */}
            <EnvironmentCard
              className="tds-sm:col-span-2 tds-lg:col-span-1"
              color="yellow"
              hasData={data.length > 0}
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={intLux.status}
              statusLabel={intLux.label}
              title="Iluminancia"
              trend={calculateTrend('illuminance')}
              unit="lux"
              value={Math.round(current.illuminance).toLocaleString()}
              onClick={() => setSelectedMetric('illuminance')}
            />
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-xl:gap-6 grid grid-cols-1 gap-5">
            {/* External Illuminance Card */}
            <EnvironmentCard
              color="yellow"
              description="Estación Meteorológica"
              hasData={data.length > 0}
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'external_illuminance'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={extLux.status}
              statusLabel={extLux.label}
              title="Iluminancia"
              unit="lux"
              value={Math.round(current.external_illuminance).toLocaleString()}
              onClick={() => setSelectedMetric('external_illuminance')}
            />

            {/* Rain Card */}
            <EnvironmentCard
              className="opacity-90"
              color="cyan"
              description={
                rainData ? `Intensidad media: ${rainData.averageIntensity}%` : 'Sin datos'
              }
              hasData={!!rainData}
              icon={<CloudRain className="h-6 w-6" />}
              isActive={selectedMetric === 'rain'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={rainData && rainData.totalDurationSeconds > 0 ? 'warning' : 'optimal'}
              title="Lluvia"
              unit=""
              value={!rainData ? '--' : formatDuration(rainData.totalDurationSeconds)}
              onClick={() => setSelectedMetric('rain')}
            />
          </div>
        )}
      </div>

      {/* Main Chart - Full Width */}
      <div className="mt-2 w-full">
        {initialLoading || isMqttLoading ? (
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
              <p className="text-sm font-medium">Seleccione un parametro ambiental</p>
            </div>
          </div>
        ) : selectedMetric !== 'rain' && chartProps ? (
          <SensorHistoryChart
            color={chartProps.color}
            data={data}
            dataKey={chartProps.dataKey}
            icon={chartProps.icon}
            range={range}
            title={`Histórico ${chartProps.title}`}
            unit={chartProps.unit}
            onRangeChange={setRange}
          />
        ) : (
          <div className="border-input-outline bg-surface text-secondary flex h-[350px] w-full items-center justify-center rounded-xl border">
            <div className="flex flex-col items-center gap-2">
              <CloudRain className="h-8 w-8 opacity-20" />
              <p className="text-sm">Gráfica de lluvia no disponible (Próximamente)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
