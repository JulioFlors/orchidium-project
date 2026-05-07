'use server'

import { prisma, ZoneType } from '@package/database'

export interface BotanicalInsights {
  dli: number | null
  vpdAvg: number | null
  dif: number | null
  avgTempDay: number | null
  avgTempNight: number | null
  highHumidityHours: number | null
  irrigationMinutes: number | null
  totalWaterEvents: number | null
  date: Date
}

export interface OracleForecast {
  timestamp: Date
  temperature: number
  humidity: number
  precipProb: number
  condition: string
  soilMoisture: number | null
  windSpeed: number | null
  pressure: number | null
  sources: {
    owm?: { precipProb: number; temp: number }
    om?: { precipProb: number; temp: number }
  }
  localSensors?: {
    lux: number | null
    temp: number | null
    hum: number | null
  }
}

/**
 * Obtiene los insights botánicos más recientes (ayer o hace unos días) de una zona específica.
 */
export async function getLatestBotanicalInsights(
  zone: ZoneType = ZoneType.EXTERIOR,
): Promise<{ success: boolean; data?: BotanicalInsights; error?: string }> {
  try {
    // Buscamos el registro pre-agregado más reciente (usualmente el de ayer insertado a las 23:55)
    const stat = await prisma.dailyEnvironmentStat.findFirst({
      where: { zone },
      orderBy: { date: 'desc' },
    })

    if (!stat) {
      return { success: false, error: `No hay datos botánicos históricos para la zona ${zone}.` }
    }

    return {
      success: true,
      data: {
        dli: stat.dli,
        vpdAvg: stat.vpdAvg,
        dif: stat.dif,
        avgTempDay: stat.avgTempDay,
        avgTempNight: stat.avgTempNight,
        highHumidityHours: stat.highHumidityHours,
        irrigationMinutes: stat.irrigationMinutes,
        totalWaterEvents: stat.totalWaterEvents,
        date: stat.date,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: `Error leyendo insights botánicos: ${msg}` }
  }
}

/**
 * Obtiene los insights más recientes de TODAS las zonas disponibles.
 */
export async function getAllLatestBotanicalInsights(): Promise<{
  success: boolean
  data?: Record<string, BotanicalInsights>
  error?: string
}> {
  try {
    const zones: ZoneType[] = [ZoneType.ZONA_A, ZoneType.ZONA_B, ZoneType.EXTERIOR]
    const results: Record<string, BotanicalInsights> = {}

    const insights = await Promise.all(
      zones.map(async (zone) => {
        const res = await getLatestBotanicalInsights(zone)

        return { zone, res }
      }),
    )

    for (const { zone, res } of insights) {
      if (res.success && res.data) {
        results[zone] = res.data
      }
    }

    return { success: true, data: results }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: `Error leyendo lista de insights: ${msg}` }
  }
}

import { influxClient } from '@/lib/server/influxdb'

/**
 * Obtiene el último pronóstico capturado por el Oráculo del Clima,
 * fusionando el clima general con la última lectura de suelo satelital y sensores locales.
 */
export async function getLatestOracleForecast(): Promise<{
  success: boolean
  data?: OracleForecast
  error?: string
}> {
  try {
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60000)
    const hourAhead = new Date(now.getTime() + 60 * 60000)

    // 1. Obtener todos los pronósticos cercanos a la hora actual para el consenso
    const forecasts = await prisma.weatherForecast.findMany({
      where: {
        timestamp: { gte: hourAgo, lte: hourAhead },
        source: { in: ['Open-Meteo', 'OpenWeatherMap'] },
      },
      orderBy: { timestamp: 'desc' },
    })

    const owm = forecasts.find((f) => f.source === 'OpenWeatherMap')
    const om = forecasts.find((f) => f.source === 'Open-Meteo')

    // Usamos el más reciente como base general, o priorizamos OM si existe por ser más estable
    const primary = om || owm

    // 2. Obtener la última lectura de suelo (AgroMonitoring)
    const latestSoil = await prisma.weatherForecast.findFirst({
      where: {
        source: 'AgroMonitoring',
        soilMoisture: { not: null },
      },
      orderBy: { timestamp: 'desc' },
    })

    // 3. Obtener telemetría local actual (última lectura de EXTERIOR)
    let localSensors: { lux: number | null; temp: number | null; hum: number | null } = {
      lux: null,
      temp: null,
      hum: null,
    }

    try {
      const localQuery = `SELECT last("illuminance") as lux, last("temperature") as temp, last("humidity") as hum FROM "environment_metrics" WHERE "zone" = '${ZoneType.EXTERIOR}'`
      const localStream = influxClient.query(localQuery)

      for await (const row of localStream) {
        localSensors = {
          lux: row.lux ? Number(row.lux) : null,
          temp: row.temp ? Number(row.temp) : null,
          hum: row.hum ? Number(row.hum) : null,
        }
      }
    } catch {
      // Si falla Influx, localSensors queda en null
    }

    if (!primary) {
      return {
        success: false,
        error: 'No hay datos del oráculo meteorológico para la hora actual.',
      }
    }

    return {
      success: true,
      data: {
        timestamp: primary.timestamp,
        temperature: primary.temperature,
        humidity: primary.humidity,
        precipProb: primary.precipProb,
        condition: primary.condition,
        soilMoisture: latestSoil?.soilMoisture ?? null,
        windSpeed: primary.windSpeed,
        pressure: primary.pressure,
        sources: {
          owm: owm ? { precipProb: owm.precipProb, temp: owm.temperature } : undefined,
          om: om ? { precipProb: om.precipProb, temp: om.temperature } : undefined,
        },
        localSensors,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: `Error leyendo Oráculo: ${msg}` }
  }
}
