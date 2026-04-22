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

interface SensorHistoryChartProps {
  data: Record<string, number | string | boolean | undefined>[]
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

interface TooltipItem {
  payload: Record<string, string | number | boolean | undefined>
  dataKey: string
  value: string | number
}

/**
 * Genera escala monocromática (claro → medio → oscuro) a partir de un color hex.
 */
function getMonochromaticScale(hex: string): { light: string; mid: string; dark: string } {
  // Mapa de colores conocidos → escala Tailwind equivalente
  const colorMap: Record<string, { light: string; mid: string; dark: string }> = {
    '#eab308': { light: '#fde047', mid: '#eab308', dark: '#a16207' }, // yellow 300/500/700
    '#f97316': { light: '#fdba74', mid: '#f97316', dark: '#c2410c' }, // orange 300/500/700
    '#3b82f6': { light: '#93c5fd', mid: '#3b82f6', dark: '#1d4ed8' }, // blue 300/500/700
    '#22c55e': { light: '#86efac', mid: '#22c55e', dark: '#15803d' }, // green 300/500/700
    '#ef4444': { light: '#fca5a5', mid: '#ef4444', dark: '#b91c1c' }, // red 300/500/700
    '#a855f7': { light: '#d8b4fe', mid: '#a855f7', dark: '#7e22ce' }, // purple 300/500/700
    '#06b6d4': { light: '#67e8f9', mid: '#06b6d4', dark: '#0e7490' }, // cyan 300/500/700
  }

  return colorMap[hex] || { light: hex + 'aa', mid: hex, dark: hex + '88' }
}

/**
 * Formatea valor numérico con 1 decimal. Si >= 1000, usa formato "Xk".
 */
function formatTooltipValue(val: unknown): string {
  const num = Number(val)

  if (isNaN(num)) return '--'
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`

  return num.toFixed(1)
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
  formatTime: (date: string | number | Date) => string
  color: string
  dataKey: string
  title: string
  unit: string
}

function CustomTooltip({
  active,
  payload,
  label,
  formatTime,
  color,
  dataKey,
  title,
  unit,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    // Buscamos el item que corresponde a la métrica principal (evitante el de la banda estadística)
    const mainItem = payload.find((i) => i.dataKey === dataKey) || payload[0]
    const data = mainItem.payload

    // Intentamos obtener min/max si existen
    const hasStats = data[`min_${dataKey}`] !== undefined && data[`max_${dataKey}`] !== undefined
    const avgValue = formatTooltipValue(data[dataKey])
    const minValue = formatTooltipValue(data[`min_${dataKey}`])
    const maxValue = formatTooltipValue(data[`max_${dataKey}`])

    // Escala monocromática basada en el color de la métrica
    const scale = getMonochromaticScale(color)

    const phaseLabels: Record<string, string> = {
      MAIN_WATER: 'Entrada de Agua',
      BOMBA: 'Bomba Activa',
      TRANSICION: 'Presurizando',
    }
    const displayPhase = data.phase ? phaseLabels[String(data.phase)] || String(data.phase) : null

    // Formateo seguro de fecha para el tooltip
    let formattedTime = ''

    if (data.time) {
      // Priorizar el campo 'time' del objeto de datos sobre el 'label' de Recharts
      try {
        const dateObj = new Date(String(data.time))

        formattedTime = isNaN(dateObj.getTime()) ? '' : formatTime(dateObj)
      } catch {
        formattedTime = ''
      }
    } else if (label !== undefined) {
      try {
        const dateObj = typeof label === 'string' ? new Date(label) : new Date(Number(label))

        formattedTime = isNaN(dateObj.getTime()) ? '' : formatTime(dateObj)
      } catch {
        formattedTime = ''
      }
    }

    return (
      <div className="bg-surface border-input-outline relative z-50 flex flex-col overflow-visible rounded-lg border p-3 text-sm shadow-md outline-none">
        {!data.dateLabel && formattedTime && (
          <span className="text-secondary mb-2 block text-xs font-semibold tracking-wider uppercase">
            {formattedTime}
          </span>
        )}

        {hasStats ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between gap-4">
                <span className="text-secondary font-medium">Máximo:</span>
                <span className="font-bold" style={{ color: scale.light }}>
                  {maxValue} {unit}
                </span>
              </div>
              {data[`max_${dataKey}_time`] && (
                <span className="text-secondary/70 text-right text-[10px]">
                  (a las {String(data[`max_${dataKey}_time`])})
                </span>
              )}
            </div>

            <div className="flex justify-between gap-4 border-t border-white/5 pt-1">
              <span className="text-secondary font-medium">Promedio:</span>
              <span className="font-bold" style={{ color: scale.mid }}>
                {avgValue} {unit}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-white/5 pt-1">
              <div className="flex justify-between gap-4">
                <span className="text-secondary font-medium">Mínimo:</span>
                <span className="font-bold" style={{ color: scale.dark }}>
                  {minValue} {unit}
                </span>
              </div>
              {data[`min_${dataKey}_time`] && (
                <span className="text-secondary/70 text-right text-[10px]">
                  (a las {String(data[`min_${dataKey}_time`])})
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="font-semibold" style={{ color }}>
            {title.replace('Histórico ', '')}: {formatTooltipValue(data[dataKey])} {unit}
          </span>
        )}

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

        {data.dateLabel && (
          <span className="text-primary mt-0.5 block font-semibold">{data.dateLabel}</span>
        )}

        {displayPhase && (
          <span className="mt-2 inline-flex items-center gap-1.5 font-bold tracking-widest text-cyan-400 uppercase">
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

  const formatLabelTime = (dateVal: number | string | Date) => {
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal)

      if (isNaN(d.getTime())) return ''
      const str = timeFormatter.format(d)

      return str.replace(/A\.?\s*M\.?/i, 'a. m.').replace(/P\.?\s*M\.?/i, 'p. m.')
    } catch {
      return ''
    }
  }

  const gradientId = `color-${dataKey}`

  // Detectar si tenemos datos estadísticos (Macro-Visión)
  const isMacro = data.length > 0 && data[0][`min_${dataKey}`] !== undefined

  const count = data.length
  let min = 0
  let max = 0
  let avg = 0

  if (count > 0) {
    let statsData = data

    if (dataKey === 'illuminance' && !isMacro) {
      // Filtrar por horario diurno (8 AM - 4 PM) solo para estadísticas de tiempo real (micro-visión)
      // Los datos Macro (Postgres) ya vienen pre-filtrados botánicamente.
      statsData = data.filter((d) => {
        const date = new Date(String(d.time))
        const hour = date.getHours()

        return hour >= 8 && hour < 16
      })
    }

    const values = statsData.map((d) => Number(d[dataKey] || 0))
    const minValues = isMacro ? statsData.map((d) => Number(d[`min_${dataKey}`] || 0)) : values
    const maxValues = isMacro ? statsData.map((d) => Number(d[`max_${dataKey}`] || 0)) : values

    if (values.length > 0) {
      min = Math.min(...minValues)
      max = Math.max(...maxValues)
      avg = values.reduce((sum, val) => sum + val, 0) / values.length
    }
  }

  const formatStat = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`

    return val.toFixed(1)
  }

  return (
    <div
      className={clsx(
        'flex w-full flex-col gap-4 rounded-md border p-5 select-none',
        'border-input-outline bg-surface',
        '[&_.recharts-wrapper_*]:outline-none!',
        '[&_.recharts-surface]:outline-none!',
        '[&_.recharts-tooltip-wrapper]:outline-none!',
        '[&_.recharts-accessibility-focus]:hidden',
        className,
      )}
    >
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
          <div>
            <h3 className="text-primary text-lg font-bold tracking-tight">Histórico</h3>
            {isMacro && (
              <span className="text-secondary text-[10px] font-semibold tracking-widest uppercase">
                (Macro-Visión Estadística)
              </span>
            )}
          </div>
        </div>

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
                e.stopPropagation()
                onRangeChange(r)
              }}
            >
              {r === 'all' ? 'Todo' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <ResponsiveContainer height={280} minHeight={0} minWidth={0} width="100%">
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
                    dataKey={dataKey}
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

              {/* Banda estadística (Solo en Macro-Visión) */}
              {isMacro && (
                <Area
                  animationDuration={800}
                  dataKey={(d) => [d[`min_${dataKey}`], d[`max_${dataKey}`]]}
                  fill={color}
                  fillOpacity={0.1}
                  stroke="none"
                  type="monotone"
                />
              )}

              {/* Línea de Promedio / Principal */}
              <Area
                activeDot={{ style: { outline: 'none' } }}
                animationDuration={800}
                dataKey={dataKey}
                fill={isMacro ? 'none' : `url(#${gradientId})`}
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
                    dataKey={dataKey}
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

      <hr className="border-input-outline my-2 w-full" />

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
