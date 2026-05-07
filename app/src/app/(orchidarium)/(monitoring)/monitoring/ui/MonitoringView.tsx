'use client'

import { useEffect, useState, useMemo } from 'react'
import { CloudRain, Droplets, Thermometer, Sun, Cloud, Moon } from 'lucide-react'
import { FaChartLine } from 'react-icons/fa6'
import useSWR from 'swr'

import { EnvironmentCard, EnvironmentDataChart } from './components'

import { ZoneType, ZoneMetrics, MetricLabels, MetricUnits, ZoneTypeLabels } from '@/config/mappings'
import { Heading, DeviceStatus } from '@/components'
import { useDeviceHeartbeat, useToast } from '@/hooks'
import { useMqttStore } from '@/store/mqtt/mqtt.store'
import { formatTime12h, formatDateLong } from '@/utils/timeFormat'

type MetricType =
  | 'temperature'
  | 'humidity'
  | 'illuminance'
  | 'rain_intensity'
  | 'rain_events'
  | 'dli'
  | 'vpd_avg'
  | 'dif'
  | 'high_humidity_hours'

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

interface RainData {
  totalDurationSeconds: number
  averageIntensity: number
  eventCount: number
  events?: { time: string; duration: number; intensity: number }[]
}

interface SensorDataResponse {
  data: SensorData[]
  liveKPIs: {
    dli: number | null
    vpdAvg: number | null
    dif: number | null
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
        initial[z][m] = '12h'
      })
      // Agregar métricas especiales que no están en ZoneMetrics pero se muestran en la UI
      if (z === ZoneType.EXTERIOR) {
        initial[z]['rain_events'] = '12h'
      }
    })

    return initial
  })

  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null)
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
    selectedMetric && metricRanges[zone] ? metricRanges[zone][selectedMetric] : '12h'

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

  // 1. Consulta para "Current Status" / Tarjetas (Rango fijo 12h)
  const {
    data: cardStatusResponse,
    error: cardStatusError,
    isLoading: isCardStatusLoading,
  } = useSWR<SensorDataResponse>(`/api/environment/data?range=12h&zone=${zone}`, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  })

  const cardStatusData = useMemo(() => cardStatusResponse?.data || [], [cardStatusResponse])
  const liveKPIs = cardStatusResponse?.liveKPIs || null

  // 2. Consulta para "Chart Data" (Solo se activa si hay una métrica seleccionada)
  const {
    data: chartResponse,
    error: chartError,
    isLoading: isChartLoading,
  } = useSWR<SensorDataResponse | SensorData[]>(
    selectedMetric &&
      !['rain_events', 'dli', 'vpd_avg', 'dif', 'high_humidity_hours'].includes(selectedMetric)
      ? `/api/environment/data?range=${currentRange}&zone=${zone}&metric=${selectedMetric}`
      : selectedMetric && ['dli', 'vpd_avg', 'dif', 'high_humidity_hours'].includes(selectedMetric)
        ? `/api/environment/data?range=${currentRange}&zone=${zone}`
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

  // 3. Consulta para "Rain Events" (Siempre activa en EXTERIOR, usa su propio rango independiente)
  const {
    data: rainData = null,
    error: rainError,
    isLoading: isRainLoading,
  } = useSWR<RainData>(
    zone === ZoneType.EXTERIOR && metricRanges[zone]?.['rain_events']
      ? `/api/environment/rain?range=${metricRanges[zone]['rain_events']}&zone=${zone}`
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

    // Si el dispositivo está offline, no tiene sentido mostrar "Cargando..." infinitamente
    if (connectionState === 'offline') return false

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
    const rainTopic = `PristinoPlant/Weather_Station/${ZoneType.EXTERIOR}/rain/state`
    const msg = mqttMessages[rainTopic]

    if (msg) {
      try {
        const payload =
          typeof msg.payload === 'object' ? msg.payload : JSON.parse(String(msg.payload))

        return payload.state === 'Raining' ? 'Raining' : 'Dry'
      } catch {
        // Fallback al estado de SWR si hay error de parseo
      }
    }

    // Si no hay mensaje MQTT reciente, usar el último estado hidratado desde InfluxDB (SWR)
    return cardStatusResponse?.lastRainState?.state || 'Dry'
  }, [mqttMessages, cardStatusResponse])

  const current = useMemo(() => {
    // Utility to ensure we handle invalid numbers as null for the UI to show '--'
    const sanitize = (val: unknown) => {
      if (val === null || val === undefined || typeof val === 'boolean') return null
      const num = Number(val)

      return isNaN(num) ? null : num
    }

    // Buscamos el último valor no nulo y verificamos que no sea antiguo (> 20 min)
    const getLastValid = (key: string) => {
      const STALE_THRESHOLD = 20 * 60 * 1000 // 20 minutos
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
  }, [cardStatusData, mqttReadings, now])

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

  // Determinar si una métrica tiene datos recientes (menos de 20 min)
  const isMetricFresh = (val: string | number | null) => {
    if (val == null || !current.time) return false

    const sampleTime = new Date(String(current.time)).getTime()

    return now - sampleTime < 20 * 60 * 1000
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) return `${hours}h ${minutes} min`

    return `${minutes} min`
  }

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
          icon: <Droplets className="h-4 w-4" />,
        }
      case 'illuminance':
        return {
          dataKey: 'illuminance',
          color: '#eab308',
          unit: MetricUnits.illuminance,
          title: `${MetricLabels.illuminance} ${ZoneTypeLabels[zone as ZoneType]}`,
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
      case 'dli':
        return {
          dataKey: 'dli',
          color: '#a855f7',
          unit: MetricUnits.dli,
          title: MetricLabels.dli,
          icon: <Sun className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      case 'vpd_avg':
        return {
          dataKey: 'vpd_avg',
          color: '#06b6d4',
          unit: MetricUnits.vpd_avg,
          title: MetricLabels.vpd_avg,
          icon: <Droplets className="h-4 w-4" />,
        }
      case 'dif':
        return {
          dataKey: 'dif',
          color: '#f97316',
          unit: MetricUnits.dif,
          title: MetricLabels.dif,
          icon: <Thermometer className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      case 'high_humidity_hours':
        return {
          dataKey: 'high_humidity_hours',
          color: '#ef4444',
          unit: MetricUnits.high_humidity_hours,
          title: MetricLabels.high_humidity_hours,
          icon: <Moon className="h-4 w-4" />,
          chartType: 'bar' as const,
        }
      default:
        return null
    }
  }

  const chartProps = getChartProps()

  const sysDate = now ? new Date(now) : new Date()
  const sysHour = sysDate.getHours()
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
    // Si tienen mas de 10min se asume que no llego el batch de datos nuevos.
    const isStale = sensorIsActive && minutesSinceLastUpdate > 10

    const luxTrend = calculateTrend('illuminance')

    // ─── PRIORIDAD 1: Verificación de Conexión (Real-time) ──────────────────────────
    if (connectionState === 'offline') {
      return {
        label: 'Desconectado',
        icon: <Cloud className="h-6 w-6 text-slate-500" />,
        color: 'orange' as const,
        description: 'Estación meteorológica fuera de línea',
        status: 'critical' as const,
      }
    }

    // ─── PRIORIDAD 2: Dato viejo (isStale) ──────────────────────────────────────────
    // Si el dato tiene más de 10 min, no es confiable.
    if (isStale) {
      return {
        label: 'Sin Datos',
        icon: <Cloud className="h-6 w-6 text-slate-500" />,
        color: 'orange' as const,
        description: `Sin señal desde las ${formatTime12h(lastUpdateDate)}`,
        status: 'critical' as const,
      }
    }

    // ─── PRIORIDAD 3: Lluvia activa (MQTT State + InfluxDB) ───────────────────
    if (rainState === 'Raining') {
      return {
        label: 'Lloviendo',
        icon: <CloudRain className="h-6 w-6 text-blue-400" />,
        color: 'blue' as const,
        description: rain > 0 ? `Intensidad: ${rain.toFixed(0)}%` : 'Precipitación detectada',
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
              hasData={cardStatusData.length > 0}
              icon={<Thermometer className="h-6 w-6" />}
              isActive={selectedMetric === 'temperature'}
              isLoading={isMqttLoading}
              isOffline={connectionState === 'offline'}
              status="optimal"
              title={MetricLabels.temperature}
              trend={calculateTrend('temperature')}
              unit={MetricUnits.temperature}
              value={current.temperature !== null ? Number(current.temperature).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('temperature')}
            />

            <EnvironmentCard
              color="blue"
              hasData={cardStatusData.length > 0}
              icon={<Droplets className="h-6 w-6" />}
              isActive={selectedMetric === 'humidity'}
              isLoading={isMqttLoading}
              isOffline={connectionState === 'offline'}
              status="optimal"
              title={MetricLabels.humidity}
              trend={calculateTrend('humidity')}
              unit={MetricUnits.humidity}
              value={current.humidity !== null ? Number(current.humidity).toFixed(1) : '--'}
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
              title={`${MetricLabels.illuminance} ${ZoneTypeLabels[zone as ZoneType]}`}
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
              hasData={cardStatusData.length > 0}
              icon={<Thermometer className="h-6 w-6" />}
              isActive={selectedMetric === 'temperature'}
              isLoading={isMqttLoading}
              isOffline={connectionState === 'offline' && !isMetricFresh(current.temperature)}
              status="optimal"
              title={MetricLabels.temperature}
              trend={calculateTrend('temperature')}
              unit={MetricUnits.temperature}
              value={current.temperature !== null ? Number(current.temperature).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('temperature')}
            />

            <EnvironmentCard
              className="tds-sm:order-2 tds-lg:col-span-2"
              color="blue"
              hasData={cardStatusData.length > 0}
              icon={<Droplets className="h-6 w-6" />}
              isActive={selectedMetric === 'humidity'}
              isLoading={isMqttLoading}
              isOffline={connectionState === 'offline' && !isMetricFresh(current.humidity)}
              status="optimal"
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
              hasData={cardStatusData.length > 0}
              icon={<Sun className="h-6 w-6" />}
              isActive={selectedMetric === 'illuminance'}
              isLoading={isMqttLoading}
              isOffline={connectionState === 'offline' && !isMetricFresh(current.illuminance)}
              status="optimal"
              title={`${MetricLabels.illuminance} ${ZoneTypeLabels[zone as ZoneType]}`}
              trend={calculateTrend('illuminance')}
              unit={MetricUnits.illuminance}
              value={current.illuminance !== null ? Number(current.illuminance).toFixed(1) : '--'}
              onClick={() => setSelectedMetric('illuminance')}
            />

            <EnvironmentCard
              className="tds-sm:order-4 tds-lg:col-span-3"
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
              title={MetricLabels.rain_events}
              unit={metricRanges[zone]?.['rain_events'] === '12h' ? '' : 'Eventos'}
              value={
                !rainData
                  ? '--'
                  : metricRanges[zone]?.['rain_events'] === '12h'
                    ? formatDuration(rainData.totalDurationSeconds)
                    : rainData.eventCount
              }
              onClick={() => setSelectedMetric('rain_events')}
            />

            <EnvironmentCard
              hasData
              className="tds-sm:col-span-2 tds-sm:order-5 tds-lg:col-span-3"
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

      <div className="mt-8 flex flex-col gap-6">
        <Heading
          description="Indicadores avanzados de salud y metabolismo vegetal (DLI, VPD, DIF)"
          title="Análisis Botánico"
        />

        <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-4 tds-xl:gap-6 grid grid-cols-1 gap-5">
          <EnvironmentCard
            color="purple"
            description={
              currentRange === '12h' || currentRange === '24h'
                ? liveKPIs?.dli
                  ? 'Acumulado hoy (mol/m²/d)'
                  : 'Calculando luz...'
                : 'Histórico diario (mol/m²/d)'
            }
            hasData={cardStatusData.length > 0 || !!liveKPIs}
            icon={<Sun className="h-6 w-6" />}
            isActive={selectedMetric === 'dli'}
            isLoading={isCardStatusLoading}
            status="optimal"
            title={MetricLabels.dli}
            unit={currentRange === '12h' || currentRange === '24h' ? '⚡ Live' : MetricUnits.dli}
            value={
              currentRange === '12h' || currentRange === '24h'
                ? liveKPIs?.dli?.toFixed(2) || '--'
                : cardStatusData.length > 0 && cardStatusData[cardStatusData.length - 1].dli != null
                  ? Number(cardStatusData[cardStatusData.length - 1].dli).toFixed(2)
                  : '--'
            }
            onClick={() => setSelectedMetric('dli')}
          />

          <EnvironmentCard
            color="cyan"
            description={
              currentRange === '12h' || currentRange === '24h'
                ? liveKPIs?.vpdAvg
                  ? 'Promedio diurno actual'
                  : 'Calculando VPD...'
                : 'Déficit de Presión (kPa)'
            }
            hasData={cardStatusData.length > 0 || !!liveKPIs}
            icon={<Droplets className="h-6 w-6" />}
            isActive={selectedMetric === 'vpd_avg'}
            isLoading={isCardStatusLoading}
            status="optimal"
            title={MetricLabels.vpd_avg}
            unit={
              currentRange === '12h' || currentRange === '24h' ? '⚡ Live' : MetricUnits.vpd_avg
            }
            value={
              currentRange === '12h' || currentRange === '24h'
                ? liveKPIs?.vpdAvg?.toFixed(2) || '--'
                : cardStatusData.length > 0 &&
                    cardStatusData[cardStatusData.length - 1].vpd_avg != null
                  ? Number(cardStatusData[cardStatusData.length - 1].vpd_avg).toFixed(2)
                  : '--'
            }
            onClick={() => setSelectedMetric('vpd_avg')}
          />

          <EnvironmentCard
            color="orange"
            description={
              currentRange === '12h' || currentRange === '24h'
                ? liveKPIs?.dif
                  ? 'Diferencial proyectado'
                  : 'Esperando noche/día'
                : 'Contraste Térmico (°C)'
            }
            hasData={cardStatusData.length > 0 || !!liveKPIs}
            icon={<Thermometer className="h-6 w-6" />}
            isActive={selectedMetric === 'dif'}
            isLoading={isCardStatusLoading}
            status="optimal"
            title={MetricLabels.dif}
            unit={currentRange === '12h' || currentRange === '24h' ? '⚡ Live' : MetricUnits.dif}
            value={
              currentRange === '12h' || currentRange === '24h'
                ? liveKPIs?.dif != null
                  ? `${liveKPIs.dif > 0 ? '+' : ''}${liveKPIs.dif}`
                  : '--'
                : cardStatusData.length > 0 && cardStatusData[cardStatusData.length - 1].dif != null
                  ? `${Number(cardStatusData[cardStatusData.length - 1].dif) > 0 ? '+' : ''}${cardStatusData[cardStatusData.length - 1].dif}`
                  : '--'
            }
            onClick={() => setSelectedMetric('dif')}
          />

          <EnvironmentCard
            color="red"
            description="Horas con Humedad > 85%"
            hasData={cardStatusData.length > 0}
            icon={<Moon className="h-6 w-6" />}
            isActive={selectedMetric === 'high_humidity_hours'}
            isLoading={isCardStatusLoading}
            status="optimal"
            title={MetricLabels.high_humidity_hours}
            unit={MetricUnits.high_humidity_hours}
            value={
              cardStatusData.length > 0 &&
              cardStatusData[cardStatusData.length - 1].high_humidity_hours != null
                ? Number(cardStatusData[cardStatusData.length - 1].high_humidity_hours)
                : '--'
            }
            onClick={() => setSelectedMetric('high_humidity_hours')}
          />
        </div>
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
              <p className="text-sm font-medium">Seleccione una card</p>
            </div>
          </div>
        ) : chartProps ? (
          <EnvironmentDataChart
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
        ) : null}
      </div>
    </div>
  )
}
