import { prisma, ZoneType } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Límites mínimos de muestras para considerar un día válido
const MIN_SAMPLES_TEMP_HUM = 500
const MIN_SAMPLES_LUX_BOTANICAL = 250
const MIN_SAMPLES_LUX_TOTAL = 420

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
  silent: boolean = false,
): Promise<boolean> {
  const dayEnd = new Date(dayStart)

  dayEnd.setDate(dayEnd.getDate() + 1)

  const isExterior = zone === ZoneType.EXTERIOR
  const dayLabel = dayStart.toISOString().split('T')[0]

  // ── 1. Lluvia ─────────────────────────────────────────────────────────────
  let totalRain = 0
  let avgRainIntensity: number | null = null

  if (isExterior) {
    try {
      const rainAgg = await prisma.rainEvent.aggregate({
        where: {
          zone: ZoneType.EXTERIOR,
          startedAt: { gte: dayStart, lt: dayEnd },
        },
        _sum: { durationSeconds: true },
        _avg: { avgIntensity: true },
      })

      totalRain = rainAgg._sum.durationSeconds || 0
      avgRainIntensity = rainAgg._avg.avgIntensity || null
    } catch (err) {
      if (!silent) Logger.error(`[${dayLabel}] Error calculando totalRain desde Postgres:`, err)
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
    countLumTotal = 0,
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

      // Iluminancia (solo 08:00–16:00 para promedio y DLI, pero contando total)
      if (row.illuminance != null) {
        const v = Number(row.illuminance)

        if (!isNaN(v) && v >= 0) {
          countLumTotal++
          if (isDaytime) {
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
    }
  } catch (err) {
    if (!silent) Logger.error(`[${dayLabel}] [${zone}] Error InfluxDB`, err)

    return false
  }

  if (rowCount === 0) {
    if (!silent) Logger.warn(`[${dayLabel}] [${zone}] Sin datos. Skipping.`)

    return false
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
  const isTempValid = countTemp >= MIN_SAMPLES_TEMP_HUM
  const isHumValid = countHum >= MIN_SAMPLES_TEMP_HUM
  const isLuxValid = countLumTotal >= MIN_SAMPLES_LUX_TOTAL || countLum >= MIN_SAMPLES_LUX_BOTANICAL

  const dli =
    isLuxValid && dliAccumulator > 0 ? Number((dliAccumulator / 1_000_000).toFixed(2)) : null
  const isVpdValid = isTempValid && isHumValid
  const vpdAvg = isVpdValid && vpdCount > 0 ? Number((vpdSum / vpdCount).toFixed(3)) : null
  const vpdMinFinal = isVpdValid && vpdMin !== Infinity ? Number(vpdMin.toFixed(3)) : null
  const vpdMaxFinal = isVpdValid && vpdMax !== -Infinity ? Number(vpdMax.toFixed(3)) : null

  if (!silent) {
    if (!isTempValid && countTemp > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Temperatura descartada por baja densidad de muestras (${countTemp} < ${MIN_SAMPLES_TEMP_HUM}).`,
      )
    }
    if (!isHumValid && countHum > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Humedad descartada por baja densidad de muestras (${countHum} < ${MIN_SAMPLES_TEMP_HUM}).`,
      )
    }
    if (!isLuxValid && countLumTotal > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Iluminancia/DLI descartada por baja densidad de muestras (Total: ${countLumTotal} < ${MIN_SAMPLES_LUX_TOTAL} y Window: ${countLum} < ${MIN_SAMPLES_LUX_BOTANICAL}).`,
      )
    }
  }

  const avgTempDay =
    isTempValid && countTempDay > 0 ? Number((sumTempDay / countTempDay).toFixed(2)) : null
  const avgTempNight =
    isTempValid && countTempNight > 0 ? Number((sumTempNight / countTempNight).toFixed(2)) : null
  const dif =
    avgTempDay !== null && avgTempNight !== null
      ? Number((avgTempDay - avgTempNight).toFixed(2))
      : null
  const highHumidityHours =
    isHumValid && maxHighHumStreakMinutes > 0
      ? Number((maxHighHumStreakMinutes / 60).toFixed(1))
      : null

  if (dryRun) {
    if (!silent) {
      Logger.info(
        `  [DRY-RUN] [${dayLabel}] [${zone}] rows=${rowCount} DLI=${dli} VPD=${vpdAvg} DIF=${dif}`,
      )
    }

    return false
  }

  const coreData = {
    avgTemperature: isTempValid ? safeAvg(sumTemp, countTemp) : null,
    minTemperature: isTempValid ? safeInf(minTemp) : null,
    minTempTime: isTempValid ? toCaracasTimeStr(minTempTime) : null,
    maxTemperature: isTempValid ? safeInf(maxTemp) : null,
    maxTempTime: isTempValid ? toCaracasTimeStr(maxTempTime) : null,
    avgHumidity: isHumValid ? safeAvg(sumHum, countHum) : null,
    minHumidity: isHumValid ? safeInf(minHum) : null,
    minHumTime: isHumValid ? toCaracasTimeStr(minHumTime) : null,
    maxHumidity: isHumValid ? safeInf(maxHum) : null,
    maxHumTime: isHumValid ? toCaracasTimeStr(maxHumTime) : null,
    avgIlluminance: isLuxValid ? safeAvg(sumLum, countLum) : null,
    minIlluminance: isLuxValid ? safeInf(minLum) : null,
    minIllumTime: isLuxValid ? toCaracasTimeStr(minLumTime) : null,
    maxIlluminance: isLuxValid ? safeInf(maxLum) : null,
    maxIllumTime: isLuxValid ? toCaracasTimeStr(maxLumTime) : null,
    lightDurationHours: isExterior && isLuxValid ? 8 : 0,
    totalRainDuration: Math.round(totalRain),
    avgRainIntensity: avgRainIntensity ? Number(avgRainIntensity.toFixed(2)) : null,
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
    if (!silent) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Sin métricas válidas tras procesar ${rowCount} filas. Skipping upsert.`,
      )
    }

    return false
  }

  await prisma.dailyEnvironmentStat.upsert({
    where: { date_zone: { date: dayStart, zone } },
    create: { date: dayStart, zone, ...coreData },
    update: coreData,
  })

  if (!silent) {
    Logger.success(
      `[${dayLabel}] [${zone}] rows=${rowCount} DLI=${dli} VPD=${vpdAvg} DIF=${dif} riego=${irrigationMinutes}min OK`,
    )
  }

  return true
}
