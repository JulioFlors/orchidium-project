import { prisma, ZoneType, TaskPurpose } from '@package/database'

import { Logger } from './logger'
import { influxClient } from './influx'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retorna la medianoche de Caracas (00:00:00.000 VET) en formato Date de JS
 * para un día calendario específico en Caracas.
 */
export function getCaracasMidnight(date: Date): Date {
  const parts = new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const getPart = (type: Intl.DateTimeFormatPartTypes): string => {
    const found = parts.find((p) => p.type === type)

    return found ? found.value : '00'
  }

  const y = getPart('year')
  const m = getPart('month')
  const d = getPart('day')

  // 00:00:00 Caracas (UTC-4) = 04:00:00 UTC
  return new Date(`${y}-${m}-${d}T04:00:00.000Z`)
}

// ── LÓGICA DE LÍMITES DE SUPERVIVENCIA ANTE CORTES (60% de operatividad esperada / tolerando 40% de pérdida)
//
// Fórmulas aplicadas:
// - Muestras Totales (T) = Frecuencia (muestras/hora) * Duración de la ventana (horas)
// - Mínimo Requerido (M) = T * 0.60 (60% de datos válidos, tolerando un corte continuo de luz/red de hasta el 40% del tiempo)
//
// 1. Zona Exterior (EXTERIOR) - Frecuencia de muestreo: 1 muestra/minuto (60 muestras/hora)
//    - Temp/Hum (24h): 24h * 60 = 1440 muestras esperadas. Límite (60%): 1440 * 0.60 = 864
//    - Temp/Hum Día (8h, 8am-4pm): 8h * 60 = 480 muestras esperadas. Límite (60%): 288
//    - Temp/Hum Noche (10h, 7pm-5am): 10h * 60 = 600 muestras esperadas. Límite (60%): 360
//    - Lux Total (14h, 5am-7pm): 14h * 60 = 840 muestras esperadas. Límite (60%): 840 * 0.60 = 504
//    - Lux Botánica (8h, 8am-4pm): 8h * 60 = 480 muestras esperadas. Límite (60%): 480 * 0.60 = 288
//
// 2. Zona Orquideario (ZONA_A) - Frecuencia de muestreo: 1 muestra/5minutos (12 muestras/hora)
//    - Temp/Hum (24h): 24h * 12 = 288 muestras esperadas. Límite (60%): 288 * 0.60 = 172.8 (redondeado a 173)
//    - Temp/Hum Día (8h, 8am-4pm): 8h * 12 = 96 muestras esperadas. Límite (60%): 57.6 (redondeado a 58)
//    - Temp/Hum Noche (10h, 7pm-5am): 10h * 12 = 120 muestras esperadas. Límite (60%): 72
//    - Lux Total (14h, 5am-7pm): 14h * 12 = 168 muestras esperadas. Límite (60%): 168 * 0.60 = 100.8 (redondeado a 101)
//    - Lux Botánica (8h, 8am-4pm): 8h * 12 = 96 muestras esperadas. Límite (60%): 96 * 0.60 = 57.6 (redondeado a 58)
const ZONE_LIMITS: Record<
  ZoneType,
  {
    readonly minTempHum24h: number
    readonly minTempHumDay: number
    readonly minTempHumNight: number
    readonly minLuxTotal: number
    readonly minLuxBotanical: number
  }
> = {
  [ZoneType.EXTERIOR]: {
    minTempHum24h: 864,
    minTempHumDay: 288,
    minTempHumNight: 360,
    minLuxTotal: 504,
    minLuxBotanical: 288,
  },
  [ZoneType.ZONA_A]: {
    minTempHum24h: 173,
    minTempHumDay: 58,
    minTempHumNight: 72,
    minLuxTotal: 101,
    minLuxBotanical: 58,
  },
  [ZoneType.ZONA_B]: {
    minTempHum24h: 173,
    minTempHumDay: 58,
    minTempHumNight: 72,
    minLuxTotal: 101,
    minLuxBotanical: 58,
  },
  [ZoneType.ZONA_C]: {
    minTempHum24h: 173,
    minTempHumDay: 58,
    minTempHumNight: 72,
    minLuxTotal: 101,
    minLuxBotanical: 58,
  },
  [ZoneType.ZONA_D]: {
    minTempHum24h: 173,
    minTempHumDay: 58,
    minTempHumNight: 72,
    minLuxTotal: 101,
    minLuxBotanical: 58,
  },
}

function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)

  if (isNaN(Number(s))) {
    return new Date(s)
  }

  // Si tiene nanosegundos (19 dígitos) o microsegundos, truncar a milisegundos (13 dígitos)
  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

function toCaracasTimeStr(isoStr: string | null): string | null {
  if (!isoStr) return null
  const d = new Date(isoStr)

  if (isNaN(d.getTime())) return null

  const formatted = d
    .toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Caracas',
    })
    .toLowerCase()

  return formatted
    .replace(/a\.\s*m\./gi, 'am')
    .replace(/p\.\s*m\./gi, 'pm')
    .replace(/a\s*m/gi, 'am')
    .replace(/p\s*m/gi, 'pm')
    .trim()
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
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

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
  let minTempDay = Infinity,
    maxTempDay = -Infinity,
    minTempDayTime: string | null = null,
    maxTempDayTime: string | null = null
  let minTempNight = Infinity,
    maxTempNight = -Infinity,
    minTempNightTime: string | null = null,
    maxTempNightTime: string | null = null

  let sumHumDay = 0,
    countHumDay = 0,
    minHumDay = Infinity,
    maxHumDay = -Infinity,
    minHumDayTime: string | null = null,
    maxHumDayTime: string | null = null
  let sumHumNight = 0,
    countHumNight = 0,
    minHumNight = Infinity,
    maxHumNight = -Infinity,
    minHumNightTime: string | null = null,
    maxHumNightTime: string | null = null
  let highHumStreakMinutes = 0,
    maxHighHumStreakMinutes = 0,
    lastHumTime: Date | null = null

  // Variables desglosadas para iluminancia (Amanecer, Fotoperíodo, Atardecer)
  let sumIllumDawn = 0,
    countIllumDawn = 0,
    minIllumDawn = Infinity,
    maxIllumDawn = -Infinity
  let minIllumDawnTime: string | null = null,
    maxIllumDawnTime: string | null = null

  let sumIllumDay = 0,
    countIllumDay = 0,
    minIllumDay = Infinity,
    maxIllumDay = -Infinity
  let minIllumDayTime: string | null = null,
    maxIllumDayTime: string | null = null

  let sumIllumDusk = 0,
    countIllumDusk = 0,
    minIllumDusk = Infinity,
    maxIllumDusk = -Infinity
  let minIllumDuskTime: string | null = null,
    maxIllumDuskTime: string | null = null

  let rowCount = 0

  try {
    const stream = influxClient.query(rawQuery)

    for await (const row of stream) {
      rowCount++
      const tDate = rowTimeToDate(row.time)
      const tIso = tDate.toISOString()
      const localHour = (tDate.getUTCHours() - 4 + 24) % 24
      const localMin = tDate.getUTCMinutes()
      const localMinutes = localHour * 60 + localMin

      // Definir rangos exactos de minutos para la hora local (Caracas VET)
      const isDawn = localMinutes >= 360 && localMinutes < 480 // 06:00 am - 07:59 am
      const isFotoperiodo = localMinutes >= 480 && localMinutes <= 960 // 08:00 am - 04:00 pm
      const isDusk = localMinutes > 960 && localMinutes <= 1080 // 04:01 pm - 06:00 pm

      // Rango Botánico Estricto: 08:00:00 a 16:00:59
      const isDaytime = (localHour >= 8 && localHour < 16) || (localHour === 16 && localMin === 0)
      const isNighttime = localHour >= 19 || localHour < 5

      // Temperatura (24h y desglosado)
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
            if (v < minTempDay) {
              minTempDay = v
              minTempDayTime = tIso
            }
            if (v > maxTempDay) {
              maxTempDay = v
              maxTempDayTime = tIso
            }
          }
          if (isNighttime) {
            sumTempNight += v
            countTempNight++
            if (v < minTempNight) {
              minTempNight = v
              minTempNightTime = tIso
            }
            if (v > maxTempNight) {
              maxTempNight = v
              maxTempNightTime = tIso
            }
          }
        }
      }

      // Humedad (24h y desglosado)
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

          if (isDaytime) {
            sumHumDay += v
            countHumDay++
            if (v < minHumDay) {
              minHumDay = v
              minHumDayTime = tIso
            }
            if (v > maxHumDay) {
              maxHumDay = v
              maxHumDayTime = tIso
            }
          }
          if (isNighttime) {
            sumHumNight += v
            countHumNight++
            if (v < minHumNight) {
              minHumNight = v
              minHumNightTime = tIso
            }
            if (v > maxHumNight) {
              maxHumNight = v
              maxHumNightTime = tIso
            }
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

      // Iluminancia (desglosada por franjas y general diurno)
      if (row.illuminance != null) {
        const v = Number(row.illuminance)

        if (!isNaN(v) && v >= 0) {
          countLumTotal++

          if (isDawn) {
            sumIllumDawn += v
            countIllumDawn++
            if (v < minIllumDawn) {
              minIllumDawn = v
              minIllumDawnTime = tIso
            }
            if (v > maxIllumDawn) {
              maxIllumDawn = v
              maxIllumDawnTime = tIso
            }
          }

          if (isFotoperiodo) {
            sumIllumDay += v
            countIllumDay++
            if (v < minIllumDay) {
              minIllumDay = v
              minIllumDayTime = tIso
            }
            if (v > maxIllumDay) {
              maxIllumDay = v
              maxIllumDayTime = tIso
            }
          }

          if (isDusk) {
            sumIllumDusk += v
            countIllumDusk++
            if (v < minIllumDusk) {
              minIllumDusk = v
              minIllumDuskTime = tIso
            }
            if (v > maxIllumDusk) {
              maxIllumDusk = v
              maxIllumDuskTime = tIso
            }
          }

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
  let nebulizationMinutes = 0
  let irrigationMinutes = 0
  let soilWettingMinutes = 0
  let fertigationMinutes = 0
  let fumigationMinutes = 0
  let totalWaterEvents = 0

  try {
    const taskLogs = await prisma.taskLog.findMany({
      where: {
        status: 'COMPLETED',
        scheduledAt: { gte: dayStart, lt: dayEnd },
      },
      select: { purpose: true, actualStartAt: true, completedMinutes: true, duration: true },
    })

    for (const task of taskLogs) {
      const durationMin = task.completedMinutes > 0 ? task.completedMinutes : task.duration
      const purpose = task.purpose

      if (purpose === TaskPurpose.HUMIDIFICATION) {
        nebulizationMinutes += durationMin
        totalWaterEvents++
      } else if (purpose === TaskPurpose.IRRIGATION) {
        irrigationMinutes += durationMin
        totalWaterEvents++
      } else if (purpose === TaskPurpose.SOIL_WETTING) {
        soilWettingMinutes += durationMin
        totalWaterEvents++
      } else if (purpose === TaskPurpose.FERTIGATION) {
        fertigationMinutes += durationMin
        totalWaterEvents++
      } else if (purpose === TaskPurpose.FUMIGATION) {
        fumigationMinutes += durationMin
        totalWaterEvents++
      }
    }
    if (totalRain > 0) totalWaterEvents++
  } catch {
    // TaskLog puede no tener datos de riego para todos los días
  }

  // ── 4. Cálculos finales ──────────────────────────────────────────────────
  const limits = ZONE_LIMITS[zone]
  const isTempValid = countTemp >= limits.minTempHum24h
  const isHumValid = countHum >= limits.minTempHum24h
  const isTempDayValid = countTempDay >= limits.minTempHumDay
  const isTempNightValid = countTempNight >= limits.minTempHumNight
  const isHumDayValid = countHumDay >= limits.minTempHumDay
  const isHumNightValid = countHumNight >= limits.minTempHumNight
  const isLuxValid = countLumTotal >= limits.minLuxTotal || countLum >= limits.minLuxBotanical

  const dli =
    isLuxValid && dliAccumulator > 0 ? Number((dliAccumulator / 1_000_000).toFixed(2)) : null
  const isVpdValid = isTempValid && isHumValid
  const vpdAvg = isVpdValid && vpdCount > 0 ? Number((vpdSum / vpdCount).toFixed(3)) : null
  const vpdMinFinal = isVpdValid && vpdMin !== Infinity ? Number(vpdMin.toFixed(3)) : null
  const vpdMaxFinal = isVpdValid && vpdMax !== -Infinity ? Number(vpdMax.toFixed(3)) : null

  if (!silent) {
    if (!isTempValid && countTemp > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Temperatura 24h descartada por baja densidad de muestras (${countTemp} < ${limits.minTempHum24h}).`,
      )
    }
    if (!isHumValid && countHum > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Humedad 24h descartada por baja densidad de muestras (${countHum} < ${limits.minTempHum24h}).`,
      )
    }
    if (!isTempDayValid && countTempDay > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Temperatura diurna descartada por baja densidad de muestras (${countTempDay} < ${limits.minTempHumDay}).`,
      )
    }
    if (!isTempNightValid && countTempNight > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Temperatura nocturna descartada por baja densidad de muestras (${countTempNight} < ${limits.minTempHumNight}).`,
      )
    }
    if (!isLuxValid && countLumTotal > 0) {
      Logger.warn(
        `[${dayLabel}] [${zone}] Iluminancia/DLI descartada por baja densidad de muestras (Total: ${countLumTotal} < ${limits.minLuxTotal} y Window: ${countLum} < ${limits.minLuxBotanical}).`,
      )
    }
  }

  const avgTempDay =
    isTempDayValid && countTempDay > 0 ? Number((sumTempDay / countTempDay).toFixed(2)) : null
  const avgTempNight =
    isTempNightValid && countTempNight > 0
      ? Number((sumTempNight / countTempNight).toFixed(2))
      : null
  const dif =
    avgTempDay !== null && avgTempNight !== null
      ? Number((avgTempDay - avgTempNight).toFixed(2))
      : null
  const highHumidityHours =
    isHumNightValid && maxHighHumStreakMinutes > 0
      ? Number((maxHighHumStreakMinutes / 60).toFixed(1))
      : null

  const totalIrrigationMinutes =
    irrigationMinutes + soilWettingMinutes + fertigationMinutes + fumigationMinutes

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

    // Nuevas métricas de Día
    minTempDay: isTempDayValid && countTempDay > 0 ? safeInf(minTempDay) : null,
    minTempDayTime: isTempDayValid && countTempDay > 0 ? toCaracasTimeStr(minTempDayTime) : null,
    maxTempDay: isTempDayValid && countTempDay > 0 ? safeInf(maxTempDay) : null,
    maxTempDayTime: isTempDayValid && countTempDay > 0 ? toCaracasTimeStr(maxTempDayTime) : null,
    avgHumDay: isHumDayValid && countHumDay > 0 ? safeAvg(sumHumDay, countHumDay) : null,
    minHumDay: isHumDayValid && countHumDay > 0 ? safeInf(minHumDay) : null,
    minHumDayTime: isHumDayValid && countHumDay > 0 ? toCaracasTimeStr(minHumDayTime) : null,
    maxHumDay: isHumDayValid && countHumDay > 0 ? safeInf(maxHumDay) : null,
    maxHumDayTime: isHumDayValid && countHumDay > 0 ? toCaracasTimeStr(maxHumDayTime) : null,

    // Nuevas métricas de Noche
    minTempNight: isTempNightValid && countTempNight > 0 ? safeInf(minTempNight) : null,
    minTempNightTime:
      isTempNightValid && countTempNight > 0 ? toCaracasTimeStr(minTempNightTime) : null,
    maxTempNight: isTempNightValid && countTempNight > 0 ? safeInf(maxTempNight) : null,
    maxTempNightTime:
      isTempNightValid && countTempNight > 0 ? toCaracasTimeStr(maxTempNightTime) : null,
    avgHumNight: isHumNightValid && countHumNight > 0 ? safeAvg(sumHumNight, countHumNight) : null,
    minHumNight: isHumNightValid && countHumNight > 0 ? safeInf(minHumNight) : null,
    minHumNightTime:
      isHumNightValid && countHumNight > 0 ? toCaracasTimeStr(minHumNightTime) : null,
    maxHumNight: isHumNightValid && countHumNight > 0 ? safeInf(maxHumNight) : null,
    maxHumNightTime:
      isHumNightValid && countHumNight > 0 ? toCaracasTimeStr(maxHumNightTime) : null,

    avgIlluminance: isLuxValid ? safeAvg(sumLum, countLum) : null,
    minIlluminance: isLuxValid ? safeInf(minLum) : null,
    minIllumTime: isLuxValid ? toCaracasTimeStr(minLumTime) : null,
    maxIlluminance: isLuxValid ? safeInf(maxLum) : null,
    maxIllumTime: isLuxValid ? toCaracasTimeStr(maxLumTime) : null,

    // Iluminancia desglosada
    avgIllumDawn: isLuxValid && countIllumDawn > 0 ? safeAvg(sumIllumDawn, countIllumDawn) : null,
    minIllumDawn: isLuxValid && countIllumDawn > 0 ? safeInf(minIllumDawn) : null,
    minIllumDawnTime: isLuxValid && countIllumDawn > 0 ? toCaracasTimeStr(minIllumDawnTime) : null,
    maxIllumDawn: isLuxValid && countIllumDawn > 0 ? safeInf(maxIllumDawn) : null,
    maxIllumDawnTime: isLuxValid && countIllumDawn > 0 ? toCaracasTimeStr(maxIllumDawnTime) : null,

    avgIllumDay: isLuxValid && countIllumDay > 0 ? safeAvg(sumIllumDay, countIllumDay) : null,
    minIllumDay: isLuxValid && countIllumDay > 0 ? safeInf(minIllumDay) : null,
    minIllumDayTime: isLuxValid && countIllumDay > 0 ? toCaracasTimeStr(minIllumDayTime) : null,
    maxIllumDay: isLuxValid && countIllumDay > 0 ? safeInf(maxIllumDay) : null,
    maxIllumDayTime: isLuxValid && countIllumDay > 0 ? toCaracasTimeStr(maxIllumDayTime) : null,

    avgIllumDusk: isLuxValid && countIllumDusk > 0 ? safeAvg(sumIllumDusk, countIllumDusk) : null,
    minIllumDusk: isLuxValid && countIllumDusk > 0 ? safeInf(minIllumDusk) : null,
    minIllumDuskTime: isLuxValid && countIllumDusk > 0 ? toCaracasTimeStr(minIllumDuskTime) : null,
    maxIllumDusk: isLuxValid && countIllumDusk > 0 ? safeInf(maxIllumDusk) : null,
    maxIllumDuskTime: isLuxValid && countIllumDusk > 0 ? toCaracasTimeStr(maxIllumDuskTime) : null,

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
    irrigationMinutes: totalIrrigationMinutes,
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
    Logger.success(`[${dayLabel}] [${zone}] rows=${rowCount} DLI=${dli} VPD=${vpdAvg} DIF=${dif}`)

    if (!isExterior) {
      const firstLineParts: string[] = []

      if (nebulizationMinutes > 0) firstLineParts.push(`Foger=${nebulizationMinutes}min`)
      if (irrigationMinutes > 0) firstLineParts.push(`Irrigation=${irrigationMinutes}min`)
      if (soilWettingMinutes > 0) firstLineParts.push(`Soil_Wet=${soilWettingMinutes}min`)

      const secondLineParts: string[] = []

      if (fertigationMinutes > 0) secondLineParts.push(`Fertirrigation=${fertigationMinutes}min`)
      if (fumigationMinutes > 0) secondLineParts.push(`Fumigation=${fumigationMinutes}min`)

      if (firstLineParts.length > 0) {
        Logger.success(`[${dayLabel}] ${firstLineParts.join(' | ')}`)
      }
      if (secondLineParts.length > 0) {
        Logger.success(`[${dayLabel}] ${secondLineParts.join(' | ')}`)
      }
    }
  }

  return true
}
