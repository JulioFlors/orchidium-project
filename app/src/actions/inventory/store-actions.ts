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
      select: {
        id: true,
        name: true,
        slug: true,
        glowColor: true,
        genus: { select: { id: true, name: true, type: true } },
        variants: {
          select: { id: true, size: true, price: true },
          orderBy: { size: 'asc' },
        },
        images: {
          select: { id: true, url: true },
          orderBy: { position: 'asc' },
        },
        plants: {
          where: { status: 'AVAILABLE' },
          select: { currentSize: true },
        },
        _count: {
          select: { plants: true },
        },
      },
    })

    const formattedSpecies = species.map((specie) => {
      const updatedVariants = specie.variants.map((v) => {
        const qty = specie.plants.filter((p) => p.currentSize === v.size).length

        return {
          ...v,
          quantity: qty,
          available: qty > 0 && v.price > 0,
        }
      })

      return {
        ...specie,
        variants: updatedVariants,
      }
    })

    return { ok: true, species: formattedSpecies }
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
}

export async function upsertVariant(data: UpsertVariantData) {
  try {
    const { id, ...rest } = data

    // Validar: Si el precio es <= 0, no se permite si existen plantas físicas registradas como AVAILABLE
    if (data.price <= 0) {
      const availablePlantsCount = await prisma.plant.count({
        where: {
          speciesId: data.speciesId,
          currentSize: data.size,
          status: 'AVAILABLE',
        },
      })

      if (availablePlantsCount > 0) {
        return {
          ok: false,
          message: `No se puede asignar un precio de $0.00 a la variante (${data.size}) porque existen ${availablePlantsCount} planta(s) disponible(s) a la venta.`,
        }
      }
    }

    const variant = await prisma.productVariant.upsert({
      where: { id: id || 'new-uuid-placeholder' },
      update: {
        price: rest.price,
      },
      create: {
        speciesId: rest.speciesId,
        size: rest.size,
        price: rest.price,
      },
    })

    revalidatePath('/shop-manager')
    revalidatePath('/stock')
    revalidatePath(`/stock/${data.speciesId}`)

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
          {
            speciesId: '',
            slug: '',
            title: 'Orquídea Destacada',
            imageUrl: 'plants/orchids/orchids.webp',
          },
          {
            speciesId: '',
            slug: '',
            title: 'Rosa del Desierto Destacada',
            imageUrl:
              'plants/adenium_obesum/multiple-petals/adenium-obesum-marbella/marbella_0_2000.webp',
          },
          {
            speciesId: '',
            slug: '',
            title: 'Cactus Destacado',
            imageUrl:
              'plants/cactus/mammillaria/mammillaria-prolifera-ssp-haitiensis/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
          },
          {
            speciesId: '',
            slug: '',
            title: 'Suculenta Destacada',
            imageUrl:
              'plants/succulents/pachyveria/pachyveria-scheideckeri/pachyveria-scheideckeri_2_2000.webp',
          },
        ],
        categories: {
          orchids: { imageUrl: 'plants/orchids/orchids.webp' },
          adenium_obesum: {
            imageUrl:
              'plants/adenium_obesum/multiple-petals/adenium-obesum-marbella/marbella_0_2000.webp',
          },
          cactus: {
            imageUrl:
              'plants/cactus/mammillaria/mammillaria-prolifera-ssp-haitiensis/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
          },
          succulents: {
            imageUrl:
              'plants/succulents/pachyveria/pachyveria-scheideckeri/pachyveria-scheideckeri_2_2000.webp',
          },
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
