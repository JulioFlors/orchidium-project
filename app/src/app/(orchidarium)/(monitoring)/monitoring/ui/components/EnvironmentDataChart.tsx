'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { clsx } from 'clsx'

interface EnvironmentDataChartProps {
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
  allowedRanges?: string[]
}

interface TooltipItem {
  payload: Record<string, string | number | boolean | null | undefined>
  dataKey: string
  value: string | number
}

/**
 * Formatea valor numérico con 1 decimal. Si >= 1000, usa formato "Xk".
 * Si la unidad es 'min' y es un valor entero, evita mostrar decimales (.0).
 */
function formatTooltipValue(val: unknown, unit?: string): string {
  const num = Number(val)

  if (isNaN(num)) return '--'
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  if (unit === 'min' && Number.isInteger(num)) return num.toString()

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
  range?: string
}

function getCaracasYMD(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(date)
    const month = parts.find((p) => p.type === 'month')?.value
    const day = parts.find((p) => p.type === 'day')?.value
    const year = parts.find((p) => p.type === 'year')?.value

    return `${year}-${month}-${day}`
  } catch {
    return date.toISOString().split('T')[0]
  }
}

function formatTooltipHeader(timeVal: string | number | Date, hasHour: boolean): string {
  try {
    const d = timeVal instanceof Date ? timeVal : new Date(timeVal)

    if (isNaN(d.getTime())) return ''

    const eventYMD = getCaracasYMD(d)
    const todayYMD = getCaracasYMD(new Date())
    const yesterday = new Date()

    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayYMD = getCaracasYMD(yesterday)

    let dayLabel = ''

    if (eventYMD === todayYMD) {
      dayLabel = 'Hoy'
    } else if (eventYMD === yesterdayYMD) {
      dayLabel = 'Ayer'
    } else {
      const weekday = d.toLocaleDateString('es-VE', {
        weekday: 'long',
        timeZone: 'America/Caracas',
      })
      const day = d.toLocaleDateString('es-VE', { day: 'numeric', timeZone: 'America/Caracas' })
      const month = d.toLocaleDateString('es-VE', { month: 'long', timeZone: 'America/Caracas' })

      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

      dayLabel = `${capitalize(weekday)}, ${day} ${capitalize(month)}`
    }

    if (!hasHour) {
      return dayLabel
    }

    // 2. Formatear la hora local de Caracas: "7:15 am"
    const timeStr = d
      .toLocaleTimeString('es-VE', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Caracas',
      })
      .toLowerCase()

    const cleanedTime = timeStr
      .replace(/a\.\s*m\./gi, 'am')
      .replace(/p\.\s*m\./gi, 'pm')
      .replace(/a\s*m/gi, 'am')
      .replace(/p\s*m/gi, 'pm')
      .trim()

    return `${dayLabel}, ${cleanedTime}`
  } catch {
    return ''
  }
}

function cleanTimeStr(val: unknown): string {
  if (!val) return ''
  let str = String(val).toLowerCase()

  str = str
    .replace(/a\.\s*m\./gi, 'am')
    .replace(/p\.\s*m\./gi, 'pm')
    .replace(/a\s*m/gi, 'am')
    .replace(/p\s*m/gi, 'pm')
    .trim()

  return str
}

function formatTooltipStat(val: unknown, unit: string): string {
  const num = Number(val)

  if (isNaN(num)) return '--'
  if (unit !== 'min') return `${formatTooltipValue(val, unit)} ${unit}`.trim()

  const roundedVal = Math.round(num)

  if (roundedVal < 60) {
    return `${roundedVal} min`
  }

  const hours = Math.floor(roundedVal / 60)
  const remaining = roundedVal % 60

  if (remaining === 0) return `${hours}h`

  return `${hours}h ${remaining}min`
}

function CustomTooltip({
  active,
  payload,
  label,
  color,
  dataKey,
  unit,
  range,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    // Buscamos el item que corresponde a la métrica principal (evitante el de la banda estadística)
    const mainItem = payload.find((i) => i.dataKey === dataKey) || payload[0]
    const data = mainItem.payload

    // Intentamos obtener min/max si existen
    const hasStats = data[`min_${dataKey}`] !== undefined && data[`max_${dataKey}`] !== undefined
    const avgValue = formatTooltipValue(data[dataKey], unit)
    const minValue = formatTooltipValue(data[`min_${dataKey}`], unit)
    const maxValue = formatTooltipValue(data[`max_${dataKey}`], unit)

    // Formateo seguro de fecha para el tooltip
    let formattedTime = ''

    if (data.time && typeof data.time !== 'boolean') {
      try {
        const isMacroRange = range === '7d' || range === '30d' || range === 'all'
        const showHour = !isMacroRange || !!data.isInfered || dataKey === 'duration'

        formattedTime = formatTooltipHeader(data.time as string | number | Date, showHour)
      } catch {
        formattedTime = ''
      }
    } else if (label !== undefined) {
      try {
        const dateObj = typeof label === 'string' ? new Date(label) : new Date(Number(label))
        const isMacroRange = range === '7d' || range === '30d' || range === 'all'
        const showHour = !isMacroRange || !!data.isInfered || dataKey === 'duration'

        formattedTime = formatTooltipHeader(dateObj, showHour)
      } catch {
        formattedTime = ''
      }
    }

    let baselineTimeText = 'Condiciones climáticas previas'
    if (data.isInfered) {
      if (data.startedAt && typeof data.startedAt !== 'boolean' && data.baselineAgeMinutes !== undefined && data.baselineAgeMinutes !== null) {
        try {
          const startTime = new Date(data.startedAt as any)
          const baselineTime = new Date(startTime.getTime() - Number(data.baselineAgeMinutes) * 60 * 1000)
          
          // Formateador limpio a las hh:mm en minúsculas (pm/am)
          const rawTimeStr = baselineTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const cleanTimeStr = rawTimeStr.toLowerCase() // 08:40 pm
          
          baselineTimeText = `Condiciones climáticas a las ${cleanTimeStr}`
        } catch {
          baselineTimeText = `Condiciones climáticas hace ${data.baselineAgeMinutes}min`
        }
      } else if (data.baselineAgeMinutes !== undefined && data.baselineAgeMinutes !== null) {
        baselineTimeText = `Condiciones climáticas hace ${data.baselineAgeMinutes}min`
      } else {
        baselineTimeText = 'Condiciones climáticas previas (10-20 min antes)'
      }
    }

    if (data.isInfered) {
      // Parsear Inicio
      let triggerTitle = 'Inferencia de Lluvia'
      let triggerDetails = ''
      if (typeof data.triggerReason === 'string') {
        const triggerStr = data.triggerReason
        const triggerParts = triggerStr.split(':')
        if (triggerParts.length > 1) {
          triggerTitle = triggerParts[0].trim()
          triggerDetails = triggerParts.slice(1).join(':').trim()
        } else {
          triggerDetails = triggerStr
        }
      }

      // Parsear Cese
      let closeTitle = 'Cese de Lluvia'
      let closeDetails = ''
      let isNight = true

      if (data.endedAt) {
        try {
          const endDate = new Date(data.endedAt as any)
          const localHour = (endDate.getUTCHours() - 4 + 24) % 24
          isNight = localHour < 8 || localHour >= 16
        } catch {}
      } else if (data.startedAt) {
        try {
          const startDate = new Date(data.startedAt as any)
          const localHour = (startDate.getUTCHours() - 4 + 24) % 24
          isNight = localHour < 8 || localHour >= 16
        } catch {}
      }

      const closeIcon = isNight ? '☁' : '⛅'

      if (typeof data.closeReason === 'string') {
        const reasonStr = data.closeReason
        const reasonUpper = reasonStr.toUpperCase()
        if (reasonUpper.includes('STAGNANT') || reasonUpper.includes('ESTANCAMIENTO')) {
          closeTitle = 'Cese por estancamiento'
        } else if (reasonUpper.includes('SOLAR_RECOVERY') || reasonUpper.includes('SOLAR')) {
          closeTitle = 'Cese por recuperación solar'
        } else if (reasonUpper.includes('BASELINE_RECOVERY') || reasonUpper.includes('RECUPERACIÓN')) {
          closeTitle = 'Cese por recuperación adaptativa'
        }

        // Extraer los detalles dentro de paréntesis si existen, por ejemplo STAGNANT (dT=0.1°C <= 0.4)
        const match = reasonStr.match(/\(([^)]+)\)/)
        if (match) {
          closeDetails = match[1]
        } else {
          // Fallback al formato alternativo con dos puntos si no hay paréntesis
          const parts = reasonStr.split(':')
          if (parts.length > 1) {
            closeDetails = parts.slice(1).join(':').trim()
          } else {
            closeDetails = reasonStr
          }
        }

        // Reemplazar abreviaciones de motivos comunes en los detalles para pulir estética
        closeDetails = closeDetails
          .replace('dT=', 'Caída térmica de ')
          .replace('°C <= 0.4', '°C')
          .replace('<= 0.4', '')
          .trim()
        
        // Poner la primera letra en mayúscula para detalles limpios
        if (closeDetails.length > 0) {
          closeDetails = closeDetails.charAt(0).toUpperCase() + closeDetails.slice(1)
          if (!closeDetails.endsWith('.')) closeDetails += '.'
        }
      }

      return (
        <div className="bg-surface border-input-outline relative z-50 flex max-w-[340px] flex-col gap-3 overflow-visible rounded-lg border p-3 text-xs shadow-md outline-none">
          {/* Encabezado: Fecha y Duración */}
          <div className="text-foreground flex flex-col gap-1 text-xs font-bold">
            <span className="flex items-center gap-1.5">📅 {formattedTime}</span>
            <span className="flex items-center gap-1.5">
              ⏱️ Duración: {formatTooltipStat(data[dataKey], unit)}
            </span>
          </div>

          {/* Condiciones Climáticas Previas */}
          <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
            <span className="text-foreground font-bold">
              {baselineTimeText}
            </span>
            <span className="text-foreground/80 font-medium">
              🌡️ Temp:{' '}
              {data.baselineTemp !== undefined && data.baselineTemp !== null
                ? `${Number(data.baselineTemp).toFixed(1)}°C`
                : '--'}{' '}
              | 💧 Hum:{' '}
              {data.baselineHum !== undefined && data.baselineHum !== null
                ? `${Number(data.baselineHum).toFixed(1)}%`
                : '--'}{' '}
              | ☀️ Ilum:{' '}
              {data.baselineLux !== undefined && data.baselineLux !== null
                ? formatTooltipValue(data.baselineLux, 'lx')
                : '--'}{' '}
              lx
            </span>
          </div>

          {/* Inicio */}
          {data.triggerReason && (
            <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
              <span className="font-bold text-purple-400">🌧️ {triggerTitle}</span>
              <span className="text-foreground/80 leading-relaxed font-medium">
                {triggerDetails}
              </span>
            </div>
          )}

          {/* Cierre */}
          {data.closeReason && (
            <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
              <span className="font-bold text-purple-400">{closeIcon} {closeTitle}</span>
              <span className="text-foreground/80 leading-relaxed font-medium">
                {closeDetails}
              </span>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="bg-surface border-input-outline relative z-50 flex flex-col overflow-visible rounded-lg border p-3 text-xs shadow-md outline-none">
        {hasStats ? (
          dataKey === 'temperature' || dataKey === 'humidity' ? (
            <div className="flex min-w-[280px] flex-col gap-3">
              {/* Bloque 1: Consolidado 24h */}
              <div className="flex flex-col gap-1">
                <span className="text-foreground flex items-center gap-1 text-xs font-bold">
                  📊 {formattedTime}
                </span>
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Máx</span>
                    <span>
                      <span style={{ color }}>
                        {maxValue} {unit}
                      </span>
                      {data[`max_${dataKey}_time`] && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data[`max_${dataKey}_time`])}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Prom</span>
                    <span style={{ color }}>
                      {avgValue} {unit}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Mín</span>
                    <span>
                      <span style={{ color }}>
                        {minValue} {unit}
                      </span>
                      {data[`min_${dataKey}_time`] && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data[`min_${dataKey}_time`])}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Día */}
              <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
                <span className="text-foreground flex items-center gap-1 text-xs font-bold">
                  ☀️ Día (08:00 am - 04:00 pm)
                </span>
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Máx</span>
                    <span>
                      <span style={{ color }}>
                        {data[`max_${dataKey}_day`] !== undefined &&
                        data[`max_${dataKey}_day`] !== null
                          ? `${formatTooltipValue(data[`max_${dataKey}_day`], unit)} ${unit}`
                          : '--'}
                      </span>
                      {data[`max_${dataKey}_day_time`] && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data[`max_${dataKey}_day_time`])}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Prom</span>
                    <span style={{ color }}>
                      {data[`avg_${dataKey}_day`] !== undefined &&
                      data[`avg_${dataKey}_day`] !== null
                        ? `${formatTooltipValue(data[`avg_${dataKey}_day`], unit)} ${unit}`
                        : '--'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Mín</span>
                    <span>
                      <span style={{ color }}>
                        {data[`min_${dataKey}_day`] !== undefined &&
                        data[`min_${dataKey}_day`] !== null
                          ? `${formatTooltipValue(data[`min_${dataKey}_day`], unit)} ${unit}`
                          : '--'}
                      </span>
                      {data[`min_${dataKey}_day_time`] && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data[`min_${dataKey}_day_time`])}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Noche */}
              <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
                <span className="text-foreground flex items-center gap-1 text-xs font-bold">
                  🌙 Noche (07:00 pm - 05:59 am)
                </span>
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Máx</span>
                    <span>
                      <span style={{ color }}>
                        {data[`max_${dataKey}_night`] !== undefined &&
                        data[`max_${dataKey}_night`] !== null
                          ? `${formatTooltipValue(data[`max_${dataKey}_night`], unit)} ${unit}`
                          : '--'}
                      </span>
                      {data[`max_${dataKey}_night_time`] && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data[`max_${dataKey}_night_time`])}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Prom</span>
                    <span style={{ color }}>
                      {data[`avg_${dataKey}_night`] !== undefined &&
                      data[`avg_${dataKey}_night`] !== null
                        ? `${formatTooltipValue(data[`avg_${dataKey}_night`], unit)} ${unit}`
                        : '--'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Mín</span>
                    <span>
                      <span style={{ color }}>
                        {data[`min_${dataKey}_night`] !== undefined &&
                        data[`min_${dataKey}_night`] !== null
                          ? `${formatTooltipValue(data[`min_${dataKey}_night`], unit)} ${unit}`
                          : '--'}
                      </span>
                      {data[`min_${dataKey}_night_time`] && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data[`min_${dataKey}_night_time`])}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : dataKey === 'illuminance' ? (
            <div className="flex min-w-[280px] flex-col gap-3">
              {/* Cabecera de fecha */}
              <div className="flex flex-col gap-1">
                <span className="text-foreground flex items-center gap-1 text-xs font-bold">
                  📊 {formattedTime}
                </span>
              </div>

              {/* Bloque 1: Amanecer */}
              <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
                <span className="text-foreground flex items-center gap-1 text-xs font-bold">
                  🌄 Amanecer (06:00 am - 08:00 am)
                </span>
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Máx</span>
                    <span>
                      <span style={{ color }}>
                        {data.max_illum_dawn !== undefined && data.max_illum_dawn !== null
                          ? `${formatTooltipValue(data.max_illum_dawn, unit)} ${unit}`
                          : '--'}
                      </span>
                      {data.max_illum_dawn_time && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data.max_illum_dawn_time)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Prom</span>
                    <span style={{ color }}>
                      {data.avg_illum_dawn !== undefined && data.avg_illum_dawn !== null
                        ? `${formatTooltipValue(data.avg_illum_dawn, unit)} ${unit}`
                        : '--'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Mín</span>
                    <span>
                      <span style={{ color }}>
                        {data.min_illum_dawn !== undefined && data.min_illum_dawn !== null
                          ? `${formatTooltipValue(data.min_illum_dawn, unit)} ${unit}`
                          : '--'}
                      </span>
                      {data.min_illum_dawn_time && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data.min_illum_dawn_time)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Fotoperíodo */}
              <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
                <span className="text-foreground flex items-center gap-1 text-xs font-bold">
                  ☀️ Fotoperiodo (08:00 am - 04:00 pm)
                </span>
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Máx</span>
                    <span>
                      <span style={{ color }}>
                        {data.max_illum_day !== undefined && data.max_illum_day !== null
                          ? `${formatTooltipValue(data.max_illum_day, unit)} ${unit}`
                          : '--'}
                      </span>
                      {data.max_illum_day_time && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data.max_illum_day_time)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Prom</span>
                    <span style={{ color }}>
                      {data.avg_illum_day !== undefined && data.avg_illum_day !== null
                        ? `${formatTooltipValue(data.avg_illum_day, unit)} ${unit}`
                        : '--'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Mín</span>
                    <span>
                      <span style={{ color }}>
                        {data.min_illum_day !== undefined && data.min_illum_day !== null
                          ? `${formatTooltipValue(data.min_illum_day, unit)} ${unit}`
                          : '--'}
                      </span>
                      {data.min_illum_day_time && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data.min_illum_day_time)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Atardecer */}
              <div className="border-input-outline/30 flex flex-col gap-1 border-t pt-2">
                <span className="text-foreground flex items-center gap-1 text-xs font-bold">
                  🌙 Atardecer (04:01 pm - 06:00 pm)
                </span>
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Máx</span>
                    <span>
                      <span style={{ color }}>
                        {data.max_illum_dusk !== undefined && data.max_illum_dusk !== null
                          ? `${formatTooltipValue(data.max_illum_dusk, unit)} ${unit}`
                          : '--'}
                      </span>
                      {data.max_illum_dusk_time && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data.max_illum_dusk_time)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Prom</span>
                    <span style={{ color }}>
                      {data.avg_illum_dusk !== undefined && data.avg_illum_dusk !== null
                        ? `${formatTooltipValue(data.avg_illum_dusk, unit)} ${unit}`
                        : '--'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-[10px] font-semibold">Mín</span>
                    <span>
                      <span style={{ color }}>
                        {data.min_illum_dusk !== undefined && data.min_illum_dusk !== null
                          ? `${formatTooltipValue(data.min_illum_dusk, unit)} ${unit}`
                          : '--'}
                      </span>
                      {data.min_illum_dusk_time && (
                        <span className="text-foreground ml-1 text-[10px] font-normal">
                          {cleanTimeStr(data.min_illum_dusk_time)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between gap-4">
                  <span className="text-foreground font-semibold">Máximo:</span>
                  <span className="font-bold" style={{ color }}>
                    {formatTooltipStat(data[`max_${dataKey}`], unit)}
                  </span>
                </div>
                {data[`max_${dataKey}_time`] && (
                  <span className="text-foreground text-right text-[10px]">
                    {cleanTimeStr(data[`max_${dataKey}_time`])}
                  </span>
                )}
              </div>

              <div className="flex justify-between gap-4 border-t border-white/5 pt-1">
                <span className="text-foreground font-semibold">Promedio:</span>
                <span className="font-bold" style={{ color }}>
                  {formatTooltipStat(data[dataKey], unit)}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 border-t border-white/5 pt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-foreground font-semibold">Mínimo:</span>
                  <span className="font-bold" style={{ color }}>
                    {formatTooltipStat(data[`min_${dataKey}`], unit)}
                  </span>
                </div>
                {data[`min_${dataKey}_time`] && (
                  <span className="text-foreground text-right text-[10px]">
                    {cleanTimeStr(data[`min_${dataKey}_time`])}
                  </span>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-1">
            {(data.dateLabel || formattedTime) && (
              <span className="text-foreground mb-1 block text-xs font-bold">
                📅 {data.dateLabel || formattedTime}
              </span>
            )}
            <span className="text-xs font-bold" style={{ color }}>
              {dataKey === 'duration' ? '⏳ Duración: ' : ''}
              {formatTooltipStat(data[dataKey], unit)}
            </span>
          </div>
        )}

        {data.intensity !== undefined && (
          <span className="mt-1 flex items-center gap-1.5 font-semibold text-blue-400">
            Intensidad: {formatTooltipValue(data.intensity)}%
          </span>
        )}

        {data.typeLabel && (
          <span
            className={`mt-1 block text-xs font-semibold ${data.isInfered ? 'text-amber-400' : 'text-cyan-400'}`}
          >
            {data.typeLabel}
          </span>
        )}

        {data.startTime && data.endTime && (
          <span className="text-primary mt-1 text-xs font-semibold">
            🕒 {data.startTime} - {data.endTime}
          </span>
        )}
      </div>
    )
  }

  return null
}

export function EnvironmentDataChart({
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
  allowedRanges,
}: EnvironmentDataChartProps) {
  const getTimeFormatter = (r: string) => {
    const opts: Intl.DateTimeFormatOptions = { timeZone: 'America/Caracas' }

    if (r === '24h' || r === '5-19h' || r === '8-16h' || r === 'today') {
      opts.hour = 'numeric'
      opts.minute = '2-digit'
      opts.hour12 = true
    } else if (r === '1D') {
      opts.weekday = 'short'
      opts.day = 'numeric'
      opts.month = 'short'
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

      return str.replace(/A\.?\s*M\.?/i, 'am').replace(/P\.?\s*M\.?/i, 'pm')
    } catch {
      return ''
    }
  }

  const gradientId = `color-${dataKey}`

  const chartDataFiltered = useMemo(() => {
    return data.filter((d) => d[dataKey] != null)
  }, [data, dataKey])

  // Optimizamos el procesamiento de datos con useMemo para evitar lags en el renderizado
  const stats = useMemo(() => {
    // Detectar si tenemos datos estadísticos (Macro-Visión) en cualquier punto del dataset
    const isMacroDetected =
      chartDataFiltered.length > 0 &&
      chartDataFiltered.some((d) => d[`min_${dataKey}`] !== undefined)

    // Filtrar datos nulos para la métrica activa antes de calcular estadísticas
    const validPoints = chartDataFiltered
    const count = validPoints.length
    let min = 0
    let max = 0
    let avg = 0

    let dayStats = { min: 0, max: 0, avg: 0, count: 0 }
    let nightStats = { min: 0, max: 0, avg: 0, count: 0 }
    let illumDawnStats = { min: 0, max: 0, avg: 0, count: 0 }
    let illumDayStats = { min: 0, max: 0, avg: 0, count: 0 }
    let illumDuskStats = { min: 0, max: 0, avg: 0, count: 0 }
    let isDetailed = false

    if (count > 0) {
      const isRealtimeRange =
        range === '24h' ||
        range === '1D' ||
        range === 'today' ||
        range === 'yesterday' ||
        range === '8-16h' ||
        range === '5-19h'
      const isTargetMetric = dataKey === 'temperature' || dataKey === 'humidity'

      if (isRealtimeRange && isTargetMetric) {
        isDetailed = true

        // 1. General (24h)
        const generalValues = validPoints.map((d) => Number(d[dataKey]))

        min = Math.min(...generalValues)
        max = Math.max(...generalValues)
        avg = generalValues.reduce((sum, val) => sum + val, 0) / generalValues.length

        // 2. Día (08:00 AM - 04:00 PM)
        const dayPoints = validPoints.filter((d) => {
          const dDate = new Date(String(d.time))
          const hour = (dDate.getUTCHours() - 4 + 24) % 24
          const minVal = dDate.getUTCMinutes()

          return (hour >= 8 && hour < 16) || (hour === 16 && minVal === 0)
        })

        if (dayPoints.length > 0) {
          const dayValues = dayPoints.map((d) => Number(d[dataKey]))

          dayStats = {
            min: Math.min(...dayValues),
            max: Math.max(...dayValues),
            avg: dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length,
            count: dayPoints.length,
          }
        }

        // 3. Noche (07:00 PM - 05:59 AM)
        const nightPoints = validPoints.filter((d) => {
          const dDate = new Date(String(d.time))
          const hour = (dDate.getUTCHours() - 4 + 24) % 24

          return hour >= 19 || hour <= 5
        })

        if (nightPoints.length > 0) {
          const nightValues = nightPoints.map((d) => Number(d[dataKey]))

          nightStats = {
            min: Math.min(...nightValues),
            max: Math.max(...nightValues),
            avg: nightValues.reduce((sum, val) => sum + val, 0) / nightValues.length,
            count: nightPoints.length,
          }
        }
      } else if (isRealtimeRange && dataKey === 'illuminance') {
        if (range !== '8-16h') {
          isDetailed = true

          // Calcular bloques de iluminancia al vuelo
          const dawnPoints = validPoints.filter((d) => {
            const dDate = new Date(String(d.time))
            const hour = (dDate.getUTCHours() - 4 + 24) % 24

            return hour >= 5 && hour < 8
          })

          const dayPoints = validPoints.filter((d) => {
            const dDate = new Date(String(d.time))
            const hour = (dDate.getUTCHours() - 4 + 24) % 24
            const minVal = dDate.getUTCMinutes()

            return (hour >= 8 && hour < 16) || (hour === 16 && minVal === 0)
          })

          const duskPoints = validPoints.filter((d) => {
            const dDate = new Date(String(d.time))
            const hour = (dDate.getUTCHours() - 4 + 24) % 24
            const minVal = dDate.getUTCMinutes()

            return (
              (hour === 16 && minVal > 0) ||
              (hour >= 17 && hour < 19) ||
              (hour === 19 && minVal === 0)
            )
          })

          if (dawnPoints.length > 0) {
            const values = dawnPoints.map((d) => Number(d[dataKey]))

            illumDawnStats = {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((sum, val) => sum + val, 0) / values.length,
              count: dawnPoints.length,
            }
          }

          if (dayPoints.length > 0) {
            const values = dayPoints.map((d) => Number(d[dataKey]))

            illumDayStats = {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((sum, val) => sum + val, 0) / values.length,
              count: dayPoints.length,
            }
          }

          if (duskPoints.length > 0) {
            const values = duskPoints.map((d) => Number(d[dataKey]))

            illumDuskStats = {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((sum, val) => sum + val, 0) / values.length,
              count: duskPoints.length,
            }
          }

          // Para promedio general de iluminancia, excluimos la noche para evitar sesgar a cero
          const activeIllumPoints = validPoints.filter((d) => {
            const dDate = new Date(String(d.time))
            const hour = (dDate.getUTCHours() - 4 + 24) % 24
            const minVal = dDate.getUTCMinutes()

            return (hour >= 8 && hour < 16) || (hour === 16 && minVal === 0)
          })
          const activeVals =
            activeIllumPoints.length > 0
              ? activeIllumPoints.map((d) => Number(d[dataKey]))
              : validPoints.map((d) => Number(d[dataKey]))

          min = Math.min(...validPoints.map((d) => Number(d[dataKey])))
          max = Math.max(...validPoints.map((d) => Number(d[dataKey])))
          avg = activeVals.reduce((sum, val) => sum + val, 0) / activeVals.length
        } else {
          isDetailed = false
          // Si el rango es 8h (8-16h), mostramos el valor general del periodo
          const values = validPoints.map((d) => Number(d[dataKey]))

          min = Math.min(...values)
          max = Math.max(...values)
          avg = values.reduce((sum, val) => sum + val, 0) / values.length
        }
      } else {
        let statsData = validPoints

        if (dataKey === 'illuminance' && !isMacroDetected) {
          if (range === '12h' || range === '24h' || range === '8-16h' || range === '5-19h') {
            // Filtrar por horario diurno para evitar sesgar el promedio con valores nocturnos de 0 lx
            statsData = validPoints.filter((d) => {
              const dDate = new Date(String(d.time))
              const hour = (dDate.getUTCHours() - 4 + 24) % 24
              const minVal = dDate.getUTCMinutes()

              return (hour >= 8 && hour < 16) || (hour === 16 && minVal === 0)
            })
          }
        }

        const values = statsData.map((d) => Number(d[dataKey]))
        const minValues = isMacroDetected
          ? statsData.map((d) => Number(d[`min_${dataKey}`] ?? d[dataKey]))
          : values
        const maxValues = isMacroDetected
          ? statsData.map((d) => Number(d[`max_${dataKey}`] ?? d[dataKey]))
          : values

        if (values.length > 0) {
          min = Math.min(...minValues)
          max = Math.max(...maxValues)
          avg = values.reduce((sum, val) => sum + val, 0) / values.length
        }

        // Si tenemos datos macroprocesados (Postgres), calcular los desgloses agregados para el footer
        if (isMacroDetected) {
          const isTargetMetric = dataKey === 'temperature' || dataKey === 'humidity'

          if (isTargetMetric) {
            isDetailed = true
            const dayMins = validPoints
              .map((d) => d[`min_${dataKey}_day`] ?? d[`min_${dataKey}`])
              .filter((v) => v != null)
              .map(Number)
            const dayMaxs = validPoints
              .map((d) => d[`max_${dataKey}_day`] ?? d[`max_${dataKey}`])
              .filter((v) => v != null)
              .map(Number)
            const dayAvgs = validPoints
              .map((d) => d[`avg_${dataKey}_day`])
              .filter((v) => v != null)
              .map(Number)

            const nightMins = validPoints
              .map((d) => d[`min_${dataKey}_night`] ?? d[`min_${dataKey}`])
              .filter((v) => v != null)
              .map(Number)
            const nightMaxs = validPoints
              .map((d) => d[`max_${dataKey}_night`] ?? d[`max_${dataKey}`])
              .filter((v) => v != null)
              .map(Number)
            const nightAvgs = validPoints
              .map((d) => d[`avg_${dataKey}_night`])
              .filter((v) => v != null)
              .map(Number)

            dayStats = {
              min: dayMins.length > 0 ? Math.min(...dayMins) : 0,
              max: dayMaxs.length > 0 ? Math.max(...dayMaxs) : 0,
              avg: dayAvgs.length > 0 ? dayAvgs.reduce((s, v) => s + v, 0) / dayAvgs.length : 0,
              count: dayAvgs.length,
            }

            nightStats = {
              min: nightMins.length > 0 ? Math.min(...nightMins) : 0,
              max: nightMaxs.length > 0 ? Math.max(...nightMaxs) : 0,
              avg:
                nightAvgs.length > 0 ? nightAvgs.reduce((s, v) => s + v, 0) / nightAvgs.length : 0,
              count: nightAvgs.length,
            }
          } else if (dataKey === 'illuminance') {
            isDetailed = true
            const dawnMins = validPoints
              .map((d) => d.min_illum_dawn)
              .filter((v) => v != null)
              .map(Number)
            const dawnMaxs = validPoints
              .map((d) => d.max_illum_dawn)
              .filter((v) => v != null)
              .map(Number)
            const dawnAvgs = validPoints
              .map((d) => d.avg_illum_dawn)
              .filter((v) => v != null)
              .map(Number)

            const dayMins = validPoints
              .map((d) => d.min_illum_day)
              .filter((v) => v != null)
              .map(Number)
            const dayMaxs = validPoints
              .map((d) => d.max_illum_day)
              .filter((v) => v != null)
              .map(Number)
            const dayAvgs = validPoints
              .map((d) => d.avg_illum_day)
              .filter((v) => v != null)
              .map(Number)

            const duskMins = validPoints
              .map((d) => d.min_illum_dusk)
              .filter((v) => v != null)
              .map(Number)
            const duskMaxs = validPoints
              .map((d) => d.max_illum_dusk)
              .filter((v) => v != null)
              .map(Number)
            const duskAvgs = validPoints
              .map((d) => d.avg_illum_dusk)
              .filter((v) => v != null)
              .map(Number)

            illumDawnStats = {
              min: dawnMins.length > 0 ? Math.min(...dawnMins) : 0,
              max: dawnMaxs.length > 0 ? Math.max(...dawnMaxs) : 0,
              avg: dawnAvgs.length > 0 ? dawnAvgs.reduce((s, v) => s + v, 0) / dawnAvgs.length : 0,
              count: dawnAvgs.length,
            }

            illumDayStats = {
              min: dayMins.length > 0 ? Math.min(...dayMins) : 0,
              max: dayMaxs.length > 0 ? Math.max(...dayMaxs) : 0,
              avg: dayAvgs.length > 0 ? dayAvgs.reduce((s, v) => s + v, 0) / dayAvgs.length : 0,
              count: dayAvgs.length,
            }

            illumDuskStats = {
              min: duskMins.length > 0 ? Math.min(...duskMins) : 0,
              max: duskMaxs.length > 0 ? Math.max(...duskMaxs) : 0,
              avg: duskAvgs.length > 0 ? duskAvgs.reduce((s, v) => s + v, 0) / duskAvgs.length : 0,
              count: duskAvgs.length,
            }
          }
        }
      }
    }

    return {
      isMacro: isMacroDetected,
      count,
      min,
      max,
      avg,
      dayStats,
      nightStats,
      illumDawnStats,
      illumDayStats,
      illumDuskStats,
      isDetailed,
    }
  }, [dataKey, chartDataFiltered, range])

  const {
    isMacro,
    count,
    min,
    max,
    avg,
    dayStats,
    nightStats,
    illumDawnStats,
    illumDayStats,
    illumDuskStats,
    isDetailed,
  } = stats

  const totalRainAccumulated = useMemo(() => {
    if (dataKey !== 'duration') return 0

    return chartDataFiltered.reduce((sum, d) => sum + Number(d.duration || 0), 0)
  }, [chartDataFiltered, dataKey])

  const formatStat = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
    if (unit === 'min' && Number.isInteger(val)) return val.toString()

    return val.toFixed(1)
  }

  const formatStatValue = (val: number) => {
    if (unit !== 'min') return `${formatStat(val)} ${unit}`.trim()

    const roundedVal = Math.round(val)

    if (roundedVal < 60) {
      return `${roundedVal} min`
    }

    const hours = Math.floor(roundedVal / 60)
    const remaining = roundedVal % 60

    if (remaining === 0) return `${hours}h`

    return `${hours}h ${remaining}min`
  }

  const getRangeLabel = (r: string) => {
    if (dataKey === 'duration') {
      if (r === 'today') return 'HOY'
      if (r === 'yesterday') return '1D'
      if (r === '7d') return '7D'
      if (r === '30d') return '30D'
      if (r === 'all') return 'TODO'
    }
    if (r === '24h') return 'HOY'
    if (r === 'all') return 'Todo'
    if (r === '5-19h') return '14h'
    if (r === '8-16h') return '8h'

    return r
  }

  const rangeOptions =
    allowedRanges ||
    (dataKey === 'illuminance'
      ? ['8-16h', '5-19h', '1D', '30d', 'all']
      : ['24h', '1D', '7d', '30d', 'all'])

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
            <h3 className="text-primary text-lg font-bold tracking-tight">{title}</h3>
            {isMacro && (
              <span className="text-secondary text-[10px] font-semibold tracking-widest uppercase">
                (Macro-Visión Estadística)
              </span>
            )}
          </div>
        </div>

        <div className="bg-hover-overlay tds-sm:w-auto tds-sm:inline-flex flex w-full rounded-md p-1">
          {rangeOptions.map((r) => (
            <button
              key={r}
              className={clsx(
                'focus-visible:outline-accessibility mx-px cursor-pointer rounded-md px-3 py-1 text-xs font-semibold uppercase outline-transparent focus-visible:outline-2 focus-visible:-outline-offset-2',
                'tds-sm:flex-none flex-1 text-center',
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
              {getRangeLabel(r)}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <ResponsiveContainer height={280} minHeight={0} minWidth={0} width="100%">
          {chartType === 'area' ? (
            <AreaChart accessibilityLayer={false} data={chartDataFiltered}>
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
                animationDuration={0}
                content={
                  <CustomTooltip
                    color={color}
                    dataKey={dataKey}
                    formatTime={formatLabelTime}
                    range={range}
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
                isAnimationActive={false}
                wrapperStyle={{ outline: 'none' }}
              />

              {/* Banda estadística (Solo en Macro-Visión) */}
              {isMacro && (
                <Area
                  connectNulls
                  animationDuration={200}
                  dataKey={(d) => [d[`min_${dataKey}`], d[`max_${dataKey}`]]}
                  fill={color}
                  fillOpacity={0.1}
                  stroke="none"
                  type="monotone"
                />
              )}

              {/* Línea de Promedio / Principal */}
              <Area
                connectNulls
                activeDot={{ style: { outline: 'none' } }}
                animationDuration={200}
                dataKey={dataKey}
                fill={isMacro ? 'none' : `url(#${gradientId})`}
                fillOpacity={1}
                stroke={color}
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          ) : (
            <BarChart accessibilityLayer={false} data={chartDataFiltered}>
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
                animationDuration={0}
                content={
                  <CustomTooltip
                    color={color}
                    dataKey={dataKey}
                    formatTime={formatLabelTime}
                    range={range}
                    title={title}
                    unit={unit}
                  />
                }
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                isAnimationActive={false}
                wrapperStyle={{ outline: 'none' }}
              />
              <Bar animationDuration={200} dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {chartDataFiltered.map((entry) => (
                  <Cell key={`cell-${String(entry.time)}`} fill={color} fillOpacity={1} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <hr className="border-input-outline my-2 w-full" />

      <div
        className={clsx(
          'grid grid-cols-2 gap-3 pt-1',
          dataKey === 'duration' ? 'tds-sm:grid-cols-5' : 'tds-sm:grid-cols-4',
        )}
      >
        {/* Card Mínimo */}
        <div className="bg-hover-overlay/50 flex min-h-24 flex-col items-center justify-center rounded-md px-2 py-3 text-center">
          <span className="text-secondary mb-1 text-xs font-bold">Mínimo</span>
          {isDetailed && count > 0 ? (
            dataKey === 'illuminance' ? (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">🌄 Amanecer</span>
                  <span className="text-primary font-bold">
                    {illumDawnStats.count > 0 ? `${formatStat(illumDawnStats.min)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Fotoperiodo</span>
                  <span className="text-primary font-bold">
                    {illumDayStats.count > 0 ? `${formatStat(illumDayStats.min)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Atardecer</span>
                  <span className="text-primary font-bold">
                    {illumDuskStats.count > 0 ? `${formatStat(illumDuskStats.min)} ${unit}` : '--'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">📊 General</span>
                  <span className="text-primary font-bold">
                    {formatStat(min)} {unit}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Día</span>
                  <span className="text-primary font-bold">
                    {dayStats.count > 0 ? `${formatStat(dayStats.min)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Noche</span>
                  <span className="text-primary font-bold">
                    {nightStats.count > 0 ? `${formatStat(nightStats.min)} ${unit}` : '--'}
                  </span>
                </div>
              </div>
            )
          ) : (
            <span className="text-primary text-xs font-semibold">
              {count > 0 ? formatStatValue(min) : '--'}
            </span>
          )}
        </div>

        {/* Card Máximo */}
        <div className="bg-hover-overlay/50 flex min-h-24 flex-col items-center justify-center rounded-md px-2 py-3 text-center">
          <span className="text-secondary mb-1 text-xs font-bold">Máximo</span>
          {isDetailed && count > 0 ? (
            dataKey === 'illuminance' ? (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">🌄 Amanecer</span>
                  <span className="text-primary font-bold">
                    {illumDawnStats.count > 0 ? `${formatStat(illumDawnStats.max)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Fotoperiodo</span>
                  <span className="text-primary font-bold">
                    {illumDayStats.count > 0 ? `${formatStat(illumDayStats.max)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Atardecer</span>
                  <span className="text-primary font-bold">
                    {illumDuskStats.count > 0 ? `${formatStat(illumDuskStats.max)} ${unit}` : '--'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">📊 General</span>
                  <span className="text-primary font-bold">
                    {formatStat(max)} {unit}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Día</span>
                  <span className="text-primary font-bold">
                    {dayStats.count > 0 ? `${formatStat(dayStats.max)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Noche</span>
                  <span className="text-primary font-bold">
                    {nightStats.count > 0 ? `${formatStat(nightStats.max)} ${unit}` : '--'}
                  </span>
                </div>
              </div>
            )
          ) : (
            <span className="text-primary text-xs font-semibold">
              {count > 0 ? formatStatValue(max) : '--'}
            </span>
          )}
        </div>

        {/* Card Promedio */}
        <div className="bg-hover-overlay/50 flex min-h-24 flex-col items-center justify-center rounded-md px-2 py-3 text-center">
          <span className="text-secondary mb-1 text-xs font-bold">Promedio</span>
          {isDetailed && count > 0 ? (
            dataKey === 'illuminance' ? (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">🌄 Amanecer</span>
                  <span className="text-primary font-bold">
                    {illumDawnStats.count > 0 ? `${formatStat(illumDawnStats.avg)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Fotoperiodo</span>
                  <span className="text-primary font-bold">
                    {illumDayStats.count > 0 ? `${formatStat(illumDayStats.avg)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Atardecer</span>
                  <span className="text-primary font-bold">
                    {illumDuskStats.count > 0 ? `${formatStat(illumDuskStats.avg)} ${unit}` : '--'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">📊 General</span>
                  <span className="text-primary font-bold">
                    {formatStat(avg)} {unit}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Día</span>
                  <span className="text-primary font-bold">
                    {dayStats.count > 0 ? `${formatStat(dayStats.avg)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Noche</span>
                  <span className="text-primary font-bold">
                    {nightStats.count > 0 ? `${formatStat(nightStats.avg)} ${unit}` : '--'}
                  </span>
                </div>
              </div>
            )
          ) : (
            <span className="text-primary text-xs font-semibold">
              {count > 0 ? formatStatValue(avg) : '--'}
            </span>
          )}
        </div>

        {/* Card Registros */}
        <div className="bg-hover-overlay/50 flex min-h-24 flex-col items-center justify-center rounded-md px-2 py-3 text-center">
          <span className="text-secondary mb-1 text-xs font-bold">
            {dataKey === 'duration' ? 'Eventos' : 'Registros'}
          </span>
          {isDetailed && count > 0 ? (
            dataKey === 'illuminance' ? (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">🌄 Amanecer</span>
                  <span className="text-primary font-bold">{illumDawnStats.count}</span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Fotoperiodo</span>
                  <span className="text-primary font-bold">{illumDayStats.count}</span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Atardecer</span>
                  <span className="text-primary font-bold">{illumDuskStats.count}</span>
                </div>
              </div>
            ) : (
              <div className="tds-sm:text-xs flex w-full flex-col gap-0.5 px-2 text-[10px]">
                <div className="flex w-full justify-between">
                  <span className="text-foreground font-semibold">📊 General</span>
                  <span className="text-primary font-bold">{count}</span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">☀️ Día</span>
                  <span className="text-primary font-bold">{dayStats.count}</span>
                </div>
                <div className="flex w-full justify-between border-t border-white/5 pt-0.5">
                  <span className="text-foreground font-semibold">🌙 Noche</span>
                  <span className="text-primary font-bold">{nightStats.count}</span>
                </div>
              </div>
            )
          ) : (
            <span className="text-primary text-xs font-semibold">{count}</span>
          )}
        </div>
        {dataKey === 'duration' && (
          <div className="bg-hover-overlay/50 flex flex-col items-center justify-center rounded-md py-3">
            <span className="text-secondary text-xs font-bold">Lluvia acumulada</span>
            <span className="text-primary mt-1 text-xs font-semibold">
              {(() => {
                if (totalRainAccumulated < 60) return `${totalRainAccumulated} min`

                const hours = Math.floor(totalRainAccumulated / 60)
                const remainingMins = totalRainAccumulated % 60

                return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`
              })()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
