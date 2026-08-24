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

    // 1. Obtener la especie y sus variantes asociadas
    const species = await prisma.species.findUnique({
      where: { id: speciesId },
      include: { variants: true },
    })

    if (!species) {
      return { ok: false, error: 'La planta solicitada no fue encontrada.' }
    }

    let resolvedVariantId = variantId || null
    let resolvedSize: PotSize | null = size || null

    // Si la especie tiene variantes registradas, validar que se seleccione una variante obligatoriamente
    if (species.variants.length > 0) {
      if (!resolvedVariantId && !resolvedSize) {
        return { ok: false, error: 'Debe seleccionar una variante o tamaño de la planta.' }
      }

      if (resolvedVariantId) {
        const found = species.variants.find((v) => v.id === resolvedVariantId)

        if (found) {
          resolvedSize = found.size
        }
      } else if (resolvedSize) {
        const found = species.variants.find((v) => v.size === resolvedSize)

        if (found) {
          resolvedVariantId = found.id
        }
      }
    } else {
      resolvedVariantId = null
      resolvedSize = null
    }

    // Búsqueda para upsert por teléfono + especie + tamaño
    const existing = await prisma.stockNotificationRequest.findFirst({
      where: {
        phoneNumber: cleanPhone,
        speciesId: speciesId,
        size: resolvedSize,
      },
    })

    if (existing) {
      await prisma.stockNotificationRequest.update({
        where: { id: existing.id },
        data: {
          userName: cleanName,
          variantId: resolvedVariantId,
          status: 'PENDING',
          updatedAt: new Date(),
        },
      })
      Logger.info('[SNAT] Solicitud de notificación de stock actualizada', {
        phone: cleanPhone,
        speciesId,
        size: resolvedSize,
      })
    } else {
      await prisma.stockNotificationRequest.create({
        data: {
          userName: cleanName,
          phoneNumber: cleanPhone,
          speciesId: speciesId,
          variantId: resolvedVariantId,
          size: resolvedSize,
          status: 'PENDING',
        },
      })
      Logger.info('[SNAT] Nueva solicitud de notificación de stock registrada', {
        phone: cleanPhone,
        speciesId,
        size: resolvedSize,
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
            plants: {
              where: { status: 'AVAILABLE' },
              select: { currentSize: true },
            },
          },
        },
        variant: {
          select: {
            id: true,
            size: true,
            price: true,
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

      const targetSize = req.variant?.size || req.size
      const availableCount = targetSize
        ? req.species.plants.filter((p) => p.currentSize === targetSize).length
        : 0
      const isAvailable = availableCount > 0

      const formattedVariant = req.variant
        ? {
            id: req.variant.id,
            size: req.variant.size,
            price: req.variant.price,
            quantity: availableCount,
            available: isAvailable,
          }
        : null

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
        variant: formattedVariant,
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
