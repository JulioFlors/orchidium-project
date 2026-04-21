import { NextResponse } from 'next/server'
import { prisma, ZoneType } from '@package/database'

import { influxClient } from '@/lib/influxdb'

/**
 * Definición de campos disponibles por zona para evitar errores de esquema en InfluxDB.
 * Debe coincidir con la definición en sensor-actions.ts.
 */
const ZONE_FIELDS: Record<string, string[]> = {
  EXTERIOR: ['illuminance', 'rain_intensity'],
  DEFAULT: ['temperature', 'humidity', 'illuminance'],
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
        const ms = Number(timeStr.substring(0, 13))

        return new Date(ms).toISOString()
      }

      return new Date(Number(rawTime)).toISOString()
    }

    return new Date(String(rawTime)).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

/**
 * Ejecuta una query a InfluxDB y retorna datos sanitizados.
 * Si hay error de esquema, reintenta con campos válidos.
 */
async function executeInfluxQuery(
  query: string,
  fields: string[],
  hasAggregation: boolean,
  zone: string,
  timeFilter: string,
  aggregationInterval: string | null,
): Promise<Record<string, unknown>[]> {
  try {
    const reader = influxClient.query(query)
    const data: Record<string, unknown>[] = []

    for await (const row of reader) {
      const entry: Record<string, unknown> = { time: safeTimeToISO(row.time) }

      fields.forEach((f) => {
        entry[f] = Number(row[f] || 0)
        if (hasAggregation) {
          entry[`min_${f}`] = Number(row[`min_${f}`] || 0)
          entry[`max_${f}`] = Number(row[`max_${f}`] || 0)
        }
      })
      if (row.phase) entry.phase = String(row.phase)
      data.push(entry)
    }

    return data
  } catch (error: unknown) {
    const msg = (error as Error).message || String(error)

    // Recuperación si un campo no existe en el esquema
    if (msg.includes('No field named') || msg.includes('Schema error')) {
      if (msg.includes('Valid fields are')) {
        const allFields =
          msg
            .split('Valid fields are ')[1]
            ?.split(', ')
            .map((f) => f.split('.')[1]) || []
        const validFields = fields.filter((f) => allFields.includes(f))

        if (validFields.length > 0) {
          const retryFieldsSql = validFields
            .map((f) =>
              hasAggregation
                ? `AVG(${f}) as ${f}, MIN(${f}) as min_${f}, MAX(${f}) as max_${f}`
                : f,
            )
            .join(', ')
          const retryQuery = hasAggregation
            ? `SELECT date_bin(${aggregationInterval}, time) as time, ${retryFieldsSql} FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter} GROUP BY 1 ORDER BY time ASC`
            : `SELECT time, ${retryFieldsSql} FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter} ORDER BY time ASC`

          return executeInfluxQuery(
            retryQuery,
            validFields,
            hasAggregation,
            zone,
            timeFilter,
            aggregationInterval,
          )
        }
      }

      return []
    }

    if (msg.includes('not found') || msg.includes('table')) return []

    throw error
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '24h'
  const zone = searchParams.get('zone') || 'Orchidarium'
  const metric = searchParams.get('metric')

  if (!influxClient) {
    return NextResponse.json({ error: 'Cliente de telemetría no inicializado' }, { status: 500 })
  }

  const availableFields = ZONE_FIELDS[zone] || ZONE_FIELDS.DEFAULT
  const fieldsToQuery = metric ? availableFields.filter((f) => f === metric) : availableFields

  if (fieldsToQuery.length === 0 && metric) {
    return NextResponse.json([])
  }

  // --- Rangos cortos (1h, 24h): Query directo sin agregación ---
  if (range === '1h' || range === '24h') {
    const rangeStr = range === '1h' ? '1h' : '24h'
    const timeFilter = `AND time >= now() - interval '${rangeStr}'`
    const rawFieldsSql = fieldsToQuery.join(', ')
    const query = `SELECT time, ${rawFieldsSql} FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter} ORDER BY time ASC`

    try {
      const data = await executeInfluxQuery(query, fieldsToQuery, false, zone, timeFilter, null)

      return NextResponse.json(data)
    } catch (error) {
      console.error('Error querying InfluxDB (short range):', error)

      return NextResponse.json({ error: 'Error al obtener datos de los sensores' }, { status: 500 })
    }
  }

  // --- Rangos largos (7d, 30d, all): PostgreSQL pre-agregado + InfluxDB para "Hoy" ---
  const totalDays = range === '7d' ? 7 : range === '30d' ? 30 : 365
  const now = new Date()

  try {
    const allData: Record<string, unknown>[] = []

    // 1. Leer datos históricos desde PostgreSQL (instantáneo, 1 query)
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

    const dateFormatter = new Intl.DateTimeFormat('es-VE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })

    for (const stat of pgData) {
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

      // Métricas botánicas (si están disponibles)
      if (stat.dli !== null) entry.dli = stat.dli
      if (stat.vpdAvg !== null) entry.vpd = stat.vpdAvg
      if (stat.dif !== null) entry.dif = stat.dif

      allData.push(entry)
    }

    // 2. Obtener datos de "Hoy" (aún no procesado por el cron) desde InfluxDB
    const todayStart = new Date(now)

    todayStart.setHours(0, 0, 0, 0)

    const hasTodayInPg = pgData.some((d) => d.date.getTime() === todayStart.getTime())

    if (!hasTodayInPg) {
      const isIlluminanceQuery = fieldsToQuery.includes('illuminance')
      // Para iluminancia, solo consideramos el horario diurno (8 AM - 4 PM)
      const hourFilter = isIlluminanceQuery ? 'AND EXTRACT(HOUR FROM time) BETWEEN 8 AND 15' : ''
      const timeFilter = `AND time >= '${todayStart.toISOString()}' ${hourFilter}`

      const fieldsSql = fieldsToQuery
        .map((f) => `AVG(${f}) as ${f}, MIN(${f}) as min_${f}, MAX(${f}) as max_${f}`)
        .join(', ')

      const query = `SELECT '${todayStart.toISOString()}' as time, ${fieldsSql} FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter}`

      try {
        const todayData = await executeInfluxQuery(
          query,
          fieldsToQuery,
          true,
          zone,
          timeFilter,
          null,
        )

        if (todayData && todayData.length > 0) {
          todayData[0].dateLabel = 'Hoy'
          allData.push(todayData[0])
        }
      } catch {
        // InfluxDB puede fallar para "Hoy" — no es crítico, ya tenemos el historial
      }
    }

    return NextResponse.json(allData)
  } catch (error) {
    console.error('Error in PostgreSQL + InfluxDB Hybrid Query:', error)

    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })
  }
}
