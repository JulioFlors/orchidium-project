'use client'

import { useState, useEffect, useRef } from 'react'
import {
  IoSearchOutline,
  IoPulseOutline,
  IoCodeSlashOutline,
  IoServerOutline,
  IoTimeOutline,
  IoHardwareChipOutline,
  IoWifiOutline,
  IoHeartOutline,
  IoTrashOutline,
} from 'react-icons/io5'
import { IoIosRefresh } from 'react-icons/io'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import clsx from 'clsx'

import { Card } from '@/components'

// --- Micro-Componente: Herramienta Individual (Card) ---
interface ToolCardProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  pending?: boolean
  active?: boolean // Latching effect
  disabled?: boolean
}

function ToolCard({ icon, label, onClick, pending, active, disabled }: ToolCardProps) {
  return (
    <Card
      className={clsx(
        'flex flex-col items-center justify-center gap-3 p-6 transition-all duration-300',
        !pending && !disabled
          ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800'
          : 'cursor-wait',
        active
          ? 'border-indigo-500 bg-indigo-500 text-white'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
        pending && 'border-indigo-500 ring-4 ring-indigo-500/10',
        disabled && 'pointer-events-none cursor-not-allowed opacity-30 grayscale',
      )}
      onClick={!pending && !disabled ? onClick : undefined}
    >
      <div className="relative">
        <div className={clsx('text-3xl transition-all', pending && 'opacity-20')}>{icon}</div>

        {pending && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        )}
      </div>

      <span
        className={clsx(
          'text-center text-[10px] font-black tracking-widest uppercase',
          active ? 'text-white' : 'opacity-60 group-hover:opacity-100',
        )}
      >
        {label}
      </span>
    </Card>
  )
}

// --- Toolbox Grid (V2.1.0: Mínimo 2 columnas siempre) ---
interface ToolboxGridProps {
  isOnline: boolean
  disableNVS?: boolean
  activeAudits: string[]
  showServices: boolean
  showTimeline: boolean
  onToggleServices: () => void
  onToggleTimeline: () => void
  onCommand: (cmd: string, auditId: string | null) => void
  isPending: (cmd: string) => boolean
  onToggleHeartbeat?: () => void
  hardwarePresence?: Record<string, boolean>
}

export function ToolboxGrid({
  isOnline,
  disableNVS,
  activeAudits,
  showServices,
  showTimeline,
  onToggleServices,
  onToggleTimeline,
  onCommand,
  isPending,
  hardwarePresence = {},
}: ToolboxGridProps) {
  return (
    <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-2xl:grid-cols-4 grid grid-cols-2 gap-4">
      {/* Botones de Widget (Latching) */}
      <ToolCard
        active={showServices}
        icon={<IoServerOutline className={clsx(!showServices && 'text-indigo-400')} />}
        label="Servicios"
        onClick={onToggleServices}
      />

      <ToolCard
        active={showTimeline}
        icon={<IoTimeOutline className={clsx(!showTimeline && 'text-indigo-400')} />}
        label="Timeline"
        onClick={onToggleTimeline}
      />

      {/* Herramientas Diagnostic (ESP32) */}
      <ToolCard
        active={activeAudits.includes('lux')}
        disabled={!isOnline || hardwarePresence.lux === false}
        icon={
          <IoSearchOutline className={clsx(!activeAudits.includes('lux') && 'text-cyan-500')} />
        }
        label={hardwarePresence.lux === false ? 'Lux (Off)' : 'Lux Meter'}
        pending={isPending('audit_lux_on')}
        onClick={() => onCommand('audit_lux_on', 'lux')}
      />

      <ToolCard
        active={activeAudits.includes('rain')}
        disabled={!isOnline || hardwarePresence.rain === false}
        icon={
          <IoPulseOutline className={clsx(!activeAudits.includes('rain') && 'text-blue-500')} />
        }
        label={hardwarePresence.rain === false ? 'Rain (Off)' : 'Rain Audit'}
        pending={isPending('audit_rain_on')}
        onClick={() => onCommand('audit_rain_on', 'rain')}
      />

      <ToolCard
        active={activeAudits.includes('pressure')}
        disabled={!isOnline || hardwarePresence.pressure === false}
        icon={
          <IoPulseOutline
            className={clsx(!activeAudits.includes('pressure') && 'text-purple-500')}
          />
        }
        label={hardwarePresence.pressure === false ? 'Pr (Off)' : 'Pressure'}
        pending={isPending('audit_pressure_on')}
        onClick={() => onCommand('audit_pressure_on', 'pressure')}
      />

      <ToolCard
        active={activeAudits.includes('heartbeat')}
        icon={
          <IoHeartOutline
            className={clsx(activeAudits.includes('heartbeat') ? 'text-red-500' : 'text-zinc-600')}
          />
        }
        label="Heartbeat"
        onClick={() => onCommand('ui_heartbeat', 'heartbeat')}
      />

      {!disableNVS && (
        <ToolCard
          active={activeAudits.includes('nvs')}
          disabled={!isOnline}
          icon={
            <IoCodeSlashOutline
              className={clsx(!activeAudits.includes('nvs') && 'text-amber-500')}
            />
          }
          label="NVS Stack"
          pending={isPending('audit_nvs')}
          onClick={() => onCommand('audit_nvs', 'nvs')}
        />
      )}

      {/* Nuevas Auditorías v0.8.5 */}
      <ToolCard
        active={activeAudits.includes('ram')}
        disabled={!isOnline}
        icon={
          <IoHardwareChipOutline
            className={clsx(!activeAudits.includes('ram') && 'text-zinc-600')}
          />
        }
        label="RAM Audit"
        pending={isPending('audit_ram_on')}
        onClick={() => onCommand('audit_ram_on', 'ram')}
      />

      <ToolCard
        active={activeAudits.includes('health')}
        disabled={!isOnline}
        icon={
          <IoWifiOutline className={clsx(!activeAudits.includes('health') && 'text-emerald-500')} />
        }
        label="WiFi Audit"
        pending={isPending('audit_health_on')}
        onClick={() => onCommand('audit_health_on', 'health')}
      />

      <ToolCard
        disabled={!isOnline}
        icon={<IoPulseOutline className="rotate-90 text-red-500" />}
        label="Node Reset"
        pending={isPending('reset')}
        onClick={() => {
          if (confirm('¿Reiniciar dispositivo?')) onCommand('reset', null)
        }}
      />
    </div>
  )
}

// --- Card 2: Consola de Auditoría (Result Widget) ---
interface AuditConsoleCardProps {
  activeAudit: string | null
  currentPayload: unknown
  receivedAt?: number
  onRefresh?: () => void
}

export function AuditConsoleCard({
  activeAudit,
  currentPayload,
  receivedAt,
  onRefresh,
}: AuditConsoleCardProps) {
  const accumulatorRef = useRef<Record<string, unknown>>({})

  // 1. Lazy Initializer (Evita renders en cascada y soluciona rule de React react-hooks/exhaustive-deps)
  const [displayPayload, setDisplayPayload] = useState<unknown>(() => {
    if (typeof window === 'undefined' || !activeAudit) return null

    const isChartable = ['lux', 'rain', 'pressure'].includes(activeAudit)

    if (isChartable) {
      const cached = window.sessionStorage.getItem(`audit_history_${activeAudit}`)

      if (cached) {
        try {
          return JSON.parse(cached)
        } catch {
          // Fallback silencioso
        }
      }
    }

    return null
  })

  // 2. Procesar payload entrante
  useEffect(() => {
    if (!currentPayload) return

    if (activeAudit === 'nvs') {
      try {
        const payloadObj =
          typeof currentPayload === 'string' ? JSON.parse(currentPayload) : currentPayload

        if (
          payloadObj &&
          typeof payloadObj === 'object' &&
          'chunk' in payloadObj &&
          'total' in payloadObj &&
          'data' in payloadObj
        ) {
          const { chunk, total, data } = payloadObj as {
            chunk: number
            total: number
            data: Record<string, unknown>
          }

          if (chunk === 1) {
            accumulatorRef.current = { ...data }
          } else {
            accumulatorRef.current = { ...accumulatorRef.current, ...data }
          }

          if (chunk === total) {
            setDisplayPayload({ ...accumulatorRef.current })
          }
        }
      } catch {
        // Error silencioso en parseo de chunks
      }
    } else {
      const isChartable = ['lux', 'rain', 'pressure'].includes(activeAudit || '')

      if (isChartable) {
        setDisplayPayload((prev: unknown) => {
          const prevPayload = (prev as { history?: unknown[] }) || { history: [] }
          const incomingPayload = (currentPayload as { history?: unknown[] }) || { history: [] }

          const prevHistory = prevPayload.history || []
          const incomingHistory = incomingPayload.history || []

          // Desduplicación por timestamp (el índice 0 de [ts, value])
          const mergedMap = new Map<number | string, unknown>()

          prevHistory.forEach((item) => {
            const ts = Array.isArray(item) ? item[0] : null

            if (ts) mergedMap.set(ts, item)
          })

          incomingHistory.forEach((item) => {
            const ts = Array.isArray(item) ? item[0] : null

            if (ts) mergedMap.set(ts, item)
          })

          // Extraer ordenados cronológicamente y limitar a 200 puntos (memoria)
          const mergedHistory = Array.from(mergedMap.values())
            .sort((a, b) => {
              const tsA = Array.isArray(a) ? Number(a[0]) : 0
              const tsB = Array.isArray(b) ? Number(b[0]) : 0

              return tsA - tsB
            })
            .slice(-200)

          const nextState = {
            ...(incomingPayload as Record<string, unknown>),
            history: mergedHistory,
          }

          if (typeof window !== 'undefined' && activeAudit) {
            window.sessionStorage.setItem(`audit_history_${activeAudit}`, JSON.stringify(nextState))
          }

          return nextState
        })
      } else {
        // Para auditorías estándar (salud, ram, etc.), se setea directo
        setDisplayPayload(currentPayload)
      }
    }
  }, [currentPayload, activeAudit])

  const handleClear = () => {
    if (activeAudit && typeof window !== 'undefined') {
      const isChartable = ['lux', 'rain', 'pressure'].includes(activeAudit)

      if (isChartable) {
        window.sessionStorage.removeItem(`audit_history_${activeAudit}`)
      }
    }
    setDisplayPayload(null)
  }

  const timeAgeStr = receivedAt
    ? `Recibido a las ${new Date(receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    : 'Esperando datos...'

  const finalDisplay = displayPayload

  if (!activeAudit && !finalDisplay) return null

  // Render Engine per Audit Type
  const renderContent = () => {
    if (activeAudit === 'nvs') {
      return (
        <pre className="whitespace-pre-wrap text-blue-300">
          {typeof displayPayload === 'object' && displayPayload !== null
            ? JSON.stringify(displayPayload, null, 2)
            : String(displayPayload)}
        </pre>
      )
    }

    if (activeAudit === 'ram' && displayPayload && typeof displayPayload === 'object') {
      const ram = displayPayload as { used: number; total: number; free: number }

      if (ram.total) {
        const percent = Math.round((ram.used / ram.total) * 100)

        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-zinc-800">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle className="fill-none stroke-zinc-700 stroke-8" cx="64" cy="64" r="56" />
                <circle
                  className={clsx(
                    'fill-none stroke-8 transition-all duration-1000',
                    percent > 80
                      ? 'stroke-red-500'
                      : percent > 60
                        ? 'stroke-amber-500'
                        : 'stroke-indigo-500',
                  )}
                  cx="64"
                  cy="64"
                  r="56"
                  strokeDasharray={`${(percent / 100) * 351} 351`}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-white">{percent}%</span>
                <span className="text-[9px] tracking-widest text-zinc-400 uppercase">Usada</span>
              </div>
            </div>
            <div className="flex w-full justify-between border-t border-zinc-800/50 px-6 pt-3 font-mono text-[10px]">
              <span className="text-emerald-500">Libre: {ram.free}</span>
              <span className="text-zinc-500 opacity-60">Total: {ram.total}</span>
            </div>
          </div>
        )
      }
    }

    if (activeAudit === 'health' || activeAudit === 'state') {
      return (
        <pre className="leading-relaxed whitespace-pre-wrap text-zinc-300">
          {typeof displayPayload === 'object' && displayPayload !== null
            ? JSON.stringify(displayPayload, null, 2)
            : String(displayPayload)}
        </pre>
      )
    }

    const isChartable = ['lux', 'rain', 'pressure'].includes(activeAudit || '')
    const history = (displayPayload as { history?: unknown[] })?.history

    if (isChartable && Array.isArray(history) && history.length > 0) {
      const chartData = history.map((val, idx) => {
        let value = 0
        let timeStr = String(idx)

        if (Array.isArray(val) && val.length === 2) {
          const [ts, data] = val

          timeStr =
            typeof ts === 'number'
              ? new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : String(ts)
          value = Number(data)
        } else {
          value = Number(val)
        }

        return { name: timeStr, value }
      })

      return (
        <div className="mt-2 h-[200px] w-full select-none">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis hide dataKey="name" />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
              />
              <Area
                dataKey="value"
                fill="url(#colorValue)"
                fillOpacity={1}
                stroke="#818cf8"
                strokeWidth={2}
                type="stepAfter"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )
    }

    return (
      <pre className="flex h-20 items-center justify-center text-center text-zinc-500 italic opacity-50">
        Esperando flujos continuos de datos...
      </pre>
    )
  }

  return (
    <Card className="flex flex-col overflow-hidden border-zinc-200 p-0 dark:border-zinc-800/50">
      <div className="bg-surface border-input-outline flex items-center justify-between border-b px-5 py-2">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <span className="text-secondary font-mono text-[10px] font-bold tracking-widest uppercase opacity-80">
            {activeAudit === 'nvs' ? 'recovery.json' : `audit/${activeAudit || 'idle'}`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {Boolean(finalDisplay) && (
            <span className="hidden items-center gap-1.5 text-[9px] font-black tracking-widest text-emerald-500 uppercase opacity-80 sm:inline-flex">
              <IoTimeOutline size={12} /> {timeAgeStr}
            </span>
          )}

          <div className="flex items-center gap-2 border-l border-zinc-800/50 pl-4">
            <button
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-indigo-400"
              title="Solicitar Actualización"
              type="button"
              onClick={onRefresh}
            >
              <IoIosRefresh size={14} />
            </button>
            <button
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-red-400"
              title="Limpiar Caché Local"
              type="button"
              onClick={handleClear}
            >
              <IoTrashOutline size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-5 font-mono text-[11px] leading-relaxed text-zinc-300">
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-500">
          {renderContent()}
        </div>
      </div>
    </Card>
  )
}

// --- Card 3: Heartbeat Monitor (Device Pulse) ---
interface HeartbeatCardProps {
  lastSeen?: number
}

const formatVEDateTime = (timestamp: number | string | Date) => {
  const date = new Date(timestamp)

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function HeartbeatCard({ lastSeen }: HeartbeatCardProps) {
  const hasSeen = Boolean(lastSeen)

  return (
    <Card className="flex items-center justify-between border-zinc-200 p-5 dark:border-zinc-800/50">
      <div className="flex items-center gap-4">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800/50">
          <IoHeartOutline
            className={clsx(
              'text-xl transition-all duration-700',
              hasSeen ? 'animate-pulse text-red-500' : 'text-zinc-400 opacity-50',
            )}
          />
          {hasSeen && (
            <div className="absolute inset-0 animate-ping rounded-full bg-red-500/10 duration-2000" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase opacity-60">
            Último Registro
          </span>
          <span className="font-mono text-sm font-bold tracking-tight text-indigo-500 uppercase dark:text-indigo-400">
            {hasSeen ? formatVEDateTime(lastSeen!) : 'Esperando Señal...'}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end text-right">
        <div className="flex items-center gap-2 grayscale group-hover:grayscale-0">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase opacity-40">
            Frontend Pulse Sync
          </span>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
        </div>
        {hasSeen && (
          <span className="mt-1 font-mono text-[8px] tracking-tighter opacity-30">
            Suscrito al broker (VET-4)
          </span>
        )}
      </div>
    </Card>
  )
}
