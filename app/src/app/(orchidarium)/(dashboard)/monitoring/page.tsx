'use client'

import { useEffect, useState, useMemo } from 'react'
import { CloudRain, Droplets, Thermometer, Sun, Cloud, Moon } from 'lucide-react'
import { FaChartLine } from 'react-icons/fa6'

import { SmartDeviceHeader } from '@/components/dashboard/SmartDeviceHeader'
import { EnvironmentCard } from '@/components/dashboard/EnvironmentCard'
import { SensorHistoryChart } from '@/components/dashboard/SensorHistoryChart'
import { useDeviceHeartbeat } from '@/hooks'
import { useMqttStore } from '@/store/mqtt/mqtt.store'
import { formatTime12h, formatDateLong } from '@/utils/timeFormat'

interface SensorData {
  [key: string]: string | number | undefined
  external_illuminance: number
  humidity: number
  illuminance: number
  rain_intensity: number
  temperature: number
  time: string
  ram_free?: number
  ram_alloc?: number
  rssi?: number
}

interface RainData {
  totalDurationSeconds: number
  averageIntensity: number
  eventCount: number
  events?: { time: string; duration: number; intensity: number }[]
}

interface AuditSnapshot {
  lux?: number
  rain?: number
  ram?: { f: number; a: number }
  health?: { rssi: number; ip: string }
}

type MetricType = 'temperature' | 'humidity' | 'illuminance' | 'rain_intensity' | 'rain_events'

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

  const { messages: mqttMessages, status } = useMqttStore()
  const { connectionState } = useDeviceHeartbeat(statusTopic)

  // Polling data para métricas históricas
  useEffect(() => {
    setInitialLoading(true)
  }, [zone])

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  useEffect(() => {
    setSelectedMetric(null)
  }, [zone])

  const isMqttLoading = useMemo(() => {
    if (!initialLoading && data.length > 0) return false

    // Si el hook ya determinó que está offline, dejamos de esperar MQTT
    if (connectionState === 'offline') return false

    const zoneSuffix = formatTopicZone(zone)
    const readingsTopic = `PristinoPlant/Weather_Station/${zoneSuffix}/readings`

    if (mqttMessages[readingsTopic]) return false

    if (status !== 'connected' && initialLoading) return true

    return initialLoading
  }, [status, mqttMessages, zone, connectionState, initialLoading, data.length])

  // Procesamiento de lecturas MQTT
  const mqttReadings = useMemo(() => {
    const zoneSuffix = formatTopicZone(zone)
    const readingsTopic = `PristinoPlant/Weather_Station/${zoneSuffix}/readings`
    const auditTopic = 'PristinoPlant/Actuator_Controller/audit'

    const readingsMsg = mqttMessages[readingsTopic]
    const auditMsg = mqttMessages[auditTopic]
    const result: Partial<SensorData> = {}

    if (readingsMsg) {
      try {
        const payload =
          typeof readingsMsg.payload === 'object'
            ? readingsMsg.payload
            : JSON.parse(String(readingsMsg.payload))

        if (payload.history && Array.isArray(payload.history)) {
          const lastPoint = payload.history[payload.history.length - 1]

          result.time = String(lastPoint[0])
          Object.assign(result, lastPoint[1])
        } else {
          Object.assign(result, payload)
        }
      } catch {
        /* ignore */
      }
    }

    if (auditMsg) {
      try {
        const payload =
          typeof auditMsg.payload === 'object'
            ? (auditMsg.payload as AuditSnapshot)
            : (JSON.parse(String(auditMsg.payload)) as AuditSnapshot)

        if (payload.lux !== undefined) result.illuminance = Number(payload.lux)

        if (payload.rain !== undefined) result.rain_intensity = Number(payload.rain)

        if (payload.ram) {
          result.ram_free = payload.ram.f
          result.ram_alloc = payload.ram.a
        }

        if (payload.health) result.rssi = payload.health.rssi
      } catch {
        /* ignore */
      }
    }

    return Object.keys(result).length > 0 ? result : null
  }, [mqttMessages, zone])

  // Derive current values from the last data point (API vs MQTT)
  const current = useMemo(() => {
    const base =
      data.length > 0
        ? data[data.length - 1]
        : {
            time: new Date().toISOString(),
            temperature: 0,
            humidity: 0,
            illuminance: 0,
            rain_intensity: 0,
          }

    // Si tenemos datos frescos de MQTT, los sobreponemos a los de la API (polling)
    if (mqttReadings) {
      // 🕒 Corrección de Época: MicroPython (2000) vs Unix (1970)
      // Si el timestamp es sospechosamente bajo (< 1B), aplicamos el offset.
      let timestamp = Date.now() / 1000

      if (mqttReadings.time) {
        const rawTime = Number(mqttReadings.time)

        timestamp = rawTime < 1000000000 ? rawTime + 946684800 : rawTime
      }

      return {
        ...base,
        ...mqttReadings,
        time: new Date(timestamp * 1000).toISOString(),
      }
    }

    return base
  }, [data, mqttReadings])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) return `${hours}h ${minutes} min`

    return `${minutes} min`
  }

  // Simple trend calculation (last vs average of last 5)
  const calculateTrend = (key: 'temperature' | 'humidity' | 'illuminance') => {
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
      case 'rain_intensity':
        return {
          dataKey: 'rain_intensity',
          color: '#3b82f6',
          unit: '%',
          title: 'Intensidad de Lluvia',
          icon: <CloudRain className="h-4 w-4" />,
        }
      case 'rain_events':
        return {
          dataKey: 'duration',
          color: '#3b82f6',
          unit: 'min',
          title: 'Duración',
          icon: <FaChartLine className="h-4 w-4" />,
          chartType: 'bar',
          customData:
            (rainData?.events || []).map((ev) => {
              const endDate = new Date(ev.time)
              const startDate = new Date(endDate.getTime() - ev.duration * 1000)

              return {
                time: ev.time,
                duration: Math.round(ev.duration / 60),
                intensity: ev.intensity,
                startTime: formatTime12h(startDate),
                endTime: formatTime12h(endDate),
                dateLabel: formatDateLong(endDate),
              }
            }) || [],
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

  const climate = (() => {
    const lux = Number(current.illuminance) || 0
    const rain = Number(current.rain_intensity) || 0
    const hour = new Date(current.time || 0).getHours()

    // Cálculo de frescura del dato
    const lastUpdate = new Date(current.time || 0).getTime()
    const minutesSinceLastUpdate = (Date.now() - lastUpdate) / 60000

    if (rain > 20) {
      return {
        label: 'Lloviendo',
        icon: <CloudRain className="h-6 w-6 text-blue-400" />,
        color: 'blue' as const,
        description: 'Precipitación activa',
        status: 'warning' as const,
      }
    }

    if (lux < 50 || hour >= 20 || hour < 6) {
      if (lux < 5 && hour > 7 && hour < 19 && minutesSinceLastUpdate < 10) {
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
        icon: <Moon className="h-6 w-6 text-indigo-400" />,
        color: 'purple' as const,
        description: 'Cielos oscuros',
        status: 'optimal' as const,
      }
    }

    if (zone === 'EXTERIOR') {
      if (lux < 5000) {
        return {
          label: 'Luz Indirecta',
          icon: <Cloud className="h-6 w-6 text-slate-400" />,
          color: 'green' as const,
          description: 'Amanecer / Atardecer / Nube densa',
          status: 'optimal' as const,
        }
      }

      if (lux < 25000) {
        return {
          label: 'Nublado',
          icon: <Cloud className="h-6 w-6 text-slate-300" />,
          color: 'cyan' as const,
          description: 'Luz difusa / Cielo cubierto',
          status: 'optimal' as const,
        }
      }

      if (lux < 55000) {
        return {
          label: 'Soleado',
          icon: <Sun className="h-6 w-6 text-yellow-400" />,
          color: 'yellow' as const,
          description: 'Radiación directa',
          status: 'optimal' as const,
        }
      }

      return {
        label: 'Extremo',
        icon: <Sun className="h-6 w-6 text-orange-500" />,
        color: 'orange' as const,
        description: 'Radiación crítica / Riesgo térmico',
        status: 'warning' as const,
      }
    } else {
      if (lux < 10000)
        return {
          label: 'Bajo',
          icon: <Cloud className="h-6 w-6 text-slate-400" />,
          color: 'orange' as const,
          description: 'Iluminación insuficiente',
          status: 'warning' as const,
        }

      if (lux <= 45000)
        return {
          label: 'Óptimo',
          icon: <Sun className="h-6 w-6 text-yellow-400" />,
          color: 'green' as const,
          description: 'Rango ideal para crecimiento',
          status: 'optimal' as const,
        }

      if (lux <= 60000)
        return {
          label: 'Alto',
          icon: <Sun className="h-6 w-6 text-yellow-500" />,
          color: 'yellow' as const,
          description: 'Límite superior recomendado',
          status: 'warning' as const,
        }

      return {
        label: 'Peligro',
        icon: <Sun className="h-6 w-6 text-red-500" />,
        color: 'orange' as const,
        description: 'Estrés lumínico detectado',
        status: 'critical' as const,
      }
    }
  })()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SmartDeviceHeader
          connectionState={connectionState}
          deviceDescription="Condiciones ambientales del orquideario en tiempo real e históricos."
          deviceName="Monitor Ambiental"
          dropdownTitle="Estación Meteorológica"
          //isLoadingStatus={isMqttLoading}
          selectedZone={zone}
          zones={['EXTERIOR', 'ZONA_A']}
          onZoneChanged={(newZone) => setZone(newZone as 'EXTERIOR' | 'ZONA_A')}
        />

        {zone !== 'EXTERIOR' ? (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-xl:gap-6 grid grid-cols-1 gap-5">
            <EnvironmentCard
              color="orange"
              hasData={data.length > 0}
              icon={<Thermometer className="h-6 w-6" />}
              isActive={selectedMetric === 'temperature'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={connectionState === 'offline'}
              status={current.temperature > 28 || current.temperature < 18 ? 'warning' : 'optimal'}
              title="Temperatura"
              trend={calculateTrend('temperature')}
              unit="°C"
              value={current.temperature.toFixed(1)}
              onClick={() => setSelectedMetric('temperature')}
            />

            <EnvironmentCard
              color="blue"
              hasData={data.length > 0}
              icon={<Droplets className="h-6 w-6" />}
              isActive={selectedMetric === 'humidity'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={connectionState === 'offline'}
              status={current.humidity < 50 ? 'warning' : 'optimal'}
              title="Humedad Relativa"
              trend={calculateTrend('humidity')}
              unit="%"
              value={current.humidity.toFixed(1)}
              onClick={() => setSelectedMetric('humidity')}
            />

            <EnvironmentCard
              className="tds-sm:col-span-2 tds-lg:col-span-1"
              color="yellow"
              hasData={data.length > 0}
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={connectionState === 'offline'}
              status="optimal"
              title="Iluminancia"
              trend={calculateTrend('illuminance')}
              unit="lux"
              value={Math.round(current.illuminance).toLocaleString()}
              onClick={() => setSelectedMetric('illuminance')}
            />
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-xl:gap-6 grid grid-cols-1 gap-5">
            <EnvironmentCard
              color="yellow"
              description="Estación Meteorológica"
              hasData={data.length > 0}
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={connectionState === 'offline'}
              status="optimal"
              title="Iluminancia"
              unit="lux"
              value={Math.round(current.illuminance).toLocaleString()}
              onClick={() => setSelectedMetric('illuminance')}
            />

            {zone === 'EXTERIOR' && (
              <EnvironmentCard
                color="blue"
                description="Intensidad de LLuvia"
                hasData={data.length > 0}
                icon={<CloudRain className="h-6 w-6" />}
                isActive={selectedMetric === 'rain_intensity'}
                isLoading={initialLoading || isMqttLoading}
                isOffline={connectionState === 'offline'}
                status={Number(current.rain_intensity) > 0 ? 'warning' : 'optimal'}
                title="Lluvia"
                trend="stable"
                unit="%"
                value={Number(current.rain_intensity).toFixed(0)}
                onClick={() => setSelectedMetric('rain_intensity')}
              />
            )}

            <EnvironmentCard
              hasData
              color={climate.color}
              description={climate.description}
              icon={climate.icon}
              isActive={false}
              isLoading={initialLoading || isMqttLoading}
              isOffline={connectionState === 'offline'}
              status={climate.status}
              title="Estado del Clima"
              unit=""
              value={climate.label}
              onClick={() => {}}
            />

            <EnvironmentCard
              color="blue"
              description={
                rainData ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {range === '24h'
                        ? `${rainData.eventCount} eventos`
                        : formatDuration(rainData.totalDurationSeconds)}
                    </span>
                    <span className="text-primary/20">|</span>
                    <span className="font-semibold">Prom: {rainData.averageIntensity}%</span>
                  </div>
                ) : (
                  'Sin registros'
                )
              }
              hasData={!!rainData}
              icon={<FaChartLine className="h-6 w-6" />}
              isActive={selectedMetric === 'rain_events'}
              isLoading={initialLoading || isMqttLoading}
              isOffline={connectionState === 'offline'}
              status="optimal"
              title="Eventos de Lluvia"
              unit={range === '24h' ? '' : 'Eventos'}
              value={
                !rainData
                  ? '--'
                  : range === '24h'
                    ? formatDuration(rainData.totalDurationSeconds)
                    : rainData.eventCount
              }
              onClick={() => setSelectedMetric('rain_events')}
            />
          </div>
        )}
      </div>

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
            chartType={chartProps.chartType as 'area' | 'bar'}
            color={chartProps.color}
            data={chartProps.customData || data}
            dataKey={chartProps.dataKey}
            icon={chartProps.icon}
            range={range}
            title={chartProps.title}
            unit={chartProps.unit}
            onRangeChange={setRange}
          />
        ) : null}
      </div>
    </div>
  )
}
