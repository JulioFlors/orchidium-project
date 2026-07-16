'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { FertigationModal, ControlGrid } from './components'

import { ZoneType } from '@/config/mappings'
import {
  createManualTask,
  cancelManualTask,
  getWaitingAgrochemicalTasks,
  confirmWaitingTasks,
} from '@/actions/operations/control-actions'
import { useMqttStore } from '@/store'
import { IrrigationCommand } from '@/interfaces'
import { useDeviceHeartbeat, useToast } from '@/hooks'
import { Heading, DeviceStatus } from '@/components'

// Definición de Tópicos
const TOPIC_PREFIX = 'PristinoPlant/Actuator_Controller'
const TOPIC_COMMAND = `${TOPIC_PREFIX}/irrigation/cmd`
const TOPIC_STATUS = `${TOPIC_PREFIX}/status`

// Tópico Unificado de Estado (Feedback)
const TOPIC_STATE_ALL = `${TOPIC_PREFIX}/irrigation/state`

// Mapa de Circuitos de Riego → Nombres del firmware
const CIRCUIT_MAP: Record<string, string | string[]> = {
  irrigation: 'IRRIGATION',
  humidification: 'HUMIDIFICATION',
  soilWet: 'SOIL_WETTING',
  fertigation: ['FERTIGATION', 'FUMIGATION'],
}

// Duración por defecto para activación manual (5 minutos)
const DEFAULT_DURATION_SEC = 300

interface WaitingTask {
  id: string
  purpose: string
  scheduledAt: Date | string
  schedule?: { name: string } | null
}

export function ControlView() {
  const { connect, status, publish, subscribe, messages } = useMqttStore()
  const { error: notifyError } = useToast()

  // --- Estados Visuales ---
  const [loadingCircuits, setLoadingCircuits] = useState<Record<string, boolean>>({})

  // Estados para Modal de Agroquímicos
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [waitingTasks, setWaitingTasks] = useState<WaitingTask[]>([])
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)

  // Flag de "Listo" (Sincronizado con MQTT)
  const [isReady, setIsReady] = useState(false)

  // Referencias para Timeouts de Comandos (120s)
  // Usamos ref para no provocar re-renders y poder limpiarlos imperativamente
  const commandTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // Ref para comandos pendientes que deben reintentarse al reconectar
  // Estructura: { [circuit]: payload MQTT a reenviar }
  const pendingRetry = useRef<Record<string, IrrigationCommand>>({})

  // Referencias para Estados Objetivo (Target States)
  const targetStates = useRef<Record<string, boolean>>({})

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
      subscribe(TOPIC_STATE_ALL)
      setTimeout(() => setIsReady(true), 0)
    }
  }, [status, subscribe])

  // --- 2. Helper de Estado de Actuador (Parseo de Snapshot Único) ---
  const getActuatorPayload = (actuatorKey: string) => {
    if (!isReady) return { state: 'OFF', taskId: null }

    const unifiedSnapshot = messages[TOPIC_STATE_ALL]?.payload

    if (unifiedSnapshot && typeof unifiedSnapshot === 'object') {
      const data = (unifiedSnapshot as Record<string, { state: string; task_id?: string }>)[
        actuatorKey
      ]

      if (data) {
        return { state: String(data.state || 'OFF'), taskId: data.task_id || null }
      }
    }

    return { state: 'OFF', taskId: null }
  }

  const isActuatorActive = (actuatorKey: string) => getActuatorPayload(actuatorKey).state === 'ON'

  // Helper para recuperar el UUID de la tarea amarrada al circuito activo
  const getCircuitActiveTaskId = (circuit: keyof typeof activeCircuits): string | null => {
    switch (circuit) {
      case 'irrigation':
        return getActuatorPayload('sprinkler').taskId
      case 'humidification':
        return getActuatorPayload('fogger').taskId
      case 'soilWet':
        return getActuatorPayload('soil_wet').taskId
      case 'fertigation':
        return getActuatorPayload('fertigation').taskId
      default:
        return null
    }
  }

  // Mapeo Directo (Sin timers locales, solo verdad del firmware)
  // Estado Estricto: Solo activo si TODOS los componentes están ON
  const isMainWaterOn = isActuatorActive('main_water')
  const isAgroOn = isActuatorActive('agrochemical')

  // Estado "Activo": Válvula de Línea + Válvula Fuente (Ignoramos Bomba por el delay)
  // Esto da feedback inmediato al usuario mientras la bomba arranca en background (10s después)
  const activeCircuits = {
    irrigation: isActuatorActive('sprinkler') && isMainWaterOn,
    humidification: isActuatorActive('fogger') && isMainWaterOn,
    soilWet: isActuatorActive('soil_wet') && isMainWaterOn,
    fertigation: isActuatorActive('fertigation') && isAgroOn, // Aquí Ferti + Agro (No Main)
  }

  // --- 3. Handlers Estables (useCallback) — deben declararse antes de los useEffects que los usan ---

  // Timeout Handler (Fallo): libera el loading de un circuito cuando no hay confirmación
  const handleCommandTimeout = useCallback((circuit: string) => {
    if (commandTimeouts.current[circuit]) {
      clearTimeout(commandTimeouts.current[circuit])
      delete commandTimeouts.current[circuit]
    }
    delete targetStates.current[circuit]
    setLoadingCircuits((prev) => {
      const next = { ...prev }

      delete next[circuit]

      return next
    })
  }, []) // commandTimeouts es ref (estable), setLoadingCircuits es estable

  // stopLoading: limpia el timeout y el estado loading de un circuito
  const stopLoading = useCallback((circuit: string) => {
    if (commandTimeouts.current[circuit]) {
      clearTimeout(commandTimeouts.current[circuit])
      delete commandTimeouts.current[circuit]
    }
    delete targetStates.current[circuit]
    setTimeout(() => {
      setLoadingCircuits((prev) => {
        const next = { ...prev }

        delete next[circuit]

        return next
      })
    }, 0)
  }, []) // Empty deps is fine as ref and setState are stable

  // --- 4. Monitoreo de Resiliencia (Limpieza de Timeouts) ---

  // A) Si el dispositivo se desconecta → guardar comandos pendientes para reintento
  useEffect(() => {
    if (!isDeviceOnline) {
      // Limpiar timers de seguridad (el reintento se gestionará al reconectar)
      Object.keys(commandTimeouts.current).forEach((key) => {
        clearTimeout(commandTimeouts.current[key])
        delete commandTimeouts.current[key]
      })
      // NO limpiamos loadingCircuits: la card permanece en estado pending
      // hasta que el nodo confirme o el usuario la cancele manualmente
    }
  }, [isDeviceOnline])

  // B) Al reconectar → reenviar todos los comandos que quedaron pendientes
  useEffect(() => {
    if (!isDeviceOnline) return

    const retries = pendingRetry.current
    const circuits = Object.keys(retries)

    if (circuits.length === 0) return

    circuits.forEach((circuit) => {
      const payload = retries[circuit]

      publish(TOPIC_COMMAND, payload)

      // Reiniciar timeout de seguridad (120s) tras el reenvío
      commandTimeouts.current[circuit] = setTimeout(() => {
        handleCommandTimeout(circuit)
      }, 120000)
    })

    pendingRetry.current = {}
  }, [isDeviceOnline, publish, handleCommandTimeout])

  // Stable stopLoading function — ahora definido arriba

  // C) Si el estado cambia a lo esperado → ÉXITO (Limpiar Timeout + pending retry)
  // Al recibir confirmación del nodo, eliminamos el comando del registro de reintento
  useEffect(() => {
    const isTargetStateReached = activeCircuits.irrigation === targetStates.current['irrigation']

    if (
      isTargetStateReached &&
      (commandTimeouts.current['irrigation'] || loadingCircuits['irrigation'])
    ) {
      delete pendingRetry.current['irrigation']
      setTimeout(() => stopLoading('irrigation'), 0)
    }
  }, [activeCircuits.irrigation, stopLoading, loadingCircuits])

  useEffect(() => {
    const isTargetStateReached =
      activeCircuits.humidification === targetStates.current['humidification']

    if (
      isTargetStateReached &&
      (commandTimeouts.current['humidification'] || loadingCircuits['humidification'])
    ) {
      delete pendingRetry.current['humidification']
      setTimeout(() => stopLoading('humidification'), 0)
    }
  }, [activeCircuits.humidification, stopLoading, loadingCircuits])

  useEffect(() => {
    const isTargetStateReached = activeCircuits.soilWet === targetStates.current['soilWet']

    if (
      isTargetStateReached &&
      (commandTimeouts.current['soilWet'] || loadingCircuits['soilWet'])
    ) {
      delete pendingRetry.current['soilWet']
      setTimeout(() => stopLoading('soilWet'), 0)
    }
  }, [activeCircuits.soilWet, stopLoading, loadingCircuits])

  useEffect(() => {
    const isTargetStateReached = activeCircuits.fertigation === targetStates.current['fertigation']

    if (
      isTargetStateReached &&
      (commandTimeouts.current['fertigation'] || loadingCircuits['fertigation'])
    ) {
      delete pendingRetry.current['fertigation']
      setTimeout(() => stopLoading('fertigation'), 0)
    }
  }, [activeCircuits.fertigation, stopLoading, loadingCircuits])

  // --- 5. Timeout Handler (Fallo) — ya definido arriba como useCallback ---

  // Mutua Exclusión: el sistema está ocupado si algún circuito está activo
  // o si algún circuito está en proceso de carga (pending)
  const isSystemBusy =
    Object.values(activeCircuits).some(Boolean) || Object.values(loadingCircuits).some(Boolean)

  // Action Handler — Envía un solo JSON con circuit al ESP32
  const toggleCircuit = async (circuit: keyof typeof activeCircuits) => {
    if (!isDeviceOnline) return

    const isTurningOn = !activeCircuits[circuit]

    if (isTurningOn && isSystemBusy) return

    // Si trata de encender agroquímicos, abrimos modal y pausamos el flujo directo.
    if (isTurningOn && circuit === 'fertigation') {
      try {
        setLoadingCircuits((prev) => ({ ...prev, [circuit]: true }))
        const res = await getWaitingAgrochemicalTasks()

        if (res.success && res.data) {
          setWaitingTasks(res.data)
        }
        setIsModalOpen(true)
        setLoadingCircuits((prev) => {
          const next = { ...prev }

          delete next[circuit]

          return next
        })
      } catch {
        notifyError('Error al obtener tareas en espera')
        setLoadingCircuits((prev) => {
          const next = { ...prev }

          delete next[circuit]

          return next
        })
      }

      return
    }

    await executeCircuitCommand(circuit, isTurningOn)
  }

  const executeCircuitCommand = async (
    circuit: keyof typeof activeCircuits,
    isTurningOn: boolean,
  ) => {
    // Registrar el estado objetivo para la sincronización del loader
    targetStates.current[circuit] = isTurningOn

    // 1. Set Loading
    setLoadingCircuits((prev) => ({ ...prev, [circuit]: true }))

    // 2. Start Safety Timeout (120s)
    if (commandTimeouts.current[circuit]) clearTimeout(commandTimeouts.current[circuit])

    commandTimeouts.current[circuit] = setTimeout(() => {
      handleCommandTimeout(circuit)
    }, 120000)

    // 3. Crear tarea oficial en Backend y obtener UUID si estamos encendiendo manualmente
    const mapped = CIRCUIT_MAP[circuit]
    const circuitName = Array.isArray(mapped) ? mapped[0] : mapped
    const state = isTurningOn ? 'ON' : 'OFF'

    let taskId = ''

    if (isTurningOn) {
      try {
        const dbRes = await createManualTask(circuitName, Math.floor(DEFAULT_DURATION_SEC / 60), [
          ZoneType.ZONA_A,
        ])

        if (dbRes.success && dbRes.taskId) {
          taskId = dbRes.taskId
        } else {
          // En caso de error (e.g. colisión predictible detectada por CollisionGuard)
          handleCommandTimeout(circuit) // Restaura UI (quita loader)
          notifyError(dbRes.error || 'Error desconocido al iniciar tarea manual.')

          return // Interrumpe y no envía el mensaje MQTT
        }
      } catch {
        handleCommandTimeout(circuit)
        notifyError('Error de comunicación con el servidor.')

        return
      }
    } else {
      // Apagado Manual Transaccional
      const activeTaskId = getCircuitActiveTaskId(circuit)

      if (activeTaskId) {
        // Cancelamos formalmente delegando la lógica de la nota a la Server Action
        await cancelManualTask(activeTaskId)
        taskId = activeTaskId // Retornamos el mismo ID al ESP32 para su limpieza local
      }
    }

    const payload: IrrigationCommand = {
      circuit: circuitName,
      state,
      ...(isTurningOn && { duration: DEFAULT_DURATION_SEC }),
      ...(taskId && { task_id: taskId }),
    }

    // Guardar payload para reintento en caso de desconexión
    pendingRetry.current[circuit] = payload

    publish(TOPIC_COMMAND, payload)
  }

  // --- Manejadores del Modal de Fertirriego ---
  const handleConfirmManualFertigation = async () => {
    setIsSubmittingModal(true)
    await executeCircuitCommand('fertigation', true)
    setIsSubmittingModal(false)
    setIsModalOpen(false)
  }

  const handleConfirmReleaseTasks = async (taskIds: string[]) => {
    setIsSubmittingModal(true)
    const res = await confirmWaitingTasks(taskIds)

    if (res.success) {
      // Tareas liberadas exitosamente
    }
    setIsSubmittingModal(false)
    setIsModalOpen(false)
  }

  // Estado Visual — isOffline es verdadero en cualquier estado que no sea 'online'
  // Cubre: 'offline', 'zombie', 'sleep', 'unknown' y cualquier estado futuro
  const isConnecting = !isReady
  const isOffline = connectionState !== 'online'

  return (
    <div className="flex flex-col gap-6">
      <Heading
        action={
          <DeviceStatus
            connectionState={connectionState}
            isLoadingStatus={isConnecting}
            selectedZone={ZoneType.ZONA_A}
            zoneMapping={{ [ZoneType.ZONA_A]: 'Controlador' }}
            zones={[ZoneType.ZONA_A]}
          />
        }
        description={
          <p className="text-secondary text-sm leading-relaxed">
            Acciona manualmente los circuitos de riego por{' '}
            <span className="text-black-and-white shrink-0 rounded bg-zinc-200/50 px-1.5 py-0.5 text-[13px] font-bold tracking-widest dark:bg-zinc-800/80">
              5 minutos
            </span>
          </p>
        }
        title="Centro de Control"
      />

      {/* Grid de Control */}
      <ControlGrid
        activeCircuits={activeCircuits}
        isConnecting={isConnecting}
        isOffline={isOffline}
        isSystemBusy={isSystemBusy}
        loadingCircuits={loadingCircuits}
        onToggle={toggleCircuit}
      />

      <FertigationModal
        isOpen={isModalOpen}
        isSubmitting={isSubmittingModal}
        waitingTasks={waitingTasks}
        onClose={() => setIsModalOpen(false)}
        onConfirmManual={handleConfirmManualFertigation}
        onConfirmRelease={handleConfirmReleaseTasks}
      />
    </div>
  )
}
