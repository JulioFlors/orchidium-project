'use client'

import { IoFlaskOutline, IoWaterOutline, IoInformationCircleOutline } from 'react-icons/io5'
import { MdDewPoint } from 'react-icons/md'
import { PiSprayBottle } from 'react-icons/pi'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ActuatorCard } from './ActuatorCard'

import { useMqttStore } from '@/store'
import { IrrigationCommand } from '@/interfaces'
import { useDeviceHeartbeat } from '@/hooks'
import { SmartDeviceHeader } from '@/components/dashboard/SmartDeviceHeader'

// Definición de Tópicos
const TOPIC_PREFIX = 'PristinoPlant/Actuator_Controller'
const TOPIC_COMMAND = `${TOPIC_PREFIX}/irrigation/cmd`
const TOPIC_STATUS = `${TOPIC_PREFIX}/status`

// Tópicos de Estado (Feedback)
// Escuchamos todo lo que venga de irrigation/state (pump, valves, etc)
const TOPIC_STATE_WILDCARD = `${TOPIC_PREFIX}/irrigation/state/#`
// Tópicos específicos para mapeo
const TOPIC_STATE_SPRINKLER = `${TOPIC_PREFIX}/irrigation/state/valve/sprinkler`
const TOPIC_STATE_FOGGER = `${TOPIC_PREFIX}/irrigation/state/valve/fogger`
const TOPIC_STATE_SOIL_WET = `${TOPIC_PREFIX}/irrigation/state/valve/soil_wet`
const TOPIC_STATE_FERTIGATION = `${TOPIC_PREFIX}/irrigation/state/valve/fertigation`
// Tópicos de Actuadores Comunes

const TOPIC_STATE_MAIN_WATER = `${TOPIC_PREFIX}/irrigation/state/valve/main_water`
const TOPIC_STATE_AGROCHEMICAL = `${TOPIC_PREFIX}/irrigation/state/valve/agrochemical`

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

  // Nivel de Notificación removido, render estático  // Flag de "Listo" (Sincronizado con MQTT)
  const [isReady, setIsReady] = useState(false)

  // Referencias para Timeouts de Comandos (120s)
  // Usamos ref para no provocar re-renders y poder limpiarlos imperativamente
  const commandTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // --- 1. Conexión & Suscripción ---
  useEffect(() => {
    connect()
  }, [connect])

  // --- Heartbeat ---
  const { connectionState } = useDeviceHeartbeat()
  // "Online" ahora significa Online REAL (no zombie)
  const isDeviceOnline = connectionState === 'online'

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
    const valveState = String(messages[valveTopic]?.payload || 'OFF').replace(/['"]+/g, '')

    return valveState === 'ON'
  }

  // Mapeo Directo (Sin timers locales, solo verdad del firmware)
  // [MODIFICACIÓN] Estado Estricto: Solo activo si TODOS los componentes están ON
  const isMainWaterOn = isZoneActive(TOPIC_STATE_MAIN_WATER)
  const isAgroOn = isZoneActive(TOPIC_STATE_AGROCHEMICAL)

  // [MODIFICACIÓN] Estado "Activo": Válvula de Zona + Válvula Principal (Ignoramos Bomba por el delay)
  // Esto da feedback inmediato al usuario mientras la bomba arranca en background (10s después)
  const activeZones = {
    irrigation: isZoneActive(TOPIC_STATE_SPRINKLER) && isMainWaterOn,
    humidification: isZoneActive(TOPIC_STATE_FOGGER) && isMainWaterOn,
    soilWet: isZoneActive(TOPIC_STATE_SOIL_WET) && isMainWaterOn,
    fertigation: isZoneActive(TOPIC_STATE_FERTIGATION) && isAgroOn, // Aquí Ferti + Agro (No Main)
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
    }
  }, [isDeviceOnline, isReady])

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

    // 3. Start Safety Timeout (120s)
    // Limpiar previo si existiera
    if (commandTimeouts.current[zone]) clearTimeout(commandTimeouts.current[zone])

    commandTimeouts.current[zone] = setTimeout(() => {
      handleCommandTimeout(zone)
    }, 120000) // 120 seconds

    // 4. Send Command
    const DURATION_SEC = 600
    const PUMP_DELAY = 10
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
  const isConnecting = !isReady || connectionState === 'unknown'
  const isOffline = connectionState === 'offline'

  return (
    <div className="space-y-6">
      <SmartDeviceHeader
        connectionState={connectionState}
        deviceDescription="Control directo sobre los actuadores del orquideario. Utilice estas herramientas para mantenimiento, pruebas o correcciones puntuales del microclima."
        deviceName="Control de Actuadores"
        gridClassName="grid-cols-1 gap-4 tds-sm:grid-cols-2 tds-lg:grid-cols-4"
        isLoadingStatus={isConnecting}
        selectedZone="ZONA_A"
        titleClassName="col-span-1 tds-sm:col-span-2 tds-lg:col-span-3"
        zoneMapping={{ ZONA_A: 'Controlador' }}
        zones={['ZONA_A']}
      />

      {/* Grid de Control */}
      <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-4 grid grid-cols-1 gap-4">
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

        {/* Nota Estática de Seguridad (Spotlight & Gradient Border styling) */}
        <div className="tds-sm:col-span-2 group relative col-span-1 overflow-hidden rounded-md p-px shadow-sm transition-all duration-300 hover:shadow-md">
          {/* Border Gradient Line (Actúa como borde luminoso diagonal en la esquina superior derecha) */}
          <div className="via-action/5 to-action/50 pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent" />

          {/* Background Card Color (Tapa el centro para dejar solo el borde de 1px) */}
          <div className="bg-surface relative flex h-full w-full flex-col gap-2 rounded-md p-3">
            {/* Inner Soft Glow (Spotlight efecto de expansión de luz en esquina) */}
            <div className="bg-action/10 group-hover:bg-action/20 pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl transition-all duration-500 group-hover:blur-3xl" />

            {/* Header: Title and Icon */}
            <div className="relative z-10 flex items-center justify-start">
              <h3 className="text-primary mr-2 text-sm font-semibold tracking-wide">Nota</h3>

              <div className="bg-action/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <IoInformationCircleOutline className="text-action text-lg" />
              </div>
            </div>

            {/* Body */}
            <p className="text-secondary relative z-10 text-sm leading-relaxed">
              El sistema se desactivará automáticamente tras{' '}
              <strong className="text-primary font-semibold">10 minutos</strong> por seguridad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
