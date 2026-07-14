'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  CloudRain,
  Thermometer,
  Sun,
  Cloud,
  Moon,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { FaChartLine } from 'react-icons/fa6'
import { IoWaterOutline } from 'react-icons/io5'
import useSWR from 'swr'

import { EnvironmentCard, EnvironmentDataChart } from './components'

import { ZoneType, ZoneMetrics, MetricLabels, MetricUnits } from '@/config/mappings'
import { Heading, DeviceStatus } from '@/components'
import { useDeviceHeartbeat, useToast } from '@/hooks'
import { useMqttStore } from '@/store/mqtt/mqtt.store'
import { formatTime12h, formatDateLong, getHourInCaracas } from '@/utils/timeFormat'

type MetricType =
  | 'temperature'
  | 'humidity'
  | 'illuminance'
  | 'rain_intensity'
  | 'rain_events'
  | 'rain_inferred'

interface SensorData {
  [key: string]: string | number | boolean | undefined
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

interface RainEvent {
  id: string
  time: string
  startedAt?: string | null
  endedAt?: string | null
  duration: number
  intensity: number
  isInfered: boolean
  baselineTemp: number | null
  baselineHum: number | null
  baselineLux: number | null
  baselineAgeMinutes?: number | null
  triggerReason: string | null
  closeReason: string | null
  startTemp?: number | null
  startHum?: number | null
  startLux?: number | null
  endTemp?: number | null
  endHum?: number | null
  endLux?: number | null
  triggerType?: string | null
  triggerTempDrop?: number | null
  triggerHumRise?: number | null
  triggerLuxDropPct?: number | null
  closeType?: string | null
  closeMinTemp?: number | null
  closeTempRecovery?: number | null
  closeTempVar?: number | null
  closeHumVar?: number | null
  closeLuxMax?: number | null
}

interface RainData {
  totalDurationSeconds: number
  averageIntensity: number
  eventCount: number
  isActive: boolean
  activeEventId: string | null
  activeInferredEventId?: string | null
  isInferredActive?: boolean
  events?: RainEvent[]
}

interface SensorDataResponse {
  data: SensorData[]
  liveKPIs: {
    isLive: boolean
  } | null
  lastRainState?: { state: string; timestamp: number } | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))

    throw new Error(errorData.error || 'Error al obtener datos de telemetría')
  }

  return res.json()
}

interface MonitoringViewProps {
  initialHeartbeats?: Record<string, { timestamp: number; status: string }>
}

export function MonitoringView({ initialHeartbeats = {} }: MonitoringViewProps) {
  // ----- Estados -----
  const [zone, setZone] = useState<string>(ZoneType.EXTERIOR)

  const [metricRanges, setMetricRanges] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {}

    Object.values(ZoneType).forEach((z) => {
      initial[z] = {}
      const metrics = ZoneMetrics[z] || []

      metrics.forEach((m) => {
        initial[z][m] = m === 'illuminance' ? '8-16h' : '24h'
      })
      // Agregar métricas especiales que no están en ZoneMetrics pero se muestran en la UI
      if (z === ZoneType.EXTERIOR) {
        initial[z]['rain_events'] = 'today'
        initial[z]['rain_inferred'] = 'today'
      }
    })

    return initial
  })

  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null)
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  const [now, setNow] = useState(() => Date.now())

  // Capturar tiempo de montaje y mantenerlo actualizado para clasificaciones dinámicas
  // (Atardecer, Noche, etc.) sin depender de recargas manuales.
  useEffect(() => {
    let interval: NodeJS.Timeout

    const timer = setTimeout(() => {
      // Sincronizar cada 60s con el ciclo de refresco de SWR
      interval = setInterval(() => {
        setNow(Date.now())
      }, 60000)
    }, 0)

    return () => {
      clearTimeout(timer)
      if (interval) clearInterval(interval)
    }
  }, [setNow])

  const { error: notifyError } = useToast()

  const currentRange =
    selectedMetric && metricRanges[zone] ? metricRanges[zone][selectedMetric] : '24h'

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

  // 1. Consulta para "Current Status" / Tarjetas (Rango optimizado según nodo)
  const cardRange = zone === ZoneType.EXTERIOR ? '30m' : '90m'
  const {
    data: cardStatusResponse,
    error: cardStatusError,
    isLoading: isCardStatusLoading,
  } = useSWR<SensorDataResponse>(
    `/api/environment/history?range=${cardRange}&zone=${zone}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    },
  )

  const cardStatusData = useMemo(() => cardStatusResponse?.data || [], [cardStatusResponse])

  // 2. Consulta para "Chart Data" (Solo se activa si hay una métrica seleccionada)
  const {
    data: chartResponse,
    error: chartError,
    isLoading: isChartLoading,
  } = useSWR<SensorDataResponse | SensorData[]>(
    selectedMetric && !['rain_events', 'rain_inferred'].includes(selectedMetric)
      ? `/api/environment/history?range=${currentRange}&zone=${zone}&metric=${selectedMetric}`
      : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    },
  )

  const chartData = useMemo(
    () => (Array.isArray(chartResponse) ? chartResponse : chartResponse?.data || []),
    [chartResponse],
  )

  // 3a. Consulta para "Lluvia Física" (Siempre activa en EXTERIOR, usa su propio rango)
  const physicalRainRange = useMemo(() => {
    if (zone === ZoneType.EXTERIOR) {
      return metricRanges[zone]?.['rain_events'] || 'today'
    }

    return null
  }, [zone, metricRanges])

  const {
    data: physicalRainData = null,
    error: physicalRainError,
    isLoading: isPhysicalRainLoading,
  } = useSWR<RainData>(
    zone === ZoneType.EXTERIOR && physicalRainRange
      ? `/api/environment/precipitation?range=${physicalRainRange}&zone=${zone}`
      : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    },
  )

  // 3b. Consulta para "Lluvia Inferida" (Siempre activa en EXTERIOR, usa su propio rango)
  const inferredRainRange = useMemo(() => {
    if (zone === ZoneType.EXTERIOR) {
      return metricRanges[zone]?.['rain_inferred'] || 'today'
    }

    return null
  }, [zone, metricRanges])

  const {
    data: inferredRainData = null,
    error: inferredRainError,
    isLoading: isInferredRainLoading,
  } = useSWR<RainData>(
    zone === ZoneType.EXTERIOR && inferredRainRange
      ? `/api/environment/precipitation?range=${inferredRainRange}&zone=${zone}`
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
    if (physicalRainError) {
      notifyError(`Error en pluviómetro físico: ${physicalRainError.message}`)
    }
    if (inferredRainError) {
      notifyError(`Error en pluviómetro inferido: ${inferredRainError.message}`)
    }
  }, [cardStatusError, chartError, physicalRainError, inferredRainError, notifyError])

  const parsedRainData = useMemo(() => {
    const physicalEvents = (physicalRainData?.events || []).filter((e) => !e.isInfered)
    const inferredEvents = (inferredRainData?.events || []).filter((e) => e.isInfered)

    const isPhysicalActive = physicalRainData?.isActive || false
    const isInferredActive = inferredRainData?.isInferredActive || false

    const physicalDuration = physicalEvents.reduce((acc, ev) => {
      const isAct = !ev.endedAt
      const dur = isAct ? Math.round((Date.now() - new Date(ev.startedAt || ev.time).getTime()) / 1000) : ev.duration
      return acc + dur
    }, 0)
    const inferredDuration = inferredEvents.reduce((acc, ev) => {
      const isAct = !ev.endedAt
      const dur = isAct ? Math.round((Date.now() - new Date(ev.startedAt || ev.time).getTime()) / 1000) : ev.duration
      return acc + dur
    }, 0)

    return {
      physical: {
        count: physicalEvents.length,
        duration: physicalDuration,
        isActive: isPhysicalActive,
        events: physicalEvents,
      },
      inferred: {
        count: inferredEvents.length,
        duration: inferredDuration,
        isActive: isInferredActive,
        events: inferredEvents,
      },
    }
  }, [physicalRainData, inferredRainData])

  // ----- MQTT & Heartbeat -----

  const statusTopic =
    zone === ZoneType.EXTERIOR
      ? `PristinoPlant/Actuator_Controller/status`
      : `PristinoPlant/Weather_Station/${zone}/status`

  const { messages: mqttMessages } = useMqttStore()
  const initialData = initialHeartbeats[statusTopic]
  const { connectionState } = useDeviceHeartbeat(
    statusTopic,
    initialData?.timestamp || null,
    initialData?.status || 'unknown',
  )

  // Determinamos si estamos esperando datos iniciales
  const isSWRBusy = isCardStatusLoading

  const isMqttLoading = useMemo(() => {
    // Si ya tenemos datos históricos de InfluxDB, mostramos esos inmediatamente
    // mientras esperamos telemetría viva. Esto evita el "vacío" tras reinicios.
    if (cardStatusData.length > 0) return false

    // Si el dispositivo está offline o en modo sleep, no tiene sentido mostrar "Cargando..." infinitamente
    if (connectionState === 'offline' || connectionState === 'sleep') return false

    const readingsTopic = `PristinoPlant/Weather_Station/${zone}/readings`

    // Si llega un mensaje MQTT, dejamos de cargar
    if (mqttMessages[readingsTopic]) return false

    // Solo mostramos loading si SWR está en su carga inicial Y no tenemos datos previos
    return isSWRBusy
  }, [mqttMessages, zone, connectionState, isSWRBusy, cardStatusData.length])

  // Procesamiento de lecturas MQTT
  const mqttReadings = useMemo(() => {
    const readingsTopic = `PristinoPlant/Weather_Station/${zone}/readings`

    const readingsMsg = mqttMessages[readingsTopic]
    const result: Partial<SensorData> = {}

    if (readingsMsg) {
      try {
        const payload =
          typeof readingsMsg.payload === 'object'
            ? readingsMsg.payload
            : JSON.parse(String(readingsMsg.payload))

        if (payload.data && Array.isArray(payload.data)) {
          const lastPoint = payload.data[payload.data.length - 1]

          result.time = String(lastPoint[0])
          Object.assign(result, lastPoint[1])
        } else {
          // Solo aceptamos nombres estandarizados (temperature, humidity, illuminance, rain_intensity)
          if (payload.temperature !== undefined) result.temperature = Number(payload.temperature)
          if (payload.humidity !== undefined) result.humidity = Number(payload.humidity)
          if (payload.illuminance !== undefined) result.illuminance = Number(payload.illuminance)
          if (payload.rain_intensity !== undefined)
            result.rain_intensity = Number(payload.rain_intensity)

          if (payload.time) result.time = String(payload.time)
        }
      } catch {
        // Error de parseo silencioso
      }
    }

    return Object.keys(result).length > 0 ? result : null
  }, [mqttMessages, zone])

  // 4. Estado de Lluvia persistente y Realtime (Aislado de las lecturas analógicas)
  const rainState = useMemo(() => {
    // Fuente de Verdad A: Estado del Sistema (Postgres)
    const dbState = cardStatusResponse?.lastRainState?.state || 'Dry'

    // Fuente de Verdad B: Tiempo Real (MQTT)
    const rainTopic = `PristinoPlant/Weather_Station/${ZoneType.EXTERIOR}/rain/state`
    const msg = mqttMessages[rainTopic]

    if (msg) {
      try {
        const payload =
          typeof msg.payload === 'object' ? msg.payload : JSON.parse(String(msg.payload))
        const mqttState = payload.state === 'Raining' ? 'Raining' : 'Dry'

        // Si MQTT dice que llueve pero Postgres dice que no,
        // confiamos en Postgres (podría ser un veto del scheduler o humedad residual).
        if (mqttState === 'Raining' && dbState === 'Dry') {
          return 'Dry'
        }

        return mqttState
      } catch {
        // Fallback
      }
    }

    // Si no hay mensaje MQTT reciente, usar Postgres
    return dbState
  }, [mqttMessages, cardStatusResponse])

  const current = useMemo(() => {
    // Utility to ensure we handle invalid numbers as null for the UI to show '--'
    const sanitize = (val: unknown) => {
      if (val === null || val === undefined || typeof val === 'boolean') return null
      const num = Number(val)

      return isNaN(num) ? null : num
    }

    // Buscamos el último valor no nulo y verificamos que no sea antiguo (> 65 min para ZONA_A, > 25 min para otras)
    const getLastValid = (key: string) => {
      const STALE_THRESHOLD = zone === ZoneType.ZONA_A ? 65 * 60 * 1000 : 25 * 60 * 1000
      const nowMs = now

      for (let i = cardStatusData.length - 1; i >= 0; i--) {
        const row = cardStatusData[i] as Record<string, unknown>
        const val = row[key]

        if (val != null) {
          const sampleTime = new Date(String(row.time)).getTime()

          // Si el dato es más viejo que el umbral, lo consideramos caducado
          if (nowMs - sampleTime > STALE_THRESHOLD) return null

          return val
        }
      }

      return null
    }

    const merged: Record<string, number | string | null> = {
      time:
        cardStatusData.length > 0
          ? cardStatusData[cardStatusData.length - 1].time
          : new Date().toISOString(),
      temperature: sanitize(getLastValid('temperature')),
      humidity: sanitize(getLastValid('humidity')),
      illuminance: sanitize(getLastValid('illuminance')),
      rain_intensity: sanitize(getLastValid('rain_intensity')),
    }

    if (mqttReadings) {
      let timestamp = now ? now / 1000 : new Date(String(merged.time)).getTime() / 1000

      if (mqttReadings.time) {
        const rawTime = Number(mqttReadings.time)

        timestamp = rawTime < 1000000000 ? rawTime + 946684800 : rawTime
      }

      // Mapeo dinámico de MQTT (prioriza nombres largos)
      const mqttTemp = mqttReadings.temperature
      const mqttHum = mqttReadings.humidity
      const mqttLux = mqttReadings.illuminance
      const mqttRain = mqttReadings.rain_intensity

      Object.assign(merged, {
        ...mqttReadings,
        temperature: mqttTemp !== undefined ? sanitize(mqttTemp) : merged.temperature,
        humidity: mqttHum !== undefined ? sanitize(mqttHum) : merged.humidity,
        illuminance: mqttLux !== undefined ? sanitize(mqttLux) : merged.illuminance,
        rain_intensity: mqttRain !== undefined ? sanitize(mqttRain) : merged.rain_intensity,
        time: new Date(timestamp * 1000).toISOString(),
      })
    }

    return merged
  }, [cardStatusData, mqttReadings, now, zone])

  // Normalizar datos del gráfico para que Recharts encuentre las métricas por sus nombres estándar
  const normalizedChartData = useMemo(() => {
    if (!chartData || !Array.isArray(chartData)) return []

    return (chartData as Record<string, unknown>[]).map((row) => {
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

  const calculateTrend = (key: 'temperature' | 'humidity' | 'illuminance') => {
    // Filtramos los datos que realmente tienen esta métrica poblada (no nulos)
    const validData = cardStatusData.filter((d) => d[key] != null)

    if (validData.length < 5) return 'stable'

    const last = Number(validData[validData.length - 1][key])
    const prev = Number(validData[validData.length - 5][key])
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
          unit: MetricUnits.temperature,
          title: MetricLabels.temperature,
          icon: <Thermometer className="h-4 w-4" />,
        }
      case 'humidity':
        return {
          dataKey: 'humidity',
          color: '#3b82f6',
          unit: MetricUnits.humidity,
          title: MetricLabels.humidity,
          icon: <IoWaterOutline className="h-4 w-4" />,
        }
      case 'illuminance':
        return {
          dataKey: 'illuminance',
          color: '#eab308',
          unit: MetricUnits.illuminance,
          title: `${MetricLabels.illuminance}`,
          icon: <Sun className="h-4 w-4" />,
        }
      case 'rain_intensity':
        return {
          dataKey: 'rain_intensity',
          color: '#3b82f6',
          unit: MetricUnits.rain_intensity,
          title: 'Intensidad de Lluvia',
          icon: <CloudRain className="h-4 w-4" />,
        }
      case 'rain_events':
        return {
          dataKey: 'duration',
          color: '#3b82f6',
          unit: 'min',
          title: 'Sensor de lluvia',
          icon: <CloudRain className="h-4 w-4" />,
          chartType: 'bar' as const,
          customData:
            (physicalRainData?.events || [])
              .filter((ev: RainEvent) => !ev.isInfered)
              .map((ev: RainEvent) => {
                const startDate = new Date(ev.time)
                const isAct = !ev.endedAt
                const durSec = isAct ? Math.round((Date.now() - startDate.getTime()) / 1000) : ev.duration
                const endDate = isAct ? new Date() : new Date(startDate.getTime() + ev.duration * 1000)

                return {
                  time: ev.time,
                  duration: Math.ceil(durSec / 60),
                  intensity: ev.intensity,
                  startTime: formatTime12h(startDate),
                  endTime: isAct ? 'En curso' : formatTime12h(endDate),
                  dateLabel: formatDateLong(startDate),
                  isInfered: ev.isInfered,
                }
              }) || [],
        }
      case 'rain_inferred':
        return {
          dataKey: 'duration',
          color: '#a855f7',
          unit: 'min',
          title: 'Lluvia Inferida',
          icon: <CloudRain className="h-4 w-4" />,
          chartType: 'bar' as const,
          customData:
            (inferredRainData?.events || [])
              .filter((ev: RainEvent) => ev.isInfered)
              .map((ev: RainEvent) => {
                const startDate = new Date(ev.time)
                const isAct = !ev.endedAt
                const durSec = isAct ? Math.round((Date.now() - startDate.getTime()) / 1000) : ev.duration
                const endDate = isAct ? new Date() : new Date(startDate.getTime() + ev.duration * 1000)

                return {
                  time: ev.time,
                  duration: Math.ceil(durSec / 60),
                  intensity: ev.intensity,
                  startTime: formatTime12h(startDate),
                  endTime: isAct ? 'En curso' : formatTime12h(endDate),
                  dateLabel: formatDateLong(startDate),
                  isInfered: ev.isInfered,
                  startedAt: ev.time,
                  endedAt: endDate.toISOString(),
                  baselineTemp: ev.baselineTemp ?? undefined,
                  baselineHum: ev.baselineHum ?? undefined,
                  baselineLux: ev.baselineLux ?? undefined,
                  baselineAgeMinutes: ev.baselineAgeMinutes ?? undefined,
                  triggerReason: ev.triggerReason ?? undefined,
                  closeReason: ev.closeReason ?? undefined,
                  startTemp: ev.startTemp ?? undefined,
                  startHum: ev.startHum ?? undefined,
                  startLux: ev.startLux ?? undefined,
                  endTemp: ev.endTemp ?? undefined,
                  endHum: ev.endHum ?? undefined,
                  endLux: ev.endLux ?? undefined,
                  triggerType: ev.triggerType ?? undefined,
                  triggerTempDrop: ev.triggerTempDrop ?? undefined,
                  triggerHumRise: ev.triggerHumRise ?? undefined,
                  triggerLuxDropPct: ev.triggerLuxDropPct ?? undefined,
                  closeType: ev.closeType ?? undefined,
                  closeMinTemp: ev.closeMinTemp ?? undefined,
                  closeTempRecovery: ev.closeTempRecovery ?? undefined,
                  closeTempVar: ev.closeTempVar ?? undefined,
                  closeHumVar: ev.closeHumVar ?? undefined,
                  closeLuxMax: ev.closeLuxMax ?? undefined,
                }
              }) || [],
        }

      default:
        return null
    }
  }

  const chartProps = getChartProps()

  const sysDate = now ? new Date(now) : new Date()
  const sysHour = getHourInCaracas(sysDate)
  const sysMinutes = sysDate.getMinutes()
  const sysTimeInHours = sysHour + sysMinutes / 60

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

    // El sensor de lux se apaga a las 19:00 y enciende a las 4:59.
    // Definimos el horario operativo del sensor (para no interpretar lux=0 como falla).
    const sensorIsActive = sysTimeInHours >= 4.98 && sysTimeInHours < 19

    // Tiempo desde la última actualización del dato
    const minutesSinceLastUpdate = (now ? now - lastUpdateDate.getTime() : 0) / 60000
    // "isStale" solo aplica dentro del horario donde el sensor DEBERÍA estar enviando datos
    // Si supera el límite de inactividad (65 min para ZONA_A y 25 min para otras) se considera offline.
    const staleLimit = zone === ZoneType.ZONA_A ? 65 : 25
    const isStale = sensorIsActive && minutesSinceLastUpdate > staleLimit

    const luxTrend = calculateTrend('illuminance')

    // ─── PRIORIDAD 1: Verificación de Conexión (Real-time) ──────────────────────────
    if (connectionState === 'offline') {
      return {
        label: 'Desconectado',
        icon: <Cloud className="h-6 w-6 text-slate-500" />,
        color: 'orange' as const,
        description: 'Estación meteorológica Offline',
        status: 'critical' as const,
      }
    }

    // ─── PRIORIDAD 2: Dato viejo (isStale) ──────────────────────────────────────────
    // Si el dato supera el límite de inactividad, no es confiable.
    if (isStale) {
      return {
        label: 'Sin Datos',
        icon: <Cloud className="h-6 w-6 text-slate-500" />,
        color: 'orange' as const,
        description: `Sin señal desde las ${formatTime12h(lastUpdateDate)}`,
        status: 'critical' as const,
      }
    }

    // ─── PRIORIDAD 3: Lluvia activa (Física o Inferida) ───────────────────
    const isRainingNow = rainState === 'Raining' || parsedRainData.physical.isActive || parsedRainData.inferred.isActive
    if (isRainingNow) {
      const isVirtual = parsedRainData.inferred.isActive && !parsedRainData.physical.isActive
      return {
        label: 'Lloviendo',
        icon: <CloudRain className="h-6 w-6 text-blue-400" />,
        color: 'blue' as const,
        description: isVirtual ? 'Inferencia termodinámica activa' : (rain > 0 ? `Intensidad: ${rain.toFixed(0)}%` : 'Precipitación detectada'),
        status: 'warning' as const,
      }
    }

    // ─── PRIORIDAD 4: Ciclo nocturno basado en el RELOJ DEL SISTEMA ─────────────────────
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
        description: 'Condiciones nocturnas',
        status: 'optimal' as const,
      }
    }

    // ─── PRIORIDAD 5: Horario diurno (6:30 – 17:00) con sensor activo ───────────────────

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
          label: 'Muy Nublado',
          icon: <Cloud className="h-6 w-6 text-slate-400" />,
          color: 'green' as const,
          description: 'Cielo cerrado / Lluvioso',
          status: 'optimal' as const,
        }
      }
      if (lux < 26000) {
        return {
          label: 'Nublado',
          icon: <Cloud className="h-6 w-6 text-slate-300" />,
          color: 'cyan' as const,
          description: 'Luz difusa / Cielo cubierto',
          status: 'optimal' as const,
        }
      }
      if (lux < 30000) {
        return {
          label: 'Templado',
          icon: <Cloud className="h-6 w-6 text-amber-200" />,
          color: 'yellow' as const,
          description: 'Luz filtrada / Transición',
          status: 'optimal' as const,
        }
      }
      if (lux < 40000) {
        return {
          label: 'Soleado',
          icon: <Sun className="h-6 w-6 text-yellow-400" />,
          color: 'yellow' as const,
          description: 'Radiación directa',
          status: 'optimal' as const,
        }
      }

      if (lux < 60000) {
        return {
          label: 'Ext. Soleado',
          icon: <Sun className="h-6 w-6 text-yellow-500" />,
          color: 'yellow' as const,
          description: 'Radiación máxima sostenida',
          status: 'optimal' as const,
        }
      }

      if (lux < 75000) {
        return {
          label: 'Crítico',
          icon: <Sun className="h-6 w-6 text-orange-500" />,
          color: 'orange' as const,
          description: 'Radiación crítica',
          status: 'critical' as const,
        }
      }

      return {
        label: 'Advertencia',
        icon: <Sun className="h-6 w-6 text-red-400" />,
        color: 'red' as const,
        description: 'Riesgo de Deshidratación',
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
              icon={<Thermometer className="h-6 w-6" />}
              isActive={selectedMetric === 'temperature'}
              isLoading={isMqttLoading}
              title={MetricLabels.temperature}
              trend={calculateTrend('temperature')}
              unit={MetricUnits.temperature}
              value={current.temperature !== null ? Number(current.temperature).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('temperature')}
            />

            <EnvironmentCard
              color="blue"
              icon={<IoWaterOutline className="h-6 w-6" />}
              isActive={selectedMetric === 'humidity'}
              isLoading={isMqttLoading}
              title={MetricLabels.humidity}
              trend={calculateTrend('humidity')}
              unit={MetricUnits.humidity}
              value={current.humidity !== null ? Number(current.humidity).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('humidity')}
            />

            <EnvironmentCard
              className="tds-sm:col-span-2 tds-lg:col-span-1"
              color="yellow"
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={isMqttLoading}
              title={`${MetricLabels.illuminance}`}
              trend={calculateTrend('illuminance')}
              unit={MetricUnits.illuminance}
              value={
                current.illuminance !== null
                  ? Math.round(Number(current.illuminance)).toLocaleString()
                  : '--'
              }
              onClick={() => setSelectedMetric('illuminance')}
            />
          </div>
        ) : (
          <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-6 tds-xl:gap-6 grid grid-cols-1 gap-5">
            <EnvironmentCard
              className="tds-sm:order-1 tds-lg:col-span-2"
              color="orange"
              icon={<Thermometer className="h-6 w-6" />}
              isActive={selectedMetric === 'temperature'}
              isLoading={isMqttLoading}
              title={MetricLabels.temperature}
              trend={calculateTrend('temperature')}
              unit={MetricUnits.temperature}
              value={current.temperature !== null ? Number(current.temperature).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('temperature')}
            />

            <EnvironmentCard
              className="tds-sm:order-2 tds-lg:col-span-2"
              color="blue"
              icon={<IoWaterOutline className="h-6 w-6" />}
              isActive={selectedMetric === 'humidity'}
              isLoading={isMqttLoading}
              title={MetricLabels.humidity}
              trend={calculateTrend('humidity')}
              unit={MetricUnits.humidity}
              value={current.humidity !== null ? Number(current.humidity).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('humidity')}
            />

            <EnvironmentCard
              className="tds-sm:order-3 tds-lg:col-span-2"
              color="yellow"
              description={
                sysTimeInHours >= 19 || sysTimeInHours < 4.98 ? 'Muestreo suspendido' : ''
              }
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={isMqttLoading}
              title={`${MetricLabels.illuminance}`}
              trend={calculateTrend('illuminance')}
              unit={MetricUnits.illuminance}
              value={current.illuminance !== null ? Number(current.illuminance).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('illuminance')}
            />

            <EnvironmentCard
              className="tds-sm:order-4 tds-lg:col-span-2"
              color="blue"
              description={
                physicalRainData ? (
                  <div className="flex items-center gap-2">
                    {parsedRainData.physical.isActive && (
                      <span className="flex h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                    )}
                    <span className="font-semibold">
                      {(() => {
                        const r = metricRanges[zone]?.['rain_events']

                        if (r === 'today') return 'HOY'
                        if (r === 'yesterday') return '1D'
                        if (r === '7d') return '7D'
                        if (r === '30d') return '30D'
                        if (r === 'all') return 'TODO'

                        return 'HOY'
                      })()}
                    </span>
                    <span className="text-primary/20">|</span>
                    <span className="font-semibold">
                      {(() => {
                        const mins = Math.round(parsedRainData.physical.duration / 60)

                        if (mins < 60) return `${mins} min`

                        const hours = Math.floor(mins / 60)
                        const remaining = mins % 60

                        return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`
                      })()}
                    </span>
                  </div>
                ) : (
                  'Sin registros'
                )
              }
              icon={<CloudRain className="h-6 w-6" />}
              isActive={selectedMetric === 'rain_events'}
              isLoading={isPhysicalRainLoading}
              title="Sensor de lluvia"
              unit="Eventos"
              value={!physicalRainData ? '--' : parsedRainData.physical.count}
              onClick={() => setSelectedMetric('rain_events')}
            />

            <EnvironmentCard
              className="tds-sm:order-5 tds-lg:col-span-2"
              color="purple"
              description={
                inferredRainData ? (
                  <div className="flex items-center gap-2">
                    {parsedRainData.inferred.isActive && (
                      <span className="flex h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                    )}
                    <span className="font-semibold">
                      {(() => {
                        const r = metricRanges[zone]?.['rain_inferred']

                        if (r === 'today') return 'HOY'
                        if (r === 'yesterday') return '1D'
                        if (r === '7d') return '7D'
                        if (r === '30d') return '30D'
                        if (r === 'all') return 'TODO'

                        return 'HOY'
                      })()}
                    </span>
                    <span className="text-primary/20">|</span>
                    <span className="font-semibold">
                      {(() => {
                        const mins = Math.round(parsedRainData.inferred.duration / 60)

                        if (mins < 60) return `${mins} min`

                        const hours = Math.floor(mins / 60)
                        const remaining = mins % 60

                        return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`
                      })()}
                    </span>
                  </div>
                ) : (
                  'Sin registros'
                )
              }
              icon={<CloudRain className="h-6 w-6" />}
              isActive={selectedMetric === 'rain_inferred'}
              isLoading={isInferredRainLoading}
              title="Lluvia Inferida"
              unit="Eventos"
              value={!inferredRainData ? '--' : parsedRainData.inferred.count}
              onClick={() => setSelectedMetric('rain_inferred')}
            />

            <EnvironmentCard
              className="tds-sm:order-6 tds-lg:col-span-2"
              color={climate.color}
              description={climate.description}
              icon={climate.icon}
              isActive={false}
              isLoading={isMqttLoading}
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
              <p className="text-sm font-medium">Seleccione un parámetro</p>
            </div>
          </div>
        ) : chartProps ? (
          <>
            <EnvironmentDataChart
              allowedRanges={
                selectedMetric === 'rain_events' || selectedMetric === 'rain_inferred'
                  ? ['today', 'yesterday', '7d', '30d', 'all']
                  : undefined
              }
              chartType={chartProps.chartType as 'area' | 'bar'}
              color={chartProps.color}
              data={chartProps.customData || normalizedChartData}
              dataKey={chartProps.dataKey}
              icon={chartProps.icon}
              range={currentRange}
              title={chartProps.title}
              unit={chartProps.unit}
              onRangeChange={handleRangeChange}
            />

            {/* Guía Explicativa de Inferencia (Colapsable) */}
            {selectedMetric === 'rain_inferred' && (
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
                              <span className="text-primary font-semibold">Configuración Sensible (Inicio):</span>
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
                        Las reglas que determinan el cierre del evento son las siguientes:
                      </p>

                      <div className="flex flex-col gap-3 mt-1">
                        <div>
                          <span className="text-primary font-bold">Cese por Estancamiento:</span>{' '}
                          <span>
                            Calma atmosférica sostenida (variación de temperatura ≤ 0.4°C y humedad ≤ 1.0% HR durante 10 min). En saturación (100% HR) solo se evalúa la temperatura.
                          </span>
                        </div>

                        <div>
                          <span className="text-primary font-bold">Guardia Térmica Unificada (Lotes Deslizantes):</span>{' '}
                          <span>
                            Bloquea el cierre por estancamiento si se detecta un enfriamiento activo (caída neta &gt; 0.4°C) evaluando los últimos lotes deslizantes de 10 minutos (hasta 30 minutos acumulados, o hasta 50 minutos si el aire está saturado al 100% HR).
                          </span>
                        </div>

                        <div>
                          <span className="text-primary font-bold">Cese por Variación Térmica:</span>{' '}
                          <span>
                            Recuperación térmica de ≥ 0.6°C desde la temperatura mínima registrada durante el evento de lluvia.
                          </span>
                        </div>

                        <div>
                          <span className="text-primary font-bold">Recuperación Adaptativa:</span>{' '}
                          <span>
                            La temperatura recupera al menos el 35% de lo caído y la humedad disminuye un 15% del ascenso de la lluvia.
                          </span>
                        </div>

                        <div>
                          <span className="text-primary font-bold">Recuperación Solar:</span>{' '}
                          <span>
                            La iluminancia rebota por el umbral elástico calculado a partir del oscurecimiento de la tormenta (sólo diurno).
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
