import { prisma } from '@package/database'

import { getHourInCaracas } from '../../utils/timeFormat'
import { Logger } from '../logger'

import { influxClient } from './influxdb'

import { ZoneMetrics, ZoneType } from '@/config/mappings'

// Interfaz para el tipado de filas de InfluxDB
interface InfluxRow {
  time: unknown
  phase?: string
  [key: string]: unknown
}

/**
 * Convierte row.time (nanosegundos BigInt, Date, o string) → ISO string seguro.
 */
function safeTimeToISO(rawTime: unknown): string {
  try {
    if (rawTime instanceof Date) return rawTime.toISOString()
    if (typeof rawTime === 'bigint' || typeof rawTime === 'number') {
      const timeStr = String(rawTime)

      if (timeStr.length > 13) {
        return new Date(Number(timeStr.substring(0, 13))).toISOString()
      }

      return new Date(Number(rawTime)).toISOString()
    }

    return new Date(String(rawTime)).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

/**
 * Formatea un timestamp para mostrar en tooltips (HH:mm a. m.)
 */
function formatTimeLabel(raw: unknown): string {
  const d = new Date(safeTimeToISO(raw))
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.'
  const h12 = hours % 12 || 12
  const m = minutes < 10 ? `0${minutes}` : minutes

  return `${h12}:${m} ${ampm}`
}

export async function getSensorHistoryInternal(
  range: string,
  zone: string,
  metric?: string | null,
) {
  const availableFields = ZoneMetrics[zone as ZoneType] || ZoneMetrics[ZoneType.ZONA_A] || []
  const fieldsToQuery = metric ? availableFields.filter((f) => f === metric) : availableFields

  if (fieldsToQuery.length === 0 && metric) return []

  const now = new Date()
  // Offset Venezuela (UTC-4)
  const VET_OFFSET = 4 * 3600000

  // Obtener la medianoche de hoy en VET expresada en tiempo UTC
  const midnightVET = new Date(now.getTime() - VET_OFFSET)

  midnightVET.setUTCHours(0, 0, 0, 0)
  const midnightVETInUTC = new Date(midnightVET.getTime() + VET_OFFSET)

  // --- Rangos Cortos / Micro-Visión (1h, 12h, 24h) ---
  if (range === '1h' || range === '12h' || range === '24h') {
    let timeFilter = `AND time >= now() - interval '24 hours'`

    if (range === '1h') timeFilter = `AND time >= now() - interval '1 hours'`
    if (range === '12h') {
      // 5:00 AM VET (Medianoche + 5h) hasta 7:00 PM VET (Medianoche + 19h)
      // Estas son las 14h de "Día Botánico" solicitadas.
      const start = new Date(midnightVETInUTC.getTime() + 5 * 3600000)
      const end = new Date(midnightVETInUTC.getTime() + 19 * 3600000)

      timeFilter = `AND time >= '${start.toISOString()}' AND time <= '${end.toISOString()}'`
    }

    const query = `SELECT * FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter} ORDER BY time ASC`

    try {
      const reader = influxClient.query(query)
      const data: Record<string, unknown>[] = []

      for await (const row of reader as AsyncIterable<InfluxRow>) {
        const entry: Record<string, unknown> = { time: safeTimeToISO(row.time) }

        fieldsToQuery.forEach((f) => {
          entry[f] = Number(row[f] || 0)
        })
        if (row.phase) entry.phase = String(row.phase)
        data.push(entry)
      }

      return data
    } catch (error) {
      Logger.error(`Error InfluxDB (${range}):`, error)

      return []
    }
  }

  // --- Rangos Largos / Macro-Visión (7d, 30d, all) ---
  const totalDays = range === '7d' ? 7 : range === '30d' ? 30 : 365
  const todayStart = midnightVETInUTC
  const startDate = new Date(todayStart)

  startDate.setDate(startDate.getDate() - totalDays)

  try {
    const allData: Record<string, unknown>[] = []

    const pgData = await prisma.dailyEnvironmentStat.findMany({
      where: {
        zone: zone as ZoneType,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    })

    const dateFormatter = new Intl.DateTimeFormat('es-VE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })

    pgData.forEach((stat) => {
      const entry: Record<string, unknown> = {
        time: stat.date.toISOString(),
        dateLabel: dateFormatter.format(stat.date),
      }

      if (fieldsToQuery.includes('temperature')) {
        entry.temperature = stat.avgTemperature
        entry.min_temperature = stat.minTemperature
        entry.max_temperature = stat.maxTemperature
        entry.min_temperature_time = stat.minTempTime
        entry.max_temperature_time = stat.maxTempTime
      }
      if (fieldsToQuery.includes('humidity')) {
        entry.humidity = stat.avgHumidity
        entry.min_humidity = stat.minHumidity
        entry.max_humidity = stat.maxHumidity
        entry.min_humidity_time = stat.minHumTime
        entry.max_humidity_time = stat.maxHumTime
      }
      if (fieldsToQuery.includes('illuminance')) {
        entry.illuminance = stat.avgIlluminance
        entry.min_illuminance = stat.minIlluminance
        entry.max_illuminance = stat.maxIlluminance
        entry.min_illuminance_time = stat.minIllumTime
        entry.max_illuminance_time = stat.maxIllumTime
      }
      if (fieldsToQuery.includes('rain_intensity')) {
        entry.rain_intensity = stat.totalRainDuration > 0 ? 100 : 0
      }

      allData.push(entry)
    })

    // InfluxDB Fallback for Today (VET Aware)
    const todayVET = new Date(now.getTime() - VET_OFFSET)
    const todayISO = todayVET.toISOString().split('T')[0]

    if (!pgData.some((d) => d.date.toISOString().startsWith(todayISO))) {
      const todayQuery = `SELECT * FROM "environment_metrics" WHERE "zone" = '${zone}' AND time >= '${midnightVETInUTC.toISOString()}' ORDER BY time ASC`

      try {
        const reader = influxClient.query(todayQuery)
        const rawRows: InfluxRow[] = []

        for await (const row of reader as AsyncIterable<InfluxRow>) rawRows.push(row)

        if (rawRows.length > 0) {
          const todayEntry: Record<string, unknown> = {
            time: todayStart.toISOString(),
            dateLabel: 'Hoy',
          }

          fieldsToQuery.forEach((f) => {
            let values = rawRows
              .map((r) => ({ val: Number(r[f]), time: r.time }))
              .filter((v) => !isNaN(v.val))

            // Aplicar filtro botánico (08:00 - 16:00) solo para Iluminancia en el punto de "Hoy"
            if (f === 'illuminance') {
              values = values.filter((v) => {
                const hour = getHourInCaracas(safeTimeToISO(v.time))

                return hour >= 8 && hour <= 16
              })
            }

            if (values.length > 0) {
              let minV = values[0].val,
                maxV = values[0].val,
                sum = 0
              let minT = values[0].time,
                maxT = values[0].time

              values.forEach((v) => {
                if (v.val < minV) {
                  minV = v.val
                  minT = v.time
                }
                if (v.val > maxV) {
                  maxV = v.val
                  maxT = v.time
                }
                sum += v.val
              })
              todayEntry[f] = sum / values.length
              todayEntry[`min_${f}`] = minV
              todayEntry[`max_${f}`] = maxV
              todayEntry[`min_${f}_time`] = formatTimeLabel(minT)
              todayEntry[`max_${f}_time`] = formatTimeLabel(maxT)
            }
          })
          allData.push(todayEntry)
        }
      } catch (e) {
        Logger.error('Error Fallback Hoy:', e)
      }
    }

    return allData
  } catch (error) {
    Logger.error('Error Query Hibrido:', error)

    return []
  }
}

/**
 * Obtiene el último latido (timestamp) registrado para un dispositivo.
 * Se usa para la hidratación SSR del estado de conexión.
 */
export async function getLastHeartbeat(source: string, zone?: string) {
  const zoneFilter = zone ? `AND "zone" = '${zone}'` : ''
  const query = `
    SELECT last("value"), time 
    FROM "system_events" 
    WHERE "source" = '${source}' 
    AND "event_type" = 'Device_Status' 
    ${zoneFilter}
  `

  try {
    const reader = influxClient.query(query)

    for await (const row of reader as AsyncIterable<InfluxRow>) {
      if (row.time) {
        return {
          timestamp: new Date(safeTimeToISO(row.time)).getTime(),
          status: String(row.last || 'unknown'),
        }
      }
    }

    return null
  } catch (error) {
    Logger.error(`Error fetching last heartbeat for ${source}:`, error)

    return null
  }
}
