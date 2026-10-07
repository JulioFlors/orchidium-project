'use server'

import { revalidatePath } from 'next/cache'
import prisma, { type ZoneType } from '@package/database'

import { Logger } from '@/lib'
import { getCalendarMonth } from '@/utils'

export interface SpeciesImageSummary {
  id: string
  url: string
  position: number
}

export interface ActiveFloweringEvent {
  id: string
  startDate: Date
  notes: string | null
  plant: {
    id: string
    location: {
      zone: string
      table: string
    } | null
    species: {
      name: string
      genus: {
        name: string
      }
      images?: SpeciesImageSummary[]
    }
  }
}

/**
 * Obtiene las floraciones activas de forma atómica y ligera.
 * Consulta únicamente eventos vigentes (endDate null) y su imagen principal.
 */
export async function getActiveFloweringEvents(): Promise<{
  success: boolean
  data?: ActiveFloweringEvent[]
  error?: string
}> {
  try {
    const floweringEvents = await prisma.floweringEvent.findMany({
      where: { endDate: null },
      include: {
        plant: {
          include: {
            species: {
              include: {
                genus: true,
                images: {
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
            location: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    return {
      success: true,
      data: floweringEvents as ActiveFloweringEvent[],
    }
  } catch (error) {
    Logger.error('Error al obtener floraciones activas:', error)

    return {
      success: false,
      error: 'No se pudieron cargar las floraciones activas.',
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
    const isOrchid = plant.species.genus.type === 'ORCHID'
    const targetZone: ZoneType = isOrchid
      ? plant.location?.zone || ('ZONA_A' as ZoneType)
      : ('EXTERIOR' as ZoneType)

    // 3. Consultar las métricas de DailyEnvironmentStat de los últimos 30 días
    const dateLimit = new Date(data.startDate)

    dateLimit.setDate(dateLimit.getDate() - 30)

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
    let dliAtInduction: number | null = null
    let difAtInduction: number | null = null
    let tempDayAverage: number | null = null
    let tempNightAverage: number | null = null
    let humDayAverage: number | null = null
    let humNightAverage: number | null = null
    let vpdAverageAtInduction: number | null = null

    if (stats.length > 0) {
      let dliSum = 0
      let dliCount = 0
      let difSum = 0
      let difCount = 0
      let tempDaySum = 0
      let tempDayCount = 0
      let tempNightSum = 0
      let tempNightCount = 0
      let humDaySum = 0
      let humDayCount = 0
      let humNightSum = 0
      let humNightCount = 0
      let vpdSum = 0
      let vpdCount = 0

      for (const stat of stats) {
        if (stat.dli !== null && stat.dli !== undefined) {
          dliSum += stat.dli
          dliCount++
        }
        if (stat.dif !== null && stat.dif !== undefined) {
          difSum += stat.dif
          difCount++
        }
        if (stat.avgTempDay !== null && stat.avgTempDay !== undefined) {
          tempDaySum += stat.avgTempDay
          tempDayCount++
        }
        if (stat.avgTempNight !== null && stat.avgTempNight !== undefined) {
          tempNightSum += stat.avgTempNight
          tempNightCount++
        }
        if (stat.avgHumDay !== null && stat.avgHumDay !== undefined) {
          humDaySum += stat.avgHumDay
          humDayCount++
        }
        if (stat.avgHumNight !== null && stat.avgHumNight !== undefined) {
          humNightSum += stat.avgHumNight
          humNightCount++
        }
        if (stat.vpdAvg !== null && stat.vpdAvg !== undefined) {
          vpdSum += stat.vpdAvg
          vpdCount++
        }
      }

      if (dliCount > 0) dliAtInduction = dliSum / dliCount
      if (difCount > 0) difAtInduction = difSum / difCount
      if (tempDayCount > 0) tempDayAverage = tempDaySum / tempDayCount
      if (tempNightCount > 0) tempNightAverage = tempNightSum / tempNightCount
      if (humDayCount > 0) humDayAverage = humDaySum / humDayCount
      if (humNightCount > 0) humNightAverage = humNightSum / humNightCount
      if (vpdCount > 0) vpdAverageAtInduction = vpdSum / vpdCount
    }

    // 5. Crear el FloweringEvent con la climatología de inducción asociada (30 días)
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
        vpdAverageAtInduction,
        inductionWindowDays: 30,
        notes: data.notes || null,
      },
    })

    await syncSpeciesFloweringBenchmark(plant.speciesId)

    revalidatePath('/orchidarium')
    revalidatePath('/stock')
    revalidatePath(`/stock/${plant.speciesId}`)
    revalidatePath('/category/plants')

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
      include: {
        plant: { select: { speciesId: true } },
      },
    })

    if (event.plant) {
      await syncSpeciesFloweringBenchmark(event.plant.speciesId)
    }

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
 * Sincroniza y consolida el Benchmark de Floración de una especie (Patrimonio Botánico).
 * Inmune ante la venta, muerte o eliminación física de ejemplares.
 */
export async function syncSpeciesFloweringBenchmark(speciesId: string) {
  try {
    const species = await prisma.species.findUnique({
      where: { id: speciesId },
      select: {
        id: true,
        floweringDurationDays: true,
        floweringFrequencyYear: true,
        floweringMonths: true,
        floweringRecordsCount: true,
      },
    })

    if (!species) return { success: false, error: 'Especie no encontrada' }

    const oneYearAgo = new Date()

    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const floweringEvents = await prisma.floweringEvent.findMany({
      where: {
        plant: { speciesId },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        plantId: true,
      },
      orderBy: { startDate: 'desc' },
    })

    // Agrupar por planta
    const plantEventsMap: Record<
      string,
      Array<{ id: string; startDate: Date; endDate: Date | null }>
    > = {}

    const detectedMonths = new Set<number>()

    for (const fe of floweringEvents) {
      const month = getCalendarMonth(fe.startDate)

      detectedMonths.add(month)

      if (!plantEventsMap[fe.plantId]) {
        plantEventsMap[fe.plantId] = []
      }
      plantEventsMap[fe.plantId].push(fe)
    }

    // Calcular estadísticas por planta
    const plantsArray = Object.entries(plantEventsMap).map(([plantId, pEvents]) => {
      const lastYearCount = pEvents.filter((e) => new Date(e.startDate) >= oneYearAgo).length
      const closedEvents = pEvents.filter((e) => e.endDate !== null)

      let totalDays = 0

      for (const ce of closedEvents) {
        const ms = new Date(ce.endDate!).getTime() - new Date(ce.startDate).getTime()

        totalDays += Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
      }

      const avgDur = closedEvents.length > 0 ? Math.ceil(totalDays / closedEvents.length) : 0
      const mostRecentDate = pEvents[0] ? new Date(pEvents[0].startDate).getTime() : 0

      return {
        plantId,
        lastYearCount,
        avgDur,
        totalEvents: pEvents.length,
        mostRecentDate,
      }
    })

    // Ordenar para encontrar el mejor ejemplar físico
    plantsArray.sort((a, b) => {
      if (b.lastYearCount !== a.lastYearCount) return b.lastYearCount - a.lastYearCount
      if (b.avgDur !== a.avgDur) return b.avgDur - a.avgDur
      if (b.totalEvents !== a.totalEvents) return b.totalEvents - a.totalEvents

      return b.mostRecentDate - a.mostRecentDate
    })

    const bestPlant = plantsArray[0]

    let updatedFrequency = species.floweringFrequencyYear
    let updatedDuration = species.floweringDurationDays

    if (bestPlant) {
      updatedFrequency = Math.max(species.floweringFrequencyYear || 0, bestPlant.lastYearCount)
      if (bestPlant.avgDur > 0) {
        updatedDuration = Math.max(species.floweringDurationDays || 0, bestPlant.avgDur)
      }
    }

    const mergedMonths = Array.from(
      new Set([...(species.floweringMonths || []), ...Array.from(detectedMonths)]),
    ).sort((a, b) => a - b)

    const updatedRecordsCount = Math.max(species.floweringRecordsCount || 0, floweringEvents.length)

    await prisma.species.update({
      where: { id: speciesId },
      data: {
        floweringFrequencyYear: updatedFrequency,
        floweringDurationDays: updatedDuration,
        floweringMonths: mergedMonths,
        floweringRecordsCount: updatedRecordsCount,
      },
    })

    return { success: true }
  } catch (error) {
    Logger.error('Error al sincronizar benchmark de floración:', error)

    return { success: false, error: 'Error al sincronizar benchmark' }
  }
}

/**
 * Obtiene analítica de floración estructurada por ejemplar y consolidada por especie.
 */
export async function getSpeciesFloweringAnalytics(speciesSlugOrId: string) {
  try {
    const species = await prisma.species.findFirst({
      where: {
        OR: [{ slug: speciesSlugOrId }, { id: speciesSlugOrId }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        floweringDurationDays: true,
        floweringFrequencyYear: true,
        floweringMonths: true,
        floweringRecordsCount: true,
      },
    })

    if (!species) {
      return { success: false, error: 'Especie no encontrada.' }
    }

    const oneYearAgo = new Date()

    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const floweringEvents = await prisma.floweringEvent.findMany({
      where: {
        plant: {
          speciesId: species.id,
        },
      },
      include: {
        plant: {
          select: {
            id: true,
            currentSize: true,
            status: true,
            location: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    const monthlyFloweringDistribution: Record<number, number> = {}

    for (let i = 1; i <= 12; i++) monthlyFloweringDistribution[i] = 0

    // Agregar meses existentes en el benchmark histórico
    for (const m of species.floweringMonths || []) {
      if (m >= 1 && m <= 12) {
        monthlyFloweringDistribution[m] = Math.max(1, monthlyFloweringDistribution[m] || 0)
      }
    }

    // Procesar y enriquecer eventos
    const enrichedEvents = floweringEvents.map((fe) => {
      const month = getCalendarMonth(fe.startDate)

      monthlyFloweringDistribution[month] = (monthlyFloweringDistribution[month] || 0) + 1

      const isActive = !fe.endDate
      let durationDays: number | undefined
      let daysElapsed: number | undefined

      if (fe.endDate) {
        const ms = new Date(fe.endDate).getTime() - new Date(fe.startDate).getTime()

        durationDays = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
      } else {
        const ms = Date.now() - new Date(fe.startDate).getTime()

        daysElapsed = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
      }

      return {
        id: fe.id,
        startDate: fe.startDate,
        endDate: fe.endDate,
        notes: fe.notes,
        plantId: fe.plantId,
        plant: fe.plant,
        durationDays,
        isActive,
        daysElapsed,
      }
    })

    // Agrupar eventos por ejemplar (planta)
    const plantsStatsMap: Record<
      string,
      {
        plantId: string
        lastYearFloweringCount: number
        avgFloweringDurationDays: number
        totalFloweringEvents: number
        monthlyFloweringDistribution: Record<number, number>
        events: typeof enrichedEvents
        isFlowering: boolean
        mostRecentDate: number
      }
    > = {}

    for (const ev of enrichedEvents) {
      if (!plantsStatsMap[ev.plantId]) {
        const pDist: Record<number, number> = {}

        for (let i = 1; i <= 12; i++) pDist[i] = 0

        plantsStatsMap[ev.plantId] = {
          plantId: ev.plantId,
          lastYearFloweringCount: 0,
          avgFloweringDurationDays: 0,
          totalFloweringEvents: 0,
          monthlyFloweringDistribution: pDist,
          events: [],
          isFlowering: false,
          mostRecentDate: new Date(ev.startDate).getTime(),
        }
      }

      const pStat = plantsStatsMap[ev.plantId]

      pStat.events.push(ev)
      pStat.totalFloweringEvents++

      const month = getCalendarMonth(ev.startDate)

      pStat.monthlyFloweringDistribution[month] =
        (pStat.monthlyFloweringDistribution[month] || 0) + 1

      if (new Date(ev.startDate) >= oneYearAgo) {
        pStat.lastYearFloweringCount++
      }

      if (ev.isActive) {
        pStat.isFlowering = true
      }
    }

    // Calcular promedios por ejemplar con Math.ceil
    for (const pStat of Object.values(plantsStatsMap)) {
      const closedEvents = pStat.events.filter((e) => e.durationDays !== undefined)

      if (closedEvents.length > 0) {
        const totalD = closedEvents.reduce((acc, e) => acc + (e.durationDays || 0), 0)

        pStat.avgFloweringDurationDays = Math.ceil(totalD / closedEvents.length)
      } else {
        pStat.avgFloweringDurationDays = 0
      }
    }

    // Ordenar para identificar al Champion Plant
    const allPlantsStats = Object.values(plantsStatsMap)

    allPlantsStats.sort((a, b) => {
      if (b.lastYearFloweringCount !== a.lastYearFloweringCount) {
        return b.lastYearFloweringCount - a.lastYearFloweringCount
      }
      if (b.avgFloweringDurationDays !== a.avgFloweringDurationDays) {
        return b.avgFloweringDurationDays - a.avgFloweringDurationDays
      }
      if (b.totalFloweringEvents !== a.totalFloweringEvents) {
        return b.totalFloweringEvents - a.totalFloweringEvents
      }

      return b.mostRecentDate - a.mostRecentDate
    })

    const champion = allPlantsStats[0]

    const championPlantId = champion ? champion.plantId : null
    const lastYearFloweringCount = champion
      ? champion.lastYearFloweringCount
      : species.floweringFrequencyYear || 0

    const avgFloweringDurationDays =
      champion && champion.avgFloweringDurationDays > 0
        ? champion.avgFloweringDurationDays
        : species.floweringDurationDays || 0

    const totalFloweringEvents = Math.max(
      floweringEvents.length,
      species.floweringRecordsCount || 0,
    )

    return {
      success: true,
      data: {
        speciesId: species.id,
        speciesName: species.name,
        speciesSlug: species.slug,
        avgFloweringDurationDays,
        lastYearFloweringCount,
        totalFloweringEvents,
        monthlyFloweringDistribution,
        championPlantId,
        plantsStats: plantsStatsMap,
        events: enrichedEvents,
      },
    }
  } catch (error) {
    Logger.error('Error al obtener analítica de floración por especie:', error)

    return {
      success: false,
      error: 'Error al obtener la analítica de floración de la especie.',
    }
  }
}
