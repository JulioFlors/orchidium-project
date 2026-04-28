'use client'

import { useState, useEffect, useRef } from 'react'
import {
  IoCloseOutline,
  IoCodeSlashOutline,
  IoHardwareChipOutline,
  IoHeartOutline,
  IoInformationCircleOutline,
  IoPlay,
  IoPlayCircleOutline,
  IoPulseOutline,
  IoSearchOutline,
  IoStatsChartOutline,
  IoStop,
  IoTimeOutline,
  IoTrashOutline,
  IoWifiOutline,
} from 'react-icons/io5'
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

import { ActionMenu, Card, StatusCircleIcon } from '@/components'
import { authClient, AUDIT_STORAGE_PREFIX, clearAuditData } from '@/lib'
import { formatRelativeHeartbeat, formatSmartDateTime } from '@/utils'

// ---- Interfaces de Auditoría ----
interface AuditPayload {
  history?: unknown[]
  receivedAt?: number
  [key: string]: unknown
}

// ---- Mapa de Colores por Herramienta ----
const TOOL_COLORS: Record<
  string,
  { bg: string; ring: string; border: string; icon: string; pulse: string }
> = {
  services: {
    bg: 'from-slate-500/20 to-slate-500/5',
    ring: 'ring-slate-500/10',
    border: 'border-slate-500/20',
    icon: 'text-slate-400',
    pulse: 'bg-slate-400',
  },
  timeline: {
    bg: 'from-indigo-500/20 to-indigo-500/5',
    ring: 'ring-indigo-500/10',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-400',
    pulse: 'bg-indigo-400',
  },
  lux: {
    bg: 'from-amber-500/20 to-amber-500/5',
    ring: 'ring-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    pulse: 'bg-amber-400',
  },
  rain: {
    bg: 'from-blue-500/20 to-blue-500/5',
    ring: 'ring-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    pulse: 'bg-blue-400',
  },
  heartbeat: {
    bg: 'from-red-500/20 to-red-500/5',
    ring: 'ring-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    pulse: 'bg-red-400',
  },
  nvs: {
    bg: 'from-amber-500/20 to-amber-500/5',
    ring: 'ring-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    pulse: 'bg-amber-400',
  },
  ram: {
    bg: 'from-indigo-500/20 to-indigo-500/5',
    ring: 'ring-indigo-500/10',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-400',
    pulse: 'bg-indigo-400',
  },
  health: {
    bg: 'from-purple-500/20 to-purple-500/5',
    ring: 'ring-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    pulse: 'bg-purple-400',
  },
}

const AUDIT_CHART_COLORS: Record<string, string> = {
  lux: '#fbbf24', // amber-400
  rain: '#3b82f6',
  ram: '#818cf8',
  health: '#a855f7', // purple-500
}

const fallbackColor = {
  bg: 'bg-indigo-500',
  ring: 'ring-indigo-500/10',
  border: 'border-indigo-500',
  icon: 'text-indigo-400',
}

// ---- Utilidades de Interpretación ----
const getWiFiSignalLabel = (rssi: number) => {
  if (rssi >= -50) return { label: 'Excelente', color: 'text-emerald-500' }
  if (rssi >= -60) return { label: 'Buena', color: 'text-indigo-400' }
  if (rssi >= -70) return { label: 'Regular', color: 'text-amber-500' }
  if (rssi >= -85) return { label: 'Pobre', color: 'text-orange-500' }

  return { label: 'Crítica', color: 'text-red-500' }
}

const getWiFiSignalIcon = (rssi: number) => {
  if (rssi >= -60) return <IoWifiOutline className="text-emerald-500" size={24} />
  if (rssi >= -80) return <IoWifiOutline className="text-amber-500" size={24} />

  return <IoWifiOutline className="text-red-500" size={24} />
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
        'group relative flex aspect-square min-h-[110px] w-full flex-col items-center justify-center gap-4 overflow-hidden p-6 transition-all duration-300 select-none',
        !pending && !disabled ? 'cursor-pointer' : 'cursor-wait',
        active
          ? clsx(`bg-linear-to-br ${colors.bg} ${colors.border} text-white`)
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
        !disabled && 'hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80',
        pending && `${colors.border} ring-4 ${colors.ring}`,
        disabled && 'pointer-events-none cursor-not-allowed opacity-30 grayscale',
      )}
      onClick={!pending && !disabled ? onClick : undefined}
    >
      {!disabled && (
        <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/5 dark:group-hover:bg-white/2" />
      )}
      <div
        className={clsx(
          'absolute -top-4 -right-4 h-24 w-24 rounded-full bg-current opacity-0 blur-3xl transition-opacity group-hover:opacity-10 dark:group-hover:opacity-5',
          active && 'opacity-20! dark:opacity-10!',
        )}
      />
      {active && (
        <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      )}
      <div className="relative z-10 text-current">
        <div
          className={clsx(
            'text-4xl transition-all duration-300',
            active ? 'drop-shadow-sm' : 'text-zinc-400 group-hover:text-current',
            pending && 'opacity-20',
          )}
        >
          {icon}
        </div>
      </div>
      <span
        className={clsx(
          'z-10 text-center text-[10px] font-black tracking-[0.15em] uppercase transition-colors',
          active
            ? 'text-white'
            : 'text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100',
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
  hardwarePresence: Record<string, boolean>
  showTimeline: boolean
  onToggleTimeline: () => void
}

export function ToolboxGrid({
  isOnline,
  activeAudits,
  onCommand,
  hardwarePresence,
  showTimeline,
  onToggleTimeline,
}: ToolboxGridProps) {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-1 gap-4 @min-[340px]:grid-cols-2 @min-[540px]:grid-cols-3 @min-[740px]:grid-cols-4 @min-[940px]:grid-cols-5 @min-[1140px]:grid-cols-6">
        <ToolCard
          active={showTimeline}
          colorKey="timeline"
          icon={<IoTimeOutline className={clsx(!showTimeline && TOOL_COLORS.timeline.icon)} />}
          label="Timeline"
          onClick={onToggleTimeline}
        />
        <ToolCard
          active={activeAudits.includes('lux')}
          colorKey="lux"
          disabled={!isOnline || hardwarePresence.lux === false}
          icon={
            <IoSearchOutline
              className={clsx(!activeAudits.includes('lux') && TOOL_COLORS.lux.icon)}
              size={24}
            />
          }
          label={hardwarePresence.lux === false ? 'Lux (Off)' : 'Lux Meter'}
          onClick={() => onCommand('audit_lux_on', 'lux')}
        />
        <ToolCard
          active={activeAudits.includes('rain')}
          colorKey="rain"
          disabled={!isOnline || hardwarePresence.rain === false}
          icon={
            <IoPulseOutline
              className={clsx(!activeAudits.includes('rain') && TOOL_COLORS.rain.icon)}
              size={24}
            />
          }
          label={hardwarePresence.rain === false ? 'Rain (Off)' : 'Rain Audit'}
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
              size={24}
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
              size={24}
            />
          }
          label="NVS Stack"
          onClick={() => onCommand('audit_nvs', 'nvs')}
        />
        <ToolCard
          active={activeAudits.includes('ram')}
          colorKey="ram"
          disabled={!isOnline}
          icon={
            <IoHardwareChipOutline
              className={clsx(!activeAudits.includes('ram') && TOOL_COLORS.ram.icon)}
              size={24}
            />
          }
          label="RAM Audit"
          onClick={() => onCommand('audit_ram_on', 'ram')}
        />
        <ToolCard
          active={activeAudits.includes('health')}
          colorKey="health"
          disabled={!isOnline}
          icon={
            <IoWifiOutline
              className={clsx(!activeAudits.includes('health') && TOOL_COLORS.health.icon)}
              size={24}
            />
          }
          label="Wi-Fi Audit"
          onClick={() => onCommand('audit_health_on', 'health')}
        />
        <ToolCard
          colorKey="services"
          disabled={!isOnline}
          icon={<IoPulseOutline className="rotate-90 text-red-500" size={24} />}
          label="Node Reset"
          onClick={() => {
            if (confirm('¿Reiniciar dispositivo?')) onCommand('reset', null)
          }}
        />
      </div>
    </div>
  )
}

// --- Custom Tooltip para Gráficas ---
interface TooltipItem {
  value: number
  payload: {
    name: string
    value: number
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
  label?: string
  chartColor: string
  activeAudit: string | null
}

function CustomTooltip({ active, payload, label, chartColor, activeAudit }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    let formattedVal = val.toFixed(1)

    if (activeAudit === 'rain') {
      formattedVal = Math.round(val).toString()
    } else if (activeAudit === 'lux') {
      formattedVal = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(1)
      formattedVal += ' lux'
    }

    return (
      <div className="flex flex-col gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-xl outline-none">
        <span className="font-mono text-xs font-bold" style={{ color: chartColor }}>
          {formattedVal}
        </span>
        <span className="text-xs font-medium text-zinc-400">{label}</span>
      </div>
    )
  }

  return null
}

// --- Card 2: Consola de Auditoría ---
interface AuditConsoleCardProps {
  deviceId: string
  activeAudit: string | null
  isActive: boolean
  isPending?: boolean
  isOnline?: boolean
  currentPayload: unknown
  isStale?: boolean
  onStart?: () => void
  onClose?: () => void
  onStop?: () => void
  onClear?: () => void
}

export function AuditConsoleCard({
  deviceId,
  activeAudit,
  isActive,
  isPending = false,
  isOnline = true,
  currentPayload,
  isStale = false,
  onStart,
  onClose,
  onStop,
  onClear,
}: AuditConsoleCardProps) {
  const accumulatorRef = useRef<Record<string, unknown>>({})
  const { data: session } = authClient.useSession()

  const [displayPayload, setDisplayPayload] = useState<AuditPayload | null>(null)
  const [localReceivedAt, setLocalReceivedAt] = useState<number | null>(null)
  const [hasMounted, setHasMounted] = useState(false)

  // ---- Hidratación Segura y Carga de Cache ----
  useEffect(() => {
    queueMicrotask(() => {
      setHasMounted(true)
      if (activeAudit && ['lux', 'rain', 'ram', 'health'].includes(activeAudit)) {
        const cached = window.localStorage.getItem(
          `${AUDIT_STORAGE_PREFIX}history_${deviceId}_${activeAudit}`,
        )

        if (cached) {
          try {
            const parsed = JSON.parse(cached) as AuditPayload

            setDisplayPayload(parsed)
            if (parsed.receivedAt) setLocalReceivedAt(parsed.receivedAt)
          } catch {
            // No hacer nada si el cache está corrupto
          }
        }
      }
    })
  }, [activeAudit, deviceId])

  // Auto-limpieza si la sesión caduca
  useEffect(() => {
    if (session === null) {
      clearAuditData()
    }
  }, [session])
  // ---- Limpieza Automática al Cerrar ----
  const unmountRef = useRef({ isActive, onStop })

  useEffect(() => {
    unmountRef.current = { isActive, onStop }
  }, [isActive, onStop])

  useEffect(() => {
    return () => {
      // Si el componente se desmonta y la auditoría seguía activa en el dispositivo,
      // enviamos el comando de parada.
      // NOTA: MqttStore.publishWithAck ahora evita duplicados, por lo que si ya
      // había un comando de parada en cola, esta llamada será ignorada.
      if (unmountRef.current.isActive && unmountRef.current.onStop) {
        unmountRef.current.onStop()
      }
    }
  }, [])

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
        // Error silencioso
      }
    } else {
      const isChartable = ['lux', 'rain', 'ram', 'health'].includes(activeAudit || '')

      if (isChartable) {
        setDisplayPayload((prev: unknown) => {
          const prevPayload = (prev as { history?: unknown[] }) || { history: [] }
          const incomingPayload = (currentPayload as Record<string, unknown>) || {}
          const prevHistory = prevPayload.history || []
          let incomingHistory = (incomingPayload.history as unknown[]) || []

          if (incomingHistory.length === 0 && activeAudit) {
            // Caso A: El payload es un objeto y tiene la clave de la auditoría (o 'val')
            // Caso B: El payload ya es el valor primitivo (número/string)
            // Caso C: El payload es un objeto pero NO tiene la clave (ya fue pre-indexado en el padre, ej: RAM)
            const hasKey =
              typeof incomingPayload === 'object' &&
              incomingPayload !== null &&
              (incomingPayload[activeAudit] !== undefined || incomingPayload.val !== undefined)

            const val = hasKey
              ? ((incomingPayload as Record<string, unknown>)[activeAudit] ??
                (incomingPayload as Record<string, unknown>).val)
              : incomingPayload

            // Solo agregamos si el valor es válido (no nulo/undefined)
            if (val !== undefined && val !== null) {
              const timestamp = (incomingPayload as Record<string, unknown>)?.time
                ? Number((incomingPayload as Record<string, unknown>).time) < 1000000000
                  ? Number((incomingPayload as Record<string, unknown>).time) + 946684800
                  : Number((incomingPayload as Record<string, unknown>).time)
                : Date.now() / 1000

              incomingHistory = [[timestamp, val]]
            }
          }

          const mergedMap = new Map<string, unknown>()

          // Usamos una llave que combine timestamp y un hash del valor para evitar colisiones en el mismo segundo
          const getSampleKey = (item: unknown) => {
            if (!Array.isArray(item) || item.length < 2) return null
            const ts = item[0]
            const val = JSON.stringify(item[1])

            return `${ts}_${val}`
          }

          prevHistory.forEach((item) => {
            const key = getSampleKey(item)

            if (key) mergedMap.set(key, item)
          })
          incomingHistory.forEach((item) => {
            const key = getSampleKey(item)

            if (key) mergedMap.set(key, item)
          })
          const mergedHistory = Array.from(mergedMap.values())
            .sort((a, b) => {
              const tsA = Array.isArray(a) ? Number(a[0]) : 0
              const tsB = Array.isArray(b) ? Number(b[0]) : 0

              return tsA - tsB
            })
            .slice(-30) // Últimas 30 muestras para mayor visibilidad

          const nextState = { ...incomingPayload, history: mergedHistory, receivedAt: Date.now() }

          if (typeof window !== 'undefined' && activeAudit) {
            window.localStorage.setItem(
              `${AUDIT_STORAGE_PREFIX}history_${deviceId}_${activeAudit}`,
              JSON.stringify(nextState),
            )
          }

          setLocalReceivedAt(nextState.receivedAt)

          return nextState
        })
      } else {
        const nextState = {
          ...(currentPayload as Record<string, unknown>),
          receivedAt: Date.now(),
        }

        setDisplayPayload(nextState)
        setLocalReceivedAt(nextState.receivedAt)
      }
    }
  }, [currentPayload, activeAudit, deviceId])

  const activeColor = activeAudit
    ? TOOL_COLORS[activeAudit]
      ? activeAudit
      : 'services'
    : 'services'
  const chartColor = AUDIT_CHART_COLORS[activeAudit || ''] || '#818cf8'

  const renderTrendChart = () => {
    const history = (displayPayload as { history?: unknown[] })?.history

    if (!Array.isArray(history) || history.length === 0) return null

    const chartData = history.map((val, idx) => {
      let value = 0
      let timeStr = String(idx)

      if (Array.isArray(val) && val.length === 2) {
        const [ts, data] = val

        timeStr = typeof ts === 'number' ? formatSmartDateTime(ts * 1000) : String(ts)

        if (typeof data === 'object' && data !== null) {
          if (activeAudit === 'ram') {
            const r = data as { a?: number }

            value = Number(r.a ?? 0) / 1024
          } else if (activeAudit === 'health') {
            const h = data as { rssi?: number }

            value = Number(h.rssi ?? 0)
          } else {
            value = Number(data)
          }
        } else {
          value = Number(data)
        }
      } else {
        value = Number(val)
      }

      return { name: timeStr, value }
    })

    if (!hasMounted) return <div className="mt-2 h-40 w-full" />

    return (
      <div
        className={clsx(
          'mt-2 min-h-[300px] w-full select-none',
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
              domain={
                activeAudit === 'health'
                  ? [-100, -30]
                  : activeAudit === 'lux'
                    ? [0, 90000]
                    : activeAudit === 'rain'
                      ? [0, 4095]
                      : ['auto', 'auto']
              }
              fontSize={11}
              scale="auto"
              stroke="var(--color-secondary)"
              tickFormatter={(value) => {
                if (activeAudit === 'health') return `${value}dB`
                if (activeAudit === 'rain') return value.toFixed(0)

                return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)
              }}
              tickLine={false}
              tickMargin={10}
              width={45}
            />
            <Tooltip
              content={<CustomTooltip activeAudit={activeAudit} chartColor={chartColor} />}
              cursor={{
                stroke: chartColor,
                strokeWidth: 1,
                strokeDasharray: '4 4',
                fill: 'transparent',
              }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Area
              activeDot={{ style: { outline: 'none' }, r: 4 }}
              animationDuration={800}
              dataKey="value"
              dot={chartData.length < 10 ? { r: 2, fill: chartColor } : false}
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

  const renderContent = () => {
    if (isPending && isOnline) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
          <div
            className={clsx(
              'h-12 w-12 animate-spin rounded-full border-2 border-current border-t-transparent',
              TOOL_COLORS[activeColor].icon.replace('text-', 'text-'),
            )}
          />
          <span
            className={clsx(
              'animate-pulse text-sm font-medium tracking-wide',
              TOOL_COLORS[activeColor].icon,
            )}
          >
            Estableciendo Conexión
          </span>
        </div>
      )
    }

    if (!isActive && !displayPayload) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/40 text-zinc-500">
            <IoPlayCircleOutline size={32} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-black tracking-widest text-zinc-400 uppercase">
              Diagnóstico en Pausa
            </span>
            <p className="text-[10px] leading-relaxed text-zinc-500 italic opacity-60">
              El flujo de datos está detenido. Pulse REPRODUCIR <br /> para iniciar la auditoría en
              tiempo real.
            </p>
          </div>
        </div>
      )
    }

    let dataForUi = displayPayload

    if (
      typeof displayPayload === 'object' &&
      displayPayload !== null &&
      'history' in displayPayload
    ) {
      const h = (displayPayload as { history: unknown[] }).history

      if (Array.isArray(h) && h.length > 0) {
        const lastPoint = h[h.length - 1]

        dataForUi = Array.isArray(lastPoint) ? lastPoint[1] : lastPoint
      }
    }

    if (activeAudit === 'nvs' && displayPayload) {
      return (
        <pre className="whitespace-pre-wrap text-blue-300">
          {JSON.stringify(displayPayload, null, 2)}
        </pre>
      )
    }

    if (activeAudit === 'ram' && dataForUi && typeof dataForUi === 'object') {
      const raw = dataForUi as {
        f?: number
        a?: number
        used?: number
        total?: number
        free?: number
      }
      const free = raw.free ?? raw.f ?? 0
      const used = raw.used ?? raw.a ?? 0
      const total = raw.total ?? free + used

      if (total > 0) {
        const percent = Math.round((used / total) * 100)

        return (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  className="fill-none stroke-zinc-200 dark:stroke-zinc-800"
                  cx="80"
                  cy="80"
                  r="72"
                  strokeWidth="8"
                />
                <circle
                  className={clsx(
                    'fill-none transition-all duration-1000',
                    percent > 80
                      ? 'stroke-red-500'
                      : percent > 60
                        ? 'stroke-amber-500'
                        : TOOL_COLORS[activeColor]?.icon.replace('text-', 'stroke-') ||
                          'stroke-indigo-500',
                  )}
                  cx="80"
                  cy="80"
                  r="72"
                  strokeDasharray={`${(percent / 100) * 452} 452`}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-zinc-900 dark:text-white">
                  {percent}%
                </span>
                <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                  Consumo RAM
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 border-t border-zinc-200/50 pt-6 dark:border-white/5">
              <div className="bg-black-and-white/5 flex flex-col items-start gap-1 rounded-lg p-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Libre</span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-500">
                  {(free / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="bg-black-and-white/5 flex flex-col items-start gap-1 rounded-lg p-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className={clsx(
                      'h-1.5 w-1.5 rounded-full',
                      TOOL_COLORS[activeColor]?.icon.replace('text-', 'bg-') || 'bg-indigo-500',
                    )}
                  />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Usada</span>
                </div>
                <span
                  className={clsx(
                    'font-mono text-sm font-bold',
                    TOOL_COLORS[activeColor]?.icon || 'text-indigo-400',
                  )}
                >
                  {(used / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>

            <div className="mt-4 flex w-full items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <IoInformationCircleOutline className="text-zinc-400" />
                <span className="text-sm text-zinc-500">Capacidad Total</span>
              </div>
              <span className="font-mono text-sm font-black text-zinc-400 opacity-60">
                {(total / 1024).toFixed(1)} KB
              </span>
            </div>

            {/* Gráfico de Tendencia RAM */}
            <div className="mt-8 flex w-full flex-col gap-2">
              <div className="flex items-center gap-2 px-2 text-zinc-400">
                <IoStatsChartOutline className="text-sm" />
                <span className="text-[10px] font-bold uppercase">Uso de Memoria (Tendencia)</span>
              </div>
              {renderTrendChart()}
            </div>
          </div>
        )
      }
    }

    if ((activeAudit === 'health' || activeAudit === 'state') && dataForUi) {
      const raw = dataForUi as {
        rssi?: number
        ip?: string
      }
      const rssi = raw.rssi ?? 0
      const ip = raw.ip ?? '0.0.0.0'
      const signal = getWiFiSignalLabel(rssi)

      return (
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between rounded-xl border border-zinc-200/50 bg-white p-4 dark:border-white/5 dark:bg-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-black/40">
                {getWiFiSignalIcon(rssi)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-black tracking-widest text-zinc-400 uppercase">
                  Fuerza de la Señal Inalámbrica
                </span>
                <div className="flex items-center gap-2">
                  <span className={clsx('text-sm font-bold', signal.color)}>{signal.label}</span>
                  <span className="text-sm text-zinc-500 opacity-60">({rssi} dBm)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-black-and-white/5 flex flex-col gap-1 rounded-lg p-3">
              <span className="text-sm font-bold text-zinc-400 uppercase">Dirección IP</span>
              <span
                className={clsx(
                  'font-mono text-sm font-medium',
                  TOOL_COLORS[activeColor]?.icon || 'text-indigo-400',
                )}
              >
                {ip}
              </span>
            </div>
            <div className="bg-black-and-white/5 flex flex-col gap-1 rounded-lg p-3">
              <span className="text-sm font-bold text-zinc-400 uppercase">Protocolo</span>
              <span
                className={clsx(
                  'font-mono text-sm font-medium',
                  TOOL_COLORS[activeColor]?.icon || 'text-emerald-400',
                )}
              >
                DHCP/TCP
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <IoStatsChartOutline className="text-sm" />
              <span className="text-sm font-bold uppercase">Estabilidad de Señal</span>
            </div>
            {renderTrendChart()}
          </div>
        </div>
      )
    }

    const isChartable = ['lux', 'rain', 'ram', 'health'].includes(activeAudit || '')

    if (isChartable) {
      const chart = renderTrendChart()

      if (chart) return chart
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 opacity-40">
        <div
          className={clsx(
            'h-12 w-12 animate-spin rounded-full border-2 border-current border-t-transparent',
            TOOL_COLORS[activeColor].icon,
          )}
        />
        <span
          className={clsx(
            'font-mono text-sm font-bold tracking-wide',
            TOOL_COLORS[activeColor].icon,
          )}
        >
          Esperando Datos
        </span>
      </div>
    )
  }

  const gradientId = `audit-grad-${activeAudit}`
  const content = renderContent()

  return (
    <Card className="bg-surface border-input-outline flex min-h-80 w-full max-w-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all">
      <div className="border-black-and-white/5 bg-black-and-white/5 flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'h-1.5 w-1.5 rounded-full',
              isActive && 'animate-pulse',
              isStale ? 'bg-zinc-400' : TOOL_COLORS[activeColor]?.pulse || 'bg-indigo-500',
            )}
          />
          <h3 className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase opacity-80 dark:text-zinc-400">
            {activeAudit === 'health'
              ? 'Audit/WiFi'
              : activeAudit
                ? `Audit/${activeAudit}`
                : 'Diagnostic/Console'}
            {!isOnline && isActive && (
              <span className="animate-pulse text-[9px] font-black tracking-normal text-red-500">
                (OFFLINE)
              </span>
            )}
          </h3>
          {isStale && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[8px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              STALE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {localReceivedAt && (
            <span className="font-mono text-[10px] font-medium tracking-tight text-zinc-400 opacity-60">
              {formatSmartDateTime(localReceivedAt)}
            </span>
          )}
          <div className="flex items-center gap-0.5 border-l border-zinc-200 pl-2 dark:border-white/5">
            {isActive ? (
              <button
                className="group bg-black-and-white/10 hover:bg-hover-overlay relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-red-500 transition-all disabled:pointer-events-none dark:text-red-400"
                disabled={isPending}
                type="button"
                onClick={onStop}
              >
                <IoStop size={12} />
                {/* Custom Tooltip - Cohesión Visual Pristinoplant */}
                <div className="animate-in fade-in slide-in-from-top-1 border-input-outline bg-surface pointer-events-none absolute -bottom-[34px] left-1/2 z-50 hidden -translate-x-1/2 rounded border px-2.5 py-1.5 text-[10px] font-bold text-white shadow-2xl group-hover:block">
                  <div className="border-input-outline bg-surface absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-t border-l" />
                  Cancelar
                </div>
              </button>
            ) : (
              <button
                className={clsx(
                  'group bg-black-and-white/10 hover:bg-hover-overlay relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-emerald-600 transition-all dark:text-emerald-400',
                  !isOnline && 'cursor-default opacity-30 grayscale',
                )}
                disabled={isPending || !isOnline}
                type="button"
                onClick={onStart}
              >
                <IoPlay className="ml-0.5" size={12} />
                {/* Custom Tooltip - Cohesión Visual Pristinoplant */}
                {isOnline && (
                  <div className="animate-in fade-in slide-in-from-top-1 border-input-outline bg-surface pointer-events-none absolute -bottom-[34px] left-1/2 z-50 hidden -translate-x-1/2 rounded border px-2.5 py-1.5 text-[10px] font-bold text-white shadow-2xl group-hover:block">
                    <div className="border-input-outline bg-surface absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-t border-l" />
                    Iniciar
                  </div>
                )}
              </button>
            )}

            <ActionMenu
              hoverOnly={false}
              items={[
                {
                  label: 'Limpiar Datos',
                  icon: <IoTrashOutline />,
                  onClick: () => {
                    if (activeAudit && typeof window !== 'undefined') {
                      window.localStorage.removeItem(
                        `${AUDIT_STORAGE_PREFIX}history_${deviceId}_${activeAudit}`,
                      )
                    }
                    setDisplayPayload(null)
                    onClear?.()
                  },
                },
                {
                  label: 'Cerrar',
                  icon: <IoCloseOutline />,
                  onClick: () => {
                    onStop?.()
                    if (activeAudit && typeof window !== 'undefined') {
                      window.sessionStorage.removeItem(`audit_history_${deviceId}_${activeAudit}`)
                    }
                    onClose?.()
                  },
                },
              ]}
              triggerClassName="h-8 w-8"
            />
          </div>
        </div>
      </div>
      <div className="bg-surface flex flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        <div className="animate-in fade-in flex w-full flex-col duration-300">{content}</div>
      </div>
    </Card>
  )
}

// --- Card 3: Heartbeat Monitor ---
interface HeartbeatCardProps {
  lastSeen?: number
}

export function HeartbeatCard({ lastSeen }: HeartbeatCardProps) {
  const hasSeen = Boolean(lastSeen)

  return (
    <Card className="bg-surface border-input-outline group hover:bg-hover-overlay tds-sm:flex-row tds-sm:items-center relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all">
      <div className="flex flex-1 flex-row items-center gap-4">
        <StatusCircleIcon
          colorClassName={hasSeen ? 'text-red-500' : 'text-secondary/30'}
          icon={<IoHeartOutline className={clsx(hasSeen && 'animate-pulse')} size={18} />}
          variant="vibrant"
        />

        <div className="flex flex-col gap-y-0.5 overflow-hidden text-left">
          <h3 className="text-primary text-[15px] leading-tight font-bold">Señal de vida</h3>
          <div className="text-secondary flex items-center gap-2 text-[11px] font-medium opacity-60">
            <span className="font-mono tracking-tight">
              {hasSeen ? formatRelativeHeartbeat(lastSeen!) : 'Esperando señal del nodo...'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
