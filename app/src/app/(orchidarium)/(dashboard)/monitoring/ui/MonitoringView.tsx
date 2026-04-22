'use client'

import { useEffect, useState, useMemo } from 'react'
import { CloudRain, Droplets, Thermometer, Sun, Cloud, Moon } from 'lucide-react'
import { FaChartLine } from 'react-icons/fa6'
import useSWR from 'swr'

import { EnvironmentCard, SensorHistoryChart } from './components'

import { ZoneType } from '@/config/mappings'
import { Heading, DeviceStatus } from '@/components'
import { useDeviceHeartbeat, useToast } from '@/hooks'
import { useMqttStore } from '@/store/mqtt/mqtt.store'
import { formatTime12h, formatDateLong } from '@/utils/timeFormat'

interface SensorData {
  [key: string]: string | number | boolean | undefined
  external_illuminance?: number
  humidity: number
  illuminance: number
  rain_intensity: number
  temperature: number
  time: string
  ram_free?: number
  ram_alloc?: number
  rssi?: number
  isAudit?: boolean
}

interface RainData {
  totalDurationSeconds: number
  averageIntensity: number
  eventCount: number
  events?: { time: string; duration: number; intensity: number }[]
}

type MetricType = 'temperature' | 'humidity' | 'illuminance' | 'rain_intensity' | 'rain_events'

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))

    throw new Error(errorData.error || 'Error al obtener datos de telemetría')
  }

  return res.json()
}

export function MonitoringView() {
  // ----- Estados -----
  const [metricRanges, setMetricRanges] = useState<Record<MetricType, string>>({
    temperature: '24h',
    humidity: '24h',
    illuminance: '24h',
    rain_intensity: '24h',
    rain_events: '24h',
  })
  const [zone, setZone] = useState<string>(ZoneType.EXTERIOR)
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null)
  const [now, setNow] = useState(0)

  // Capturar tiempo de montaje de forma asíncrona para evitar renders en cascada síncronos
  // y cumplir con la pureza requerida en React 19 (idempotencia).
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now())
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const { error: notifyError } = useToast()

  const currentRange = selectedMetric ? metricRanges[selectedMetric] : '24h'

  const handleRangeChange = (newRange: string) => {
    if (selectedMetric) {
      setMetricRanges((prev) => ({ ...prev, [selectedMetric]: newRange }))
    }
  }

  // 1. Consulta para "Current Status" / Tarjetas (Rango fijo 24h, todos los campos de la zona)
  const {
    data: cardStatusData = [],
    error: cardStatusError,
    isLoading: isCardStatusLoading,
  } = useSWR<SensorData[]>(`/api/sensors/history?range=24h&zone=${zone}`, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  })

  // 2. Consulta para "Chart Data" (Solo se activa si hay una métrica seleccionada)
  const {
    data: chartData = [],
    error: chartError,
    isLoading: isChartLoading,
  } = useSWR<SensorData[]>(
    selectedMetric && selectedMetric !== 'rain_events'
      ? `/api/sensors/history?range=${currentRange}&zone=${zone}&metric=${selectedMetric}`
      : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    },
  )

  // 3. Consulta para "Rain Events" (Siempre activa en EXTERIOR, usa su propio rango independiente)
  const {
    data: rainData = null,
    error: rainError,
    isLoading: isRainLoading,
  } = useSWR<RainData>(
    zone === ZoneType.EXTERIOR
      ? `/api/sensors/rain?range=${metricRanges['rain_events']}&zone=${zone}`
      : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    },
  )

  // ----- Sincronización de Errores (Notificaciones) -----
  useEffect(() => {
    if (cardStatusError) {
      notifyError(`Error en sensores: ${cardStatusError.message}`)
    }
    if (chartError) {
      notifyError(`Error en historial: ${chartError.message}`)
    }
    if (rainError) {
      notifyError(`Error en pluviómetro: ${rainError.message}`)
    }
  }, [cardStatusError, chartError, rainError, notifyError])

  // ----- MQTT & Heartbeat -----
  const formatTopicZone = (z: string) => {
    return z
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_')
  }

  const statusTopic =
    zone === ZoneType.EXTERIOR
      ? 'PristinoPlant/Actuator_Controller/status'
      : `PristinoPlant/Environmental_Monitoring/${formatTopicZone(zone)}/status`

  const { messages: mqttMessages, status } = useMqttStore()
  const { connectionState } = useDeviceHeartbeat(statusTopic)

  // Determinamos si estamos esperando datos iniciales
  const isSWRBusy = isCardStatusLoading

  const isMqttLoading = useMemo(() => {
    if (!isSWRBusy && cardStatusData.length > 0) return false
    if (connectionState === 'offline') return false

    const zoneSuffix = formatTopicZone(zone)
    const readingsTopic = `PristinoPlant/Weather_Station/${zoneSuffix}/readings`

    if (mqttMessages[readingsTopic]) return false
    if (status !== 'connected' && isSWRBusy) return true

    return isSWRBusy
  }, [status, mqttMessages, zone, connectionState, isSWRBusy, cardStatusData.length])

  // Procesamiento de lecturas MQTT
  const mqttReadings = useMemo(() => {
    const zoneSuffix = formatTopicZone(zone)
    const readingsTopic = `PristinoPlant/Weather_Station/${zoneSuffix}/readings`

    const readingsMsg = mqttMessages[readingsTopic]
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
        // Error de parseo silencioso
      }
    }

    return Object.keys(result).length > 0 ? result : null
  }, [mqttMessages, zone])

  const current = useMemo(() => {
    // Utility to ensure we don't return NaN to the UI
    const sanitize = (val: unknown) => {
      const num = Number(val)

      return isNaN(num) ? 0 : num
    }

    const base =
      cardStatusData.length > 0
        ? cardStatusData[cardStatusData.length - 1]
        : {
            time: new Date().toISOString(),
            temperature: 0,
            humidity: 0,
            illuminance: 0,
            rain_intensity: 0,
          }

    const merged: SensorData = {
      ...base,
      temperature: sanitize(base.temperature),
      humidity: sanitize(base.humidity),
      illuminance: sanitize(base.illuminance),
      rain_intensity: sanitize(base.rain_intensity),
    }

    if (mqttReadings) {
      let timestamp = now ? now / 1000 : new Date(base.time).getTime() / 1000

      if (mqttReadings.time) {
        const rawTime = Number(mqttReadings.time)

        timestamp = rawTime < 1000000000 ? rawTime + 946684800 : rawTime
      }

      Object.assign(merged, {
        ...mqttReadings,
        temperature:
          mqttReadings.temperature !== undefined
            ? sanitize(mqttReadings.temperature)
            : merged.temperature,
        humidity:
          mqttReadings.humidity !== undefined ? sanitize(mqttReadings.humidity) : merged.humidity,
        illuminance:
          mqttReadings.illuminance !== undefined
            ? sanitize(mqttReadings.illuminance)
            : merged.illuminance,
        rain_intensity:
          mqttReadings.rain_intensity !== undefined
            ? sanitize(mqttReadings.rain_intensity)
            : merged.rain_intensity,
        time: new Date(timestamp * 1000).toISOString(),
      })
    }

    return merged
  }, [cardStatusData, mqttReadings, now])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) return `${hours}h ${minutes} min`

    return `${minutes} min`
  }

  const calculateTrend = (key: 'temperature' | 'humidity' | 'illuminance') => {
    if (cardStatusData.length < 5) return 'stable'
    const last = Number(cardStatusData[cardStatusData.length - 1][key])
    const prev = Number(cardStatusData[cardStatusData.length - 5][key])
    const threshold = key === 'illuminance' ? 150 : 0.5

    if (last > prev + threshold) return 'up'
    if (last < prev - threshold) return 'down'

    return 'stable'
  }

  const getChartProps = () => {
    if (!selectedMetric) return null

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
          chartType: 'bar' as const,
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
        return null
    }
  }

  const chartProps = getChartProps()

  const climate = ((): {
    label: string
    icon: React.ReactNode
    color: 'blue' | 'purple' | 'orange' | 'yellow' | 'green' | 'cyan' | 'red'
    description: string
    status: 'optimal' | 'warning' | 'critical'
  } => {
    const lux = Number(current.illuminance) || 0
    const rain = Number(current.rain_intensity) || 0
    const lastUpdateDate = new Date(current.time || 0)

    const sysDate = now ? new Date(now) : new Date()
    const sysHour = sysDate.getHours()
    const sysMinutes = sysDate.getMinutes()
    const sysTimeInHours = sysHour + sysMinutes / 60

    // El sensor de lux se apaga a las 19:00 y enciende a las 5:30.
    // Definimos el horario operativo del sensor (para no interpretar lux=0 como falla).
    const sensorIsActive = sysTimeInHours >= 5.5 && sysTimeInHours < 19

    // Tiempo desde la última actualización del dato
    const minutesSinceLastUpdate = (now ? now - lastUpdateDate.getTime() : 0) / 60000
    // "isStale" solo aplica dentro del horario donde el sensor DEBERÍA estar enviando datos
    const isStale = sensorIsActive && minutesSinceLastUpdate > 30

    const luxTrend = calculateTrend('illuminance')

    // ─── PRIORIDAD 1: Lluvia activa (siempre, sin importar si el dato es viejo) ───────────
    // La lluvia es detectada por el pluviómetro que funciona 24h independiente del sensor de lux
    if (rain > 20) {
      return {
        label: 'Lloviendo',
        icon: <CloudRain className="h-6 w-6 text-blue-400" />,
        color: 'blue' as const,
        description: 'Precipitación activa',
        status: 'warning' as const,
      }
    }

    // ─── PRIORIDAD 2: Ciclo nocturno basado en el RELOJ DEL SISTEMA ─────────────────────
    // El scheduler apaga el sensor a 19:00 → cualquier hora ≥19 o <5:30 es noche esperada.

    // Madrugada (0:00 – 5:30)
    if (sysTimeInHours >= 0 && sysTimeInHours < 5.5) {
      return {
        label: 'Madrugada',
        icon: <Moon className="h-6 w-6 text-indigo-400" />,
        color: 'purple' as const,
        description: 'Oscuridad total',
        status: 'optimal' as const,
      }
    }

    // Amanecer temprano (5:30 – 6:30)
    if (sysTimeInHours >= 5.5 && sysTimeInHours < 6.5) {
      return {
        label: 'Amanecer',
        icon: <Sun className="h-6 w-6 animate-pulse text-amber-300" />,
        color: 'yellow' as const,
        description: 'Iniciando muestreo',
        status: 'optimal' as const,
      }
    }

    // Atardecer (17:00 – 19:00) — sensor aún activo pero luz decreciente
    if (sysTimeInHours >= 17 && sysTimeInHours < 19) {
      const isActuallyDark = lux < 1000 || luxTrend === 'down'

      return {
        label: 'Atardecer',
        icon: <Sun className="h-6 w-6 text-orange-400" />,
        color: 'orange' as const,
        description: isActuallyDark ? 'Luz en descenso' : 'Despejado / Ocaso',
        status: 'optimal' as const,
      }
    }

    // Noche (19:00 – 24:00) — sensor apagado, es condición esperada
    if (sysTimeInHours >= 19) {
      return {
        label: 'Noche',
        icon: <Moon className="h-6 w-6 text-indigo-400" />,
        color: 'purple' as const,
        description: 'Muestreo suspendido',
        status: 'optimal' as const,
      }
    }

    // ─── PRIORIDAD 3: Horario diurno (6:30 – 17:00) con sensor activo ───────────────────

    // Dato viejo durante horario activo del sensor → advertencia real
    if (isStale) {
      return {
        label: 'Sin Datos',
        icon: <Cloud className="h-6 w-6 text-slate-500" />,
        color: 'orange' as const,
        description: `Sin señal desde las ${formatTime12h(lastUpdateDate)}`,
        status: 'critical' as const,
      }
    }

    // Falla real: sensor activo, dato reciente, pero lux=0 en horario de alta irradiación
    if (lux < 5 && sysHour >= 8 && sysHour < 17) {
      return {
        label: 'Falla Sensor',
        icon: <Moon className="h-6 w-6 text-red-400" />,
        color: 'red' as const,
        description: 'Lux 0 en horario diurno',
        status: 'critical' as const,
      }
    }

    if (zone === ZoneType.EXTERIOR) {
      if (lux < 15000) {
        return {
          label: 'Luz Indirecta',
          icon: <Cloud className="h-6 w-6 text-slate-400" />,
          color: 'green' as const,
          description: 'Luz Filtrada / Nube densa',
          status: 'optimal' as const,
        }
      }
      if (lux < 30000) {
        return {
          label: 'Nublado',
          icon: <Cloud className="h-6 w-6 text-slate-300" />,
          color: 'cyan' as const,
          description: 'Luz difusa / Cielo cubierto',
          status: 'optimal' as const,
        }
      }
      if (lux < 60000) {
        return {
          label: 'Soleado',
          icon: <Sun className="h-6 w-6 text-yellow-400" />,
          color: 'yellow' as const,
          description: 'Radiación directa',
          status: 'optimal' as const,
        }
      }

      if (lux < 75000) {
        return {
          label: 'Extremo',
          icon: <Sun className="h-6 w-6 text-orange-500" />,
          color: 'orange' as const,
          description: 'Radiación crítica',
          status: 'warning' as const,
        }
      }

      return {
        label: 'Peligro',
        icon: <Sun className="h-6 w-6 text-red-400" />,
        color: 'red' as const,
        description: 'Riesgo de Deshidratación',
        status: 'critical' as const,
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
          color: 'orange' as const,
          description: 'Límite superior recomendado',
          status: 'warning' as const,
        }

      return {
        label: 'Peligro',
        icon: <Sun className="h-6 w-6 text-red-400" />,
        color: 'red' as const,
        description: 'Estrés lumínico detectado',
        status: 'critical' as const,
      }
    }
  })()

  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <div className="flex flex-col gap-6">
        <Heading
          action={
            <DeviceStatus
              connectionState={connectionState}
              dropdownTitle="Estación Meteorológica"
              selectedZone={zone}
              zones={[ZoneType.EXTERIOR, ZoneType.ZONA_A]}
              onZoneChanged={(newZone) => {
                setZone(newZone)
                setSelectedMetric(null)
              }}
            />
          }
          description="Condiciones ambientales del orquideario en tiempo real e históricos."
          title="Monitor Ambiental"
        />

        {zone !== ZoneType.EXTERIOR ? (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-xl:gap-6 grid grid-cols-1 gap-5">
            <EnvironmentCard
              color="orange"
              hasData={cardStatusData.length > 0}
              icon={<Thermometer className="h-6 w-6" />}
              isActive={selectedMetric === 'temperature'}
              isLoading={isMqttLoading}
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
              hasData={cardStatusData.length > 0}
              icon={<Droplets className="h-6 w-6" />}
              isActive={selectedMetric === 'humidity'}
              isLoading={isMqttLoading}
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
              hasData={cardStatusData.length > 0}
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={isMqttLoading}
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
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-xl:gap-6 grid grid-cols-1 gap-5">
            <EnvironmentCard
              color="yellow"
              description="Estación Meteorológica"
              hasData={cardStatusData.length > 0}
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={isMqttLoading}
              isOffline={connectionState === 'offline'}
              status="optimal"
              title="Iluminancia"
              unit="lux"
              value={Math.round(current.illuminance).toLocaleString()}
              onClick={() => setSelectedMetric('illuminance')}
            />

            <EnvironmentCard
              color="blue"
              description={
                rainData ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{rainData.eventCount} eventos</span>
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
              isLoading={isRainLoading}
              isOffline={false}
              status="optimal"
              title="Eventos de Lluvia"
              unit={metricRanges['rain_events'] === '24h' ? '' : 'Eventos'}
              value={
                !rainData
                  ? '--'
                  : metricRanges['rain_events'] === '24h'
                    ? formatDuration(rainData.totalDurationSeconds)
                    : rainData.eventCount
              }
              onClick={() => setSelectedMetric('rain_events')}
            />

            <EnvironmentCard
              hasData
              className="tds-sm:col-span-2 tds-lg:col-span-1"
              color={climate.color}
              description={climate.description}
              icon={climate.icon}
              isActive={false}
              isLoading={isMqttLoading}
              isOffline={connectionState === 'offline'}
              status={climate.status}
              title="Estado del Clima"
              unit=""
              value={climate.label}
              onClick={() => {}}
            />
          </div>
        )}
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
              <p className="text-sm font-medium">
                Seleccione un parámetro ambiental para ver su historial
              </p>
            </div>
          </div>
        ) : chartProps ? (
          <SensorHistoryChart
            chartType={chartProps.chartType as 'area' | 'bar'}
            color={chartProps.color}
            data={chartProps.customData || chartData}
            dataKey={chartProps.dataKey}
            icon={chartProps.icon}
            range={currentRange}
            title={chartProps.title}
            unit={chartProps.unit}
            onRangeChange={handleRangeChange}
          />
        ) : null}
      </div>
    </div>
  )
}
