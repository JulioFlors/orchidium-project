'use client'

import type { DeviceLog } from '@package/database'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IoHardwareChipOutline, IoPulseOutline, IoServerOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { ToolboxGrid, AuditConsoleCard, HeartbeatCard } from './DiagnosticPanel'

import { getConnectivityLogs } from '@/actions'
import { Card, Heading, DeviceStatus } from '@/components'
import { authClient } from '@/lib/auth-client'
import { useMqttStore } from '@/store/mqtt/mqtt.store'
import { formatTime12h } from '@/utils'
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
    baseTopic: `PristinoPlant/Environmental_Monitoring/${ZoneType.ZONA_A}`,
    hasMaskNvs: true,
    heartbeatTimeoutMs: 60000,
    hasDiagnostics: true,
  },
]

const SERVICES: DeviceConfig[] = [
  {
    id: 'ingest',
    name: 'Service: Ingest',
    description: 'Ingesta de telemetría a InfluxDB.',
    baseTopic: 'PristinoPlant/Services/Ingest',
    isService: true,
    heartbeatTimeoutMs: 360000,
  },
  {
    id: 'scheduler',
    name: 'Service: Scheduler',
    description: 'Planificador de tareas y automatizaciones.',
    baseTopic: 'PristinoPlant/Services/Scheduler',
    isService: true,
    heartbeatTimeoutMs: 360000,
  },
]

type ConnectionState = 'online' | 'offline' | 'unknown' | 'zombie'

const formatVETime = (timestamp: number | string | Date) => {
  return formatTime12h(timestamp, true)
}

export function DeviceDebugger() {
  const { subscribe, publishWithAck, messages, status, pendingAcks } = useMqttStore()
  const { data: session } = authClient.useSession()

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEVICES[0].id

    return localStorage.getItem('diag_selected_device') || DEVICES[0].id
  })
  const [connectivityLogs, setConnectivityLogs] = useState<DeviceLog[]>([])
  const [now, setNow] = useState(() => Date.now())

  const [showServices, setShowServices] = useState(() => {
    if (typeof window === 'undefined') return false

    return localStorage.getItem('diag_show_services') === 'true'
  })
  const [showTimeline, setShowTimeline] = useState(() => {
    if (typeof window === 'undefined') return false

    return localStorage.getItem('diag_show_timeline') === 'true'
  })

  // Cola FIFO: orden estricto de activación de widgets por el usuario
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    const cached = localStorage.getItem(`diag_widget_order_${selectedDeviceId}`)

    return cached ? JSON.parse(cached) : []
  })

  // Sincronización con localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('diag_show_services', String(showServices))
    localStorage.setItem('diag_show_timeline', String(showTimeline))
    localStorage.setItem('diag_selected_device', selectedDeviceId)
    localStorage.setItem(`diag_widget_order_${selectedDeviceId}`, JSON.stringify(widgetOrder))
  }, [showServices, showTimeline, widgetOrder, selectedDeviceId])

  const selectedDevice = DEVICES.find((d) => d.id === selectedDeviceId) || DEVICES[0]
  const statusTopic = `${selectedDevice.baseTopic}/status`
  const topicCmd = `${selectedDevice.baseTopic}/cmd`
  const topicReceived = `${selectedDevice.baseTopic}/cmd/received`

  const unifiedAuditTopic = `${selectedDevice.baseTopic}/audit`
  const auditStateTopic = `${selectedDevice.baseTopic}/audit/state`

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
    const interval = setInterval(() => setNow(Date.now()), 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await getConnectivityLogs(15)

      if (res.ok && res.logs) setConnectivityLogs(res.logs)
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 45000)

    return () => clearInterval(interval)
  }, [])

  const getStatus = useCallback(
    (topic: string, timeout: number = 60000): ConnectionState => {
      const data = messages[topic] as { payload: unknown; receivedAt: number } | undefined

      if (!data) return 'unknown'
      const statusVal = String(data.payload).trim()

      if (statusVal === 'offline') return 'offline'
      if (statusVal === 'online') {
        const isZombie = now - data.receivedAt > timeout

        return isZombie ? 'zombie' : 'online'
      }

      return 'unknown'
    },
    [messages, now],
  )

  useEffect(() => {
    if (status === 'connected') {
      subscribe(statusTopic)
      subscribe(topicReceived)
      SERVICES.forEach((s) => subscribe(`${s.baseTopic}/status`))
      subscribe(unifiedAuditTopic)
      subscribe(auditStateTopic)
    }
  }, [status, subscribe, statusTopic, topicReceived, unifiedAuditTopic, auditStateTopic])

  const connectionState = getStatus(statusTopic, selectedDevice.heartbeatTimeoutMs)

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

  // Renderizar widgets en el orden FIFO de activación del usuario
  const orderedWidgets = useMemo(() => {
    // El widgetOrder define el orden estricto.
    // Si hay widgets activos en el hardware que no están en widgetOrder,
    // se añaden al final (pero NO se auto-muestran, solo se marcan como activos en el grid).
    return widgetOrder.filter((w) => activeDisplayWidgets.includes(w) || widgetOrder.includes(w))
  }, [widgetOrder, activeDisplayWidgets])

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
        title={selectedDevice.name}
      />

      {/* Toolbox Grid */}
      <ToolboxGrid
        activeAudits={activeDisplayWidgets}
        hardwarePresence={hardwarePresence}
        isOnline={connectionState === 'online'}
        showServices={showServices}
        showTimeline={showTimeline}
        onCommand={handleCommand}
        onToggleServices={() => setShowServices((prev) => !prev)}
        onToggleTimeline={() => setShowTimeline((prev) => !prev)}
      />

      {/* Widgets Area: Cola FIFO vertical */}
      <div className="animate-in slide-in-from-top-4 flex flex-col gap-6 duration-500">
        {(showServices || showTimeline || orderedWidgets.length > 0) && (
          <>
            {showServices && (
              <Card className="flex w-full flex-col p-5">
                <h3 className="text-primary mb-6 flex items-center gap-2 text-sm font-bold tracking-widest uppercase opacity-60">
                  <IoServerOutline className="text-indigo-500" />
                  Estado de Servicios
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {SERVICES.map((srv) => {
                    const srvStatus = getStatus(`${srv.baseTopic}/status`, srv.heartbeatTimeoutMs)

                    return (
                      <div
                        key={srv.id}
                        className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
                      >
                        {/* Glow de fondo sutil según estado */}
                        <div
                          className={clsx(
                            'absolute -top-4 -right-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-20',
                            srvStatus === 'online'
                              ? 'bg-emerald-500'
                              : srvStatus === 'zombie'
                                ? 'bg-amber-500'
                                : 'bg-red-500',
                          )}
                        />

                        <div className="relative z-10 flex flex-col">
                          <span className="mb-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                            Service Node
                          </span>
                          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {srv.name.replace('Service: ', '')}
                          </span>
                        </div>

                        <div className="relative z-10 flex flex-col items-end gap-1.5">
                          <div
                            className={clsx(
                              'flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase',
                              srvStatus === 'online'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : srvStatus === 'zombie'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400',
                            )}
                          >
                            <div
                              className={clsx(
                                'h-1.5 w-1.5 animate-pulse rounded-full',
                                srvStatus === 'online'
                                  ? 'bg-emerald-500'
                                  : srvStatus === 'zombie'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500',
                              )}
                            />
                            {srvStatus}
                          </div>
                          <span className="font-mono text-[9px] font-bold tracking-widest text-zinc-500 uppercase opacity-40">
                            Heartbeat OK
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {showTimeline && (
              <Card className="flex w-full flex-col overflow-hidden border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-black/40">
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
                        className="group flex items-center justify-between px-5 py-4 transition-all hover:bg-zinc-50 dark:hover:bg-black/20"
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
                          <span className="text-[9px] font-medium text-zinc-400 opacity-40">
                            Protocol: MQTT (VET-4)
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {orderedWidgets.map((auditId) => {
              const unifiedPacket = messages[unifiedAuditTopic]?.payload as Record<
                string,
                { history: unknown[] }
              >

              // Los datos provienen directamente del stream MQTT
              const payload = unifiedPacket ? unifiedPacket[auditId] : null

              return (
                <div
                  key={`${selectedDeviceId}_${auditId}_${session?.user?.id ?? 'guest'}`}
                  className="w-full"
                >
                  {auditId === 'heartbeat' ? (
                    <HeartbeatCard lastSeen={messages[statusTopic]?.receivedAt} />
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
