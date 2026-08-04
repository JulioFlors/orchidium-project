'use server'

import type { PaymentMethod, PotSize } from '@package/database/enums'

import { prisma } from '@package/database'
import { revalidatePath } from 'next/cache'

export interface CreateOrderInputItem {
  variantId?: string
  plantId?: string
  speciesName: string
  size: PotSize
  unitPrice: number
  quantity: number
}

export interface CreateOrderInput {
  userId?: string
  items: CreateOrderInputItem[]
  paymentMethod: PaymentMethod
  shippingAddress: Record<string, string | null | undefined>
  billingInfo: Record<string, string | boolean | null | undefined>
  shippingCost?: number
}

export async function createOrder(input: CreateOrderInput) {
  try {
    if (!input.items || input.items.length === 0) {
      return { ok: false, message: 'El pedido no contiene productos.' }
    }

    // Resolver un userId válido de la base de datos si no viene o es inválido
    let targetUserId = input.userId

    if (!targetUserId || targetUserId === 'temp-user-id') {
      const existingUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      })

      if (!existingUser) {
        return { ok: false, message: 'No se encontró un usuario válido para registrar el pedido.' }
      }

      targetUserId = existingUser.id
    }

    const latestRate = await prisma.exchangeRate.findFirst({
      orderBy: { date: 'desc' },
    })

    const exchangeRate = latestRate?.rate || 70.0

    const subtotal = input.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
    const shippingCost = input.shippingCost || 0
    const tax = 0
    const totalUsd = subtotal + shippingCost + tax
    const totalVes = totalUsd * exchangeRate

    const count = await prisma.order.count()
    const orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: targetUserId,
          status: 'PENDING_PAYMENT',
          paymentMethod: input.paymentMethod,
          subtotal,
          tax,
          totalUsd,
          totalVes,
          exchangeRate,
          shippingAddress: input.shippingAddress as object,
          billingInfo: input.billingInfo as object,
          expiresAt,
          items: {
            create: input.items.map((item) => ({
              variantId: item.variantId,
              plantId: item.plantId,
              speciesName: item.speciesName,
              size: item.size,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      })

      for (const item of input.items) {
        if (item.plantId) {
          await tx.plant.update({
            where: { id: item.plantId },
            data: { status: 'RESERVED' },
          })
        }
      }

      return order
    })

    revalidatePath('/account/orders')
    revalidatePath('/admin/orders')
    revalidatePath('/stock')

    return { ok: true, order: result }
  } catch (error) {
    return { ok: false, message: 'Error al procesar el pedido.', error }
  }
}

export async function getOrderById(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!order) {
      return { ok: false, message: 'Orden no encontrada.' }
    }

    return { ok: true, order }
  } catch (error) {
    return { ok: false, message: 'Error al recuperar la orden.', error }
  }
}

export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    })

    return { ok: true, orders }
  } catch (error) {
    return { ok: false, message: 'Error al recuperar pedidos del usuario.', error }
  }
}

export async function getAdminOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        saleRecord: true,
      },
    })

    return { ok: true, orders }
  } catch (error) {
    return { ok: false, message: 'Error al recuperar órdenes administrativas.', error }
  }
}

export async function assignPlantToOrderItem(orderItemId: string, plantId: string) {
  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
    })

    if (!orderItem) return { ok: false, message: 'Ítem de orden no encontrado.' }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    })

    if (!plant) return { ok: false, message: 'Ejemplar físico no encontrado.' }

    await prisma.$transaction(async (tx) => {
      // Liberar planta previa si la hubiere
      if (orderItem.plantId && orderItem.plantId !== plantId) {
        await tx.plant.update({
          where: { id: orderItem.plantId },
          data: { status: 'AVAILABLE' },
        })
      }

      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { plantId: plant.id },
      })

      await tx.plant.update({
        where: { id: plant.id },
        data: { status: 'RESERVED' },
      })
    })

    revalidatePath('/admin/orders')
    revalidatePath('/stock')

    return { ok: true }
  } catch (error) {
    return { ok: false, message: 'Error al asignar la planta al ítem de la orden.', error }
  }
}

export async function confirmOrderPayment(orderId: string, adminUserId?: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) return { ok: false, message: 'Orden no encontrada.' }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      })

      for (const item of order.items) {
        if (item.plantId) {
          await tx.plant.update({
            where: { id: item.plantId },
            data: { status: 'SOLD' },
          })
        }

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              quantity: { decrement: item.quantity },
            },
          })
        }
      }

      await tx.saleRecord.create({
        data: {
          type: 'ONLINE_ORDER',
          orderId: order.id,
          totalUsd: order.totalUsd,
          totalVes: order.totalVes,
          exchangeRate: order.exchangeRate,
          notes: `Venta online confirmada #${order.orderNumber}`,
          createdById: adminUserId,
        },
      })
    })

    revalidatePath('/admin/orders')
    revalidatePath('/account/orders')
    revalidatePath('/stock')

    return { ok: true }
  } catch (error) {
    return { ok: false, message: 'Error al confirmar pago del pedido.', error }
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) return { ok: false, message: 'Orden no encontrada.' }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      })

      for (const item of order.items) {
        if (item.plantId) {
          await tx.plant.update({
            where: { id: item.plantId },
            data: { status: 'AVAILABLE' },
          })
        }
      }
    })

    revalidatePath('/admin/orders')
    revalidatePath('/account/orders')
    revalidatePath('/stock')

    return { ok: true }
  } catch (error) {
    return { ok: false, message: 'Error al cancelar la orden.', error }
  }
}
