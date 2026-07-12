import { useEffect, useState } from 'react'
import useSWR from 'swr'

import { useMqttStore } from '@/store/mqtt/mqtt.store'

export type DeviceConnectionState = 'online' | 'offline' | 'zombie' | 'unknown' | 'sleep'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const useDeviceHeartbeat = (
  topic: string = 'PristinoPlant/Actuator_Controller/status',
  initialHeartbeat: number | null = null,
  initialStatus: string = 'unknown',
) => {
  const { subscribe, messages, subscriptionTimestamps } = useMqttStore()

  const [now, setNow] = useState<number>(0)

  const startedAt = subscriptionTimestamps[topic] || 0

  // 1. Suscripción a MQTT
  useEffect(() => {
    subscribe(topic)
  }, [subscribe, topic])

  useEffect(() => {
    const timerId = setTimeout(() => setNow(Date.now()), 0)
    const intervalId = setInterval(() => setNow(Date.now()), 5000)

    return () => {
      clearTimeout(timerId)
      clearInterval(intervalId)
    }
  }, [])

  // Determinar el ID del dispositivo en la base de datos
  const isEmaTopic = topic.includes('Weather_Station')
  const deviceName = isEmaTopic
    ? topic.includes('ZONA_A')
      ? 'Weather_Station_ZONA_A'
      : 'Weather_Station_EXTERIOR'
    : 'Actuator_Controller'

  // Consultar el estado en Postgres mediante API usando SWR
  const { data: dbData, isLoading: dbLoading } = useSWR<{ timestamp: number; status: string } | null>(
    `/api/environment/device-status?device=${deviceName}`,
    fetcher,
    {
      refreshInterval: 30000,
      fallbackData: initialHeartbeat && initialStatus !== 'unknown'
        ? { timestamp: initialHeartbeat, status: initialStatus }
        : undefined,
    }
  )

  const statusData = messages[topic] as
    | { payload: unknown; receivedAt: number; isRetained: boolean }
    | undefined

  const isRetained = statusData?.isRetained ?? false

  // El latido efectivo proviene del mensaje MQTT en vivo si existe y no es retenido.
  // Si no hay mensaje en vivo o es retenido, usamos los datos de Postgres (dbData).
  const currentHeartbeat =
    statusData && !isRetained
      ? statusData.receivedAt
      : (dbData?.timestamp || null)

  const rawStatus =
    statusData && !isRetained
      ? String(statusData.payload).trim()
      : (dbData?.status || 'unknown')

  const zombieThreshold = isEmaTopic ? 62 * 60 * 1000 : 75000 // 62 min para EMA, 75s para Actuador
  const offlineThreshold = isEmaTopic ? 65 * 60 * 1000 : 145000 // 65 min para EMA, 145s para Actuador
  const initialSearchThreshold = 30000

  const lastKnownHeartbeat = currentHeartbeat
  const lastHeartbeat = lastKnownHeartbeat

  let connectionState: DeviceConnectionState = 'unknown'

  // Si está cargando y no tenemos datos (SSR o caché), mostramos 'unknown' (Conectando)
  if (dbLoading && !dbData) {
    connectionState = 'unknown'
  } else if (lastKnownHeartbeat !== null && now > 0) {
    const elapsed = now - lastKnownHeartbeat

    if (elapsed > offlineThreshold) {
      connectionState = 'offline'
    } else if (elapsed > zombieThreshold) {
      connectionState = 'zombie'
    } else {
      // Normalizar los posibles payloads de desconexión y vida a un estado unificado
      const normalizedStatus =
        rawStatus === 'lwt_disconnect' || rawStatus === 'offline'
          ? 'offline'
          : ['online', 'ping', 'reboot'].includes(rawStatus)
            ? 'online'
            : rawStatus
      connectionState = normalizedStatus as DeviceConnectionState
    }
  } else {
    // Si no tenemos ningún latido conocido en absoluto (ej. inicio de suscripción y BD vacía)
    if (now > 0 && startedAt > 0) {
      const searchDuration = now - startedAt

      if (searchDuration > offlineThreshold) connectionState = 'offline'
      else if (searchDuration > initialSearchThreshold) connectionState = 'zombie'
      else connectionState = 'unknown'
    } else {
      connectionState = 'unknown'
    }
  }

  return {
    connectionState,
    lastHeartbeat,
  }
}
