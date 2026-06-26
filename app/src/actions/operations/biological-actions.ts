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
    const sighting = await prisma.pestSighting.create({
      data: {
        pestId: data.pestId,
        pestName: data.pestName,
        zone: data.zone,
        severity: data.severity,
        notes: data.notes,
        plantId: data.plantId,
        capturedAt: new Date(),
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

/**
 * Registra un evento de inicio de floración para una planta.
 */
export async function registerFlowering(data: {
  plantId: string
  startDate: Date
  notes?: string
}) {
  try {
    // 1. Buscar la planta para saber su tipo y ubicación
    const plant = await prisma.plant.findUnique({
      where: { id: data.plantId },
      include: {
        location: true,
        species: {
          include: {
            genus: true,
          },
        },
      },
    })

    if (!plant) {
      return { success: false, error: 'Planta no encontrada.' }
    }

    // 2. Determinar la zona climática EMA correspondiente
    // Por defecto, orquídeas usan el invernadero (su zona asignada, o fallback a ZONA_A),
    // el resto (cactus, suculentas, adenium, bromelias) usan EXTERIOR.
    const isOrchid = plant.species.genus.type === 'ORCHID'
    const targetZone: ZoneType = isOrchid
      ? (plant.location?.zone || 'ZONA_A' as ZoneType)
      : 'EXTERIOR' as ZoneType

    // 3. Consultar las métricas de DailyEnvironmentStat de los últimos 7 días
    const dateLimit = new Date(data.startDate)
    dateLimit.setDate(dateLimit.getDate() - 7)

    const stats = await prisma.dailyEnvironmentStat.findMany({
      where: {
        zone: targetZone,
        date: {
          gte: dateLimit,
          lte: data.startDate,
        },
      },
    })

    // 4. Calcular los promedios de las métricas
    let dliAtInduction = null
    let difAtInduction = null
    let tempDayAverage = null
    let tempNightAverage = null
    let humDayAverage = null
    let humNightAverage = null

    if (stats.length > 0) {
      let dliSum = 0, dliCount = 0
      let difSum = 0, difCount = 0
      let tempDaySum = 0, tempDayCount = 0
      let tempNightSum = 0, tempNightCount = 0
      let humDaySum = 0, humDayCount = 0
      let humNightSum = 0, humNightCount = 0

      for (const stat of stats) {
        if (stat.dli !== null && stat.dli !== undefined) { dliSum += stat.dli; dliCount++; }
        if (stat.dif !== null && stat.dif !== undefined) { difSum += stat.dif; difCount++; }
        if (stat.avgTempDay !== null && stat.avgTempDay !== undefined) { tempDaySum += stat.avgTempDay; tempDayCount++; }
        if (stat.avgTempNight !== null && stat.avgTempNight !== undefined) { tempNightSum += stat.avgTempNight; tempNightCount++; }
        if (stat.avgHumDay !== null && stat.avgHumDay !== undefined) { humDaySum += stat.avgHumDay; humDayCount++; }
        if (stat.avgHumNight !== null && stat.avgHumNight !== undefined) { humNightSum += stat.avgHumNight; humNightCount++; }
      }

      if (dliCount > 0) dliAtInduction = dliSum / dliCount
      if (difCount > 0) difAtInduction = difSum / difCount
      if (tempDayCount > 0) tempDayAverage = tempDaySum / tempDayCount
      if (tempNightCount > 0) tempNightAverage = tempNightSum / tempNightCount
      if (humDayCount > 0) humDayAverage = humDaySum / humDayCount
      if (humNightCount > 0) humNightAverage = humNightSum / humNightCount
    }

    // 5. Crear el FloweringEvent con la climatología de inducción asociada
    const event = await prisma.floweringEvent.create({
      data: {
        plantId: data.plantId,
        startDate: data.startDate,
        dliAtInduction,
        difAtInduction,
        tempDayAverage,
        tempNightAverage,
        humDayAverage,
        humNightAverage,
        notes: data.notes || null,
      },
    })

    revalidatePath('/orchidarium')
    revalidatePath('/category/plants') // Para actualizar el label de "Floración" en la tienda

    return { success: true, data: event }
  } catch (error) {
    Logger.error('Error al registrar floración:', error)

    return {
      success: false,
      error: 'Error al registrar la floración.',
    }
  }
}

/**
 * Obtiene plantas de una zona para el selector de floración.
 */
export async function getPlantsByZone(zone: ZoneType) {
  try {
    const plants = await prisma.plant.findMany({
      where: {
        location: {
          zone: zone,
        },
      },
      include: {
        species: true,
      },
      take: 50,
    })

    return { success: true, data: plants }
  } catch (error) {
    Logger.error('Error al obtener plantas por zona:', error)

    return {
      success: false,
      error: 'No se pudieron obtener las plantas de la zona.',
    }
  }
}

/**
 * Finaliza un evento de floración activo para una planta.
 */
export async function endFlowering(eventId: string, endDate: Date) {
  try {
    const event = await prisma.floweringEvent.update({
      where: { id: eventId },
      data: { endDate },
    })

    revalidatePath('/orchidarium')
    revalidatePath('/category/plants')

    return { success: true, data: event }
  } catch (error) {
    Logger.error('Error al finalizar floración:', error)

    return {
      success: false,
      error: 'No se pudo finalizar el evento de floración.',
    }
  }
}

/**
 * Obtiene los eventos de floración activos y avistamientos de plagas recientes.
 */
export async function getActiveBiologicalEvents() {
  try {
    const floweringEvents = await prisma.floweringEvent.findMany({
      where: { endDate: null },
      include: {
        plant: {
          include: {
            species: {
              include: {
                genus: true,
              },
            },
            location: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    const pestSightings = await prisma.pestSighting.findMany({
      take: 15,
      include: {
        pest: true,
        plant: {
          include: {
            species: true,
          },
        },
      },
      orderBy: { capturedAt: 'desc' },
    })

    return {
      success: true,
      data: {
        floweringEvents,
        pestSightings,
      },
    }
  } catch (error) {
    Logger.error('Error al obtener eventos biológicos activos:', error)

    return {
      success: false,
      error: 'No se pudieron cargar los eventos biológicos activos.',
    }
  }
}

