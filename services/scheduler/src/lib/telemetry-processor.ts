import { prisma, ZoneType } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

function toCaracasTimeStr(isoStr: string | null): string | null {
  if (!isoStr) return null
  const d = new Date(isoStr)

  if (isNaN(d.getTime())) return null

  return d.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Caracas',
  })
}

const safeAvg = (sum: number, count: number) =>
  count > 0 ? Number((sum / count).toFixed(2)) : null
const safeInf = (v: number) => (v === Infinity || v === -Infinity ? null : Number(v.toFixed(2)))

function calculateVPD(tempC: number, humidityPercent: number): number {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))

  return Number((svp * (1 - humidityPercent / 100)).toFixed(3))
}

// ── Procesamiento de un solo día ──────────────────────────────────────────────

export async function processDay(
  zone: ZoneType,
  dayStart: Date,
  dryRun: boolean = false,
): Promise<void> {
  const dayEnd = new Date(dayStart)

  dayEnd.setDate(dayEnd.getDate() + 1)

  const isExterior = zone === ZoneType.EXTERIOR
  const dayLabel = dayStart.toISOString().split('T')[0]

  // ── 1. Lluvia ─────────────────────────────────────────────────────────────
  let totalRain = 0

  if (isExterior) {
    try {
      const rainQuery = `SELECT SUM(duration_seconds) as total_rain FROM "rain_events" WHERE "zone" = '${zone}' AND time >= '${dayStart.toISOString()}' AND time < '${dayEnd.toISOString()}'`
      const rainStream = influxClient.query(rainQuery)

      for await (const row of rainStream) {
        totalRain = Number(row.total_rain || 0)
      }
    } catch {
      // Tabla puede no existir — normal
    }
  }

  // ── 2. Métricas ambientales ───────────────────────────────────────────────
  const rawQuery = `SELECT * FROM "environment_metrics" WHERE "zone" = '${zone}' AND time >= '${dayStart.toISOString()}' AND time < '${dayEnd.toISOString()}' ORDER BY time ASC`

  let countTemp = 0,
    sumTemp = 0,
    minTemp = Infinity,
    maxTemp = -Infinity
  let minTempTime: string | null = null,
    maxTempTime: string | null = null

  let countHum = 0,
    sumHum = 0,
    minHum = Infinity,
    maxHum = -Infinity
  let minHumTime: string | null = null,
    maxHumTime: string | null = null

  let countLum = 0,
    sumLum = 0,
    minLum = Infinity,
    maxLum = -Infinity
  let minLumTime: string | null = null,
    maxLumTime: string | null = null

  // Botánicos
  let dliAccumulator = 0,
    lastLuxTime: Date | null = null
  let vpdSum = 0,
    vpdCount = 0,
    vpdMin = Infinity,
    vpdMax = -Infinity
  let sumTempDay = 0,
    countTempDay = 0,
    sumTempNight = 0,
    countTempNight = 0
  let highHumStreakMinutes = 0,
    maxHighHumStreakMinutes = 0,
    lastHumTime: Date | null = null

  let rowCount = 0

  try {
    const stream = influxClient.query(rawQuery)

    for await (const row of stream) {
      rowCount++
      const tDate = rowTimeToDate(row.time)
      const tIso = tDate.toISOString()
      const localHour = (tDate.getUTCHours() - 4 + 24) % 24
      const localMin = tDate.getUTCMinutes()

      // Rango Botánico Estricto: 08:00:00 a 16:00:59
      const isDaytime = (localHour >= 8 && localHour < 16) || (localHour === 16 && localMin === 0)
      const isNighttime = localHour >= 19 || localHour <= 5

      // Temperatura (24h)
      if (row.temperature != null) {
        const v = Number(row.temperature)

        if (!isNaN(v)) {
          sumTemp += v
          countTemp++
          if (v < minTemp) {
            minTemp = v
            minTempTime = tIso
          }
          if (v > maxTemp) {
            maxTemp = v
            maxTempTime = tIso
          }
          if (isDaytime) {
            sumTempDay += v
            countTempDay++
          }
          if (isNighttime) {
            sumTempNight += v
            countTempNight++
          }
        }
      }

      // Humedad (24h)
      if (row.humidity != null) {
        const v = Number(row.humidity)

        if (!isNaN(v)) {
          sumHum += v
          countHum++
          if (v < minHum) {
            minHum = v
            minHumTime = tIso
          }
          if (v > maxHum) {
            maxHum = v
            maxHumTime = tIso
          }

          // Riesgo epidemiológico
          if (isNighttime && v > 85) {
            if (lastHumTime) {
              const deltaMin = (tDate.getTime() - lastHumTime.getTime()) / 60000

              if (deltaMin > 0 && deltaMin < 15) {
                highHumStreakMinutes += deltaMin
                if (highHumStreakMinutes > maxHighHumStreakMinutes) {
                  maxHighHumStreakMinutes = highHumStreakMinutes
                }
              }
            }
            lastHumTime = tDate
          } else {
            highHumStreakMinutes = 0
            lastHumTime = null
          }

          // VPD diurno
          if (isDaytime && row.temperature != null) {
            const tempV = Number(row.temperature)

            if (!isNaN(tempV)) {
              const vpd = calculateVPD(tempV, v)

              vpdSum += vpd
              vpdCount++
              if (vpd < vpdMin) vpdMin = vpd
              if (vpd > vpdMax) vpdMax = vpd
            }
          }
        }
      }

      // Iluminancia (solo 08:00–16:00)
      if (row.illuminance != null && isDaytime) {
        const v = Number(row.illuminance)

        if (!isNaN(v) && v >= 0) {
          sumLum += v
          countLum++
          if (v < minLum) {
            minLum = v
            minLumTime = tIso
          }
          if (v > maxLum) {
            maxLum = v
            maxLumTime = tIso
          }

          // DLI
          if (lastLuxTime) {
            const deltaSeconds = (tDate.getTime() - lastLuxTime.getTime()) / 1000

            if (deltaSeconds > 0 && deltaSeconds < 900) {
              dliAccumulator += v * 0.018 * deltaSeconds
            }
          }
          lastLuxTime = tDate
        }
      }
    }
  } catch (err) {
    Logger.error(`[${dayLabel}] [${zone}] Error InfluxDB`, err)

    return
  }

  if (rowCount === 0) {
    Logger.warn(`[${dayLabel}] [${zone}] Sin datos. Skipping.`)

    return
  }

  // ── 3. Balance hídrico desde TaskLog ──────────────────────────────────────
  let irrigationMinutes = 0,
    nebulizationMinutes = 0,
    totalWaterEvents = 0

  try {
    const taskLogs = await prisma.taskLog.findMany({
      where: {
        status: 'COMPLETED',
        actualStartAt: { gte: dayStart, lt: dayEnd },
      },
      select: { purpose: true, actualStartAt: true, completedMinutes: true },
    })

    for (const task of taskLogs) {
      if (!task.actualStartAt) continue
      const durationMin = task.completedMinutes
      const purposeStr = String(task.purpose || '').toUpperCase()

      if (purposeStr.includes('NEBUL') || purposeStr.includes('HUMIDIF')) {
        nebulizationMinutes += durationMin
        totalWaterEvents++
      } else if (purposeStr.includes('RIEGO') || purposeStr.includes('IRRIG')) {
        irrigationMinutes += durationMin
        totalWaterEvents++
      }
    }
    if (totalRain > 0) totalWaterEvents++
  } catch {
    // TaskLog puede no tener datos de riego para todos los días
  }

  // ── 4. Cálculos finales ──────────────────────────────────────────────────
  const dli = dliAccumulator > 0 ? Number((dliAccumulator / 1_000_000).toFixed(2)) : null
  const vpdAvg = vpdCount > 0 ? Number((vpdSum / vpdCount).toFixed(3)) : null
  const vpdMinFinal = vpdMin !== Infinity ? Number(vpdMin.toFixed(3)) : null
  const vpdMaxFinal = vpdMax !== -Infinity ? Number(vpdMax.toFixed(3)) : null
  const avgTempDay = countTempDay > 0 ? Number((sumTempDay / countTempDay).toFixed(2)) : null
  const avgTempNight =
    countTempNight > 0 ? Number((sumTempNight / countTempNight).toFixed(2)) : null
  const dif =
    avgTempDay !== null && avgTempNight !== null
      ? Number((avgTempDay - avgTempNight).toFixed(2))
      : null
  const highHumidityHours =
    maxHighHumStreakMinutes > 0 ? Number((maxHighHumStreakMinutes / 60).toFixed(1)) : null

  if (dryRun) {
    Logger.info(
      `  [DRY-RUN] [${dayLabel}] [${zone}] rows=${rowCount} DLI=${dli} VPD=${vpdAvg} DIF=${dif}`,
    )

    return
  }

  const coreData = {
    avgTemperature: safeAvg(sumTemp, countTemp),
    minTemperature: safeInf(minTemp),
    minTempTime: toCaracasTimeStr(minTempTime),
    maxTemperature: safeInf(maxTemp),
    maxTempTime: toCaracasTimeStr(maxTempTime),
    avgHumidity: safeAvg(sumHum, countHum),
    minHumidity: safeInf(minHum),
    minHumTime: toCaracasTimeStr(minHumTime),
    maxHumidity: safeInf(maxHum),
    maxHumTime: toCaracasTimeStr(maxHumTime),
    avgIlluminance: safeAvg(sumLum, countLum),
    minIlluminance: safeInf(minLum),
    minIllumTime: toCaracasTimeStr(minLumTime),
    maxIlluminance: safeInf(maxLum),
    maxIllumTime: toCaracasTimeStr(maxLumTime),
    lightDurationHours: isExterior ? 8 : 0,
    totalRainDuration: Math.round(totalRain),
    dli,
    vpdAvg,
    vpdMin: vpdMinFinal,
    vpdMax: vpdMaxFinal,
    dif,
    avgTempDay,
    avgTempNight,
    highHumidityHours,
    irrigationMinutes,
    nebulizationMinutes,
    totalWaterEvents,
  }

  if (
    coreData.avgTemperature === null &&
    coreData.avgHumidity === null &&
    coreData.avgIlluminance === null &&
    coreData.totalRainDuration === 0 &&
    coreData.irrigationMinutes === 0 &&
    coreData.nebulizationMinutes === 0
  ) {
    Logger.warn(
      `[${dayLabel}] [${zone}] Sin métricas válidas tras procesar ${rowCount} filas. Skipping upsert.`,
    )

    return
  }

  await prisma.dailyEnvironmentStat.upsert({
    where: { date_zone: { date: dayStart, zone } },
    create: { date: dayStart, zone, ...coreData },
    update: coreData,
  })

  Logger.success(
    `[${dayLabel}] [${zone}] rows=${rowCount} DLI=${dli} VPD=${vpdAvg} DIF=${dif} riego=${irrigationMinutes}min OK`,
  )
}
