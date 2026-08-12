'use server'

import { revalidatePath } from 'next/cache'
import { prisma, PotSize, StockRequestStatus } from '@package/database'

import { Logger } from '@/lib'

export interface RequestStockNotificationInput {
  userName: string
  phoneNumber: string
  speciesId: string
  variantId?: string | null
  size?: PotSize | null
}

export async function requestStockNotification(input: RequestStockNotificationInput) {
  try {
    const { userName, phoneNumber, speciesId, variantId, size } = input

    if (!userName || !userName.trim()) {
      return { ok: false, error: 'Se necesita un nombre' }
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return { ok: false, error: 'Se necesita un número de WhatsApp' }
    }

    if (!speciesId) {
      return { ok: false, error: 'Especie no especificada' }
    }

    const cleanName = userName.trim()
    const cleanPhone = phoneNumber.trim()

    // Búsqueda para upsert por teléfono + especie + tamaño
    const existing = await prisma.stockNotificationRequest.findFirst({
      where: {
        phoneNumber: cleanPhone,
        speciesId: speciesId,
        size: size || null,
      },
    })

    if (existing) {
      await prisma.stockNotificationRequest.update({
        where: { id: existing.id },
        data: {
          userName: cleanName,
          variantId: variantId || null,
          status: 'PENDING',
          updatedAt: new Date(),
        },
      })
      Logger.info('[SNAT] Solicitud de notificación de stock actualizada', {
        phone: cleanPhone,
        speciesId,
        size,
      })
    } else {
      await prisma.stockNotificationRequest.create({
        data: {
          userName: cleanName,
          phoneNumber: cleanPhone,
          speciesId: speciesId,
          variantId: variantId || null,
          size: size || null,
          status: 'PENDING',
        },
      })
      Logger.info('[SNAT] Nueva solicitud de notificación de stock registrada', {
        phone: cleanPhone,
        speciesId,
        size,
      })
    }

    try {
      revalidatePath('/admin')
      revalidatePath('/requests')
    } catch {
      // Ignorar error de contexto en revalidatePath si ocurre en cliente/script
    }

    return { ok: true, message: 'Le enviaremos un WhatsApp cuando vuelva a haber existencias.' }
  } catch (error) {
    Logger.error('[SNAT] Error al guardar solicitud de notificación de stock', { error })

    return {
      ok: false,
      error: 'Hubo un problema al registrar tu notificación. Por favor, inténtalo más tarde.',
    }
  }
}

export interface GroupedUserStockRequests {
  userName: string
  phoneNumber: string
  requests: {
    id: string
    status: StockRequestStatus
    createdAt: Date
    updatedAt: Date
    species: {
      id: string
      name: string
      slug: string
      image?: string | null
    }
    variant?: {
      id: string
      size: PotSize
      price: number
      quantity: number
      available: boolean
    } | null
    size?: PotSize | null
    isAvailable: boolean
  }[]
}

export async function getGroupedStockRequestsByUser() {
  try {
    const rawRequests = await prisma.stockNotificationRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        species: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              select: { url: true },
              orderBy: { position: 'asc' },
              take: 1,
            },
          },
        },
        variant: {
          select: {
            id: true,
            size: true,
            price: true,
            quantity: true,
            available: true,
          },
        },
      },
    })

    const userMap = new Map<string, GroupedUserStockRequests>()

    for (const req of rawRequests) {
      const key = req.phoneNumber.trim()

      if (!userMap.has(key)) {
        userMap.set(key, {
          userName: req.userName,
          phoneNumber: req.phoneNumber,
          requests: [],
        })
      }

      const userGroup = userMap.get(key)!

      let isAvailable = false

      if (req.variant) {
        isAvailable = req.variant.available && req.variant.quantity > 0
      }

      const mainImage = req.species.images[0]?.url || null

      userGroup.requests.push({
        id: req.id,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        species: {
          id: req.species.id,
          name: req.species.name,
          slug: req.species.slug,
          image: mainImage,
        },
        variant: req.variant,
        size: req.size,
        isAvailable,
      })
    }

    return { ok: true, data: Array.from(userMap.values()) }
  } catch (error) {
    Logger.error('[SNAT] Error al obtener solicitudes agrupadas', { error })

    return { ok: false, data: [] }
  }
}

export async function updateStockRequestStatus(ids: string[], status: StockRequestStatus) {
  try {
    if (!ids || ids.length === 0) {
      return { ok: false, error: 'No se enviaron identificadores' }
    }

    await prisma.stockNotificationRequest.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    })

    Logger.info('[SNAT] Estado de solicitudes de notificación actualizado', {
      count: ids.length,
      status,
    })
    try {
      revalidatePath('/admin')
      revalidatePath('/requests')
    } catch {
      // Ignorar si se ejecuta fuera del contexto estático
    }

    return { ok: true }
  } catch (error) {
    Logger.error('[SNAT] Error al actualizar estado de solicitudes', { error })

    return { ok: false, error: 'No se pudo actualizar el estado.' }
  }
}

export async function deleteStockRequests(ids: string[]) {
  try {
    if (!ids || ids.length === 0) {
      return { ok: false, error: 'No se enviaron identificadores' }
    }

    await prisma.stockNotificationRequest.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    Logger.info('[SNAT] Solicitudes de notificación limpiadas/eliminadas', {
      count: ids.length,
    })
    try {
      revalidatePath('/admin')
      revalidatePath('/requests')
    } catch {
      // Ignorar si se ejecuta fuera del contexto estático
    }

    return { ok: true }
  } catch (error) {
    Logger.error('[SNAT] Error al eliminar solicitudes de stock', { error })

    return { ok: false, error: 'No se pudieron eliminar las solicitudes notificadas.' }
  }
}
