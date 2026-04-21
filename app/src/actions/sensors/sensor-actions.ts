'use server'

import { prisma, ZoneType } from '@package/database'

import { influxClient } from '@/lib/influxdb'

interface RainEvent {
  time: string
  duration: number
  intensity: number
}

interface RainHistory {
  totalDurationSeconds: number
  averageIntensity: number
  eventCount: number
  events: RainEvent[]
}

/**
 * Definición de campos disponibles por zona para evitar errores de esquema en InfluxDB.
 */
const ZONE_FIELDS: Record<string, string[]> = {
  EXTERIOR: ['illuminance', 'rain_intensity'],
  DEFAULT: ['temperature', 'humidity', 'illuminance'],
}

/**
 * Obtiene el historial de sensores desde InfluxDB.
 */
export async function getSensorHistory(range = '24h', zone = 'Orchidarium', metric?: string) {
  if (!influxClient) {
    return { success: false, error: 'Servidor de telemetría no inicializado (InfluxDB)' }
  }

  let rangeString = '24h'

  switch (range) {
    case '1h':
      rangeString = '1h'
      break
    case '24h':
      rangeString = '24h'
      break
    case '7d':
      rangeString = '7d'
      break
    case '30d':
      rangeString = '30d'
      break
    case 'all':
      rangeString = '365d'
      break
    default:
      rangeString = '24h'
  }

  const timeFilter = range === 'all' ? '' : `AND time >= now() - interval '${rangeString}'`

  const getAggregationInterval = (r: string): string | null => {
    if (r === '1h' || r === '24h') return null
    const targetPoints = 500
    let totalSeconds = 86400
    const match = r.match(/^(\d+)([hd])/)

    if (match) {
      const value = parseInt(match[1])
      const unit = match[2]

      if (unit === 'h') totalSeconds = value * 3600
      if (unit === 'd') totalSeconds = value * 86400
    } else if (r === 'all') {
      totalSeconds = 365 * 86400
    }
    const intervalSeconds = Math.max(60, Math.floor(totalSeconds / targetPoints))

    if (intervalSeconds < 3600) {
      return `interval '${Math.floor(intervalSeconds / 60)} minutes'`
    }

    return `interval '${Math.floor(intervalSeconds / 3600)} hours'`
  }

  const aggregationInterval = getAggregationInterval(range)

  // Selección de campos inteligente basada en la zona
  const availableFields = ZONE_FIELDS[zone] || ZONE_FIELDS.DEFAULT

  // Si se solicita una métrica específica, la filtramos (si existe en la zona)
  const fieldsToQuery = metric ? availableFields.filter((f) => f === metric) : availableFields

  if (fieldsToQuery.length === 0 && metric) {
    // Si la métrica solicitada no existe en esta zona, devolvemos vacío directamente
    return { success: true, data: [] }
  }

  const fieldsSql = fieldsToQuery
    .map((f) => `AVG(${f}) as ${f}, MIN(${f}) as min_${f}, MAX(${f}) as max_${f}`)
    .join(', ')
  const rawFieldsSql = fieldsToQuery.join(', ')

  // Función interna para ejecutar query y parsear filas
  async function executeAndParse(q: string, fields: string[], aggInterval: string | null) {
    const reader = influxClient.query(q)
    const results: Record<string, unknown>[] = []

    for await (const row of reader) {
      let timeStr = ''

      try {
        if (row.time instanceof Date) {
          timeStr = row.time.toISOString()
        } else if (typeof row.time === 'bigint' || typeof row.time === 'number') {
          const timeRaw = String(row.time)

          if (timeRaw.length > 13) {
            timeStr = new Date(Number(timeRaw.substring(0, 13))).toISOString()
          } else {
            timeStr = new Date(Number(timeRaw)).toISOString()
          }
        } else {
          timeStr = new Date(String(row.time)).toISOString()
        }
      } catch {
        timeStr = new Date().toISOString()
      }

      const entry: Record<string, unknown> = { time: timeStr }

      fields.forEach((f) => {
        entry[f] = Number(row[f] || 0)
        if (aggInterval) {
          entry[`min_${f}`] = Number(row[`min_${f}`] || 0)
          entry[`max_${f}`] = Number(row[`max_${f}`] || 0)
        }
      })
      if (row.phase) entry.phase = String(row.phase)
      results.push(entry)
    }

    return results
  }

  // Si es un rango corto, consulta directa única
  if (range === '1h' || range === '24h') {
    const query = aggregationInterval
      ? `SELECT date_bin(${aggregationInterval}, time) as time, ${fieldsSql} FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter} GROUP BY 1 ORDER BY time ASC`
      : `SELECT time, ${rawFieldsSql} FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter} ORDER BY time ASC`

    try {
      const data = await executeAndParse(query, fieldsToQuery, aggregationInterval)

      return { success: true, data }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)

      if (msg.includes('No field named') || msg.includes('Schema error'))
        return { success: true, data: [] }

      return { success: false, error: `Error de telemetría: ${msg}` }
    }
  }

  // Rangos largos (7d, 30d, all): Leer de PostgreSQL + fallback InfluxDB para "Hoy"
  const totalDays = range === '7d' ? 7 : range === '30d' ? 30 : 365
  const now = new Date()

  try {
    const allData: Record<string, unknown>[] = []

    const startDate = new Date(now)

    startDate.setDate(startDate.getDate() - totalDays)
    startDate.setHours(0, 0, 0, 0)

    const pgData = await prisma.dailyEnvironmentStat.findMany({
      where: {
        zone: zone as ZoneType,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    })

    for (const stat of pgData) {
      const entry: Record<string, unknown> = { time: stat.date.toISOString() }

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
    }

    // Fallback para "Hoy" si no fue procesado por el cron
    const todayStart = new Date(now)

    todayStart.setHours(0, 0, 0, 0)

    const hasTodayInPg = pgData.some((d) => d.date.getTime() === todayStart.getTime())

    if (!hasTodayInPg) {
      const todayFilter = `AND time >= '${todayStart.toISOString()}'`
      const todayFieldsSql = fieldsToQuery
        .map((f) => `AVG(${f}) as ${f}, MIN(${f}) as min_${f}, MAX(${f}) as max_${f}`)
        .join(', ')
      const todayQuery = `SELECT '${todayStart.toISOString()}' as time, ${todayFieldsSql} FROM "environment_metrics" WHERE "zone" = '${zone}' ${todayFilter}`

      try {
        const todayData = await executeAndParse(todayQuery, fieldsToQuery, 'today')

        if (todayData.length > 0) allData.push(...todayData)
      } catch {
        // InfluxDB puede fallar para "Hoy" — no es crítico
      }
    }

    return { success: true, data: allData }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: `Error en consulta híbrida PG+Influx: ${msg}` }
  }
}

/**
 * Obtiene el historial de eventos de lluvia desde InfluxDB.
 */
export async function getRainHistory(range = '24h', zone = 'EXTERIOR') {
  if (!influxClient) {
    return { success: false, error: 'Servidor de telemetría no inicializado (InfluxDB)' }
  }

  let rangeString = '24h'

  switch (range) {
    case '1h':
      rangeString = '1h'
      break
    case '7d':
      rangeString = '7d'
      break
    case '30d':
      rangeString = '30d'
      break
    case 'all':
      rangeString = '365d'
      break
    default:
      rangeString = '24h'
  }

  const timeFilter = range === 'all' ? '' : `AND time >= now() - interval '${rangeString}'`
  const query = `SELECT time, duration_seconds, intensity_percent FROM "rain_events" WHERE "zone" = '${zone}' ${timeFilter} ORDER BY time ASC`

  try {
    const reader = influxClient.query(query)
    const events: RainEvent[] = []
    let totalDuration = 0
    let totalIntensity = 0

    for await (const row of reader) {
      events.push({
        time: String(row.time),
        duration: Number(row.duration_seconds),
        intensity: Number(row.intensity_percent),
      })
      totalDuration += Number(row.duration_seconds)
      totalIntensity += Number(row.intensity_percent)
    }

    const data: RainHistory = {
      totalDurationSeconds: totalDuration,
      averageIntensity: events.length > 0 ? Math.round(totalIntensity / events.length) : 0,
      eventCount: events.length,
      events,
    }

    return { success: true, data }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)

    if (msg.includes('not found') || msg.includes('table')) {
      return {
        success: true,
        data: { totalDurationSeconds: 0, averageIntensity: 0, eventCount: 0, events: [] },
      }
    }

    console.error('Error querying InfluxDB (Rain Events):', error)

    return { success: false, error: `Error de telemetría (Lluvia): ${msg}` }
  }
}
