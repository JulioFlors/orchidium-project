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

// Auxiliar para sincronizar el stock comercial (no-op tras migración, stock derivado en vivo)
export async function syncVariantStock(_speciesId: string, _size: PotSize) {
  // Las variantes ya no almacenan columas quantity/available estáticas; el stock es 100% derivado dinámicamente de Plant
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
    // Validar: Para registrar una planta con estatus AVAILABLE (tienda), la variante comercial debe existir y tener precio > 0
    if (data.status === 'AVAILABLE') {
      const variant = await prisma.productVariant.findUnique({
        where: {
          speciesId_size: {
            speciesId: data.speciesId,
            size: data.size,
          },
        },
      })

      if (!variant || variant.price <= 0) {
        return {
          ok: false,
          message: `Para registrar una planta física disponible para la venta (${data.size}), debes configurar primero el precio de la variante asignándole un valor mayor a $0.00.`,
        }
      }
    }

    const location = await getOrCreateLocationForZone(data.zone)

    const plant = await prisma.plant.create({
      data: {
        speciesId: data.speciesId,
        currentSize: data.size,
        status: data.status,
        locationId: location.id,
        pottingDate: data.pottingDate ? new Date(data.pottingDate) : null,
      },
      include: {
        location: { select: { id: true, zone: true, table: true } },
        FloweringEvent: {
          select: { id: true, startDate: true, endDate: true },
          orderBy: { startDate: 'desc' as const },
        },
      },
    })

    await syncVariantStock(data.speciesId, data.size)

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

    const targetStatus = data.status || existing.status
    const targetSize = data.size || existing.currentSize

    // Validar: Para mantener o cambiar el estatus a AVAILABLE, la variante debe tener precio > 0
    if (targetStatus === 'AVAILABLE') {
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
          message: `Para asignar el estatus de "Disponible" a la planta (${targetSize}), debes configurar el precio de la variante de maceta asignándole un valor mayor a $0.00.`,
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
      include: {
        location: { select: { id: true, zone: true, table: true } },
        FloweringEvent: {
          select: { id: true, startDate: true, endDate: true },
          orderBy: { startDate: 'desc' as const },
        },
      },
    })

    await syncVariantStock(existing.speciesId, existing.currentSize)
    if (data.size && data.size !== existing.currentSize) {
      await syncVariantStock(existing.speciesId, data.size)
    }

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
      select: { speciesId: true, currentSize: true },
    })

    await prisma.plant.delete({
      where: { id },
    })

    if (existing) {
      await syncVariantStock(existing.speciesId, existing.currentSize)
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
    // Validar variantes de precio > 0 para todas las plantas disponibles del lote
    for (const item of data.items) {
      const itemStatus = item.isMother ? 'MOTHER' : item.status || data.status || 'AVAILABLE'

      if (itemStatus === 'AVAILABLE' && item.quantity > 0) {
        const variant = await prisma.productVariant.findUnique({
          where: {
            speciesId_size: {
              speciesId: data.speciesId,
              size: item.size,
            },
          },
        })

        if (!variant || variant.price <= 0) {
          return {
            ok: false,
            message: `Para incluir plantas disponibles en el lote (${item.size}), debes configurar la variante correspondiente con un precio mayor a $0.00.`,
          }
        }
      }
    }

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

    // Sincronizar variantes comerciales de todos los tamaños del lote
    for (const item of data.items) {
      await syncVariantStock(data.speciesId, item.size)
    }

    // Re-consultar todas las plantas de la especie con relaciones completas
    const allPlants = await prisma.plant.findMany({
      where: { speciesId: data.speciesId },
      select: {
        id: true,
        currentSize: true,
        pottingDate: true,
        status: true,
        location: { select: { id: true, zone: true, table: true } },
        FloweringEvent: {
          select: { id: true, startDate: true, endDate: true },
          orderBy: { startDate: 'desc' as const },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    revalidatePath('/stock')
    revalidatePath(`/stock/${data.speciesId}`)

    return { ok: true, count: createInputs.length, plants: allPlants }
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
  endDate?: string | null
  notes?: string
}) {
  try {
    const plant = await prisma.plant.findUnique({
      where: { id: data.plantId },
      select: {
        speciesId: true,
        FloweringEvent: {
          where: { endDate: null },
          select: { id: true },
        },
      },
    })

    if (!plant) {
      return { ok: false, message: 'Planta no encontrada.' }
    }

    if (plant.FloweringEvent && plant.FloweringEvent.length > 0) {
      return {
        ok: false,
        message:
          'Esta planta ya posee un evento de floración activo. Debes finalizarlo antes de iniciar uno nuevo.',
      }
    }

    const startDateObj = new Date(data.startDate)
    const endDateObj = data.endDate ? new Date(data.endDate) : null

    if (endDateObj && endDateObj < startDateObj) {
      return {
        ok: false,
        message: 'La fecha de cierre de floración no puede ser anterior a la fecha de inicio.',
      }
    }

    const floweringEvent = await prisma.floweringEvent.create({
      data: {
        plantId: data.plantId,
        startDate: startDateObj,
        endDate: endDateObj,
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

// ─────────────────────────────────────────────────────────────
// CLOSE FLOWERING EVENT
// ─────────────────────────────────────────────────────────────
export async function closeFloweringEvent(data: {
  eventId: string
  endDate: string
  notes?: string
}) {
  try {
    const existing = await prisma.floweringEvent.findUnique({
      where: { id: data.eventId },
      include: {
        plant: { select: { speciesId: true } },
      },
    })

    if (!existing) {
      return { ok: false, message: 'Evento de floración no encontrado.' }
    }

    const endDateObj = new Date(data.endDate)

    if (endDateObj < existing.startDate) {
      return {
        ok: false,
        message: 'La fecha de cierre no puede ser anterior a la fecha de inicio del evento.',
      }
    }

    const floweringEvent = await prisma.floweringEvent.update({
      where: { id: data.eventId },
      data: {
        endDate: endDateObj,
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    })

    revalidatePath('/stock')
    if (existing.plant) {
      revalidatePath(`/stock/${existing.plant.speciesId}`)
    }

    return { ok: true, floweringEvent }
  } catch (err) {
    Logger.error('[Plant] Error al finalizar evento de floración:', err)

    return { ok: false, message: 'No se pudo finalizar la floración.' }
  }
}
