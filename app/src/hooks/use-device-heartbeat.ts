import { useEffect, useState } from 'react'

import { useMqttStore } from '@/store/mqtt/mqtt.store'

export type DeviceConnectionState = 'online' | 'offline' | 'zombie' | 'unknown'

const ZOMBIE_THRESHOLD_MS = 70000 // (30s x 2 latidos) + 10s de gracia
const OFFLINE_THRESHOLD_MS = 100000 // (30s x 3 latidos) + 10s de gracia
const INITIAL_SEARCH_THRESHOLD_MS = 30000 // Tiempo máximo para esperar el primer latido antes de marcar offline

export const useDeviceHeartbeat = (topic: string = 'PristinoPlant/Actuator_Controller/status') => {
  const { subscribe, messages, subscriptionTimestamps } = useMqttStore()

  // Estado para forzar re-render periódicamente (cada 5s)
  // Inicializamos en 0 para evitar Hydration Mismatch y errores de pureza
  const [now, setNow] = useState<number>(0)

  // Track de cuándo se inició la escucha de este tópico (Estado estable y global)
  const startedAt = subscriptionTimestamps[topic] || 0

  // 1. Suscripción
  useEffect(() => {
    subscribe(topic)
  }, [subscribe, topic])

  useEffect(() => {
    // Sincronizar inmediatamente al montar (Async para evitar warning de fase de render)
    const timerId = setTimeout(() => setNow(Date.now()), 0)

    const intervalId = setInterval(() => {
      setNow(Date.now())
    }, 5000)

    return () => {
      clearTimeout(timerId)
      clearInterval(intervalId)
    }
  }, [])

  // 3. Derivar estado del Store + Tiempo
  const statusData = messages[topic] as
    | { payload: unknown; receivedAt: number; isRetained: boolean }
    | undefined

  const lastHeartbeat = statusData?.receivedAt || null
  const rawStatus = String(statusData?.payload || 'unknown').trim()
  const isRetained = statusData?.isRetained || false

  // Lógica de Estado Efectivo:
  // Si el mensaje es 'online' pero es retenido (viejo), lo ignoramos para el cálculo de latidos frescos.
  // Pero si el mensaje es 'offline', confiamos en él inmediatamente (LWT).
  const effectiveStatus = isRetained && rawStatus === 'online' ? 'unknown' : rawStatus

  // Cálculo de Zombie y Dead en tiempo de render (Reactivo puro)
  // Nota: Solo calculamos esto si el estado efectivo es 'online' (es decir, recibimos uno fresco)
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
    // Si no sabemos nada (unknown), permitimos un tiempo de búsqueda inicial (30s)
    if (now > 0 && startedAt > 0) {
      const searchDuration = now - startedAt

      if (searchDuration > OFFLINE_THRESHOLD_MS) {
        connectionState = 'offline'
      } else if (searchDuration > INITIAL_SEARCH_THRESHOLD_MS) {
        connectionState = 'zombie'
      } else {
        connectionState = 'unknown'
      }
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
