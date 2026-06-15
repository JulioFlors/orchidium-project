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

const INFLUX_PHYSICAL_FIELDS = ['temperature', 'humidity', 'illuminance', 'rain_intensity']

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
  try {
    const d = new Date(safeTimeToISO(raw))
    const formatter = new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    let formatted = formatter.format(d).toLowerCase()

    // Normalizar a minúsculas y eliminar espacios y puntos
    formatted = formatted
      .replace(/a\.\s*m\./gi, 'am')
      .replace(/p\.\s*m\./gi, 'pm')
      .replace(/a\s*m/gi, 'am')
      .replace(/p\s*m/gi, 'pm')

    return formatted
  } catch {
    return '--:--'
  }
}

export async function getSensorDataInternal(range: string, zone: ZoneType, metric?: string | null) {
  const botanicFields = ['dli', 'dif', 'vpd_avg', 'high_humidity_hours', 'deficit_hidrico']
  const availableFields = [
    ...(ZoneMetrics[zone as ZoneType] || ZoneMetrics[ZoneType.ZONA_A] || []),
    ...botanicFields,
  ]
  const fieldsToQuery = metric ? availableFields.filter((f) => f === metric) : availableFields

  if (fieldsToQuery.length === 0 && metric) return []

  if (range === 'yesterday') {
    try {
      const latestStat = await prisma.dailyEnvironmentStat.findFirst({
        where: {
          zone: zone as ZoneType,
        },
        orderBy: {
          date: 'desc',
        },
      })

      if (latestStat) {
        const limitSeq = zone === ZoneType.EXTERIOR ? 45 : 50
        const minHum = latestStat.minHumidity ?? limitSeq
        const deficitHidricoHours =
          minHum < limitSeq ? Number(((limitSeq - minHum) * 0.15).toFixed(1)) : 0

        const yesterdayKPIs = {
          dli: latestStat.dli != null ? Number(latestStat.dli.toFixed(2)) : null,
          vpdAvg: latestStat.vpdAvg != null ? Number(latestStat.vpdAvg.toFixed(3)) : null,
          dif: latestStat.dif != null ? Number(latestStat.dif.toFixed(2)) : null,
          highHumidityHours:
            latestStat.highHumidityHours != null
              ? Number(latestStat.highHumidityHours.toFixed(2))
              : null,
          deficitHidricoHours,
          isLive: false,
        }

        return { data: [], liveKPIs: yesterdayKPIs, lastRainState: null }
      }

      return { data: [], liveKPIs: null, lastRainState: null }
    } catch (error) {
      Logger.error(`Error al obtener estadísticas de ayer:`, error)

      return { data: [], liveKPIs: null, lastRainState: null }
    }
  }

  const now = new Date()
  const VET_OFFSET = 4 * 3600000
  const midnightVET = new Date(now.getTime() - VET_OFFSET)

  midnightVET.setUTCHours(0, 0, 0, 0)
  const midnightVETInUTC = new Date(midnightVET.getTime() + VET_OFFSET)

  if (
    range === '30m' ||
    range === '90m' ||
    range === '1h' ||
    range === '12h' ||
    range === '24h' ||
    range === '5-19h' ||
    range === '8-16h' ||
    range === '1D'
  ) {
    let timeFilter = `AND time >= now() - interval '24 hours'`

    if (range === '30m') timeFilter = `AND time >= now() - interval '30 minutes'`
    if (range === '90m') timeFilter = `AND time >= now() - interval '90 minutes'`
    if (range === '1h') timeFilter = `AND time >= now() - interval '1 hours'`
    if (range === '12h') timeFilter = `AND time >= now() - interval '12 hours'`
    if (range === '24h') {
      timeFilter = `AND time >= TIMESTAMP '${midnightVETInUTC.toISOString()}'`
    }

    if (range === '5-19h') {
      const start = new Date(midnightVETInUTC.getTime() + 5 * 3600000)
      const end = new Date(midnightVETInUTC.getTime() + 19 * 3600000 + 59 * 1000)

      timeFilter = `AND time >= TIMESTAMP '${start.toISOString()}' AND time <= TIMESTAMP '${end.toISOString()}'`
    } else if (range === '8-16h') {
      const start = new Date(midnightVETInUTC.getTime() + 8 * 3600000)
      const end = new Date(midnightVETInUTC.getTime() + 16 * 3600000 + 59 * 1000)

      timeFilter = `AND time >= TIMESTAMP '${start.toISOString()}' AND time <= TIMESTAMP '${end.toISOString()}'`
    } else if (range === '1D') {
      const yesterdayMidnightVETInUTC = new Date(midnightVETInUTC.getTime() - 24 * 3600000)

      if (metric === 'illuminance') {
        const start = new Date(yesterdayMidnightVETInUTC.getTime() + 5 * 3600000)
        const end = new Date(yesterdayMidnightVETInUTC.getTime() + 19 * 3600000 + 59 * 1000)

        timeFilter = `AND time >= TIMESTAMP '${start.toISOString()}' AND time <= TIMESTAMP '${end.toISOString()}'`
      } else {
        const start = yesterdayMidnightVETInUTC
        const end = new Date(yesterdayMidnightVETInUTC.getTime() + 24 * 3600000 - 1000)

        timeFilter = `AND time >= TIMESTAMP '${start.toISOString()}' AND time <= TIMESTAMP '${end.toISOString()}'`
      }
    }

    const influxFields = fieldsToQuery.filter((f) => INFLUX_PHYSICAL_FIELDS.includes(f))
    const selectFields = ['time', ...influxFields].join(', ')
    const query = `
      SELECT ${selectFields}
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

      let highHumCount = 0
      let lowHumCount = 0
      let totalHumPoints = 0

      for await (const row of reader as AsyncIterable<InfluxRow>) {
        const tDate = new Date(safeTimeToISO(row.time))
        const entry: Record<string, unknown> = { time: tDate.toISOString() }

        fieldsToQuery.forEach((f) => {
          const val = row[f]

          if (val != null) {
            entry[f] = Number(val)
          }
        })
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

          // 4. Humedad extrema (Saturación y Déficit Hídrico)
          if (row.humidity != null) {
            const hum = Number(row.humidity)
            const limitSat = zone === ZoneType.EXTERIOR ? 98 : 90
            const limitSeq = zone === ZoneType.EXTERIOR ? 45 : 50

            if (hum >= limitSat) highHumCount++
            if (hum <= limitSeq) lowHumCount++
            totalHumPoints++
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
        highHumidityHours: totalHumPoints > 0 ? Number(((highHumCount * 5) / 60).toFixed(2)) : null,
        deficitHidricoHours:
          totalHumPoints > 0 ? Number(((lowHumCount * 5) / 60).toFixed(2)) : null,
        isLive: true,
      }

      const lastRainState =
        zone === ZoneType.EXTERIOR || ['12h', '24h', '5-19h', '8-16h', '1D'].includes(range)
          ? await getLastRainState()
          : null

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

        // Diurnas (08:00 AM - 04:00 PM)
        entry.min_temp_day = stat.minTempDay
        entry.min_temp_day_time = stat.minTempDayTime
        entry.max_temp_day = stat.maxTempDay
        entry.max_temp_day_time = stat.maxTempDayTime
        entry.avg_temp_day = stat.avgTempDay

        // Nocturnas (07:00 PM - 05:59 AM)
        entry.min_temp_night = stat.minTempNight
        entry.min_temp_night_time = stat.minTempNightTime
        entry.max_temp_night = stat.maxTempNight
        entry.max_temp_night_time = stat.maxTempNightTime
        entry.avg_temp_night = stat.avgTempNight
      }
      if (fieldsToQuery.includes('humidity')) {
        entry.humidity = stat.avgHumidity
        entry.min_humidity = stat.minHumidity
        entry.max_humidity = stat.maxHumidity
        entry.min_humidity_time = stat.minHumTime
        entry.max_humidity_time = stat.maxHumTime

        // Diurnas (08:00 AM - 04:00 PM)
        entry.avg_hum_day = stat.avgHumDay
        entry.min_hum_day = stat.minHumDay
        entry.min_hum_day_time = stat.minHumDayTime
        entry.max_hum_day = stat.maxHumDay
        entry.max_hum_day_time = stat.maxHumDayTime

        // Nocturnas (07:00 PM - 05:59 AM)
        entry.avg_hum_night = stat.avgHumNight
        entry.min_hum_night = stat.minHumNight
        entry.min_hum_night_time = stat.minHumNightTime
        entry.max_hum_night = stat.maxHumNight
        entry.max_hum_night_time = stat.maxHumNightTime
      }
      if (fieldsToQuery.includes('illuminance')) {
        entry.illuminance = stat.avgIlluminance
        entry.min_illuminance = stat.minIlluminance
        entry.max_illuminance = stat.maxIlluminance
        entry.min_illuminance_time = stat.minIllumTime
        entry.max_illuminance_time = stat.maxIllumTime

        // Nuevos campos de Iluminancia Desglosada
        entry.avg_illum_dawn = stat.avgIllumDawn
        entry.min_illum_dawn = stat.minIllumDawn
        entry.min_illum_dawn_time = stat.minIllumDawnTime
        entry.max_illum_dawn = stat.maxIllumDawn
        entry.max_illum_dawn_time = stat.maxIllumDawnTime

        entry.avg_illum_day = stat.avgIllumDay
        entry.min_illum_day = stat.minIllumDay
        entry.min_illum_day_time = stat.minIllumDayTime
        entry.max_illum_day = stat.maxIllumDay
        entry.max_illum_day_time = stat.maxIllumDayTime

        entry.avg_illum_dusk = stat.avgIllumDusk
        entry.min_illum_dusk = stat.minIllumDusk
        entry.min_illum_dusk_time = stat.minIllumDuskTime
        entry.max_illum_dusk = stat.maxIllumDusk
        entry.max_illum_dusk_time = stat.maxIllumDuskTime
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
      if (fieldsToQuery.includes('deficit_hidrico')) {
        const limitSeq = zone === ZoneType.EXTERIOR ? 45 : 50
        const minHum = stat.minHumidity ?? limitSeq

        entry.deficit_hidrico =
          minHum < limitSeq ? Number(((limitSeq - minHum) * 0.15).toFixed(1)) : 0
      }

      allData.push(entry)
    })

    // InfluxDB Fallback for Today (VET Aware)
    const todayVET = new Date(now.getTime() - VET_OFFSET)
    const todayISO = todayVET.toISOString().split('T')[0]

    if (!pgData.some((d) => d.date.toISOString().startsWith(todayISO))) {
      const zoneFilter = `zone = '${zone}'`

      const influxFields = fieldsToQuery.filter((f) => INFLUX_PHYSICAL_FIELDS.includes(f))
      const selectFields = ['time', ...influxFields].join(', ')
      const todayQuery = `SELECT ${selectFields} FROM environment_metrics WHERE ${zoneFilter} AND time >= TIMESTAMP '${midnightVETInUTC.toISOString()}' ORDER BY time ASC`

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
            const rawValues = rawRows
              .filter((r) => r[f] != null && r[f] !== '')
              .map((r) => ({ val: Number(r[f]), time: r.time }))
              .filter((v) => !isNaN(v.val))

            let values = [...rawValues]

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

              // Calcular sub-desgloses para Temperatura y Humedad
              if (f === 'temperature' || f === 'humidity') {
                const valuesDay = values.filter((v) => {
                  const dDate = new Date(safeTimeToISO(v.time))
                  const hour = (dDate.getUTCHours() - 4 + 24) % 24
                  const min = dDate.getUTCMinutes()

                  return (hour >= 8 && hour < 16) || (hour === 16 && min === 0)
                })

                const valuesNight = values.filter((v) => {
                  const dDate = new Date(safeTimeToISO(v.time))
                  const hour = (dDate.getUTCHours() - 4 + 24) % 24

                  return hour >= 19 || hour <= 5
                })

                if (valuesDay.length > 0) {
                  let minVD = valuesDay[0].val,
                    maxVD = valuesDay[0].val,
                    sumD = 0
                  let minTD = valuesDay[0].time,
                    maxTD = valuesDay[0].time

                  valuesDay.forEach((v) => {
                    if (v.val < minVD) {
                      minVD = v.val
                      minTD = v.time
                    }
                    if (v.val > maxVD) {
                      maxVD = v.val
                      maxTD = v.time
                    }
                    sumD += v.val
                  })
                  todayEntry[`min_${f}_day`] = minVD
                  todayEntry[`max_${f}_day`] = maxVD
                  todayEntry[`avg_${f}_day`] = sumD / valuesDay.length
                  todayEntry[`min_${f}_day_time`] = formatTimeLabel(minTD)
                  todayEntry[`max_${f}_day_time`] = formatTimeLabel(maxTD)
                }

                if (valuesNight.length > 0) {
                  let minVN = valuesNight[0].val,
                    maxVN = valuesNight[0].val,
                    sumN = 0
                  let minTN = valuesNight[0].time,
                    maxTN = valuesNight[0].time

                  valuesNight.forEach((v) => {
                    if (v.val < minVN) {
                      minVN = v.val
                      minTN = v.time
                    }
                    if (v.val > maxVN) {
                      maxVN = v.val
                      maxTN = v.time
                    }
                    sumN += v.val
                  })
                  todayEntry[`min_${f}_night`] = minVN
                  todayEntry[`max_${f}_night`] = maxVN
                  todayEntry[`avg_${f}_night`] = sumN / valuesNight.length
                  todayEntry[`min_${f}_night_time`] = formatTimeLabel(minTN)
                  todayEntry[`max_${f}_night_time`] = formatTimeLabel(maxTN)
                }
              }

              // Calcular sub-desgloses para Iluminancia
              if (f === 'illuminance') {
                const valuesDawn = rawValues.filter((v) => {
                  const dDate = new Date(safeTimeToISO(v.time))
                  const hour = (dDate.getUTCHours() - 4 + 24) % 24

                  return hour >= 6 && hour < 8
                })

                const valuesDay = rawValues.filter((v) => {
                  const dDate = new Date(safeTimeToISO(v.time))
                  const hour = (dDate.getUTCHours() - 4 + 24) % 24
                  const min = dDate.getUTCMinutes()

                  return (hour >= 8 && hour < 16) || (hour === 16 && min === 0)
                })

                const valuesDusk = rawValues.filter((v) => {
                  const dDate = new Date(safeTimeToISO(v.time))
                  const hour = (dDate.getUTCHours() - 4 + 24) % 24
                  const min = dDate.getUTCMinutes()

                  return (
                    (hour === 16 && min > 0) ||
                    (hour >= 17 && hour < 18) ||
                    (hour === 18 && min === 0)
                  )
                })

                if (valuesDawn.length > 0) {
                  let minVDawn = valuesDawn[0].val,
                    maxVDawn = valuesDawn[0].val,
                    sumDawn = 0
                  let minTDawn = valuesDawn[0].time,
                    maxTDawn = valuesDawn[0].time

                  valuesDawn.forEach((v) => {
                    if (v.val < minVDawn) {
                      minVDawn = v.val
                      minTDawn = v.time
                    }
                    if (v.val > maxVDawn) {
                      maxVDawn = v.val
                      maxTDawn = v.time
                    }
                    sumDawn += v.val
                  })
                  todayEntry[`min_illum_dawn`] = minVDawn
                  todayEntry[`max_illum_dawn`] = maxVDawn
                  todayEntry[`avg_illum_dawn`] = sumDawn / valuesDawn.length
                  todayEntry[`min_illum_dawn_time`] = formatTimeLabel(minTDawn)
                  todayEntry[`max_illum_dawn_time`] = formatTimeLabel(maxTDawn)
                }

                if (valuesDay.length > 0) {
                  let minVDay = valuesDay[0].val,
                    maxVDay = valuesDay[0].val,
                    sumDay = 0
                  let minTDay = valuesDay[0].time,
                    maxTDay = valuesDay[0].time

                  valuesDay.forEach((v) => {
                    if (v.val < minVDay) {
                      minVDay = v.val
                      minTDay = v.time
                    }
                    if (v.val > maxVDay) {
                      maxVDay = v.val
                      maxTDay = v.time
                    }
                    sumDay += v.val
                  })
                  todayEntry[`min_illum_day`] = minVDay
                  todayEntry[`max_illum_day`] = maxVDay
                  todayEntry[`avg_illum_day`] = sumDay / valuesDay.length
                  todayEntry[`min_illum_day_time`] = formatTimeLabel(minTDay)
                  todayEntry[`max_illum_day_time`] = formatTimeLabel(maxTDay)
                }

                if (valuesDusk.length > 0) {
                  let minVDusk = valuesDusk[0].val,
                    maxVDusk = valuesDusk[0].val,
                    sumDusk = 0
                  let minTDusk = valuesDusk[0].time,
                    maxTDusk = valuesDusk[0].time

                  valuesDusk.forEach((v) => {
                    if (v.val < minVDusk) {
                      minVDusk = v.val
                      minTDusk = v.time
                    }
                    if (v.val > maxVDusk) {
                      maxVDusk = v.val
                      maxTDusk = v.time
                    }
                    sumDusk += v.val
                  })
                  todayEntry[`min_illum_dusk`] = minVDusk
                  todayEntry[`max_illum_dusk`] = maxVDusk
                  todayEntry[`avg_illum_dusk`] = sumDusk / valuesDusk.length
                  todayEntry[`min_illum_dusk_time`] = formatTimeLabel(minTDusk)
                  todayEntry[`max_illum_dusk_time`] = formatTimeLabel(maxTDusk)
                }
              }
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
  const query = `
    SELECT * 
    FROM system_events 
    WHERE source = '${source}' 
    AND event_type = 'Device_Status' 
    AND time >= now() - interval '24 hours'
    ORDER BY time DESC
  `

  try {
    const reader = influxClient.query(query)

    for await (const row of reader as AsyncIterable<InfluxRow>) {
      if (zone && row.zone !== zone) continue

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
  let endDate: Date | undefined = undefined

  switch (range) {
    case 'today': {
      const caracasOffset = -4 * 60 // -240 minutos
      const now = new Date()
      const caracasTime = new Date(
        now.getTime() + (caracasOffset + now.getTimezoneOffset()) * 60000,
      )

      caracasTime.setHours(0, 0, 0, 0)
      startDate = new Date(
        caracasTime.getTime() - (caracasOffset + now.getTimezoneOffset()) * 60000,
      )
      break
    }
    case 'yesterday':
    case '1D': {
      const caracasOffset = -4 * 60 // -240 minutos
      const now = new Date()
      const caracasTime = new Date(
        now.getTime() + (caracasOffset + now.getTimezoneOffset()) * 60000,
      )

      const caracasYesterdayStart = new Date(caracasTime)

      caracasYesterdayStart.setDate(caracasYesterdayStart.getDate() - 1)
      caracasYesterdayStart.setHours(0, 0, 0, 0)

      const caracasYesterdayEnd = new Date(caracasYesterdayStart)

      caracasYesterdayEnd.setHours(23, 59, 59, 999)

      startDate = new Date(
        caracasYesterdayStart.getTime() - (caracasOffset + now.getTimezoneOffset()) * 60000,
      )
      endDate = new Date(
        caracasYesterdayEnd.getTime() - (caracasOffset + now.getTimezoneOffset()) * 60000,
      )
      break
    }
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
        startedAt: {
          gte: startDate,
          ...(endDate ? { lte: endDate } : {}),
        },
      },
      orderBy: { startedAt: 'asc' },
    })

    const events = rainEvents.map((ev) => ({
      id: ev.id,
      time: ev.startedAt.toISOString(),
      duration: ev.durationSeconds || 0,
      intensity: ev.avgIntensity || ev.peakIntensity || 0,
      isInfered: ev.isInfered,
      baselineTemp: ev.baselineTemp,
      baselineHum: ev.baselineHum,
      baselineLux: ev.baselineLux,
      baselineAgeMinutes: ev.baselineAgeMinutes,
      triggerReason: ev.triggerReason,
      closeReason: ev.closeReason,
    }))

    const totalDuration = rainEvents.reduce((acc, ev) => acc + (ev.durationSeconds || 0), 0)
    const totalIntensity = rainEvents.reduce(
      (acc, ev) => acc + (ev.avgIntensity || ev.peakIntensity || 0),
      0,
    )

    const activePhysicalEvent = rainEvents.find((ev) => ev.endedAt === null && !ev.isInfered)
    const activeInferredEvent = rainEvents.find((ev) => ev.endedAt === null && ev.isInfered)

    return {
      totalDurationSeconds: totalDuration,
      averageIntensity: rainEvents.length > 0 ? Math.round(totalIntensity / rainEvents.length) : 0,
      eventCount: rainEvents.length,
      isActive: !!activePhysicalEvent,
      activeEventId: activePhysicalEvent?.id || null,
      activeInferredEventId: activeInferredEvent?.id || null,
      isInferredActive: !!activeInferredEvent,
      events,
    }
  } catch (error: unknown) {
    Logger.error('Error al consultar RainEvents en Postgres:', error)

    return {
      totalDurationSeconds: 0,
      averageIntensity: 0,
      eventCount: 0,
      events: [],
      isActive: false,
      activeEventId: null,
      activeInferredEventId: null,
      isInferredActive: false,
    }
  }
}

/**
 * Obtiene la telemetría detallada de InfluxDB correspondiente a un evento de lluvia.
 * Retorna datos desde startedAt - 15m hasta endedAt + 15m para graficación cruzada.
 */
export async function getRainEventTelemetryInternal(eventId: string) {
  try {
    const event = await prisma.rainEvent.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      Logger.error(`Evento de lluvia ${eventId} no encontrado en Postgres`)

      return null
    }

    const startedAtMs = event.startedAt.getTime()
    const endedAtMs = event.endedAt ? event.endedAt.getTime() : Date.now()

    // Margen de 15 minutos antes y después para ver la dinámica previa/posterior
    const startIso = new Date(startedAtMs - 15 * 60 * 1000).toISOString()
    const endIso = new Date(endedAtMs + 15 * 60 * 1000).toISOString()

    const query = `
      SELECT time, temperature, humidity, illuminance
      FROM environment_metrics
      WHERE zone = 'EXTERIOR'
        AND time >= TIMESTAMP '${startIso}'
        AND time <= TIMESTAMP '${endIso}'
      ORDER BY time ASC
    `

    const reader = influxClient.query(query)
    const data: Record<string, unknown>[] = []

    for await (const row of reader as AsyncIterable<InfluxRow>) {
      data.push({
        time: new Date(safeTimeToISO(row.time)).toISOString(),
        temperature: row.temperature != null ? Number(row.temperature) : null,
        humidity: row.humidity != null ? Number(row.humidity) : null,
        illuminance: row.illuminance != null ? Number(row.illuminance) : null,
      })
    }

    return {
      event: {
        id: event.id,
        startedAt: event.startedAt.toISOString(),
        endedAt: event.endedAt ? event.endedAt.toISOString() : null,
        durationSeconds: event.durationSeconds,
        isInfered: event.isInfered,
        baselineTemp: event.baselineTemp,
        baselineHum: event.baselineHum,
        baselineLux: event.baselineLux,
        baselineAgeMinutes: event.baselineAgeMinutes,
        triggerReason: event.triggerReason,
        closeReason: event.closeReason,
      },
      telemetry: data,
    }
  } catch (error) {
    Logger.error(`Error al obtener telemetría del evento de lluvia ${eventId}:`, error)

    return null
  }
}
