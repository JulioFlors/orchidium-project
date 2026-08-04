'use server'

import type { PotSize, PlantStatus, ZoneType } from '@package/database/enums'

import { revalidatePath } from 'next/cache'
import { prisma } from '@package/database'

import { Logger } from '@/lib'

// Auxiliar para obtener o crear la Location basada en la Zona
async function getOrCreateLocationForZone(zone: ZoneType) {
  let location = await prisma.location.findFirst({
    where: { zone },
  })

  if (!location) {
    location = await prisma.location.create({
      data: {
        zone,
        table: 'MESA_1',
      },
    })
  }

  return location
}

// ─────────────────────────────────────────────────────────────
// CREATE SINGLE PLANT
// ─────────────────────────────────────────────────────────────
export async function createPlant(data: {
  speciesId: string
  size: PotSize
  status: PlantStatus
  zone: ZoneType
  pottingDate?: string | null
}) {
  try {
    const location = await getOrCreateLocationForZone(data.zone)

    const plant = await prisma.plant.create({
      data: {
        speciesId: data.speciesId,
        currentSize: data.size,
        status: data.status,
        locationId: location.id,
        pottingDate: data.pottingDate ? new Date(data.pottingDate) : null,
      },
    })

    revalidatePath('/stock')
    revalidatePath(`/stock/${data.speciesId}`)

    return { ok: true, plant }
  } catch (err) {
    Logger.error('[Plant] Error al crear planta física:', err)

    return { ok: false, message: 'No se pudo registrar la planta.' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE SINGLE PLANT
// ─────────────────────────────────────────────────────────────
export async function updatePlant(
  id: string,
  data: {
    size?: PotSize
    status?: PlantStatus
    zone?: ZoneType
    pottingDate?: string | null
  },
) {
  try {
    const existing = await prisma.plant.findUnique({
      where: { id },
      select: { speciesId: true, currentSize: true, status: true },
    })

    if (!existing) {
      return { ok: false, message: 'Planta no encontrada.' }
    }

    // Validar: Para cambiar de estado a AVAILABLE, la variante comercial del tamaño debe tener un precio > 0
    if (data.status === 'AVAILABLE') {
      const targetSize = data.size || existing.currentSize
      const variant = await prisma.productVariant.findUnique({
        where: {
          speciesId_size: {
            speciesId: existing.speciesId,
            size: targetSize,
          },
        },
      })

      if (!variant || variant.price <= 0) {
        return {
          ok: false,
          message: `Para cambiar el estatus de la planta a "Disponible", debes configurar el precio de la variante de maceta (${targetSize}) asignándole un valor mayor a $0.00.`,
        }
      }
    }

    let locationId: string | undefined

    if (data.zone) {
      const loc = await getOrCreateLocationForZone(data.zone)

      locationId = loc.id
    }

    const plant = await prisma.plant.update({
      where: { id },
      data: {
        ...(data.size ? { currentSize: data.size } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(locationId ? { locationId } : {}),
        pottingDate:
          data.pottingDate !== undefined
            ? data.pottingDate
              ? new Date(data.pottingDate)
              : null
            : undefined,
      },
    })

    revalidatePath('/stock')
    revalidatePath(`/stock/${existing.speciesId}`)

    return { ok: true, plant }
  } catch (err) {
    Logger.error('[Plant] Error al actualizar planta física:', err)

    return { ok: false, message: 'No se pudo actualizar la planta.' }
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE SINGLE PLANT
// ─────────────────────────────────────────────────────────────
export async function deletePlant(id: string) {
  try {
    const existing = await prisma.plant.findUnique({
      where: { id },
      select: { speciesId: true },
    })

    await prisma.plant.delete({
      where: { id },
    })

    if (existing) {
      revalidatePath('/stock')
      revalidatePath(`/stock/${existing.speciesId}`)
    }

    return { ok: true }
  } catch (err) {
    Logger.error('[Plant] Error al eliminar planta física:', err)

    return { ok: false, message: 'No se pudo eliminar la planta.' }
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE BATCH PLANTS (LOTE MULTIVARIANTE)
// ─────────────────────────────────────────────────────────────
export async function createBatchPlants(data: {
  speciesId: string
  zone: ZoneType
  status?: PlantStatus
  eventType: string
  pottingDate?: string | null
  items: Array<{ size: PotSize; quantity: number; isMother?: boolean; status?: PlantStatus }>
}) {
  try {
    const location = await getOrCreateLocationForZone(data.zone)
    const pottingDateObj = data.pottingDate ? new Date(data.pottingDate) : null

    const createInputs: Array<{
      speciesId: string
      currentSize: PotSize
      status: PlantStatus
      locationId: string
      pottingDate: Date | null
    }> = []

    for (const item of data.items) {
      const itemStatus = item.isMother ? 'MOTHER' : item.status || data.status || 'AVAILABLE'

      for (let i = 0; i < item.quantity; i++) {
        createInputs.push({
          speciesId: data.speciesId,
          currentSize: item.size,
          status: itemStatus,
          locationId: location.id,
          pottingDate: pottingDateObj,
        })
      }
    }

    if (createInputs.length === 0) {
      return { ok: false, message: 'No se indicaron cantidades válidas.' }
    }

    await prisma.plant.createMany({
      data: createInputs,
    })

    revalidatePath('/stock')
    revalidatePath(`/stock/${data.speciesId}`)

    return { ok: true, count: createInputs.length }
  } catch (err) {
    Logger.error('[Plant] Error al crear lote de plantas:', err)

    return { ok: false, message: 'No se pudo registrar el lote de plantas.' }
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE FLOWERING EVENT
// ─────────────────────────────────────────────────────────────
export async function createFloweringEvent(data: {
  plantId: string
  startDate: string
  notes?: string
}) {
  try {
    const plant = await prisma.plant.findUnique({
      where: { id: data.plantId },
      select: { speciesId: true },
    })

    if (!plant) {
      return { ok: false, message: 'Planta no encontrada.' }
    }

    const floweringEvent = await prisma.floweringEvent.create({
      data: {
        plantId: data.plantId,
        startDate: new Date(data.startDate),
        notes: data.notes ?? null,
      },
    })

    revalidatePath('/stock')
    revalidatePath(`/stock/${plant.speciesId}`)

    return { ok: true, floweringEvent }
  } catch (err) {
    Logger.error('[Plant] Error al registrar evento de floración:', err)

    return { ok: false, message: 'No se pudo registrar la floración.' }
  }
}
