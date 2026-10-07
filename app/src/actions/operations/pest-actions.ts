'use server'

import { revalidatePath } from 'next/cache'
import prisma, { type ZoneType, type Severity } from '@package/database'

import { Logger } from '@/lib'

/**
 * Obtiene el catálogo de plagas disponibles.
 */
export async function getPestCatalog() {
  try {
    const pests = await prisma.pest.findMany({
      orderBy: { name: 'asc' },
    })

    return { success: true, data: pests }
  } catch (error) {
    Logger.error('Error al obtener catálogo de plagas:', error)

    return {
      success: false,
      error: 'No se pudo cargar el catálogo de plagas.',
    }
  }
}

/**
 * Registra un avistamiento de plaga en una zona específica.
 */
export async function registerPestSighting(data: {
  pestId?: string
  pestName?: string
  zone: ZoneType
  severity: Severity
  notes?: string
  plantId?: string
}) {
  try {
    const now = new Date()
    const dateLimit = new Date(now)

    dateLimit.setDate(dateLimit.getDate() - 30)

    const stats = await prisma.dailyEnvironmentStat.findMany({
      where: {
        zone: data.zone,
        date: {
          gte: dateLimit,
          lte: now,
        },
      },
    })

    let avgTemp30d: number | null = null
    let avgHum30d: number | null = null
    let avgDli30d: number | null = null
    let highHumHours30d: number | null = null

    if (stats.length > 0) {
      let tempSum = 0
      let tempCount = 0
      let humSum = 0
      let humCount = 0
      let dliSum = 0
      let dliCount = 0
      let highHumSum = 0
      let highHumCount = 0

      for (const stat of stats) {
        if (stat.avgTemperature !== null && stat.avgTemperature !== undefined) {
          tempSum += stat.avgTemperature
          tempCount++
        }
        if (stat.avgHumidity !== null && stat.avgHumidity !== undefined) {
          humSum += stat.avgHumidity
          humCount++
        }
        if (stat.dli !== null && stat.dli !== undefined) {
          dliSum += stat.dli
          dliCount++
        }
        if (stat.highHumidityHours !== null && stat.highHumidityHours !== undefined) {
          highHumSum += stat.highHumidityHours
          highHumCount++
        }
      }

      if (tempCount > 0) avgTemp30d = tempSum / tempCount
      if (humCount > 0) avgHum30d = humSum / humCount
      if (dliCount > 0) avgDli30d = dliSum / dliCount
      if (highHumCount > 0) highHumHours30d = highHumSum / highHumCount
    }

    const sighting = await prisma.pestSighting.create({
      data: {
        pestId: data.pestId,
        pestName: data.pestName,
        zone: data.zone,
        severity: data.severity,
        notes: data.notes,
        plantId: data.plantId,
        capturedAt: now,
        avgTemp30d,
        avgHum30d,
        avgDli30d,
        highHumHours30d,
      },
      include: {
        pest: true,
      },
    })

    revalidatePath('/orchidarium')

    return { success: true, data: sighting }
  } catch (error) {
    Logger.error('Error al registrar avistamiento:', error)

    return {
      success: false,
      error: 'Error al guardar el reporte de plaga.',
    }
  }
}
