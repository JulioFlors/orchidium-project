'use client'

import { useEffect, useState } from 'react'
import { CloudRain, Droplets, Thermometer, Sun, Cloud, Moon, CloudSun } from 'lucide-react'
import { FaChartLine } from 'react-icons/fa6'

import { SmartDeviceHeader } from '@/components/dashboard/SmartDeviceHeader'
import { EnvironmentCard } from '@/components/dashboard/EnvironmentCard'
import { SensorHistoryChart } from '@/components/dashboard/SensorHistoryChart'
import { useDeviceHeartbeat } from '@/hooks'

interface SensorData {
  [key: string]: string | number | undefined
  external_illuminance: number
  humidity: number
  illuminance: number
  phase?: string
  temperature: number
  time: string
}

interface RainData {
  totalDurationSeconds: number
  averageIntensity: number
  eventCount: number
}

interface FilterData {
  health: number
  pressure: number
  status: 'optimal' | 'warning' | 'critical' | 'unknown'
}

type MetricType = 'temperature' | 'humidity' | 'illuminance' | 'pressure' | 'rain'

export default function MonitoringPage() {
  const [data, setData] = useState<SensorData[]>([])
  const [rainData, setRainData] = useState<RainData | null>(null)
  const [filterData, setFilterData] = useState<FilterData | null>(null)
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
        const [histRes, rainRes, filterRes] = await Promise.all([
          fetch(`/api/sensors/history?range=${range}&zone=${zone}`),
          fetch(`/api/sensors/rain?range=${range}&zone=${zone}`),
          fetch(`/api/sensors/filter?zone=${zone}`),
        ])

        if (histRes.ok) {
          const jsonData = await histRes.json()

          setData(jsonData)
        }

        if (rainRes.ok) {
          const rainJson = await rainRes.json()

          setRainData(rainJson)
        }

        if (filterRes.ok) {
          const filterJson = await filterRes.json()

          setFilterData(filterJson)
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
          pressure: 0,
          rain_intensity: 0,
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
  const calculateTrend = (key: 'temperature' | 'humidity' | 'illuminance' | 'pressure') => {
    if (data.length < 5) return 'stable'
    const last = Number(data[data.length - 1][key])
    const prev = Number(data[data.length - 5][key])

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
      case 'pressure':
        return {
          dataKey: 'pressure',
          color: '#818cf8',
          unit: 'PSI',
          title: 'Presión de Agua',
          icon: <Droplets className="h-4 w-4" />,
        }
      case 'rain':
        return {
          dataKey: 'rain_intensity',
          color: '#0ea5e9',
          unit: '%',
          title: 'Intensidad de Lluvia',
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
  const extLux = getExteriorLuxStatus(current.illuminance)

  // 3. Lógica de Clima Inteligente (Deducción por sensores + tiempo)
  const getClimateStatus = () => {
    // Prioridad 1: Lluvia
    const isRaining = Number(current.rain_intensity) > 0

    if (isRaining) {
      return {
        label: 'Lloviendo',
        icon: <CloudRain className="h-6 w-6 text-blue-400" />,
        color: 'blue' as const,
        description: 'Precipitación detectada',
        status: 'warning' as const,
      }
    }

    const lux = Number(current.illuminance) || 0
    const hour = new Date(current.time || 0).getHours()
    const minutesSinceLastUpdate = (Date.now() - new Date(current.time || 0).getTime()) / 60000

    // Prioridad 1.5: Desconocido (Datos muy viejos o nulos)
    if (minutesSinceLastUpdate > 60 || (!current.time && !isRaining)) {
      return {
        label: 'Desconocido',
        icon: <Cloud className="h-6 w-6 text-gray-400" />,
        color: 'cyan' as const,
        description: 'Sin datos recientes',
        status: 'warning' as const,
      }
    }

    // Prioridad 2: Noche (Lux bajo o horario nocturno)
    // Umbral: 20:00 a 06:00 o Lux muy bajo (< 50)
    if (lux < 50 || hour >= 20 || hour < 6) {
      if (lux < 5 && hour > 7 && hour < 19) {
        // Caso especial: Es de día pero lux es 0 -> Sensor posiblemente fallido
        return {
          label: 'Falla Sensor',
          icon: <Moon className="h-6 w-6 text-red-400" />,
          color: 'orange' as const,
          description: 'Lux 0 en horario diurno',
          status: 'critical' as const,
        }
      }

      return {
        label: 'Noche',
        icon: <Moon className="h-6 w-6 text-indigo-300" />,
        color: 'blue' as const,
        description: 'Cielos oscuros',
        status: 'optimal' as const,
      }
    }

    // Prioridad 3: Soleado (Lux alto)
    if (lux > 25000) {
      return {
        label: 'Soleado',
        icon: <Sun className="h-6 w-6 text-yellow-500" />,
        color: 'yellow' as const,
        description: 'Cielos despejados',
        status: 'optimal' as const,
      }
    }

    // Prioridad 4: Nublado (Lux medio)
    if (lux > 2000) {
      return {
        label: 'Nublado',
        icon: <Cloud className="h-6 w-6 text-gray-400" />,
        color: 'orange' as const,
        description: 'Luz tamizada por nubes',
        status: 'optimal' as const,
      }
    }

    // Prioridad 5: Atardecer / Sombrío (Lux bajo pero de día)
    return {
      label: 'Sombrío',
      icon: <CloudSun className="h-6 w-6 text-orange-300" />,
      color: 'orange' as const,
      description: 'Baja luminosidad / Atardecer',
      status: 'optimal' as const,
    }
  }

  const climate = getClimateStatus()

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
              isActive={selectedMetric === 'illuminance'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={extLux.status}
              statusLabel={extLux.label}
              title="Iluminancia"
              unit="lux"
              value={Math.round(current.illuminance).toLocaleString()}
              onClick={() => setSelectedMetric('illuminance')}
            />

            {/* Pressure Card */}
            <EnvironmentCard
              color="cyan"
              description="Transductor 150PSI"
              hasData={data.length > 0}
              icon={<Droplets className="h-6 w-6" />}
              isActive={selectedMetric === 'pressure'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={
                Number(current.pressure) > 100 || Number(current.pressure) < 5
                  ? 'warning'
                  : 'optimal'
              }
              title="Presión de Agua"
              trend={calculateTrend('pressure')}
              unit="PSI"
              value={Number(current.pressure).toFixed(1)}
              onClick={() => setSelectedMetric('pressure')}
            />

            {/* Climate Status Card */}
            <EnvironmentCard
              hasData
              color={climate.color}
              description={climate.description}
              icon={climate.icon}
              isActive={false}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={climate.status}
              title="Estado del Clima"
              unit=""
              value={climate.label}
              onClick={() => {}}
            />

            {/* Rain Statistics Card */}
            <EnvironmentCard
              color="blue"
              description={
                rainData
                  ? `${rainData.eventCount} eventos | Prom: ${rainData.averageIntensity}%`
                  : 'Sin registros'
              }
              hasData={!!rainData}
              icon={<FaChartLine className="h-6 w-6" />}
              isActive={selectedMetric === 'rain'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status="optimal"
              title="Resumen de Lluvia"
              unit=""
              value={!rainData ? '--' : formatDuration(rainData.totalDurationSeconds)}
              onClick={() => setSelectedMetric('rain')}
            />

            {/* Filter Health Card */}
            <EnvironmentCard
              color={!filterData || filterData.health > 80 ? 'green' : 'orange'}
              description={
                filterData ? `Presión de trabajo: ${filterData.pressure} PSI` : 'Bomba inactiva'
              }
              hasData={!!filterData}
              icon={<FaChartLine className="h-6 w-6" />}
              isActive={false}
              isLoading={initialLoading || isMqttLoading}
              isOffline={isOffline}
              status={filterData?.status === 'unknown' ? undefined : filterData?.status}
              statusLabel={filterData ? `${filterData.health}%` : 'Óptimo'}
              title="Salud del Filtro"
              unit=""
              value={filterData ? `${filterData.health}%` : '100%'}
              onClick={() => {}}
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
        ) : chartProps ? (
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
        ) : null}
      </div>
    </div>
  )
}
