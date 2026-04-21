'use server'

import { revalidatePath } from 'next/cache'
import prisma, { type ZoneType, type Severity } from '@package/database'

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
    console.error('Error al obtener catálogo de plagas:', error)

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
    console.error('Error al registrar avistamiento:', error)

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
    const event = await prisma.floweringEvent.create({
      data: {
        plantId: data.plantId,
        startDate: data.startDate,
      },
    })

    // Si hay notas, podríamos guardarlas en un Log de la planta (futuro)
    // Por ahora solo el evento de floración.

    revalidatePath('/orchidarium')
    revalidatePath('/category/plants') // Para actualizar el label de "Floración" en la tienda

    return { success: true, data: event }
  } catch (error) {
    console.error('Error al registrar floración:', error)

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
    console.error('Error al obtener plantas por zona:', error)

    return {
      success: false,
      error: 'No se pudieron obtener las plantas de la zona.',
    }
  }
}
