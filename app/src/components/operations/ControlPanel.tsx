'use client'

import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { IoFlaskOutline, IoRainyOutline, IoWarningOutline, IoWaterOutline } from 'react-icons/io5'

import { ActuatorCard } from './ActuatorCard'

import { useMqttStore } from '@/store'
import { IrrigationCommand } from '@/interfaces'

// Definición de Tópicos
const TOPIC_PREFIX = 'PristinoPlant/Actuator_Controller'
const TOPIC_COMMAND = `${TOPIC_PREFIX}/irrigation/cmd`
const TOPIC_STATUS = `${TOPIC_PREFIX}/status`

// Tópicos de Estado (Feedback)
const TOPIC_STATE_WILDCARD = `${TOPIC_PREFIX}/irrigation/state/valve/#`
// Tópicos específicos para mapeo (coinciden con lo que llega del wildcard)
const TOPIC_STATE_SPRINKLER = `${TOPIC_PREFIX}/irrigation/state/valve/sprinkler`
const TOPIC_STATE_FOGGER = `${TOPIC_PREFIX}/irrigation/state/valve/fogger`
const TOPIC_STATE_SOIL_WET = `${TOPIC_PREFIX}/irrigation/state/valve/soil_wet`
const TOPIC_STATE_FERTIGATION = `${TOPIC_PREFIX}/irrigation/state/valve/fertigation`

// IDs de Hardware (Sincronizados con Scheduler/Firmware)
const HARDWARE = {
  PUMP: 3,
  VALVES: {
    MAIN_SOURCE: 1,
    AGROCHEMICAL: 2, // Tank Source
    FOGGERS: 4,
    FERTIGATION: 5,
    SPRINKLERS: 6,
    SOIL_WET: 7,
  },
}

export function ControlPanel() {
  const { connect, status, publish, subscribe, messages } = useMqttStore()

  // Estado local para Loading (optimista/transicional)
  const [loadingZones, setLoadingZones] = useState<Record<string, boolean>>({})

  // 1. Suscripción a Tópicos Reales (Wildcard + Status + Pump)
  useEffect(() => {
    connect() // Asegurar conexión
  }, [connect])

  useEffect(() => {
    if (status === 'connected') {
      subscribe(TOPIC_STATUS) // Heartbeat (online/offline)
      subscribe(TOPIC_STATE_WILDCARD) // Feedback Válvulas (Todas)
      // Si la bomba tuviera su propio tópico fuera de valve/#, habría que suscribirlo.
      // Asumiremos por ahora que la bomba reporta su estado. Si no reporta, la UI no se activará.
    }
  }, [status, subscribe])

  // Helper para determinar si una zona está REALMENTE activa (Solo Válvula)
  // [MODIFICADO]: Se eliminó la dependencia de la bomba para evitar que la UI quede en 'pending' durante el delay.
  const isZoneActive = (valveTopic: string) => {
    const valveState = String(messages[valveTopic] || 'OFF').replace(/['"]+/g, '')

    return valveState === 'ON'
  }

  const sprinklerState = isZoneActive(TOPIC_STATE_SPRINKLER)
  const foggerState = isZoneActive(TOPIC_STATE_FOGGER)
  const soilWetState = isZoneActive(TOPIC_STATE_SOIL_WET)
  const fertigationState = isZoneActive(TOPIC_STATE_FERTIGATION)

  const deviceStatus = String(messages[TOPIC_STATUS] || 'unknown').replace(/['"]+/g, '')

  const isDeviceOnline = deviceStatus === 'online'

  // Refrescamos loading: Si el estado real coincide con lo esperado, quitamos loading.
  useEffect(() => {
    // Usamos setTimeout para evitar "setState synchronously in effect"
    // Esto mueve la actualización al siguiente ciclo de eventos, evitando cascadas síncronas.
    const timer = setTimeout(() => {
      setLoadingZones((prev) => {
        if (Object.keys(prev).length === 0) return prev

        const next = { ...prev }
        let hasChanges = false

        // Limpieza genérica si el estado ya cambió
        // (Nota: Esto asume que el cambio de estado en activeZones dispara este effect)
        if (prev.irrigation !== undefined) {
          delete next.irrigation
          hasChanges = true
        }
        if (prev.humidification !== undefined) {
          delete next.humidification
          hasChanges = true
        }
        if (prev.soilWet !== undefined) {
          delete next.soilWet
          hasChanges = true
        }
        if (prev.fertigation !== undefined) {
          delete next.fertigation
          hasChanges = true
        }

        return hasChanges ? next : prev
      })
    }, 0)

    return () => clearTimeout(timer)
  }, [sprinklerState, foggerState, soilWetState, fertigationState])

  // Estado Derivado
  const activeZones = {
    irrigation: sprinklerState,
    humidification: foggerState,
    soilWet: soilWetState,
    fertigation: fertigationState,
  }

  // Mutua Exclusión: Si alguna zona está activa o cargando, el sistema está ocupado.
  const isSystemBusy =
    Object.values(activeZones).some((isActive) => isActive) || Object.keys(loadingZones).length > 0

  // Helper para enviar comando MQTT estandarizado
  const sendActuatorCommand = (id: number, state: 'ON' | 'OFF', duration = 0, delay = 0) => {
    // Construimos payload optimizado
    const payload: IrrigationCommand = {
      actuator: id,
      state,
    }

    if (state === 'ON') {
      if (duration > 0) payload.duration = duration
      if (delay > 0) payload.start_delay = delay
    }

    // TODO: Implementar throttling de 50ms si se permiten pulsaciones muy rápidas
    // (Actualmente la UI deshabilita el boón mientras carga, lo que ya actúa como throttle básico)
    publish(TOPIC_COMMAND, payload)
  }

  // 3. Orquestación con Feedback
  const toggleZone = (zone: keyof typeof activeZones) => {
    if (!isDeviceOnline) return // Offline protection

    const isTurningOn = !activeZones[zone]

    // Mutua Exclusión: No permitir encender si ya hay algo activo (y no somos nosotros apagándonos)
    if (isTurningOn && isSystemBusy) return

    setLoadingZones((prev) => ({ ...prev, [zone]: true }))

    // Duración por defecto: 10 minutos
    const DURATION_SEC = 10 * 60
    // Delay de la bomba: 30 segundos
    const PUMP_DELAY = 30
    // Duración compensada para válvulas (Duración + Delay) para sincronizar apagado
    const VALVE_DURATION = DURATION_SEC + PUMP_DELAY

    if (zone === 'irrigation') {
      const state = isTurningOn ? 'ON' : 'OFF'

      sendActuatorCommand(HARDWARE.VALVES.MAIN_SOURCE, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(HARDWARE.VALVES.SPRINKLERS, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(
        HARDWARE.PUMP,
        state,
        isTurningOn ? DURATION_SEC : 0,
        isTurningOn ? PUMP_DELAY : 0,
      )
    }

    if (zone === 'humidification') {
      const state = isTurningOn ? 'ON' : 'OFF'

      sendActuatorCommand(HARDWARE.VALVES.MAIN_SOURCE, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(HARDWARE.VALVES.FOGGERS, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(
        HARDWARE.PUMP,
        state,
        isTurningOn ? DURATION_SEC : 0,
        isTurningOn ? PUMP_DELAY : 0,
      )
    }

    if (zone === 'soilWet') {
      const state = isTurningOn ? 'ON' : 'OFF'

      sendActuatorCommand(HARDWARE.VALVES.MAIN_SOURCE, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(HARDWARE.VALVES.SOIL_WET, state, isTurningOn ? VALVE_DURATION : 0)
      sendActuatorCommand(
        HARDWARE.PUMP,
        state,
        isTurningOn ? DURATION_SEC : 0,
        isTurningOn ? PUMP_DELAY : 0,
      )
    }

    if (zone === 'fertigation') {
      const state = isTurningOn ? 'ON' : 'OFF'

      // Fertirriego usa AGROCHEMICAL (Tanque) en lugar de MAIN_SOURCE
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

  return (
    <div className="space-y-6">
      {/* Barra de Estado del Dispositivo (Heartbeat) */}
      <div
        className={clsx(
          'flex items-center justify-between rounded-lg border p-4 transition-colors duration-300',
          isDeviceOnline
            ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
            : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'h-3 w-3 rounded-full shadow-sm',
              isDeviceOnline ? 'animate-pulse bg-green-500' : 'bg-red-500',
            )}
          />
          <span className="font-mono text-sm font-semibold tracking-wide uppercase">
            {isDeviceOnline ? 'Controlador Activo' : 'Controlador Offline'}
          </span>
        </div>
        <div className="flex flex-col items-end font-mono text-xs opacity-70">
          <span>ESP32 Relay Module</span>
          <span className="text-[10px]">{TOPIC_STATUS}</span>
        </div>
      </div>

      {/* Grid de Control */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActuatorCard
          color="blue"
          icon={<IoWaterOutline />}
          isActive={activeZones.irrigation}
          isDisabled={isSystemBusy && !activeZones.irrigation}
          isLoading={loadingZones['irrigation']}
          title="Regar"
          onToggle={() => toggleZone('irrigation')}
        />

        <ActuatorCard
          color="purple"
          icon={<IoRainyOutline />}
          isActive={activeZones.humidification}
          isDisabled={isSystemBusy && !activeZones.humidification}
          isLoading={loadingZones['humidification']}
          title="Nebulizar"
          onToggle={() => toggleZone('humidification')}
        />

        <ActuatorCard
          color="cyan"
          icon={<IoWarningOutline />} // TODO: Buscar icono de suelo mojado
          isActive={activeZones.soilWet}
          isDisabled={isSystemBusy && !activeZones.soilWet}
          isLoading={loadingZones['soilWet']}
          title="Humedecer Suelo"
          onToggle={() => toggleZone('soilWet')}
        />

        <ActuatorCard
          color="amber"
          icon={<IoFlaskOutline />}
          isActive={activeZones.fertigation}
          isDisabled={isSystemBusy && !activeZones.fertigation}
          isLoading={loadingZones['fertigation']}
          title="Fertirriego"
          onToggle={() => toggleZone('fertigation')}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-500">
        <IoWarningOutline className="shrink-0 text-xl" />
        <p>
          El sistema se desactivará automáticamente tras <strong>10 minutos</strong> por seguridad.
          Puede detener la acción manualmente en cualquier momento. Nota: El control manual ignora
          sensores de lluvia/viento.
        </p>
      </div>
    </div>
  )
}
