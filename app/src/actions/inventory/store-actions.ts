'use server'

import type { PotSize } from '@package/database/enums'

import { revalidatePath } from 'next/cache'
import { prisma, Prisma } from '@package/database'

import { Logger } from '@/lib'

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

export async function getStoreData() {
  try {
    const species = await prisma.species.findMany({
      orderBy: { name: 'asc' },
      include: {
        genus: { select: { name: true, type: true } },
        variants: {
          orderBy: { size: 'asc' },
        },
        images: {
          select: { url: true },
        },
        _count: {
          select: { plants: true },
        },
      },
    })

    return { ok: true, species }
  } catch (err) {
    Logger.error('[Store] Error al obtener datos de tienda:', err)

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
    Logger.error('[Store] Error al upsert variant:', err)

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
    Logger.error('[Store] Error al eliminar variante:', err)

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
    Logger.error('[Store] Error al actualizar stock:', err)

    return { ok: false, message: 'No se pudo actualizar el inventario.' }
  }
}

// ─────────────────────────────────────────────────────────────
// LAYOUT CONFIG ACTIONS
// ─────────────────────────────────────────────────────────────

export interface ShopLayoutConfig {
  heroSlides: {
    speciesId: string
    slug: string
    title: string
    imageUrl: string
  }[]
  categories: {
    orchids: { imageUrl: string }
    adenium_obesum: { imageUrl: string }
    cactus: { imageUrl: string }
    succulents: { imageUrl: string }
  }
  megamenu: {
    featuredItem: {
      speciesId: string
      slug: string
      title: string
      imageUrl: string
    }
  }
  featuredSpeciesIds: string[]
}

export async function getShopLayoutConfig() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'shop_layout' },
    })

    if (!setting) {
      // Devolver configuración por defecto basada en routes.tsx
      const defaultConfig: ShopLayoutConfig = {
        heroSlides: [
          { speciesId: '', slug: '', title: 'Orquídea Destacada', imageUrl: 'plants/orchids/orchids.webp' },
          { speciesId: '', slug: '', title: 'Rosa del Desierto Destacada', imageUrl: 'plants/adenium_obesum/multiple-petals/adenium-obesum-marbella/marbella_0_2000.webp' },
          { speciesId: '', slug: '', title: 'Cactus Destacado', imageUrl: 'plants/cactus/mammillaria/mammillaria-prolifera-ssp-haitiensis/mammillaria-prolifera-ssp-haitiensis_0_2000.webp' },
          { speciesId: '', slug: '', title: 'Suculenta Destacada', imageUrl: 'plants/succulents/pachyveria/pachyveria-scheideckeri/pachyveria-scheideckeri_2_2000.webp' },
        ],
        categories: {
          orchids: { imageUrl: 'plants/orchids/orchids.webp' },
          adenium_obesum: { imageUrl: 'plants/adenium_obesum/multiple-petals/adenium-obesum-marbella/marbella_0_2000.webp' },
          cactus: { imageUrl: 'plants/cactus/mammillaria/mammillaria-prolifera-ssp-haitiensis/mammillaria-prolifera-ssp-haitiensis_0_2000.webp' },
          succulents: { imageUrl: 'plants/succulents/pachyveria/pachyveria-scheideckeri/pachyveria-scheideckeri_2_2000.webp' },
        },
        megamenu: {
          featuredItem: {
            speciesId: '',
            slug: '',
            title: 'Dendrobium Striata',
            imageUrl: 'plants/orchids/orchids.webp',
          },
        },
        featuredSpeciesIds: [],
      }

      return { ok: true, config: defaultConfig }
    }

    return { ok: true, config: setting.value as unknown as ShopLayoutConfig }
  } catch (err) {
    Logger.error('[Store] Error al obtener shop_layout config:', err)
    return { ok: false, message: 'No se pudo cargar la configuración de la tienda.' }
  }
}

export async function saveShopLayoutConfig(config: ShopLayoutConfig) {
  try {
    const prismaValue = config as unknown as Prisma.InputJsonValue

    await prisma.systemSetting.upsert({
      where: { key: 'shop_layout' },
      update: {
        value: prismaValue,
      },
      create: {
        key: 'shop_layout',
        value: prismaValue,
      },
    })

    revalidatePath('/')
    revalidatePath('/shop-manager')

    return { ok: true }
  } catch (err) {
    Logger.error('[Store] Error al guardar shop_layout config:', err)
    return { ok: false, message: 'No se pudo guardar la configuración de la tienda.' }
  }
}

