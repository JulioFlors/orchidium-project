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

  const currentHeartbeat = statusData?.receivedAt || initialHeartbeat
  const rawStatus = statusData ? String(statusData.payload).trim() : initialStatus.trim()

  const isEmaTopic = topic.includes('Weather_Station')
  const zombieThreshold = isEmaTopic ? 12 * 60 * 1000 : 75000 // 12 min para EMA, 75s para Actuador
  const offlineThreshold = isEmaTopic ? 15 * 60 * 1000 : 145000 // 15 min para EMA, 145s para Actuador
  const initialSearchThreshold = 30000

  // Normalizar los posibles payloads de desconexión y vida a un estado unificado
  const normalizedStatus =
    rawStatus === 'lwt_disconnect' || rawStatus === 'offline'
      ? 'offline'
      : ['online', 'ping', 'reboot'].includes(rawStatus)
        ? 'online'
        : rawStatus

  // Lógica de Estado Efectivo:
  // Si el mensaje es 'online' o 'sleep', verificamos su frescura
  const lastKnownHeartbeat = currentHeartbeat
  const isCacheFresh =
    lastKnownHeartbeat && now > 0 ? now - lastKnownHeartbeat < offlineThreshold : true

  const effectiveStatus =
    (normalizedStatus === 'online' || normalizedStatus === 'sleep') && !isCacheFresh
      ? 'unknown'
      : normalizedStatus

  // Cálculo de Zombie y Dead
  const lastHeartbeat = lastKnownHeartbeat
  const isZombie =
    lastHeartbeat !== null &&
    (effectiveStatus === 'online' || effectiveStatus === 'sleep') &&
    now > 0 &&
    now - lastHeartbeat > zombieThreshold

  const isDead =
    lastHeartbeat !== null &&
    (effectiveStatus === 'online' || effectiveStatus === 'sleep') &&
    now > 0 &&
    now - lastHeartbeat > offlineThreshold

  // 4. Calcular Estado Final
  let connectionState: DeviceConnectionState = 'offline'

  if (effectiveStatus === 'unknown') {
    if (now > 0 && startedAt > 0) {
      const searchDuration = now - startedAt

      if (searchDuration > offlineThreshold) connectionState = 'offline'
      else if (searchDuration > initialSearchThreshold) connectionState = 'zombie'
      else connectionState = 'unknown'
    } else {
      connectionState = 'unknown'
    }
  } else if (effectiveStatus === 'online') {
    if (isDead) connectionState = 'offline'
    else if (isZombie) connectionState = 'zombie'
    else connectionState = 'online'
  } else if (effectiveStatus === 'sleep') {
    if (isDead) connectionState = 'offline'
    else if (isZombie) connectionState = 'zombie'
    else connectionState = 'sleep'
  }

  return {
    connectionState,
    lastHeartbeat,
  }
}
