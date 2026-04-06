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
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import clsx from 'clsx'

import { Card } from '@/components'
import { formatTime12h } from '@/utils'

// ---- Mapa de Colores por Herramienta ----
// Cada key corresponde al identificador único de la herramienta/auditoría.
// Se propaga al fondo, borde y anillo de la ToolCard cuando está activa.
const TOOL_COLORS: Record<string, { bg: string; ring: string; border: string; icon: string }> = {
  services: {
    bg: 'bg-indigo-500',
    ring: 'ring-indigo-500/10',
    border: 'border-indigo-500',
    icon: 'text-indigo-400',
  },
  timeline: {
    bg: 'bg-slate-600',
    ring: 'ring-slate-600/10',
    border: 'border-slate-600',
    icon: 'text-slate-400',
  },
  lux: {
    bg: 'bg-cyan-500',
    ring: 'ring-cyan-500/10',
    border: 'border-cyan-500',
    icon: 'text-cyan-500',
  },
  rain: {
    bg: 'bg-blue-500',
    ring: 'ring-blue-500/10',
    border: 'border-blue-500',
    icon: 'text-blue-500',
  },
  heartbeat: {
    bg: 'bg-red-500',
    ring: 'ring-red-500/10',
    border: 'border-red-500',
    icon: 'text-red-500',
  },
  nvs: {
    bg: 'bg-amber-500',
    ring: 'ring-amber-500/10',
    border: 'border-amber-500',
    icon: 'text-amber-500',
  },
  ram: {
    bg: 'bg-zinc-600',
    ring: 'ring-zinc-600/10',
    border: 'border-zinc-600',
    icon: 'text-zinc-500',
  },
  health: {
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-500/10',
    border: 'border-emerald-500',
    icon: 'text-emerald-500',
  },
}

// Colores de trazo para las gráficas de auditoría (coinciden con TOOL_COLORS)
const AUDIT_CHART_COLORS: Record<string, string> = {
  lux: '#eab308', // yellow-500
  rain: '#3b82f6', // blue-500
}

const fallbackColor = {
  bg: 'bg-indigo-500',
  ring: 'ring-indigo-500/10',
  border: 'border-indigo-500',
  icon: 'text-indigo-400',
}

// --- Micro-Componente: Herramienta Individual (Card) ---
interface ToolCardProps {
  icon: React.ReactNode
  label: string
  colorKey: string
  onClick: () => void
  pending?: boolean
  active?: boolean
  disabled?: boolean
}

function ToolCard({ icon, label, colorKey, onClick, pending, active, disabled }: ToolCardProps) {
  const colors = TOOL_COLORS[colorKey] || fallbackColor

  return (
    <Card
      className={clsx(
        'flex flex-col items-center justify-center gap-3 p-6 transition-all duration-300',
        !pending && !disabled
          ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800'
          : 'cursor-wait',
        active
          ? `${colors.bg} ${colors.border} text-white`
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
        pending && `${colors.border} ring-4 ${colors.ring}`,
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

// --- Toolbox Grid ---
interface ToolboxGridProps {
  isOnline: boolean
  activeAudits: string[]
  onCommand: (cmd: string, auditKey: string | null) => void
  isPending: (cmd: string) => boolean
  showServices: boolean
  showTimeline: boolean
  onToggleServices: () => void
  onToggleTimeline: () => void
}

export function ToolboxGrid({
  isOnline,
  activeAudits,
  onCommand,
  isPending,
  showServices,
  onToggleServices,
  showTimeline,
  onToggleTimeline,
}: ToolboxGridProps) {
  return (
    <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-3 tds-2xl:grid-cols-4 grid grid-cols-2 gap-4">
      {/* Botones de Widget (Latching) */}
      <ToolCard
        active={showServices}
        colorKey="services"
        icon={<IoServerOutline className={clsx(!showServices && TOOL_COLORS.services.icon)} />}
        label="Servicios"
        onClick={onToggleServices}
      />

      <ToolCard
        active={showTimeline}
        colorKey="timeline"
        icon={<IoTimeOutline className={clsx(!showTimeline && TOOL_COLORS.timeline.icon)} />}
        label="Timeline"
        onClick={onToggleTimeline}
      />

      {/* Herramientas Diagnostic (ESP32) */}
      <ToolCard
        active={activeAudits.includes('lux')}
        colorKey="lux"
        disabled={!isOnline}
        icon={
          <IoSearchOutline
            className={clsx(!activeAudits.includes('lux') && TOOL_COLORS.lux.icon)}
          />
        }
        label="Lux Meter"
        pending={isPending('audit_lux_on')}
        onClick={() => onCommand('audit_lux_on', 'lux')}
      />

      <ToolCard
        active={activeAudits.includes('rain')}
        colorKey="rain"
        disabled={!isOnline}
        icon={
          <IoPulseOutline
            className={clsx(!activeAudits.includes('rain') && TOOL_COLORS.rain.icon)}
          />
        }
        label="Rain Audit"
        pending={isPending('audit_rain_on')}
        onClick={() => onCommand('audit_rain_on', 'rain')}
      />

      <ToolCard
        active={activeAudits.includes('heartbeat')}
        colorKey="heartbeat"
        icon={
          <IoHeartOutline
            className={clsx(
              activeAudits.includes('heartbeat') ? 'text-red-500' : TOOL_COLORS.heartbeat.icon,
            )}
          />
        }
        label="Heartbeat"
        onClick={() => onCommand('ui_heartbeat', 'heartbeat')}
      />

      <ToolCard
        active={activeAudits.includes('nvs')}
        colorKey="nvs"
        disabled={!isOnline}
        icon={
          <IoCodeSlashOutline
            className={clsx(!activeAudits.includes('nvs') && TOOL_COLORS.nvs.icon)}
          />
        }
        label="NVS Stack"
        pending={isPending('audit_nvs')}
        onClick={() => onCommand('audit_nvs', 'nvs')}
      />

      {/* Nuevas Auditorías v0.8.5 */}
      <ToolCard
        active={activeAudits.includes('ram')}
        colorKey="ram"
        disabled={!isOnline}
        icon={
          <IoHardwareChipOutline
            className={clsx(!activeAudits.includes('ram') && TOOL_COLORS.ram.icon)}
          />
        }
        label="RAM Audit"
        pending={isPending('audit_ram_on')}
        onClick={() => onCommand('audit_ram_on', 'ram')}
      />

      <ToolCard
        active={activeAudits.includes('health')}
        colorKey="health"
        disabled={!isOnline}
        icon={
          <IoWifiOutline
            className={clsx(!activeAudits.includes('health') && TOOL_COLORS.health.icon)}
          />
        }
        label="WiFi Audit"
        pending={isPending('audit_health_on')}
        onClick={() => onCommand('audit_health_on', 'health')}
      />

      <ToolCard
        colorKey="services"
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
  isStale?: boolean
  onRefresh?: () => void
}

export function AuditConsoleCard({
  activeAudit,
  currentPayload,
  receivedAt,
  isStale = false,
  onRefresh,
}: AuditConsoleCardProps) {
  const accumulatorRef = useRef<Record<string, unknown>>({})

  // 1. Lazy Initializer (Evita renders en cascada y soluciona rule de React react-hooks/exhaustive-deps)
  const [displayPayload, setDisplayPayload] = useState<unknown>(() => {
    if (typeof window === 'undefined' || !activeAudit) return null

    const isChartable = ['lux', 'rain'].includes(activeAudit)

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
      const isChartable = ['lux', 'rain'].includes(activeAudit || '')

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
      const isChartable = ['lux', 'rain'].includes(activeAudit)

      if (isChartable) {
        window.sessionStorage.removeItem(`audit_history_${activeAudit}`)
      }
    }
    setDisplayPayload(null)
  }

  const timeAgeStr = receivedAt
    ? `Recibido a las ${formatTime12h(receivedAt, true)}`
    : 'Esperando datos...'

  const finalDisplay = displayPayload

  if (!activeAudit && !finalDisplay) return null

  // Color de la gráfica según la categoría de auditoría
  const chartColor = AUDIT_CHART_COLORS[activeAudit || ''] || '#818cf8'
  const gradientId = `audit-grad-${activeAudit}`

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

    const isChartable = ['lux', 'rain'].includes(activeAudit || '')
    const history = (displayPayload as { history?: unknown[] })?.history

    if (isChartable && Array.isArray(history) && history.length > 0) {
      const chartData = history.map((val, idx) => {
        let value = 0
        let timeStr = String(idx)

        if (Array.isArray(val) && val.length === 2) {
          const [ts, data] = val

          timeStr = typeof ts === 'number' ? formatTime12h(ts * 1000) : String(ts)
          value = Number(data)
        } else {
          value = Number(val)
        }

        return { name: timeStr, value }
      })

      return (
        <div
          className={clsx(
            'mt-2 h-[200px] w-full select-none',
            // Clases CSS de supresión de foco (idénticas a SensorHistoryChart)
            '[&_.recharts-wrapper_*]:outline-none!',
            '[&_.recharts-surface]:outline-none!',
            '[&_.recharts-tooltip-wrapper]:outline-none!',
            '[&_.recharts-accessibility-focus]:hidden',
          )}
        >
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart accessibilityLayer={false} data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--color-input-outline)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis axisLine={false} dataKey="name" tick={false} tickLine={false} />
              <YAxis
                axisLine={false}
                domain={['auto', 'auto']}
                fontSize={11}
                stroke="var(--color-secondary)"
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1)
                }
                tickLine={false}
                tickMargin={10}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                cursor={{
                  stroke: chartColor,
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  fill: 'transparent',
                }}
                itemStyle={{ color: chartColor, fontWeight: 'bold' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Area
                activeDot={{ style: { outline: 'none' } }}
                animationDuration={800}
                dataKey="value"
                fill={`url(#${gradientId})`}
                fillOpacity={1}
                stroke={chartColor}
                strokeWidth={2}
                type="monotone"
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

  // Color del indicador pulsante del header (coincide con la herramienta)
  const headerColor = AUDIT_CHART_COLORS[activeAudit || ''] || '#6366f1'

  return (
    <Card
      className={clsx(
        'flex flex-col overflow-hidden p-0',
        'border-zinc-200 dark:border-zinc-800/50',
      )}
    >
      <div className="bg-surface border-input-outline flex items-center justify-between border-b px-5 py-2">
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: headerColor, boxShadow: `0 0 8px ${headerColor}80` }}
          />
          <span className="text-secondary font-mono text-[10px] font-bold tracking-widest uppercase opacity-80">
            {activeAudit === 'nvs' ? 'recovery.json' : `audit/${activeAudit || 'idle'}`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isStale && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-widest text-amber-500 uppercase">
              Datos Antiguos
            </span>
          )}

          {Boolean(finalDisplay) && !isStale && (
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
  const dateStr = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })

  return `${dateStr}, ${formatTime12h(timestamp)}`
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
