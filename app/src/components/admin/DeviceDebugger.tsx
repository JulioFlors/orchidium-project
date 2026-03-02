'use client'

import { useEffect, useState, useRef } from 'react'
import {
  IoBugOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoPowerOutline,
  IoChevronDownOutline,
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'

import { useMqttStore } from '@/store/mqtt/mqtt.store'

// Animación copiada de SearchBox
const motionProps = {
  initial: { opacity: 0, scale: 0.8, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15, ease: 'easeInOut' } },
} as const

interface DeviceConfig {
  name: string
  baseTopic: string
  hasMaskNvs?: boolean // Si es true, oculta el botón de Dump NVS
}

const DEVICES: DeviceConfig[] = [
  {
    name: 'ESP32 Relay Module',
    baseTopic: 'PristinoPlant/Actuator_Controller',
  },
  {
    name: 'ESP32 Sensors',
    baseTopic: 'PristinoPlant/Environmental_Monitoring/Zona_A',
    hasMaskNvs: true,
  },
  {
    name: 'Service: Ingestion (Cloud)',
    baseTopic: 'PristinoPlant/Services/Ingest-CLOUD',
    hasMaskNvs: true,
  },
  {
    name: 'Service: Scheduler (Cloud)',
    baseTopic: 'PristinoPlant/Services/Scheduler-CLOUD',
    hasMaskNvs: true,
  },
]

const ZOMBIE_THRESHOLD_MS = 60000 // 60s

export function DeviceDebugger() {
  const { subscribe, unsubscribe, publish, messages } = useMqttStore()

  // Estado local
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(DEVICES[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [lastRequested, setLastRequested] = useState<number | null>(null)

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Derivamos los tópicos del Base seleccionado
  const cmdTopic = `${selectedDevice.baseTopic}/cmd`
  const debugTopic = `${selectedDevice.baseTopic}/debug/nvs`
  const statusTopic = `${selectedDevice.baseTopic}/status`

  // 1. Suscripción Dinámica al cambiar de dispositivo
  useEffect(() => {
    // Suscribirse a Debug y Status del dispositivo seleccionado
    subscribe(debugTopic)
    subscribe(statusTopic)

    return () => {
      // Opcional: Desuscribirse al cambiar
    }
  }, [subscribe, unsubscribe, debugTopic, statusTopic])

  // 2. Comandos
  const handleRequestNvs = () => {
    publish(cmdTopic, 'get_nvs')
    setLastRequested(Date.now())
  }

  const handleReset = () => {
    if (confirm(`¿Estás SEGURO de reiniciar ${selectedDevice.name} remotamente?`)) {
      publish(cmdTopic, 'reset')
    }
  }

  // 3. Obtener datos del store
  const debugData = messages[debugTopic]
  const nvsContent = debugData?.payload
  const receivedAt = debugData?.receivedAt

  // 4. Lógica de Estado (Heartbeat) local
  const statusData = messages[statusTopic] as { payload: unknown; receivedAt: number } | undefined
  const lastHeartbeat = statusData?.receivedAt || null
  const rawStatus = String(statusData?.payload || 'unknown').trim()

  const [now, setNow] = useState(0)

  useEffect(() => {
    // Sincronizar al montar (usamos timeout para evitar error de linter sobre set state sincrono)
    const timeout = setTimeout(() => setNow(Date.now()), 0)
    const interval = setInterval(() => setNow(Date.now()), 5000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  const isZombie =
    lastHeartbeat !== null &&
    rawStatus === 'online' &&
    now > 0 &&
    now - lastHeartbeat > ZOMBIE_THRESHOLD_MS

  let connectionState = 'unknown'

  if (rawStatus === 'offline') connectionState = 'offline'
  else if (rawStatus === 'online') connectionState = isZombie ? 'zombie' : 'online'

  // Colores de estado (Sólo texto/borde, el icono es SVG)
  const statusColors = {
    // Green
    online: 'text-green-600 dark:text-green-400',
    // Red
    offline: 'text-red-600 dark:text-red-400',
    // Yellow
    zombie: 'text-yellow-600 dark:text-yellow-400',
    // Gray
    unknown: 'text-zinc-400',
  }

  const currentColorClass = statusColors[connectionState as keyof typeof statusColors]

  return (
    <div className="space-y-6">
      {/* Selector de Dispositivo (Estilo SearchBox results con Motion) */}
      <div className="bg-canvas border-input-outline flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm md:flex-row">
        <div ref={dropdownRef} className="relative z-20 w-full md:max-w-md">
          {/* Trigger del Dropdown */}
          <button
            className="flex w-full items-center justify-between rounded-lg bg-zinc-100 p-3 text-left text-sm text-zinc-800 transition-all hover:bg-zinc-200 focus:outline-none dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="font-medium">{selectedDevice.name}</span>
            <IoChevronDownOutline
              className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Lista Animada */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                className="border-input-outline bg-canvas text-black-and-white absolute top-12 left-0 w-full overflow-hidden rounded-lg border py-1 shadow-lg"
                {...motionProps}
              >
                {DEVICES.map((device) => (
                  <button
                    key={device.name}
                    className={clsx(
                      'w-full px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      device.name === selectedDevice.name &&
                        'bg-primary/5 text-primary font-medium',
                    )}
                    type="button"
                    onClick={() => {
                      setSelectedDevice(device)
                      setIsDropdownOpen(false)
                    }}
                  >
                    {device.name}
                    <span className="text-secondary mt-0.5 block truncate font-mono text-xs opacity-60">
                      {device.baseTopic}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Estado de Conectividad (Pulse Icon) */}
        <div className={`flex items-center gap-2 font-medium capitalize ${currentColorClass}`}>
          {/* Pulse Circle CSS puro */}
          <span className="relative flex h-3 w-3">
            {connectionState === 'online' && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
            )}
            <span className="relative inline-flex h-3 w-3 rounded-full bg-current" />
          </span>
          <span>{connectionState}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <IoBugOutline size={24} />
          <h2 className="text-xl font-bold">Herramientas</h2>
        </div>

        <div className="flex gap-2">
          {/* Hard Reset: Estilo Revertido a btn-danger */}
          <button
            className="btn-danger flex items-center gap-2"
            title="Envía comando 'reset' al tópico /cmd"
            type="button"
            onClick={handleReset}
          >
            <IoPowerOutline size={20} />
            Hard Reset
          </button>

          {!selectedDevice.hasMaskNvs && (
            <button
              className="btn-primary flex items-center gap-2"
              type="button"
              onClick={handleRequestNvs}
            >
              <IoRefreshOutline size={20} />
              Solicitar Dump NVS
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Panel de Control */}
        <div className="bg-canvas border-input-outline rounded-xl border p-6 shadow-sm">
          <h3 className="text-primary mb-4 font-semibold">Detalles de Depuración</h3>
          <div className="space-y-4 text-sm">
            <div className="border-input-outline flex justify-between border-b pb-2">
              <span className="text-secondary">Última Solicitud:</span>
              <span className="font-mono">
                {lastRequested ? new Date(lastRequested).toLocaleTimeString() : '-'}
              </span>
            </div>
            {!selectedDevice.hasMaskNvs && (
              <div className="border-input-outline flex justify-between border-b pb-2">
                <span className="text-secondary">Última Respuesta NVS:</span>
                <span className="font-mono">
                  {receivedAt ? new Date(receivedAt).toLocaleTimeString() : '-'}
                </span>
              </div>
            )}
            <div className="border-input-outline flex justify-between border-b pb-2">
              <span className="text-secondary">Último Heartbeat:</span>
              <span className="font-mono">
                {lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Panel de Visualización JSON */}
        {!selectedDevice.hasMaskNvs && (
          <div className="bg-canvas border-input-outline flex h-[500px] flex-col overflow-hidden rounded-xl border p-0 shadow-sm">
            <div className="border-input-outline flex items-center justify-between border-b bg-zinc-100 px-4 py-2 dark:bg-zinc-800">
              <span className="text-secondary font-mono text-xs tracking-wider uppercase">
                recovery.json
              </span>
              {!!nvsContent && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <IoDownloadOutline /> Recibido
                </span>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-xs text-zinc-300">
              {nvsContent ? (
                <pre>{JSON.stringify(nvsContent, null, 2)}</pre>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-zinc-600">
                  <IoBugOutline className="mb-2 opacity-20" size={48} />
                  <p>Sin datos recibidos.</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Asegúrate de que el dispositivo esté Online.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
