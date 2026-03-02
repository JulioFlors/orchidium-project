'use client'

import {
  Area,
  AreaChart,
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
  data: Record<string, number | string>[]
  className?: string
  dataKey: string
  color: string
  unit: string
  title: string
  icon?: React.ReactNode
  range: string
  onRangeChange: (range: string) => void
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
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-input-outline)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--color-primary)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                padding: '8px 12px',
                outline: 'none',
              }}
              cursor={{
                stroke: color,
                strokeWidth: 1,
                strokeDasharray: '4 4',
                fill: 'transparent',
              }}
              formatter={(value: number | string | Array<number | string> | undefined) => [
                value !== undefined ? `${value} ${unit}` : '',
                title.replace('Histórico ', ''),
              ]}
              itemStyle={{ color: color, fontWeight: 600 }}
              labelFormatter={(label) => {
                try {
                  return timeFormatter.format(new Date(label))
                } catch {
                  return ''
                }
              }}
              labelStyle={{ color: 'var(--color-secondary)', marginBottom: '0.25rem' }}
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
