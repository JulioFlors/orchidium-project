import { useEffect, useState } from 'react'

import { useMqttStore } from '@/store/mqtt/mqtt.store'

type DeviceConnectionState = 'online' | 'offline' | 'zombie' | 'unknown'

const ZOMBIE_THRESHOLD_MS = 70000 // (30s x 2 latidos) + 10s de gracia
const OFFLINE_THRESHOLD_MS = 100000 // (30s x 3 latidos) + 10s de gracia

export const useDeviceHeartbeat = (topic: string = 'PristinoPlant/Actuator_Controller/status') => {
  const { subscribe, unsubscribe, messages } = useMqttStore()

  // Estado para forzar re-render periódicamente (cada 5s)
  // Inicializamos en 0 para evitar Hydration Mismatch y errores de pureza
  const [now, setNow] = useState<number>(0)

  // 1. Suscripción
  useEffect(() => {
    subscribe(topic)

    return () => {
      // unsubscribe(topic) // Opcional
    }
  }, [subscribe, unsubscribe, topic])

  useEffect(() => {
    // Sincronizar inmediatamente al montar (Async para evitar warning)
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
    lastHeartbeat !== null && rawStatus === 'online' && now - lastHeartbeat > ZOMBIE_THRESHOLD_MS

  const isDead =
    lastHeartbeat !== null && rawStatus === 'online' && now - lastHeartbeat > OFFLINE_THRESHOLD_MS

  // 4. Calcular Estado Final
  // Si no hay mensaje retenido o es explícitamente offline, el dispositivo se marca offline (a menos que aún no se sepa el estado)
  let connectionState: DeviceConnectionState = 'offline'

  if (rawStatus === 'unknown') {
    connectionState = 'unknown' // Mantenemos unknown para la UI (Muestra Skeleton/Conectando)
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
