'use client'

import type { DeviceLog } from '@package/database'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IoPulseOutline, IoCloseOutline, IoReloadOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { ToolboxGrid, AuditConsoleCard, HeartbeatCard } from './DiagnosticPanel'

import { getConnectivityLogs } from '@/actions'
import { Card, Heading, DeviceStatus, StatusCircleIcon } from '@/components'
import { authClient } from '@/lib'
import { useDeviceHeartbeat } from '@/hooks'
import { useMqttStore } from '@/store/mqtt/mqtt.store'
import { formatTime12h, formatRelativeHeartbeat } from '@/utils'
import { ZoneType, ZoneTypeLabels } from '@/config/mappings'

interface DeviceConfig {
  id: string
  name: string
  description: string
  baseTopic: string
  hasMaskNvs?: boolean
  isService?: boolean
  heartbeatTimeoutMs?: number
  hasDiagnostics?: boolean
}

const DEVICES: DeviceConfig[] = [
  {
    id: 'Actuator_Controller',
    name: 'Controlador',
    description: 'Nodo Actuador + Estación Meteorológica Exterior',
    baseTopic: 'PristinoPlant/Actuator_Controller',
    heartbeatTimeoutMs: 60000,
    hasDiagnostics: true,
  },
  {
    id: 'Weather_Station',
    name: 'Estación Meteorológica',
    description: `Estación Meteorológica ${ZoneTypeLabels[ZoneType.ZONA_A]}`,
    baseTopic: `PristinoPlant/Weather_Station/Zona_A`,
    hasMaskNvs: false,
    heartbeatTimeoutMs: 60000,
    hasDiagnostics: true,
  },
]

export function DeviceDebugger() {
  const { subscribe, publishWithAck, messages, status, pendingAcks } = useMqttStore()
  const { data: session } = authClient.useSession()

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(DEVICES[0].id)
  const [connectivityLogs, setConnectivityLogs] = useState<DeviceLog[]>([])

  const [showTimeline, setShowTimeline] = useState(false)

  // Cola FIFO: orden estricto de activación de widgets por el usuario
  const [widgetOrder, setWidgetOrder] = useState<string[]>([])

  // ---- Hidratación Segura (Solo Cliente) ----
  useEffect(() => {
    // Usamos queueMicrotask para evitar cascading renders sincrónicos durante el montaje
    queueMicrotask(() => {
      const storedDevice = localStorage.getItem('diag_selected_device')
      const storedTimeline = localStorage.getItem('diag_show_timeline') === 'true'
      const cachedOrder = localStorage.getItem(`diag_widget_order_${storedDevice || DEVICES[0].id}`)

      if (storedDevice) setSelectedDeviceId(storedDevice)
      if (storedTimeline) setShowTimeline(storedTimeline)
      if (cachedOrder) setWidgetOrder(JSON.parse(cachedOrder))
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('diag_show_timeline', String(showTimeline))
    localStorage.setItem('diag_selected_device', selectedDeviceId)
    localStorage.setItem(`diag_widget_order_${selectedDeviceId}`, JSON.stringify(widgetOrder))
  }, [showTimeline, widgetOrder, selectedDeviceId])

  const selectedDevice = DEVICES.find((d) => d.id === selectedDeviceId) || DEVICES[0]
  const statusTopic = `${selectedDevice.baseTopic}/status`
  const topicCmd = `${selectedDevice.baseTopic}/cmd`
  const topicReceived = `${selectedDevice.baseTopic}/cmd/received`

  const unifiedAuditTopic = `${selectedDevice.baseTopic}/audit`
  const auditStateTopic = `${selectedDevice.baseTopic}/audit/state`

  const { connectionState } = useDeviceHeartbeat(statusTopic)

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await getConnectivityLogs(15)

      if (res.ok && res.logs) setConnectivityLogs(res.logs)
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 45000)

    return () => clearInterval(interval)
  }, [])

  const hardwarePresence = useMemo(() => {
    const msg = messages[auditStateTopic]

    if (!msg) return {}

    try {
      const payload = msg.payload
      const hwState = (
        typeof payload === 'object' ? payload : JSON.parse(String(payload))
      ) as Record<string, boolean>

      const presence: Record<string, boolean> = {}

      Object.entries(hwState).forEach(([key, value]) => {
        if (key.endsWith('_hw')) {
          presence[key.replace('_hw', '')] = value
        }
      })

      return presence
    } catch {
      return {}
    }
  }, [messages, auditStateTopic])

  useEffect(() => {
    if (status === 'connected') {
      subscribe(statusTopic)
      subscribe(topicReceived)
      subscribe(unifiedAuditTopic)
      subscribe(auditStateTopic)
    }
  }, [status, subscribe, statusTopic, topicReceived, unifiedAuditTopic, auditStateTopic])

  // Lista de widgets activos combinando hardware y UI local (para el grid de tools)
  const hardwareAudits = useMemo(() => {
    // Si el dispositivo no está online, no hay auditorías físicas activas
    if (connectionState !== 'online') return []

    const msg = messages[auditStateTopic]

    if (!msg) return []

    try {
      const payload = msg.payload
      const hwState = (
        typeof payload === 'object' ? payload : JSON.parse(String(payload))
      ) as Record<string, boolean>

      return Object.entries(hwState)
        .filter(([key, active]) => active && !key.endsWith('_hw'))
        .map(([key]) => key)
    } catch {
      return []
    }
  }, [messages, auditStateTopic, connectionState])

  // Los widgets visibles derivan del widgetOrder (cola FIFO del usuario)
  // Los que están en hardwareAudits también se marcan como activos en el ToolboxGrid
  const activeDisplayWidgets = useMemo(() => {
    const allActive = new Set([...hardwareAudits, ...widgetOrder])

    return [...allActive]
  }, [hardwareAudits, widgetOrder])

  const handleCommand = useCallback(
    async (cmd: string, auditKey: string | null) => {
      if (auditKey === 'heartbeat') {
        setWidgetOrder((prev) => {
          if (prev.includes('heartbeat')) return prev.filter((k) => k !== 'heartbeat')

          return [...prev, 'heartbeat']
        })

        return
      }

      if (auditKey === 'nvs') {
        const isCurrentlyActive = widgetOrder.includes('nvs')

        if (!isCurrentlyActive) {
          setWidgetOrder((prev) => [...prev, 'nvs'])
        } else {
          setWidgetOrder((prev) => prev.filter((k) => k !== 'nvs'))
        }

        return
      }

      if (auditKey) {
        const isCurrentlyVisible = widgetOrder.includes(auditKey)

        if (isCurrentlyVisible) {
          // Toggle OFF: ocultar widget
          setWidgetOrder((prev) => prev.filter((k) => k !== auditKey))
        } else {
          // Toggle ON: mostrar widget
          setWidgetOrder((prev) => [...prev, auditKey])
        }

        return
      }

      publishWithAck(topicCmd, cmd)
    },
    [widgetOrder, publishWithAck, topicCmd],
  )

  // Renderizar widgets: Prioridad al orden manual del usuario + Auditorías activas en hardware
  const orderedWidgets = useMemo(() => {
    const manualOrder = [...widgetOrder]

    // Asegurarse de incluir la timeline si está activa
    if (showTimeline && !manualOrder.includes('timeline')) {
      manualOrder.push('timeline')
    }

    const allActive = new Set([...manualOrder, ...hardwareAudits])

    return Array.from(allActive)
  }, [widgetOrder, hardwareAudits, showTimeline])

  // Determinar la última señal de vida (Heartbeat)
  // Prioridad: Logs de Connectivity (BD) para persistencia, luego Mensajes MQTT para tiempo real.
  const effectiveLastSeen = useMemo(() => {
    const lastOnlineLog = connectivityLogs.find(
      (l) => l.device === selectedDeviceId && l.status === 'ONLINE',
    )
    const logTime = lastOnlineLog ? new Date(lastOnlineLog.timestamp).getTime() : 0

    const statusMsg = messages[statusTopic]
    const statusTime = statusMsg?.payload === 'online' ? statusMsg.receivedAt : 0

    const ackMsg = messages[topicReceived]
    const ackTime = ackMsg?.receivedAt || 0

    return Math.max(logTime, statusTime, ackTime) || undefined
  }, [connectivityLogs, selectedDeviceId, messages, statusTopic, topicReceived])

  return (
    <div className="animate-in fade-in space-y-10 duration-500">
      <Heading
        action={
          <DeviceStatus
            connectionState={connectionState}
            dropdownTitle="Seleccionar Firmware"
            selectedZone={selectedDeviceId}
            zoneMapping={Object.fromEntries(DEVICES.map((d) => [d.id, d.name]))}
            zones={DEVICES.map((d) => d.id)}
            onZoneChanged={(id) => {
              setSelectedDeviceId(id)
              setWidgetOrder([])
            }}
          />
        }
        description={selectedDevice.description}
        title="Depuración IoT"
      />

      {/* Toolbox Grid */}
      <ToolboxGrid
        activeAudits={activeDisplayWidgets}
        hardwarePresence={hardwarePresence}
        isOnline={connectionState === 'online'}
        showTimeline={showTimeline}
        onCommand={handleCommand}
        onToggleTimeline={() => {
          const isCurrentlyVisible = widgetOrder.includes('timeline') || showTimeline

          if (isCurrentlyVisible) {
            setShowTimeline(false)
            setWidgetOrder((prev) => prev.filter((k) => k !== 'timeline'))
          } else {
            setShowTimeline(true)
            setWidgetOrder((prev) => [...prev, 'timeline'])
          }
        }}
      />

      {/* Widgets Area: Cola FIFO vertical */}
      <div className="animate-in slide-in-from-top-4 flex flex-col gap-6 duration-500">
        {orderedWidgets.length > 0 && (
          <>
            {orderedWidgets.map((auditId) => {
              if (auditId === 'timeline') {
                return (
                  <Card
                    key="timeline_card"
                    className="bg-surface border-input-outline flex w-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all"
                  >
                    <div className="border-black-and-white/5 bg-black-and-white/5 flex items-center justify-between border-b px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'h-1.5 w-1.5 rounded-full',
                            connectionState === 'online'
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                              : 'bg-zinc-400',
                          )}
                        />
                        <h4 className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase opacity-80 dark:text-zinc-400">
                          Connectivity / {selectedDevice.name}
                        </h4>
                      </div>
                      <button
                        className="group hover:bg-hover-overlay flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all"
                        type="button"
                        onClick={() => {
                          setShowTimeline(false)
                          setWidgetOrder((prev) => prev.filter((k) => k !== 'timeline'))
                        }}
                      >
                        <IoCloseOutline
                          className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"
                          size={18}
                        />
                      </button>
                    </div>
                    <div className="max-h-[400px] flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800/30">
                      {connectivityLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 text-zinc-400">
                          <span className="font-mono text-[10px] uppercase opacity-40">
                            No logs recorded
                          </span>
                        </div>
                      ) : (
                        connectivityLogs.map((item) => (
                          <div
                            key={item.id}
                            className="group hover:bg-hover-overlay flex items-center justify-between px-5 py-3 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <StatusCircleIcon
                                glow
                                glowVariant={
                                  item.status === 'ONLINE'
                                    ? 'green'
                                    : item.status === 'REBOOT'
                                      ? 'blue'
                                      : 'red'
                                }
                                icon={
                                  item.status === 'ONLINE' ? (
                                    <IoPulseOutline size={16} />
                                  ) : item.status === 'REBOOT' ? (
                                    <IoReloadOutline size={16} />
                                  ) : (
                                    <IoCloseOutline size={16} />
                                  )
                                }
                                size="sm"
                                variant="vibrant"
                              />

                              <div className="flex flex-col gap-0">
                                <span className="text-primary text-sm font-bold tracking-tight">
                                  {item.status}
                                </span>
                                <span className="text-secondary text-sm font-medium italic opacity-80">
                                  {item.notes || 'Registro de estado'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end text-right">
                              <span className="text-primary font-mono text-sm font-bold">
                                {formatTime12h(item.timestamp, true)}
                              </span>
                              <span className="text-secondary text-sm font-medium tracking-tight opacity-70">
                                {formatRelativeHeartbeat(item.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                )
              }

              const unifiedPacket = messages[unifiedAuditTopic]?.payload as Record<string, unknown>

              // Los datos provienen directamente del stream MQTT (Audit Unified Ticker)
              const payload = unifiedPacket ? unifiedPacket[auditId] : null

              return (
                <div
                  key={`${selectedDeviceId}_${auditId}_${session?.user?.id ?? 'guest'}`}
                  className="w-full"
                >
                  {auditId === 'heartbeat' ? (
                    <HeartbeatCard lastSeen={effectiveLastSeen} />
                  ) : (
                    <AuditConsoleCard
                      activeAudit={auditId}
                      currentPayload={payload}
                      deviceId={selectedDevice.id}
                      isActive={hardwareAudits.includes(auditId)}
                      isOnline={connectionState === 'online'}
                      isPending={
                        Boolean(pendingAcks[`audit_${auditId}_on`]) ||
                        Boolean(pendingAcks[`audit_${auditId}_off`])
                      }
                      isStale={false}
                      onClear={() => {
                        // El widget ya se encarga de limpiar su propia sesión internamente
                      }}
                      onClose={() => {
                        setWidgetOrder((prev) => prev.filter((id) => id !== auditId))
                      }}
                      onStart={() => {
                        publishWithAck(topicCmd, `audit_${auditId}_on`)
                      }}
                      onStop={() => {
                        publishWithAck(topicCmd, `audit_${auditId}_off`)
                      }}
                    />
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
