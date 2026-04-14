import { InfluxDBClient } from '@influxdata/influxdb3-client'
import { prisma, ZoneType } from '@package/database'

const INFLUX_URL = process.env.INFLUX_URL || process.env.INFLUX_URL_CLOUD || process.env.INFLUX_URL_SERVERLESS || process.env.INFLUX_URL_LOCAL || 'http://localhost:8181'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || process.env.INFLUX_TOKEN_SERVERLESS
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'telemetry'

const url = new URL(INFLUX_URL)
if ((url.hostname === 'influxdb' || url.hostname === 'localhost') && !url.hostname.endsWith('influxdata.com')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const influxClient = new InfluxDBClient({
  host: INFLUX_URL,
  token: INFLUX_TOKEN,
  database: INFLUX_BUCKET,
})

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte el timestamp heterogéneo de InfluxDB 3 a Date */
function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)
  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

/** Hora local en Caracas (UTC-4) */
function localHourCaracas(d: Date): number {
  return (d.getUTCHours() - 4 + 24) % 24
}

/** Formatea ISO → "HH:MM" en hora de Caracas */
function toCaracasTimeStr(isoStr: string | null): string | null {
  if (!isoStr) return null
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return null
  return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas' })
}

const safeAvg = (sum: number, count: number) => count > 0 ? Number((sum / count).toFixed(2)) : 0
const safeInf = (v: number) => (v === Infinity || v === -Infinity) ? 0 : Number(v.toFixed(2))

/**
 * Calcula el VPD (Déficit de Presión de Vapor) en kPa.
 * Fórmula de Magnus: SVP = 0.6108 × e^(17.27×T / (T+237.3))
 * VPD = SVP × (1 - HR/100)
 */
function calculateVPD(tempC: number, humidityPercent: number): number {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
  return Number((svp * (1 - humidityPercent / 100)).toFixed(3))
}

// ── Agregación Principal ─────────────────────────────────────────────────────

export async function aggregateDailyStats(targetDate = new Date()) {
  console.log(`[ CRON ] Iniciando agregación diaria para ${targetDate.toISOString()}`)

  const targetDayStart = new Date(targetDate)
  targetDayStart.setHours(0, 0, 0, 0)

  const targetDayEnd = new Date(targetDayStart)
  targetDayEnd.setDate(targetDayEnd.getDate() + 1)

  const timeFilter = `AND time >= '${targetDayStart.toISOString()}' AND time < '${targetDayEnd.toISOString()}'`

  const zones: ZoneType[] = ['EXTERIOR', 'ZONA_A']

  for (const zone of zones) {
    try {
      const isExterior = zone === 'EXTERIOR'

      // ── 1. Lluvia (solo EXTERIOR) ───────────────────────────────────────
      let totalRain = 0
      if (isExterior) {
        try {
          const rainQuery = `SELECT SUM(duration_seconds) as total_rain FROM "rain_events" WHERE zone = '${zone}' ${timeFilter}`
          const rainStream = influxClient.query(rainQuery)
          for await (const row of rainStream) {
            totalRain = Number(row.total_rain || 0)
          }
        } catch (e) {
          console.error(`[ CRON ] Error InfluxDB Rain_Events zone ${zone}:`, e)
        }
      }

      // ── 2. Métricas ambientales (24h completas) ─────────────────────────
      const rawQuery = `SELECT time, temperature, humidity, illuminance FROM "environment_metrics" WHERE "zone" = '${zone}' ${timeFilter}`

      // Acumuladores – Temperatura (24h)
      let countTemp = 0, sumTemp = 0, minTemp = Infinity, maxTemp = -Infinity
      let minTempTime: string | null = null, maxTempTime: string | null = null

      // Acumuladores – Humedad (24h)
      let countHum = 0, sumHum = 0, minHum = Infinity, maxHum = -Infinity
      let minHumTime: string | null = null, maxHumTime: string | null = null

      // Acumuladores – Iluminancia (solo 08:00–16:00 hora Caracas)
      let countLum = 0, sumLum = 0, minLum = Infinity, maxLum = -Infinity
      let minLumTime: string | null = null, maxLumTime: string | null = null

      // ── Acumuladores Botánicos ──────────────────────────────────────────

      // DLI: Integral de luz fotosintética (Lux → PPFD → DLI)
      let dliAccumulator = 0 // Almacena Σ(PPFD × Δt_segundos)
      let lastLuxTime: Date | null = null

      // VPD: Déficit de presión de vapor (solo horario diurno 08-16)
      let vpdSum = 0, vpdCount = 0, vpdMin = Infinity, vpdMax = -Infinity

      // DIF: Temp diurna (08-16) vs nocturna (20-06)
      let sumTempDay = 0, countTempDay = 0
      let sumTempNight = 0, countTempNight = 0

      // Riesgo Epidemiológico: horas con HR > 85% en período nocturno
      let highHumStreakMinutes = 0
      let maxHighHumStreakMinutes = 0
      let lastHumTime: Date | null = null

      try {
        const stream = influxClient.query(rawQuery)
        for await (const row of stream) {
          const tDate = rowTimeToDate(row.time)
          const tIso = tDate.toISOString()
          const localHour = localHourCaracas(tDate)
          const isDaytime = localHour >= 8 && localHour < 16
          const isNighttime = localHour >= 20 || localHour < 6

          // ── Temperatura (24h) ───────────────────────────────────────────
          if (row.temperature != null) {
            const v = Number(row.temperature)
            if (!isNaN(v)) {
              sumTemp += v; countTemp++
              if (v < minTemp) { minTemp = v; minTempTime = tIso }
              if (v > maxTemp) { maxTemp = v; maxTempTime = tIso }

              // DIF: clasificar por horario
              if (isDaytime) { sumTempDay += v; countTempDay++ }
              if (isNighttime) { sumTempNight += v; countTempNight++ }
            }
          }

          // ── Humedad (24h) ───────────────────────────────────────────────
          if (row.humidity != null) {
            const v = Number(row.humidity)
            if (!isNaN(v)) {
              sumHum += v; countHum++
              if (v < minHum) { minHum = v; minHumTime = tIso }
              if (v > maxHum) { maxHum = v; maxHumTime = tIso }

              // Riesgo epidemiológico: contar racha nocturna de HR > 85%
              if (isNighttime && v > 85) {
                if (lastHumTime) {
                  const deltaMin = (tDate.getTime() - lastHumTime.getTime()) / 60000
                  // Solo acumular si el intervalo entre lecturas es razonable (< 15 min)
                  if (deltaMin > 0 && deltaMin < 15) {
                    highHumStreakMinutes += deltaMin
                    if (highHumStreakMinutes > maxHighHumStreakMinutes) {
                      maxHighHumStreakMinutes = highHumStreakMinutes
                    }
                  }
                }
                lastHumTime = tDate
              } else {
                // Se rompió la racha
                highHumStreakMinutes = 0
                lastHumTime = null
              }

              // VPD: calcular solo en horario diurno con temperatura disponible
              if (isDaytime && row.temperature != null) {
                const tempV = Number(row.temperature)
                if (!isNaN(tempV)) {
                  const vpd = calculateVPD(tempV, v)
                  vpdSum += vpd; vpdCount++
                  if (vpd < vpdMin) vpdMin = vpd
                  if (vpd > vpdMax) vpdMax = vpd
                }
              }
            }
          }

          // ── Iluminancia (solo 08:00–16:00 hora Caracas) ─────────────────
          if (row.illuminance != null && isDaytime) {
            const v = Number(row.illuminance)
            if (!isNaN(v)) {
              sumLum += v; countLum++
              if (v < minLum) { minLum = v; minLumTime = tIso }
              if (v > maxLum) { maxLum = v; maxLumTime = tIso }

              // DLI: integrar PPFD × Δt
              // PPFD (µmol/m²/s) ≈ Lux × 0.018 (factor de conversión solar)
              if (lastLuxTime) {
                const deltaSeconds = (tDate.getTime() - lastLuxTime.getTime()) / 1000
                if (deltaSeconds > 0 && deltaSeconds < 900) { // < 15 min entre lecturas
                  const ppfd = v * 0.018
                  dliAccumulator += ppfd * deltaSeconds
                }
              }
              lastLuxTime = tDate
            }
          }
        }
      } catch (e) {
        console.error(`[ CRON ] Error InfluxDB environment_metrics zone ${zone}:`, e)
      }

      // ── 3. Balance Hídrico desde TaskLog ─────────────────────────────────
      let irrigationMinutes = 0
      let nebulizationMinutes = 0
      let totalWaterEvents = 0

      try {
        // Contar minutos de riego ejecutados en el día
        const taskLogs = await prisma.taskLog.findMany({
          where: {
            status: 'COMPLETED',
            actualStartAt: { gte: targetDayStart, lt: targetDayEnd },
          },
          select: { purpose: true, actualStartAt: true, completedAt: true },
        })

        for (const task of taskLogs) {
          if (!task.actualStartAt || !task.completedAt) continue
          const durationMin = Math.round((task.completedAt.getTime() - task.actualStartAt.getTime()) / 60000)

          const purposeStr = String(task.purpose || '').toUpperCase()
          if (purposeStr.includes('NEBUL') || purposeStr.includes('HUMIDIF')) {
            nebulizationMinutes += durationMin
            totalWaterEvents++
          } else if (purposeStr.includes('RIEGO') || purposeStr.includes('IRRIG')) {
            irrigationMinutes += durationMin
            totalWaterEvents++
          }
        }

        // Lluvia también es un evento de agua
        if (totalRain > 0) totalWaterEvents++
      } catch (e) {
        console.error(`[ CRON ] Error consultando TaskLog para balance hídrico:`, e)
      }

      // ── 4. Cálculos finales ──────────────────────────────────────────────

      // DLI: convertir µmol/m² acumulados → mol/m²/d (÷ 1,000,000)
      const dli = dliAccumulator > 0 ? Number((dliAccumulator / 1_000_000).toFixed(2)) : null

      // VPD promedio diurno
      const vpdAvg = vpdCount > 0 ? Number((vpdSum / vpdCount).toFixed(3)) : null
      const vpdMinFinal = vpdMin !== Infinity ? Number(vpdMin.toFixed(3)) : null
      const vpdMaxFinal = vpdMax !== -Infinity ? Number(vpdMax.toFixed(3)) : null

      // DIF: Diferencial térmico día-noche
      const avgTempDay = countTempDay > 0 ? Number((sumTempDay / countTempDay).toFixed(2)) : null
      const avgTempNight = countTempNight > 0 ? Number((sumTempNight / countTempNight).toFixed(2)) : null
      const dif = avgTempDay !== null && avgTempNight !== null
        ? Number((avgTempDay - avgTempNight).toFixed(2))
        : null

      // Horas de humedad alta nocturna
      const highHumidityHours = maxHighHumStreakMinutes > 0
        ? Number((maxHighHumStreakMinutes / 60).toFixed(1))
        : null

      // ── 5. Upsert en PostgreSQL ──────────────────────────────────────────

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
        // Métricas botánicas
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

      await prisma.dailyEnvironmentStat.upsert({
        where: { date_zone: { date: targetDayStart, zone } },
        create: { date: targetDayStart, zone, ...coreData },
        update: coreData,
      })

      console.log(`[ CRON ] Stats ${zone} guardados OK. DLI=${dli} VPD=${vpdAvg} DIF=${dif}`)
    } catch (e) {
      console.error(`[ CRON ] Error procesando zona ${zone} en aggregateDailyStats:`, e)
    }
  }
}
