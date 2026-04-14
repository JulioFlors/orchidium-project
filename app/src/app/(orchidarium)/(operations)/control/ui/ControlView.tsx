'use client'

import { IoFlaskOutline, IoWaterOutline, IoInformationCircleOutline } from 'react-icons/io5'
import { MdDewPoint } from 'react-icons/md'
import { PiSprayBottle } from 'react-icons/pi'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ActuatorCard, FertigationModal } from './components'

import {
  createManualTask,
  cancelManualTask,
  getWaitingAgrochemicalTasks,
  confirmWaitingTasks,
} from '@/actions/operations/control-actions'
import { useMqttStore } from '@/store'
import { IrrigationCommand } from '@/interfaces'
import { useDeviceHeartbeat, useToast } from '@/hooks'
import { DeviceViewHeader } from '@/components'

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
      setTimeout(() => {
        setLoadingCircuits({})
        // No notificamos error aquí porque el desconectado ya se maneja visualmente
      }, 0)
    }
  }, [isDeviceOnline, isReady])

  // Stable stopLoading function
  const stopLoading = useCallback((circuit: string) => {
    if (commandTimeouts.current[circuit]) {
      clearTimeout(commandTimeouts.current[circuit])
      delete commandTimeouts.current[circuit]
    }
    // Async update
    setTimeout(() => {
      setLoadingCircuits((prev) => {
        const next = { ...prev }

        delete next[circuit]

        return next
      })
    }, 0)
  }, []) // Empty deps is fine as ref and setState are stable

  // B) Si el estado cambia a lo esperado -> ÉXITO (Limpiar Timeout)
  // Usamos useEffect para analizar cambios. Si activeCircuits cambia,
  // verificamos si estábamos esperando ese circuito (timeout activo).
  useEffect(() => {
    if (commandTimeouts.current['irrigation']) {
      setTimeout(() => stopLoading('irrigation'), 0)
    }
  }, [activeCircuits.irrigation, stopLoading])

  useEffect(() => {
    if (commandTimeouts.current['humidification']) {
      setTimeout(() => stopLoading('humidification'), 0)
    }
  }, [activeCircuits.humidification, stopLoading])

  useEffect(() => {
    if (commandTimeouts.current['soilWet']) {
      setTimeout(() => stopLoading('soilWet'), 0)
    }
  }, [activeCircuits.soilWet, stopLoading])

  useEffect(() => {
    if (commandTimeouts.current['fertigation']) {
      setTimeout(() => stopLoading('fertigation'), 0)
    }
  }, [activeCircuits.fertigation, stopLoading])

  // --- 4. Timeout Handler (Fallo) ---
  const handleCommandTimeout = (circuit: string) => {
    // 1. Limpiar ref por si acaso
    if (commandTimeouts.current[circuit]) {
      delete commandTimeouts.current[circuit]
    }

    // 2. Quitar loading (Desbloquear UI)
    setLoadingCircuits((prev) => {
      const next = { ...prev }

      delete next[circuit]

      return next
    })
  }

  // Mutua Exclusión (Si hay loading o offline)
  const isSystemBusy =
    Object.values(activeCircuits).some(Boolean) || Object.keys(loadingCircuits).length > 0

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
        const dbRes = await createManualTask(circuitName, Math.floor(DEFAULT_DURATION_SEC / 60))

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

  // Estado Visual
  const isConnecting = !isReady || connectionState === 'unknown'
  const isOffline = connectionState === 'offline'

  return (
    <div className="space-y-6">
      <DeviceViewHeader
        connectionState={connectionState}
        deviceDescription="Control directo sobre los actuadores del orquideario. Utilice estas herramientas para mantenimiento, pruebas o correcciones puntuales del microclima."
        deviceName="Centro de Control"
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
          isActive={activeCircuits.irrigation}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeCircuits.irrigation)}
          isLoading={loadingCircuits['irrigation']}
          title="Riego por Aspersión"
          onToggle={() => toggleCircuit('irrigation')}
        />

        <ActuatorCard
          color="purple"
          icon={<PiSprayBottle />}
          isActive={activeCircuits.humidification}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeCircuits.humidification)}
          isLoading={loadingCircuits['humidification']}
          title="Nebulización"
          onToggle={() => toggleCircuit('humidification')}
        />

        <ActuatorCard
          color="cyan"
          icon={<MdDewPoint />}
          isActive={activeCircuits.soilWet}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeCircuits.soilWet)}
          isLoading={loadingCircuits['soilWet']}
          title="Humectación del Suelo"
          onToggle={() => toggleCircuit('soilWet')}
        />

        <ActuatorCard
          color="amber"
          icon={<IoFlaskOutline />}
          isActive={activeCircuits.fertigation}
          isDeviceOnline={isDeviceOnline}
          isDisabled={isConnecting || isOffline || (isSystemBusy && !activeCircuits.fertigation)}
          isLoading={loadingCircuits['fertigation']}
          title="Fertirriego"
          onToggle={() => toggleCircuit('fertigation')}
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
              <strong className="text-primary font-semibold">5 minutos</strong> por seguridad.
            </p>
          </div>
        </div>
      </div>

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
