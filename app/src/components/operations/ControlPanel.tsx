'use client'

import clsx from 'clsx'
import { IoFlaskOutline, IoWarning, IoWaterOutline } from 'react-icons/io5'
import { MdDewPoint } from 'react-icons/md'
import { PiSprayBottle } from 'react-icons/pi'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { ActuatorCard } from './ActuatorCard'

import { useMqttStore } from '@/store'
import { IrrigationCommand } from '@/interfaces'

// Definición de Tópicos
const TOPIC_PREFIX = 'PristinoPlant/Actuator_Controller'
const TOPIC_COMMAND = `${TOPIC_PREFIX}/irrigation/cmd`
const TOPIC_STATUS = `${TOPIC_PREFIX}/status`

// Tópicos de Estado (Feedback)
const TOPIC_STATE_WILDCARD = `${TOPIC_PREFIX}/irrigation/state/valve/#`
// Tópicos específicos para mapeo
const TOPIC_STATE_SPRINKLER = `${TOPIC_PREFIX}/irrigation/state/valve/sprinkler`
const TOPIC_STATE_FOGGER = `${TOPIC_PREFIX}/irrigation/state/valve/fogger`
const TOPIC_STATE_SOIL_WET = `${TOPIC_PREFIX}/irrigation/state/valve/soil_wet`
const TOPIC_STATE_FERTIGATION = `${TOPIC_PREFIX}/irrigation/state/valve/fertigation`

// IDs de Hardware (Sincronizados con firmware/relay_modules/main.py)
const HARDWARE = {
  PUMP: 'pump',
  VALVES: {
    MAIN_SOURCE: 'main_water',
    AGROCHEMICAL: 'agrochemical',
    FOGGERS: 'fogger',
    FERTIGATION: 'fertigation',
    SPRINKLERS: 'sprinkler',
    SOIL_WET: 'soil_wet',
  },
}

export function ControlPanel() {
  const { connect, status, publish, subscribe, messages } = useMqttStore()

  // --- Estados Visuales ---
  const [loadingZones, setLoadingZones] = useState<Record<string, boolean>>({})

  // Nivel de Notificación (Info vs Error)
  const [notification, setNotification] = useState<{ type: 'info' | 'error'; message: ReactNode }>({
    type: 'info',
    message: (
      <>
        El sistema se desactivará automáticamente tras <strong>10 minutos</strong> por seguridad.
        Puede detener la acción manualmente en cualquier momento.
      </>
    ),
  })

  // Flag de "Listo" (Sincronizado con MQTT)
  const [isReady, setIsReady] = useState(false)

  // Referencias para Timeouts de Comandos (120s)
  // Usamos ref para no provocar re-renders y poder limpiarlos imperativamente
  const commandTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // --- 1. Conexión & Suscripción ---
  useEffect(() => {
    connect()
  }, [connect])

  const deviceStatus = String(messages[TOPIC_STATUS] || 'unknown').replace(/['"]+/g, '')
  const isDeviceOnline = deviceStatus === 'online'

  useEffect(() => {
    if (status === 'connected') {
      subscribe(TOPIC_STATUS)
      subscribe(TOPIC_STATE_WILDCARD)
      setTimeout(() => setIsReady(true), 0)
    }
  }, [status, subscribe])

  // --- 2. Helper de Estado Activo ---
  const isZoneActive = (valveTopic: string) => {
    if (!isReady) return false
    const valveState = String(messages[valveTopic] || 'OFF').replace(/['"]+/g, '')

    return valveState === 'ON'
  }

  // Mapeo Directo (Sin timers locales, solo verdad del firmware)
  const activeZones = {
    irrigation: isZoneActive(TOPIC_STATE_SPRINKLER),
    humidification: isZoneActive(TOPIC_STATE_FOGGER),
    soilWet: isZoneActive(TOPIC_STATE_SOIL_WET),
    fertigation: isZoneActive(TOPIC_STATE_FERTIGATION),
  }

  // --- 3. Monitoreo de Resiliencia (Limpieza de Timeouts) ---

  // A) Si el dispositivo se desconecta -> Limpieza TOTAL
  useEffect(() => {
    if (!isDeviceOnline) {
      // Limpiar todos los timers pendientes
      Object.keys(commandTimeouts.current).forEach((key) => {
        clearTimeout(commandTimeouts.current[key])
        delete commandTimeouts.current[key]
      })

      // Desbloquear UI inmediatamente (Async para evitar linter warning)
      setTimeout(() => setLoadingZones({}), 0)

      // Mostrar Error si estábamos "Listos" y se cayó
      if (isReady) {
        setTimeout(() => {
          setNotification({
            type: 'error',
            message: 'Conexión perdida con el Módulo de Relés. Esperando reconexión...',
          })
        }, 0)
      }
    } else {
      // Al volver, restaurar mensaje default si no hay error pendiente
      if (notification.type === 'error') {
        setTimeout(() => {
          setNotification({
            type: 'info',
            message: (
              <>
                El sistema se desactivará automáticamente tras <strong>10 minutos</strong> por
                seguridad. Puede detener la acción manualmente en cualquier momento.
              </>
            ),
          })
        }, 0)
      }
    }
  }, [isDeviceOnline, isReady, notification.type])

  // Stable stopLoading function
  const stopLoading = useCallback((zone: string) => {
    if (commandTimeouts.current[zone]) {
      clearTimeout(commandTimeouts.current[zone])
      delete commandTimeouts.current[zone]
    }
    // Async update
    setTimeout(() => {
      setLoadingZones((prev) => {
        const next = { ...prev }

        delete next[zone]

        return next
      })
    }, 0)
  }, []) // Empty deps is fine as ref and setState are stable

  // B) Si el estado cambia a lo esperado -> ÉXITO (Limpiar Timeout)
  // Usamos useEffect para analizar cambios. Si activeZones cambia,
  // verificamos si estábamos esperando esa zona (timeout activo).
  useEffect(() => {
    if (commandTimeouts.current['irrigation']) {
      setTimeout(() => stopLoading('irrigation'), 0)
    }
  }, [activeZones.irrigation, stopLoading])

  useEffect(() => {
    if (commandTimeouts.current['humidification']) {
      setTimeout(() => stopLoading('humidification'), 0)
    }
  }, [activeZones.humidification, stopLoading])

  useEffect(() => {
    if (commandTimeouts.current['soilWet']) {
      setTimeout(() => stopLoading('soilWet'), 0)
    }
  }, [activeZones.soilWet, stopLoading])

  useEffect(() => {
    if (commandTimeouts.current['fertigation']) {
      setTimeout(() => stopLoading('fertigation'), 0)
    }
  }, [activeZones.fertigation, stopLoading])

  // --- 4. Timeout Handler (Fallo) ---
  const handleCommandTimeout = (zone: string) => {
    // 1. Limpiar ref por si acaso
    if (commandTimeouts.current[zone]) {
      delete commandTimeouts.current[zone]
    }

    // 2. Quitar loading (Desbloquear UI)
    setLoadingZones((prev) => {
      const next = { ...prev }

      delete next[zone]

      return next
    })

    // 3. Mostrar Error Rojo
    setNotification({
      type: 'error',
      message: 'No se pudo establecer conexión con el ESP32 Relay Modules (Timeout 120s).',
    })
  }

  // Mutua Exclusión (Si hay loading o offline)
  // Pero permitimos 'resetear' si hay error? No, el timeout ya resetea.
  const isSystemBusy =
    Object.values(activeZones).some(Boolean) || Object.keys(loadingZones).length > 0

  // Helper MQTT
  const sendActuatorCommand = (id: string, state: 'ON' | 'OFF', duration = 0, delay = 0) => {
    const payload: IrrigationCommand = { actuator: id, state }

    if (state === 'ON') {
      if (duration > 0) payload.duration = duration
      if (delay > 0) payload.start_delay = delay
    }
    publish(TOPIC_COMMAND, payload)
  }

  // Action Handler
  const toggleZone = (zone: keyof typeof activeZones) => {
    if (!isDeviceOnline) return

    const isTurningOn = !activeZones[zone]

    if (isTurningOn && isSystemBusy) return

    // 1. Set Loading
    setLoadingZones((prev) => ({ ...prev, [zone]: true }))

    // 2. Reset Notification to Info (Optimistic)
    setNotification({
      type: 'info',
      message: (
        <>
          El sistema se desactivará automáticamente tras <strong>10 minutos</strong> por seguridad.
          Puede detener la acción manualmente en cualquier momento.
        </>
      ),
    })

    // 3. Start Safety Timeout (120s)
    // Limpiar previo si existiera
    if (commandTimeouts.current[zone]) clearTimeout(commandTimeouts.current[zone])

    commandTimeouts.current[zone] = setTimeout(() => {
      handleCommandTimeout(zone)
    }, 120000) // 120 seconds

    // 4. Send Command
    const DURATION_SEC = 600
    const PUMP_DELAY = 30
    const VALVE_DURATION = DURATION_SEC + PUMP_DELAY
    const state = isTurningOn ? 'ON' : 'OFF'

    // Definimos hardware targets según zona
    if (zone === 'irrigation') {
      sendActuatorCommand(HARDWARE.VALVES.MAIN_SOURCE, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(HARDWARE.VALVES.SPRINKLERS, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(
        HARDWARE.PUMP,
        state,
        isTurningOn ? DURATION_SEC : 0,
        isTurningOn ? PUMP_DELAY : 0,
      )
    } else if (zone === 'humidification') {
      sendActuatorCommand(HARDWARE.VALVES.MAIN_SOURCE, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(HARDWARE.VALVES.FOGGERS, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(
        HARDWARE.PUMP,
        state,
        isTurningOn ? DURATION_SEC : 0,
        isTurningOn ? PUMP_DELAY : 0,
      )
    } else if (zone === 'soilWet') {
      sendActuatorCommand(HARDWARE.VALVES.MAIN_SOURCE, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(HARDWARE.VALVES.SOIL_WET, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(
        HARDWARE.PUMP,
        state,
        isTurningOn ? DURATION_SEC : 0,
        isTurningOn ? PUMP_DELAY : 0,
      )
    } else if (zone === 'fertigation') {
      sendActuatorCommand(HARDWARE.VALVES.AGROCHEMICAL, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(HARDWARE.VALVES.FERTIGATION, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(
        HARDWARE.PUMP,
        state,
        isTurningOn ? DURATION_SEC : 0,
        isTurningOn ? PUMP_DELAY : 0,
      )
    }
  }

  // Estado Visual
  const isConnecting = !isReady || deviceStatus === 'unknown'
  const isOffline = deviceStatus === 'offline'

  const statusLabel = isConnecting
    ? 'Conectando'
    : isOffline
      ? 'Controlador Offline'
      : 'Controlador Activo'

  // Clase Dinámica Notificación
  const notificationClass = clsx(
    'flex items-start gap-2 rounded-lg border p-4 text-sm transition-all duration-300',
    notification.type === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
      : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500',
  )

  return (
    <div className="space-y-6">
      {/* Barra de Estado del Dispositivo (Heartbeat) - Premium Design */}
      <div
        className={clsx(
          'relative flex items-center justify-between overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-500',
          'backdrop-blur-md', // Glass effect
          isConnecting
            ? 'border-zinc-200 bg-zinc-100/80 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400'
            : isOffline
              ? 'border-red-200 bg-red-50/90 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'
              : 'border-emerald-200 bg-emerald-50/90 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400',
        )}
      >
        {/* Background Gradient Glow */}
        <div
          className={clsx(
            'absolute inset-0 opacity-10 blur-3xl transition-colors duration-500',
            isConnecting ? 'bg-zinc-400' : isOffline ? 'bg-red-500' : 'bg-emerald-500',
          )}
        />

        <div className="relative flex items-center gap-4">
          {/* Status Indicator Ring */}
          <div className="relative flex h-4 w-4 items-center justify-center">
            <span
              className={clsx(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                isConnecting ? 'bg-zinc-400' : isOffline ? 'bg-red-400' : 'bg-emerald-400',
              )}
            />
            <span
              className={clsx(
                'relative inline-flex h-3 w-3 rounded-full',
                isConnecting ? 'bg-zinc-500' : isOffline ? 'bg-red-500' : 'bg-emerald-500',
              )}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight uppercase">{statusLabel}</span>
            <span className="text-[10px] font-medium tracking-widest uppercase opacity-70">
              {isOffline ? 'Verifique conexión WiFi/MQTT' : 'Sistema Operativo'}
            </span>
          </div>
        </div>

        <div className="relative flex flex-col items-end text-right">
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">
            Dispositivo
          </span>
          <span className="font-mono text-xs font-medium">ESP32 Relay Module</span>
        </div>
      </div>

      {/* Grid de Control */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActuatorCard
          color="blue"
          icon={<IoWaterOutline />}
          isActive={activeZones.irrigation}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeZones.irrigation)}
          isLoading={loadingZones['irrigation']}
          title="Regar"
          onToggle={() => toggleZone('irrigation')}
        />

        <ActuatorCard
          color="purple"
          icon={<PiSprayBottle />}
          isActive={activeZones.humidification}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeZones.humidification)}
          isLoading={loadingZones['humidification']}
          title="Nebulizar"
          onToggle={() => toggleZone('humidification')}
        />

        <ActuatorCard
          color="cyan"
          icon={<MdDewPoint />}
          isActive={activeZones.soilWet}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeZones.soilWet)}
          isLoading={loadingZones['soilWet']}
          title="Humedecer Suelo"
          onToggle={() => toggleZone('soilWet')}
        />

        <ActuatorCard
          color="amber"
          icon={<IoFlaskOutline />}
          isActive={activeZones.fertigation}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeZones.fertigation)}
          isLoading={loadingZones['fertigation']}
          title="Fertirriego"
          onToggle={() => toggleZone('fertigation')}
        />
      </div>

      {/* Notificación Dinámica */}
      <div className={notificationClass}>
        {notification.type === 'error' ? (
          <IoWarning className="shrink-0 text-xl text-red-500" />
        ) : (
          <IoWarning className="shrink-0 text-xl text-yellow-500" />
        )}
        <p>{notification.message}</p>
      </div>
    </div>
  )
}
