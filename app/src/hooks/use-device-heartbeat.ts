import { useEffect, useState } from 'react'

import { useMqttStore } from '@/store/mqtt/mqtt.store'

export type DeviceConnectionState = 'online' | 'offline' | 'zombie' | 'unknown'

const ZOMBIE_THRESHOLD_MS = 70000 // (30s x 2 latidos) + 10s de gracia
const OFFLINE_THRESHOLD_MS = 100000 // (30s x 3 latidos) + 10s de gracia
const INITIAL_SEARCH_THRESHOLD_MS = 30000 // Tiempo máximo para esperar el primer latido antes de marcar offline

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

  // Normalizar los posibles payloads de desconexión a un estado unificado
  // 'lwt_disconnect' = broker detectó fallo de red (LWT automático)
  // 'offline'        = firmware publicó antes de desconectarse limpiamente
  // Ambos son semánticamente equivalentes para el frontend
  const normalizedStatus =
    rawStatus === 'lwt_disconnect' || rawStatus === 'offline' ? 'offline' : rawStatus

  // Lógica de Estado Efectivo:
  // Si el mensaje es 'online' (o viene del servidor), verificamos su frescura
  const lastKnownHeartbeat = currentHeartbeat
  const isCacheFresh =
    lastKnownHeartbeat && now > 0 ? now - lastKnownHeartbeat < OFFLINE_THRESHOLD_MS : true

  const effectiveStatus =
    normalizedStatus === 'online' && !isCacheFresh ? 'unknown' : normalizedStatus

  // Cálculo de Zombie y Dead
  const lastHeartbeat = lastKnownHeartbeat
  const isZombie =
    lastHeartbeat !== null &&
    effectiveStatus === 'online' &&
    now > 0 &&
    now - lastHeartbeat > ZOMBIE_THRESHOLD_MS

  const isDead =
    lastHeartbeat !== null &&
    effectiveStatus === 'online' &&
    now > 0 &&
    now - lastHeartbeat > OFFLINE_THRESHOLD_MS

  // 4. Calcular Estado Final
  let connectionState: DeviceConnectionState = 'offline'

  if (effectiveStatus === 'unknown') {
    if (now > 0 && startedAt > 0) {
      const searchDuration = now - startedAt

      if (searchDuration > OFFLINE_THRESHOLD_MS) connectionState = 'offline'
      else if (searchDuration > INITIAL_SEARCH_THRESHOLD_MS) connectionState = 'zombie'
      else connectionState = 'unknown'
    } else {
      connectionState = 'unknown'
    }
  } else if (effectiveStatus === 'online') {
    if (isDead) connectionState = 'offline'
    else if (isZombie) connectionState = 'zombie'
    else connectionState = 'online'
  }

  return {
    connectionState,
    lastHeartbeat,
  }
}
