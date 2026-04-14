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
}

/**
 * Obtiene los insights botánicos más recientes (ayer o hace unos días) de una zona específica.
 */
export async function getLatestBotanicalInsights(
  zone: ZoneType = 'EXTERIOR',
): Promise<{ success: boolean; data?: BotanicalInsights; error?: string }> {
  try {
    // Buscamos el registro pre-agregado más reciente (usualmente el de ayer insertado a las 23:55)
    const stat = await prisma.dailyEnvironmentStat.findFirst({
      where: { zone },
      orderBy: { date: 'desc' },
    })

    if (!stat) {
      return { success: false, error: 'No hay datos botánicos históricos disponibles.' }
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
 * Obtiene el último pronóstico capturado por el Oráculo del Clima.
 */
export async function getLatestOracleForecast(): Promise<{
  success: boolean
  data?: OracleForecast
  error?: string
}> {
  try {
    const forecast = await prisma.weatherForecast.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!forecast) {
      return {
        success: false,
        error: 'No hay datos del oráculo meteorológico en la base de datos.',
      }
    }

    return {
      success: true,
      data: {
        timestamp: forecast.timestamp,
        temperature: forecast.temperature,
        humidity: forecast.humidity,
        precipProb: forecast.precipProb,
        condition: forecast.condition,
        soilMoisture: forecast.soilMoisture,
        windSpeed: forecast.windSpeed,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    return { success: false, error: `Error leyendo Oráculo: ${msg}` }
  }
}
