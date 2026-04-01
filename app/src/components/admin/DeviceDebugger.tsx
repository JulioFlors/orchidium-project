'use client'

import type { DeviceLog } from '@package/database'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IoServerOutline } from 'react-icons/io5'
import clsx from 'clsx'

import { ToolboxGrid, AuditConsoleCard, HeartbeatCard } from './DiagnosticPanel'

import { getConnectivityLogs } from '@/actions'
import { Card, SmartDeviceHeader } from '@/components'
import { useMqttStore } from '@/store/mqtt/mqtt.store'

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
    description: 'Monitoreo de Zona A (Lux, Lluvia, Presión).',
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
  return new Date(timestamp).toLocaleTimeString('en-US', {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function DeviceDebugger() {
  const { subscribe, publish, messages, status } = useMqttStore()

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(DEVICES[0].id)
  const [connectivityLogs, setConnectivityLogs] = useState<DeviceLog[]>([])
  const [now, setNow] = useState(() => Date.now())

  const [pendingCommands, setPendingCommands] = useState<string[]>([])
  const [showServices, setShowServices] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showHeartbeat, setShowHeartbeat] = useState(false)
  const [showNvs, setShowNvs] = useState(false) // Estado local para el widget de ráfaga

  const selectedDevice = DEVICES.find((d) => d.id === selectedDeviceId) || DEVICES[0]
  const statusTopic = `${selectedDevice.baseTopic}/status`
  const topicCmd = `${selectedDevice.baseTopic}/cmd`
  const topicReceived = `${selectedDevice.baseTopic}/cmd/received`

  const unifiedAuditTopic = `${selectedDevice.baseTopic}/audit`
  const auditStateTopic = `${selectedDevice.baseTopic}/audit/state`

  // El estado de presencia de hardware y status general se envía integrado en el mensaje de error o estado de auditoría
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

  // El estado visual de las auditorías se deriva directamente del hardware (Fuente de Verdad)
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

  // Combinamos las auditorías del Hardware con las de la UI (Heartbeat y NVS son locales/UI)
  const activeDisplayWidgets = useMemo(() => {
    const list = [...hardwareAudits]

    if (showHeartbeat) list.unshift('heartbeat')
    if (showNvs) list.push('nvs')

    return list
  }, [hardwareAudits, showHeartbeat, showNvs])

  const connectionState = getStatus(statusTopic, selectedDevice.heartbeatTimeoutMs)
  
  const receivedMsgItem = messages[topicReceived]

  // Limpiador automático del spool de comandos pendientes interceptando confirmaciones MQTT
  useEffect(() => {
    if (receivedMsgItem?.payload) {
      setTimeout(() => {
        setPendingCommands((prev) => prev.filter((cmd) => cmd !== String(receivedMsgItem.payload)))
      }, 0)
    }
  }, [receivedMsgItem?.receivedAt, receivedMsgItem?.payload])

  const handleCommand = (cmd: string, auditKey: string | null) => {
    if (auditKey === 'heartbeat') {
      setShowHeartbeat((prev) => !prev)

      return
    }

    if (auditKey === 'nvs') {
      const willShow = !showNvs

      setShowNvs(willShow)
      if (willShow) {
        publish(topicCmd, 'audit_nvs')
        setPendingCommands((prev) => Array.from(new Set([...prev, 'audit_nvs'])))
      }

      return
    }

    if (auditKey) {
      // El toggle se hace basándose en el estado real reportado por el hardware
      const isCurrentlyActive = hardwareAudits.includes(auditKey)
      const toggleCmd = isCurrentlyActive ? `audit_${auditKey}_off` : `audit_${auditKey}_on`

      publish(topicCmd, toggleCmd)
      setPendingCommands((prev) => Array.from(new Set([...prev, toggleCmd])))

      return
    }

    publish(topicCmd, cmd)
    setPendingCommands((prev) => Array.from(new Set([...prev, cmd])))
    if (cmd === 'reset') {
      setTimeout(() => setPendingCommands((prev) => prev.filter((c) => c !== 'reset')), 5000)
    }
  }

  const forceRefreshAudit = (auditKey: string) => {
    if (auditKey === 'nvs') publish(topicCmd, 'audit_nvs')
    else publish(topicCmd, `audit_${auditKey}_on`)
    setPendingCommands((prev) => Array.from(new Set([...prev, `audit_${auditKey}_on`])))
  }

  const getDeviceLabel = (id: string) => {
    if (id === 'actuator') return 'RELAY'
    if (id === 'sensors') return 'SENSOR'

    return id.split('/').pop()?.toUpperCase() || 'HUB'
  }

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
        }}
      />

      {/* Toolbox Grid: Individual Cards (Media grid minimum) */}
      <ToolboxGrid
        activeAudits={activeDisplayWidgets}
        disableNVS={selectedDevice.hasMaskNvs}
        hardwarePresence={hardwarePresence}
        isOnline={connectionState === 'online'}
        isPending={(cmd) => pendingCommands.includes(cmd)}
        showServices={showServices}
        showTimeline={showTimeline}
        onCommand={handleCommand}
        onToggleServices={() => setShowServices((prev) => !prev)}
        onToggleTimeline={() => setShowTimeline((prev) => !prev)}
      />

      {/* Widgets Area: Alumno vertical Stack (Full Width siempre) */}
      <div className="animate-in slide-in-from-top-4 flex flex-col gap-6 duration-500">
        {(showServices || showTimeline || activeDisplayWidgets.length > 0) && (
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

            {activeDisplayWidgets.map((auditId) => {
              const unifiedPacket = messages[unifiedAuditTopic]?.payload as Record<
                string,
                { history: unknown[] }
              >

              let payload

              if (unifiedPacket && unifiedPacket[auditId]) {
                payload = unifiedPacket[auditId]
              }

              return (
                <div key={auditId} className="w-full">
                  {auditId === 'heartbeat' ? (
                    <HeartbeatCard lastSeen={messages[statusTopic]?.receivedAt} />
                  ) : (
                    <AuditConsoleCard
                      activeAudit={auditId}
                      currentPayload={payload}
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
