'use client'

import type { DeviceLog } from '@package/database'

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
import { getConnectivityLogs } from '@/actions'

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
  isService?: boolean // Si es true, oculta Reset y Logs de Conexión
  heartbeatTimeoutMs?: number // Umbral para estado zombie
}

const DEVICES: DeviceConfig[] = [
  {
    name: 'ESP32 Relay Module',
    baseTopic: 'PristinoPlant/Actuator_Controller',
    heartbeatTimeoutMs: 60000, // 60s
  },
  {
    name: 'ESP32 Sensors',
    baseTopic: 'PristinoPlant/Environmental_Monitoring/Zona_A',
    hasMaskNvs: true,
    heartbeatTimeoutMs: 60000, // 60s
  },
  {
    name: 'Service: Ingest',
    baseTopic: 'PristinoPlant/Services/Ingest',
    hasMaskNvs: true,
    isService: true,
    heartbeatTimeoutMs: 360000, // 6 min (latido cada 5 min)
  },
  {
    name: 'Service: Scheduler',
    baseTopic: 'PristinoPlant/Services/Scheduler',
    hasMaskNvs: true,
    isService: true,
    heartbeatTimeoutMs: 360000, // 6 min (latido cada 5 min)
  },
]

export function DeviceDebugger() {
  // ----- Hooks -----
  const { subscribe, unsubscribe, publish, messages } = useMqttStore()

  // ----- States -----
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(DEVICES[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [lastRequested, setLastRequested] = useState<number | null>(null)
  const [connectivityLogs, setConnectivityLogs] = useState<DeviceLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  // ----- Topicos MQTT -----
  const cmdTopic = `${selectedDevice.baseTopic}/cmd`
  const debugTopic = `${selectedDevice.baseTopic}/debug/nvs`
  const statusTopic = `${selectedDevice.baseTopic}/status`

  // ----------------------------------------
  //  useEffects
  // ----------------------------------------

  // ----- Cierra el dropdown al hacer click fuera -----
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ----- Cargar Historial de Conectividad -----
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoadingLogs(true)
      const res = await getConnectivityLogs(15)

      if (res.ok && res.logs) {
        setConnectivityLogs(res.logs)
      }

      setIsLoadingLogs(false)
    }

    fetchLogs()

    // Opcional: Refrescar cada 30s
    const interval = setInterval(fetchLogs, 30000)

    return () => clearInterval(interval)
  }, [])

  // Suscripción Dinámica al cambiar de dispositivo
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
    now - lastHeartbeat > (selectedDevice.heartbeatTimeoutMs || 60000)

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
            className="text-primary hover:bg-hover-overlay bg-surface flex w-full items-center justify-between rounded-lg p-3 text-left text-sm transition-all focus:outline-none"
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
                      'hover:bg-hover-overlay w-full px-4 py-3 text-left text-sm transition-colors',
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
        <div className="text-secondary flex items-center gap-2">
          <IoBugOutline size={24} />
          <h2 className="text-xl font-bold">Herramientas</h2>
        </div>

        <div className="flex gap-2">
          {/* Hard Reset: Solo para Hardware */}
          {!selectedDevice.isService && (
            <button
              className="btn-danger flex items-center gap-2"
              title="Envía comando 'reset' al tópico /cmd"
              type="button"
              onClick={handleReset}
            >
              <IoPowerOutline size={20} />
              Hard Reset
            </button>
          )}

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
            <div className="border-input-outline bg-surface flex items-center justify-between border-b px-4 py-2">
              <span className="text-secondary font-mono text-xs tracking-wider uppercase">
                recovery.json
              </span>
              {!!nvsContent && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <IoDownloadOutline /> Recibido
                </span>
              )}
            </div>
            <div className="text-secondary flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-xs">
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

      {/* Historial de Conexión (Línea de Tiempo) - Solo para Hardware */}
      {!selectedDevice.isService && (
        <div className="bg-canvas border-input-outline overflow-hidden rounded-xl border shadow-sm">
          <div className="border-input-outline bg-surface flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-primary flex items-center gap-2 font-semibold">
              <IoRefreshOutline className={clsx(isLoadingLogs && 'animate-spin')} />
              Línea de Tiempo de Conexión
            </h3>
            <span className="text-secondary text-xs opacity-60">Últimos 15 eventos</span>
          </div>

          <div className="divide-input-outline divide-y">
            {connectivityLogs.length > 0 ? (
              connectivityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'h-2.5 w-2.5 rounded-full',
                        log.status === 'ONLINE'
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                          : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
                      )}
                    />
                    <div>
                      <span className="text-primary font-medium">Actuator {log.status}</span>
                      <p className="text-secondary text-xs opacity-70">{log.notes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-primary block font-mono text-xs">
                      {new Intl.DateTimeFormat('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(new Date(log.timestamp))}
                    </span>
                    <span className="text-secondary block font-mono text-[10px] uppercase opacity-60">
                      {new Intl.DateTimeFormat('es-VE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      }).format(new Date(log.timestamp))}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-secondary py-12 text-center text-sm">
                No hay eventos de conectividad registrados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
