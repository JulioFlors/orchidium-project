'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { clsx } from 'clsx'
// Assuming next-themes is installed or similar provider.
// If not using next-themes, we can rely on CSS variables or props.
// Recharts needs direct hex colors for some props often, or we use CSS var trick.

interface SensorHistoryChartProps {
  data: Record<string, number | string | undefined>[]
  className?: string
  dataKey: string
  color: string
  unit: string
  title: string
  icon?: React.ReactNode
  range: string
  onRangeChange: (range: string) => void
  chartType?: 'area' | 'bar'
}

interface CustomTooltipProps {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: string | number
  formatTime: (date: string | number | Date) => string
  color: string
  title: string
  unit: string
}

function CustomTooltip({
  active,
  payload,
  label,
  formatTime,
  color,
  title,
  unit,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as Record<string, string | number | undefined>

    // Mapeo de fases técnicas a etiquetas amigables
    const phaseLabels: Record<string, string> = {
      MAIN_WATER: 'Entrada de Agua',
      BOMBA: 'Bomba Activa',
      TRANSICION: 'Presurizando',
    }
    const displayPhase = data.phase ? phaseLabels[String(data.phase)] || String(data.phase) : null

    return (
      <div className="bg-surface border-input-outline relative z-50 flex flex-col overflow-visible rounded-lg border p-3 text-sm shadow-md outline-none">
        {!data.dateLabel && (
          <span className="text-primary mb-1 font-medium">
            {label !== undefined ? formatTime(label) : ''}
          </span>
        )}
        <span className="font-semibold" style={{ color }}>
          {title.replace('Histórico ', '')}: {payload[0].value} {unit}
        </span>

        {/* Detalles específicos para eventos discretos (ej: Lluvia) */}
        {data.intensity !== undefined && (
          <span className="mt-1 flex items-center gap-1.5 font-semibold text-blue-400">
            Intensidad: {data.intensity}%
          </span>
        )}

        {data.startTime && data.endTime && (
          <span className="text-primary mt-1 font-semibold">
            {data.startTime} - {data.endTime}
          </span>
        )}

        {/* Fecha y Día abajo de la duración (solicitado para barras) */}
        {data.dateLabel && (
          <span className="text-primary mt-0.5 block font-semibold">{data.dateLabel}</span>
        )}

        {displayPhase && (
          <span className="mt-1 inline-flex items-center gap-1.5 font-bold tracking-widest text-cyan-400 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Modo: {displayPhase}
          </span>
        )}
      </div>
    )
  }

  return null
}

export function SensorHistoryChart({
  data,
  className,
  dataKey,
  color,
  unit,
  title,
  icon,
  range,
  onRangeChange,
  chartType = 'area',
}: SensorHistoryChartProps) {
  // Configuración dinámica del formateador de tiempo / fecha según el rango
  const getTimeFormatter = (r: string) => {
    const opts: Intl.DateTimeFormatOptions = { timeZone: 'America/Caracas' }

    if (r === '24h') {
      opts.hour = 'numeric'
      opts.minute = '2-digit'
      opts.hour12 = true
    } else {
      opts.weekday = 'short'
      opts.day = 'numeric'
      opts.month = 'short'
      if (r === 'all') opts.year = 'numeric'
      opts.hour = '2-digit'
      opts.minute = '2-digit'
      opts.hour12 = true
    }

    return new Intl.DateTimeFormat('es-VE', opts)
  }

  const timeFormatter = getTimeFormatter(range)

  // Utilidad para asegurar consistencia del sufijo am/pm (PristinoPlant Estándar)
  const formatLabelTime = (dateVal: number | string | Date) => {
    const str = timeFormatter.format(new Date(dateVal))

    return str.replace(/A\.?\s*M\.?/i, 'a. m.').replace(/P\.?\s*M\.?/i, 'p. m.')
  }

  // Generamos un ID único para el gradiente
  const gradientId = `color-${dataKey}`

  // Calcular estadísticas
  const count = data.length
  let min = 0
  let max = 0
  let avg = 0

  if (count > 0) {
    const values = data.map((d) => Number(d[dataKey] || 0))

    min = Math.min(...values)
    max = Math.max(...values)
    avg = values.reduce((sum, val) => sum + val, 0) / count
  }

  // Helper para mostrar unidades adecuadamente (k para miles)
  const formatStat = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`

    return val.toFixed(1)
  }

  return (
    <div
      className={clsx(
        'flex w-full flex-col gap-4 rounded-md border p-5 select-none',
        'border-input-outline bg-surface',
        // Ocultamos todos los contornos de foco nativos de svg profundamente anidados
        '[&_.recharts-wrapper_*]:outline-none!',
        '[&_.recharts-surface]:outline-none!',
        '[&_.recharts-tooltip-wrapper]:outline-none!',
        // Ocultamos el rectángulo de accesibilidad SVG literal que dibuja Recharts
        '[&_.recharts-accessibility-focus]:hidden',
        className,
      )}
    >
      {/* HEADER: Icon, Title & Range Selector */}
      <div className="tds-sm:flex-row tds-sm:items-center tds-sm:justify-between flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
          )}
          <h3 className="text-primary text-lg font-bold tracking-tight">Histórico</h3>
        </div>

        {/* Range Selector Integrado */}
        <div className="bg-hover-overlay tds-sm:self-auto inline-flex self-start rounded-md p-1">
          {['24h', '7d', '30d', 'all'].map((r) => (
            <button
              key={r}
              className={clsx(
                'focus-visible:outline-accessibility mx-px cursor-pointer rounded-md px-3 py-1 text-xs font-semibold uppercase outline-transparent focus-visible:outline-2 focus-visible:-outline-offset-2',
                range === r
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-secondary hover:text-primary',
              )}
              type="button"
              onClick={(e) => {
                e.stopPropagation() // Evitar conflictos con el clic general
                onRangeChange(r)
              }}
            >
              {r === 'all' ? 'Todo' : r}
            </button>
          ))}
        </div>
      </div>

      {/* CHART AREA */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          {chartType === 'area' ? (
            <AreaChart accessibilityLayer={false} data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--color-input-outline)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis axisLine={false} dataKey="time" tick={false} tickLine={false} />
              <YAxis
                axisLine={false}
                domain={dataKey === 'humidity' ? [0, 100] : ['auto', 'auto']}
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
                content={
                  <CustomTooltip
                    color={color}
                    formatTime={formatLabelTime}
                    title={title}
                    unit={unit}
                  />
                }
                cursor={{
                  stroke: color,
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  fill: 'transparent',
                }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Area
                activeDot={{ style: { outline: 'none' } }}
                animationDuration={800}
                dataKey={dataKey}
                fill={`url(#${gradientId})`}
                fillOpacity={1}
                stroke={color}
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          ) : (
            <BarChart accessibilityLayer={false} data={data}>
              <CartesianGrid
                stroke="var(--color-input-outline)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis axisLine={false} dataKey="time" tick={false} tickLine={false} />
              <YAxis
                axisLine={false}
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
                content={
                  <CustomTooltip
                    color={color}
                    formatTime={formatLabelTime}
                    title={title}
                    unit={unit}
                  />
                }
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Bar animationDuration={800} dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* EXPLICIT SEPARATOR LINE */}
      <hr className="border-input-outline my-2 w-full" />

      {/* STATISTICS FOOTER */}
      <div className="tds-sm:grid-cols-4 grid grid-cols-2 gap-3 pt-1">
        <div className="bg-hover-overlay/50 flex flex-col items-center justify-center rounded-md py-3">
          <span className="text-secondary text-[10px] font-bold tracking-wider uppercase">
            Mínimo
          </span>
          <span className="text-primary mt-1 text-sm font-semibold">
            {count > 0 ? `${formatStat(min)} ${unit}` : '--'}
          </span>
        </div>
        <div className="bg-hover-overlay/50 flex flex-col items-center justify-center rounded-md py-3">
          <span className="text-secondary text-[10px] font-bold tracking-wider uppercase">
            Máximo
          </span>
          <span className="text-primary mt-1 text-sm font-semibold">
            {count > 0 ? `${formatStat(max)} ${unit}` : '--'}
          </span>
        </div>
        <div className="bg-hover-overlay/50 flex flex-col items-center justify-center rounded-md py-3">
          <span className="text-secondary text-[10px] font-bold tracking-wider uppercase">
            Promedio
          </span>
          <span className="text-primary mt-1 text-sm font-semibold">
            {count > 0 ? `${formatStat(avg)} ${unit}` : '--'}
          </span>
        </div>
        <div className="bg-hover-overlay/50 flex flex-col items-center justify-center rounded-md py-3">
          <span className="text-secondary text-[10px] font-bold tracking-wider uppercase">
            Registros
          </span>
          <span className="text-primary mt-1 text-sm font-semibold">{count}</span>
        </div>
      </div>
    </div>
  )
}
