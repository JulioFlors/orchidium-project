import { useEffect, useState } from 'react'

import { useMqttStore } from '@/store/mqtt/mqtt.store'

export type DeviceConnectionState = 'online' | 'offline' | 'zombie' | 'unknown'

const ZOMBIE_THRESHOLD_MS = 70000 // (30s x 2 latidos) + 10s de gracia
const OFFLINE_THRESHOLD_MS = 100000 // (30s x 3 latidos) + 10s de gracia
const INITIAL_SEARCH_THRESHOLD_MS = 30000 // Tiempo máximo para esperar el primer latido antes de marcar offline

export const useDeviceHeartbeat = (topic: string = 'PristinoPlant/Actuator_Controller/status') => {
  const { subscribe, messages } = useMqttStore()

  // Estado para forzar re-render periódicamente (cada 5s)
  // Inicializamos en 0 para evitar Hydration Mismatch y errores de pureza
  const [now, setNow] = useState<number>(0)

  // Track de cuándo se inició la escucha de este tópico (Estado estable para el render)
  const [startedAt, setStartedAt] = useState<number>(0)

  // 1. Suscripción y Reset de Timer de Búsqueda
  useEffect(() => {
    subscribe(topic)

    // Desacoplamos el setState del efecto síncrono inicial
    // para evitar el error de "cascading renders". Al usar un microtask,
    // permitimos que React complete el render primario antes de registrar el tiempo de inicio.
    Promise.resolve().then(() => setStartedAt(Date.now()))
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
  const statusData = messages[topic] as { payload: unknown; receivedAt: number } | undefined

  const lastHeartbeat = statusData?.receivedAt || null
  const rawStatus = String(statusData?.payload || 'unknown').trim()

  // Cálculo de Zombie y Dead en tiempo de render (Reactivo puro)
  const isZombie =
    lastHeartbeat !== null &&
    rawStatus === 'online' &&
    now > 0 &&
    now - lastHeartbeat > ZOMBIE_THRESHOLD_MS

  const isDead =
    lastHeartbeat !== null &&
    rawStatus === 'online' &&
    now > 0 &&
    now - lastHeartbeat > OFFLINE_THRESHOLD_MS

  // 4. Calcular Estado Final
  // Si no hay mensaje retenido o es explícitamente offline, el dispositivo se marca offline (a menos que aún no se sepa el estado)
  let connectionState: DeviceConnectionState = 'offline'

  if (rawStatus === 'unknown') {
    // Si no sabemos nada (unknown), permitimos un tiempo de búsqueda inicial (30s)
    // Solo realizamos este cálculo si 'now' y 'startedAt' ya se han sincronizado
    if (now > 0 && startedAt > 0) {
      const searchDuration = now - startedAt

      if (searchDuration > INITIAL_SEARCH_THRESHOLD_MS) {
        connectionState = 'offline'
      } else {
        connectionState = 'unknown'
      }
    } else {
      connectionState = 'unknown'
    }
  } else if (rawStatus === 'online') {
    if (isDead) connectionState = 'offline'
    else if (isZombie) connectionState = 'zombie'
    else connectionState = 'online'
  }

  return {
    connectionState,
    lastHeartbeat,
  }
}
