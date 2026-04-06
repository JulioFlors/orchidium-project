'use client'

import type { DeviceLog } from '@package/database'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IoServerOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { ToolboxGrid, AuditConsoleCard, HeartbeatCard } from './DiagnosticPanel'

import { getConnectivityLogs } from '@/actions'
import { Card, SmartDeviceHeader } from '@/components'
import { useMqttStore } from '@/store/mqtt/mqtt.store'
import { formatTime12h } from '@/utils'

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
    name: 'Relay Module',
    description: 'Control de electroválvulas y bombas.',
    baseTopic: 'PristinoPlant/Actuator_Controller',
    heartbeatTimeoutMs: 60000,
    hasDiagnostics: true,
  },
  {
    id: 'sensors',
    name: 'Environmental Sensors',
    description: 'Monitoreo de Zona A',
    baseTopic: 'PristinoPlant/Environmental_Monitoring/Zona_A',
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

// Interfaz para los snapshots cargados desde la API
interface AuditSnapshotResponse {
  id: string
  device: string
  category: string
  data: unknown
  createdAt: string
}

export function DeviceDebugger() {
  const { subscribe, publish, messages, status } = useMqttStore()

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(DEVICES[0].id)
  const [connectivityLogs, setConnectivityLogs] = useState<DeviceLog[]>([])
  const [now, setNow] = useState(() => Date.now())

  const [pendingCommands, setPendingCommands] = useState<string[]>([])
  const [showServices, setShowServices] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  // Cola FIFO: orden estricto de activación de widgets por el usuario
  const [widgetOrder, setWidgetOrder] = useState<string[]>([])

  // Datos históricos cargados desde PostgreSQL (por categoría)
  const [historicalData, setHistoricalData] = useState<Record<string, unknown>>({})
  // Indica qué widgets muestran datos antiguos (cargados desde DB)
  const [staleWidgets, setStaleWidgets] = useState<Record<string, boolean>>({})

  const selectedDevice = DEVICES.find((d) => d.id === selectedDeviceId) || DEVICES[0]
  const statusTopic = `${selectedDevice.baseTopic}/status`
  const topicCmd = `${selectedDevice.baseTopic}/cmd`
  const topicReceived = `${selectedDevice.baseTopic}/cmd/received`

  const unifiedAuditTopic = `${selectedDevice.baseTopic}/audit`
  const auditStateTopic = `${selectedDevice.baseTopic}/audit/state`

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

  // Lista de widgets activos combinando hardware y UI local (para el grid de tools)
  const hardwareAudits = useMemo(() => {
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
  }, [messages, auditStateTopic])

  // Los widgets visibles derivan del widgetOrder (cola FIFO del usuario)
  // Los que están en hardwareAudits también se marcan como activos en el ToolboxGrid
  const activeDisplayWidgets = useMemo(() => {
    const allActive = new Set([...hardwareAudits, ...widgetOrder])

    return [...allActive]
  }, [hardwareAudits, widgetOrder])

  const connectionState = getStatus(statusTopic, selectedDevice.heartbeatTimeoutMs)

  const receivedMsgItem = messages[topicReceived]

  // Limpiador automático del spool de comandos pendientes
  useEffect(() => {
    if (receivedMsgItem?.payload) {
      setTimeout(() => {
        setPendingCommands((prev) => prev.filter((cmd) => cmd !== String(receivedMsgItem.payload)))
      }, 0)
    }
  }, [receivedMsgItem?.receivedAt, receivedMsgItem?.payload])

  // Consultar datos históricos desde PostgreSQL al activar un widget
  const fetchHistoricalData = useCallback(async (device: string, category: string) => {
    try {
      const res = await fetch(`/api/admin/audit?device=${device}&category=${category}`)

      if (res.ok) {
        const json = (await res.json()) as { snapshots: AuditSnapshotResponse[] }

        if (json.snapshots && json.snapshots.length > 0) {
          // Combinar los datos de todos los snapshots
          const isChartable = ['lux', 'rain'].includes(category)

          if (isChartable) {
            // Para gráficas: combinar los historiales de todos los snapshots
            const allHistory: unknown[] = []

            for (const snap of json.snapshots) {
              const snapData = snap.data as { history?: unknown[] }

              if (snapData?.history) {
                allHistory.push(...snapData.history)
              }
            }

            if (allHistory.length > 0) {
              setHistoricalData((prev) => ({
                ...prev,
                [category]: { history: allHistory },
              }))
              setStaleWidgets((prev) => ({ ...prev, [category]: true }))

              return true // Hay datos históricos
            }
          } else {
            // Para widgets no gráficos: usar el último snapshot
            const lastSnap = json.snapshots[json.snapshots.length - 1]

            setHistoricalData((prev) => ({
              ...prev,
              [category]: lastSnap.data,
            }))
            setStaleWidgets((prev) => ({ ...prev, [category]: true }))

            return true
          }
        }
      }
    } catch {
      // Error silencioso al consultar datos históricos
    }

    return false // No hay datos históricos
  }, [])

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
        setWidgetOrder((prev) => {
          const willShow = !prev.includes('nvs')

          if (willShow) {
            publish(topicCmd, 'audit_nvs')
            setPendingCommands((p) => Array.from(new Set([...p, 'audit_nvs'])))

            return [...prev, 'nvs']
          }

          return prev.filter((k) => k !== 'nvs')
        })

        return
      }

      if (auditKey) {
        const isCurrentlyVisible = widgetOrder.includes(auditKey)

        if (isCurrentlyVisible) {
          // Toggle OFF: solo ocultar el widget (no enviar comandos MQTT)
          setWidgetOrder((prev) => prev.filter((k) => k !== auditKey))
        } else {
          // Toggle ON: añadir a la cola FIFO
          setWidgetOrder((prev) => [...prev, auditKey])

          // Consultar datos históricos de la DB
          const hasHistory = await fetchHistoricalData(selectedDevice.id, auditKey)

          if (!hasHistory) {
            // No hay datos históricos → activar auditoría en el firmware
            const isCurrentlyActive = hardwareAudits.includes(auditKey)

            if (!isCurrentlyActive) {
              publish(topicCmd, `audit_${auditKey}_on`)
              setPendingCommands((prev) => Array.from(new Set([...prev, `audit_${auditKey}_on`])))
            }
          }
        }

        return
      }

      publish(topicCmd, cmd)
      setPendingCommands((prev) => Array.from(new Set([...prev, cmd])))
      if (cmd === 'reset') {
        setTimeout(() => setPendingCommands((prev) => prev.filter((c) => c !== 'reset')), 5000)
      }
    },
    [widgetOrder, hardwareAudits, publish, topicCmd, fetchHistoricalData, selectedDevice.id],
  )

  const forceRefreshAudit = useCallback(
    async (auditKey: string) => {
      // 1. Limpiar datos antiguos en la DB
      try {
        await fetch(`/api/admin/audit?device=${selectedDevice.id}&category=${auditKey}`, {
          method: 'DELETE',
        })
      } catch {
        // Error silencioso al limpiar datos
      }

      // 2. Limpiar estado local
      setHistoricalData((prev) => {
        const next = { ...prev }

        delete next[auditKey]

        return next
      })
      setStaleWidgets((prev) => {
        const next = { ...prev }

        delete next[auditKey]

        return next
      })

      // 3. Enviar comando para nuevas lecturas
      if (auditKey === 'nvs') {
        publish(topicCmd, 'audit_nvs')
      } else {
        publish(topicCmd, `audit_${auditKey}_on`)
      }
      setPendingCommands((prev) => Array.from(new Set([...prev, `audit_${auditKey}_on`])))
    },
    [publish, topicCmd, selectedDevice.id],
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
      <SmartDeviceHeader
        connectionState={connectionState}
        deviceDescription={selectedDevice.description}
        deviceName={selectedDevice.name}
        dropdownTitle="Seleccionar Firmware"
        selectedZone={selectedDeviceId}
        zoneMapping={Object.fromEntries(DEVICES.map((d) => [d.id, d.name]))}
        zones={DEVICES.map((d) => d.id)}
        onZoneChanged={(id) => {
          setSelectedDeviceId(id)
          setPendingCommands([])
          setWidgetOrder([])
          setHistoricalData({})
          setStaleWidgets({})
        }}
      />

      {/* Toolbox Grid */}
      <ToolboxGrid
        activeAudits={activeDisplayWidgets}
        isOnline={connectionState === 'online'}
        isPending={(cmd) => pendingCommands.includes(cmd)}
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
                        className="group flex items-center justify-between rounded-xl border border-transparent bg-zinc-50 p-5 transition-all hover:border-zinc-200 dark:bg-zinc-800/40 dark:hover:border-zinc-700"
                      >
                        <div className="flex flex-col">
                          <span className="mb-1.5 text-xs leading-none font-black tracking-wide uppercase">
                            {srv.name.replace('Service: ', '')}
                          </span>
                          <span className="font-mono text-[9px] font-bold tracking-wider text-zinc-500 uppercase opacity-60">
                            Heartbeat OK
                          </span>
                        </div>
                        <div
                          className={clsx(
                            'h-3 w-3 rounded-full ring-4 transition-all duration-500',
                            srvStatus === 'online'
                              ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] ring-green-500/10'
                              : srvStatus === 'zombie'
                                ? 'bg-yellow-500 ring-yellow-500/10'
                                : 'bg-red-500 ring-red-500/10',
                          )}
                        />
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {showTimeline && (
              <Card className="flex w-full flex-col overflow-hidden p-0">
                <div className="bg-surface/50 border-input-outline border-b px-5 py-3">
                  <h4 className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase opacity-60">
                    Línea de Tiempo
                  </h4>
                </div>
                <div className="max-h-[350px] flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800/50">
                  {connectivityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="group flex items-center justify-between px-5 py-3.5 text-[10px] transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/20"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={clsx(
                            'rounded px-2 py-0.5 text-[8px] font-black tracking-tighter text-white',
                            log.device === 'actuator' ? 'bg-indigo-500' : 'bg-amber-500',
                          )}
                        >
                          {getDeviceLabel(log.device)}
                        </span>
                        <span
                          className={clsx(
                            'font-bold',
                            log.status === 'ONLINE' ? 'text-green-600' : 'text-red-600',
                          )}
                        >
                          {log.status}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-400 opacity-50 transition-opacity group-hover:opacity-100">
                        {formatVETime(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {orderedWidgets.map((auditId) => {
              const unifiedPacket = messages[unifiedAuditTopic]?.payload as Record<
                string,
                { history: unknown[] }
              >

              // Priorizar datos MQTT en vivo sobre datos históricos
              let payload = historicalData[auditId] || null
              let isStale = staleWidgets[auditId] || false

              if (unifiedPacket && unifiedPacket[auditId]) {
                payload = unifiedPacket[auditId]
                isStale = false // Datos frescos del firmware
              }

              return (
                <div key={auditId} className="w-full">
                  {auditId === 'heartbeat' ? (
                    <HeartbeatCard lastSeen={messages[statusTopic]?.receivedAt} />
                  ) : (
                    <AuditConsoleCard
                      activeAudit={auditId}
                      currentPayload={payload}
                      isStale={isStale}
                      receivedAt={messages[unifiedAuditTopic]?.receivedAt}
                      onRefresh={() => forceRefreshAudit(auditId)}
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
