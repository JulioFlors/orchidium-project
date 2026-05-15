import { prisma } from '@package/database'

import { Logger } from '../logger'
import {
  calculateVPD,
  calculateDLIIncrement,
  isDaytimeCaracas,
  isNighttimeCaracas,
} from '../botany'

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

export async function getSensorDataInternal(range: string, zone: ZoneType, metric?: string | null) {
  const availableFields = ZoneMetrics[zone as ZoneType] || ZoneMetrics[ZoneType.ZONA_A] || []
  const fieldsToQuery = metric ? availableFields.filter((f) => f === metric) : availableFields

  if (fieldsToQuery.length === 0 && metric) return []

  const now = new Date()
  const VET_OFFSET = 4 * 3600000
  const midnightVET = new Date(now.getTime() - VET_OFFSET)

  midnightVET.setUTCHours(0, 0, 0, 0)
  const midnightVETInUTC = new Date(midnightVET.getTime() + VET_OFFSET)

  if (range === '1h' || range === '12h' || range === '24h') {
    let timeFilter = `AND time >= now() - interval '24 hours'`

    if (range === '1h') timeFilter = `AND time >= now() - interval '1 hours'`
    if (range === '12h') {
      // "Día Botánico": 5:00 AM VET → 7:00 PM VET (14h operativas).
      // Si estamos en madrugada (antes de 5 AM VET), retrocedemos al día anterior
      // para no mostrar una ventana vacía.
      const currentVETHour = (now.getUTCHours() - 4 + 24) % 24
      const baseDay =
        currentVETHour < 5
          ? new Date(midnightVETInUTC.getTime() - 24 * 3600000) // Ayer
          : midnightVETInUTC // Hoy
      const start = new Date(baseDay.getTime() + 5 * 3600000)
      const end = new Date(baseDay.getTime() + 19 * 3600000)

      timeFilter = `AND time >= TIMESTAMP '${start.toISOString()}' AND time <= TIMESTAMP '${end.toISOString()}'`
    }

    const query = `
      SELECT *
      FROM environment_metrics 
      WHERE zone = '${zone}' 
      ${timeFilter}
      ORDER BY time ASC
    `

    try {
      const reader = influxClient.query(query)
      const data: Record<string, unknown>[] = []

      // Variables para Preámbulo de KPIs (Live)
      let liveDLI = 0
      let lastLuxTime: Date | null = null
      let vpdSum = 0
      let vpdCount = 0
      let tempSumDay = 0
      let tempCountDay = 0
      let tempSumNight = 0
      let tempCountNight = 0

      for await (const row of reader as AsyncIterable<InfluxRow>) {
        const tDate = new Date(safeTimeToISO(row.time))
        const entry: Record<string, unknown> = { time: tDate.toISOString() }

        fieldsToQuery.forEach((f) => {
          const val = row[f]

          if (val != null) {
            entry[f] = Number(val)
          }
        })
        if (row.phase) entry.phase = String(row.phase)
        data.push(entry)

        // ── Cálculo de Live KPIs (Solo para el día actual) ──
        if (tDate >= midnightVETInUTC) {
          const isDay = isDaytimeCaracas(tDate)
          const isNight = isNighttimeCaracas(tDate)

          // 1. DLI Live
          if (row.illuminance != null && isDay) {
            const lux = Number(row.illuminance)

            if (lastLuxTime) {
              const deltaSec = (tDate.getTime() - lastLuxTime.getTime()) / 1000

              if (deltaSec > 0 && deltaSec < 900) {
                liveDLI += calculateDLIIncrement(lux, deltaSec)
              }
            }
            lastLuxTime = tDate
          }

          // 2. VPD Live
          if (row.temperature != null && row.humidity != null && isDay) {
            vpdSum += calculateVPD(Number(row.temperature), Number(row.humidity))
            vpdCount++
          }

          // 3. DIF Live (Promedios diurno/nocturno en curso)
          if (row.temperature != null) {
            const t = Number(row.temperature)

            if (isDay) {
              tempSumDay += t
              tempCountDay++
            }
            if (isNight) {
              tempSumNight += t
              tempCountNight++
            }
          }
        }
      }

      // Consolidar Preámbulo
      const liveKPIs = {
        dli: liveDLI > 0 ? Number((liveDLI / 1_000_000).toFixed(2)) : null,
        vpdAvg: vpdCount > 0 ? Number((vpdSum / vpdCount).toFixed(3)) : null,
        dif:
          tempCountDay > 0 && tempCountNight > 0
            ? Number((tempSumDay / tempCountDay - tempSumNight / tempCountNight).toFixed(2))
            : null,
        isLive: true,
      }

      const lastRainState = range === '12h' || range === '24h' ? await getLastRainState() : null

      return { data, liveKPIs, lastRainState }
    } catch (error) {
      Logger.error(`Error en InfluxDB (${range}):`, error)

      return { data: [], liveKPIs: null, lastRainState: null }
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
        entry.rain_intensity = stat.avgRainIntensity ?? (stat.totalRainDuration > 0 ? 100 : 0)
      }

      // KPIs Botánicos (Procesados)
      if (fieldsToQuery.includes('dli')) entry.dli = stat.dli
      if (fieldsToQuery.includes('dif')) entry.dif = stat.dif
      if (fieldsToQuery.includes('vpd_avg')) entry.vpd_avg = stat.vpdAvg
      if (fieldsToQuery.includes('high_humidity_hours'))
        entry.high_humidity_hours = stat.highHumidityHours

      allData.push(entry)
    })

    // InfluxDB Fallback for Today (VET Aware)
    const todayVET = new Date(now.getTime() - VET_OFFSET)
    const todayISO = todayVET.toISOString().split('T')[0]

    if (!pgData.some((d) => d.date.toISOString().startsWith(todayISO))) {
      const zoneFilter = `zone = '${zone}'`

      const todayQuery = `SELECT * FROM environment_metrics WHERE ${zoneFilter} AND time >= TIMESTAMP '${midnightVETInUTC.toISOString()}' ORDER BY time ASC`

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

            // Aplicar filtro botánico (08:00:00 - 16:00:59) solo para Iluminancia en el punto de "Hoy"
            if (f === 'illuminance') {
              values = values.filter((v) => {
                const dDate = new Date(safeTimeToISO(v.time))
                const hour = (dDate.getUTCHours() - 4 + 24) % 24
                const min = dDate.getUTCMinutes()

                return (hour >= 8 && hour < 16) || (hour === 16 && min === 0)
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
        Logger.error('Error en el respaldo de hoy:', e)
      }
    }

    return { data: allData, liveKPIs: null }
  } catch (error) {
    Logger.error('Error en consulta híbrida:', error)

    return { data: [], liveKPIs: null }
  }
}

/**
 * Obtiene el último latido (timestamp) registrado para un dispositivo.
 * Se usa para la hidratación SSR del estado de conexión.
 */
export async function getLastHeartbeat(source: string, zone?: ZoneType) {
  let zoneFilter = ''

  if (zone) {
    zoneFilter = `AND zone = '${zone}'`
  }

  const query = `
    SELECT value, time 
    FROM system_events 
    WHERE source = '${source}' 
    AND event_type = 'Device_Status' 
    ${zoneFilter}
    AND time >= now() - interval '24 hours'
    ORDER BY time DESC
    LIMIT 1
  `

  try {
    const reader = influxClient.query(query)

    for await (const row of reader as AsyncIterable<InfluxRow>) {
      if (row.time) {
        return {
          timestamp: new Date(safeTimeToISO(row.time)).getTime(),
          status: String(row.value || 'unknown'),
        }
      }
    }

    return null
  } catch (error) {
    Logger.error(`Error al obtener el último latido para ${source}:`, error)

    return null
  }
}

/**
 * Obtiene el último estado de lluvia (Raining/Dry) basado en la base de datos (Postgres).
 * Un evento abierto (endedAt: null) significa que para el sistema sigue lloviendo.
 */
export async function getLastRainState() {
  try {
    // 1. Verificar si hay un evento abierto en Postgres
    const activeEvent = await prisma.rainEvent.findFirst({
      where: { zone: ZoneType.EXTERIOR, endedAt: null },
      orderBy: { startedAt: 'desc' },
    })

    if (activeEvent) {
      return {
        state: 'Raining',
        timestamp: activeEvent.startedAt.getTime(),
        eventId: activeEvent.id,
      }
    }

    // 2. Si no hay evento abierto, buscamos el último cerrado para tener referencia de tiempo
    const lastEvent = await prisma.rainEvent.findFirst({
      where: { zone: ZoneType.EXTERIOR },
      orderBy: { startedAt: 'desc' },
    })

    return {
      state: 'Dry',
      timestamp: lastEvent?.endedAt?.getTime() || Date.now(),
    }
  } catch (error) {
    Logger.error('Error al obtener el estado de lluvia desde Postgres:', error)

    return { state: 'Dry', timestamp: Date.now() }
  }
}

export async function getRainSummaryInternal(range: string, zone: ZoneType) {
  let startDate = new Date()

  switch (range) {
    case '12h':
      startDate = new Date(Date.now() - 12 * 3600000)
      break
    case '24h':
      startDate = new Date(Date.now() - 24 * 3600000)
      break
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 3600000)
      break
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 3600000)
      break
    case 'all':
      startDate = new Date(0)
      break
    default:
      startDate = new Date(Date.now() - 24 * 3600000)
  }

  try {
    const rainEvents = await prisma.rainEvent.findMany({
      where: {
        zone: zone as ZoneType,
        startedAt: { gte: startDate },
      },
      orderBy: { startedAt: 'asc' },
    })

    const events = rainEvents.map((ev) => ({
      time: ev.startedAt.toISOString(),
      duration: ev.durationSeconds || 0,
      intensity: ev.avgIntensity || ev.peakIntensity || 0,
    }))

    const totalDuration = rainEvents.reduce((acc, ev) => acc + (ev.durationSeconds || 0), 0)
    const totalIntensity = rainEvents.reduce(
      (acc, ev) => acc + (ev.avgIntensity || ev.peakIntensity || 0),
      0,
    )

    const activeEvent = rainEvents.find((ev) => ev.endedAt === null)

    return {
      totalDurationSeconds: totalDuration,
      averageIntensity: rainEvents.length > 0 ? Math.round(totalIntensity / rainEvents.length) : 0,
      eventCount: rainEvents.length,
      isActive: !!activeEvent,
      activeEventId: activeEvent?.id || null,
      events,
    }
  } catch (error: unknown) {
    Logger.error('Error al consultar RainEvents en Postgres:', error)

    return {
      totalDurationSeconds: 0,
      averageIntensity: 0,
      eventCount: 0,
      events: [],
    }
  }
}
