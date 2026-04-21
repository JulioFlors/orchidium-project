'use server'

import type { PotSize } from '@package/database/enums'

import { revalidatePath } from 'next/cache'
import { prisma } from '@package/database'

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

export async function getStoreData() {
  try {
    const species = await prisma.species.findMany({
      orderBy: { name: 'asc' },
      include: {
        genus: { select: { name: true } },
        variants: {
          orderBy: { size: 'asc' },
        },
        _count: {
          select: { plants: true },
        },
      },
    })

    return { ok: true, species }
  } catch (err) {
    console.error('[Store] Error al obtener datos de tienda:', err)

    return { ok: false, message: 'No se pudieron cargar los datos de la tienda.' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPSERT (Create or Update)
// ─────────────────────────────────────────────────────────────

interface UpsertVariantData {
  id?: string
  speciesId: string
  size: PotSize
  price: number
  quantity: number
  available: boolean
}

export async function upsertVariant(data: UpsertVariantData) {
  try {
    const { id, ...rest } = data

    const variant = await prisma.productVariant.upsert({
      where: { id: id || 'new-uuid-placeholder' }, // Si no hay ID, el where fallará y disparará el create
      update: {
        price: rest.price,
        quantity: rest.quantity,
        available: rest.available,
      },
      create: rest,
    })

    revalidatePath('/shop-manager')

    return { ok: true, variant }
  } catch (err) {
    console.error('[Store] Error al upsert variant:', err)

    return {
      ok: false,
      message: 'Error al guardar la variante. ¿Ya existe ese tamaño para esta especie?',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

export async function deleteVariant(id: string) {
  try {
    await prisma.productVariant.delete({ where: { id } })
    revalidatePath('/shop-manager')

    return { ok: true }
  } catch (err) {
    console.error('[Store] Error al eliminar variante:', err)

    return { ok: false, message: 'Error al eliminar la variante comercial.' }
  }
}

// ─────────────────────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────────────────────

export async function updateVariantStock(id: string, newQuantity: number) {
  try {
    await prisma.productVariant.update({
      where: { id },
      data: { quantity: newQuantity },
    })
    revalidatePath('/shop-manager')

    return { ok: true }
  } catch (err) {
    console.error('[Store] Error al actualizar stock:', err)

    return { ok: false, message: 'No se pudo actualizar el inventario.' }
  }
}
