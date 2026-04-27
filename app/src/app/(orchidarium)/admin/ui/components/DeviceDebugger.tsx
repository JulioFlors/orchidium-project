'use client'

import type { DeviceLog } from '@package/database'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IoHardwareChipOutline, IoPulseOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { ToolboxGrid, AuditConsoleCard, HeartbeatCard } from './DiagnosticPanel'

import { getConnectivityLogs } from '@/actions'
import { Card, Heading, DeviceStatus } from '@/components'
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
    id: 'actuator',
    name: 'Controlador',
    description: 'Nodo Actuador + Estación Meteorológica Exterior',
    baseTopic: 'PristinoPlant/Actuator_Controller',
    heartbeatTimeoutMs: 60000,
    hasDiagnostics: true,
  },
  {
    id: 'sensors',
    name: 'Sensores',
    description: `Estación Meteorológica ${ZoneTypeLabels[ZoneType.ZONA_A]}`,
    baseTopic: `PristinoPlant/Environmental_Monitoring/Zona_A`,
    hasMaskNvs: true,
    heartbeatTimeoutMs: 60000,
    hasDiagnostics: true,
  },
]

const formatVETime = (timestamp: number | string | Date) => {
  return formatTime12h(timestamp, true)
}

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

  const getDeviceLabel = (id: string) => {
    if (id === 'actuator') return 'RELAY'
    if (id === 'sensors') return 'SENSOR'

    return id.split('/').pop()?.toUpperCase() || 'HUB'
  }

  // Renderizar widgets: Prioridad al orden manual del usuario + Auditorías activas en hardware
  const orderedWidgets = useMemo(() => {
    const allActive = new Set([...widgetOrder, ...hardwareAudits])

    return Array.from(allActive)
  }, [widgetOrder, hardwareAudits])

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
        onToggleTimeline={() => setShowTimeline((prev) => !prev)}
      />

      {/* Widgets Area: Cola FIFO vertical */}
      <div className="animate-in slide-in-from-top-4 flex flex-col gap-6 duration-500">
        {(showTimeline || orderedWidgets.length > 0) && (
          <>
            {showTimeline && (
              <Card className="bg-surface border-input-outline flex w-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all">
                <div className="border-black-and-white/5 bg-black-and-white/5 flex items-center justify-between border-b px-5 py-3">
                  <h4 className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase opacity-80 dark:text-zinc-400">
                    Connectivity/Log Timeline
                  </h4>
                </div>
                <div className="max-h-[400px] flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800/30">
                  {connectivityLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-zinc-400">
                      <span className="font-mono text-[10px] uppercase opacity-40">
                        No logs recorded
                      </span>
                    </div>
                  ) : (
                    connectivityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="group hover:bg-hover-overlay flex items-center justify-between px-5 py-4 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={clsx(
                              'flex h-8 w-8 items-center justify-center rounded-lg text-lg ring-1',
                              log.device === 'actuator'
                                ? 'bg-indigo-500/10 text-indigo-500 ring-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
                            )}
                          >
                            {log.device === 'actuator' ? (
                              <IoHardwareChipOutline size={16} />
                            ) : (
                              <IoPulseOutline size={16} />
                            )}
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-black tracking-widest text-zinc-400 uppercase opacity-60">
                                {getDeviceLabel(log.device)}
                              </span>
                              <div
                                className={clsx(
                                  'h-1 w-1 rounded-full',
                                  log.status === 'ONLINE'
                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
                                )}
                              />
                            </div>
                            <span
                              className={clsx(
                                'text-xs font-bold tracking-tight',
                                log.status === 'ONLINE'
                                  ? 'text-zinc-900 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400',
                              )}
                            >
                              Dispositivo {log.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end text-right">
                          <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                            {formatVETime(log.timestamp)}
                          </span>
                          <span className="text-[10px] font-bold tracking-tight text-zinc-400 opacity-60">
                            {formatRelativeHeartbeat(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {orderedWidgets.map((auditId) => {
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
