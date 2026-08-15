'use server'

import type { PotSize } from '@package/database/enums'

import { prisma } from '@package/database'
import { revalidatePath } from 'next/cache'

export interface DirectSaleItemInput {
  variantId?: string
  plantId?: string
  speciesName: string
  size: PotSize
  unitPrice: number
  quantity: number
}

export interface RegisterDirectSaleInput {
  items: DirectSaleItemInput[]
  notes?: string
  createdById?: string
}

export async function registerDirectSale(input: RegisterDirectSaleInput) {
  try {
    if (!input.items || input.items.length === 0) {
      return { ok: false, message: 'No hay ítems para registrar la venta.' }
    }

    const latestRate = await prisma.exchangeRate.findFirst({
      orderBy: { date: 'desc' },
    })

    const exchangeRate = latestRate?.rate || 70.0

    const totalUsd = input.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
    const totalVes = totalUsd * exchangeRate

    const saleRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.saleRecord.create({
        data: {
          type: 'DIRECT_MANUAL',
          totalUsd,
          totalVes,
          exchangeRate,
          notes: input.notes || 'Venta directa en tienda / fuera de web',
          createdById: input.createdById,
        },
      })

      for (const item of input.items) {
        if (item.plantId) {
          await tx.plant.update({
            where: { id: item.plantId },
            data: { status: 'SOLD' },
          })
        }
      }

      return record
    })

    revalidatePath('/stock')
    revalidatePath('/admin/sales')

    return { ok: true, saleRecord }
  } catch (error) {
    return { ok: false, message: 'Error al registrar venta directa.', error }
  }
}

export async function registerSinglePlantSale(
  plantId: string,
  price: number,
  notes?: string,
  createdById?: string,
) {
  try {
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: { species: true },
    })

    if (!plant) return { ok: false, message: 'Planta física no encontrada.' }

    return await registerDirectSale({
      items: [
        {
          plantId: plant.id,
          speciesName: plant.species.name,
          size: plant.currentSize,
          unitPrice: price,
          quantity: 1,
        },
      ],
      notes: notes || `Venta individual de ejemplar #${plant.id.slice(-8).toUpperCase()}`,
      createdById,
    })
  } catch (error) {
    return { ok: false, message: 'Error al registrar venta de la planta.', error }
  }
}
