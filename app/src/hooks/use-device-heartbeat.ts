import { useEffect, useState } from 'react'

import { useMqttStore } from '@/store/mqtt/mqtt.store'

export type DeviceConnectionState = 'online' | 'offline' | 'zombie' | 'unknown' | 'sleep'

export const useDeviceHeartbeat = (
  topic: string = 'PristinoPlant/Actuator_Controller/status',
  initialHeartbeat: number | null = null,
  initialStatus: string = 'unknown',
) => {
  const { subscribe, messages, subscriptionTimestamps } = useMqttStore()

  const [now, setNow] = useState<number>(0)

  const startedAt = subscriptionTimestamps[topic] || 0

  // 1. Suscripción
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

  const statusData = messages[topic] as
    | { payload: unknown; receivedAt: number; isRetained: boolean }
    | undefined

  const isRetained = statusData?.isRetained ?? false
  const currentHeartbeat =
    statusData && !isRetained
      ? statusData.receivedAt
      : (initialHeartbeat || null)

  const rawStatus = statusData ? String(statusData.payload).trim() : initialStatus.trim()

  const isEmaTopic = topic.includes('Weather_Station')
  const zombieThreshold = isEmaTopic ? 62 * 60 * 1000 : 75000 // 62 min para EMA, 75s para Actuador
  const offlineThreshold = isEmaTopic ? 65 * 60 * 1000 : 145000 // 65 min para EMA, 145s para Actuador
  const initialSearchThreshold = 30000

  // Normalizar los posibles payloads de desconexión y vida a un estado unificado
  const normalizedStatus =
    rawStatus === 'lwt_disconnect' || rawStatus === 'offline'
      ? 'offline'
      : ['online', 'ping', 'reboot'].includes(rawStatus)
        ? 'online'
        : rawStatus

  const lastKnownHeartbeat = currentHeartbeat
  const lastHeartbeat = lastKnownHeartbeat

  let connectionState: DeviceConnectionState = 'offline'

  if (lastKnownHeartbeat !== null && now > 0) {
    const elapsed = now - lastKnownHeartbeat

    if (elapsed > offlineThreshold) {
      connectionState = 'offline'
    } else if (elapsed > zombieThreshold) {
      connectionState = 'zombie'
    } else {
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
