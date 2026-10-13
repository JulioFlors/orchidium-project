'use server'

import type { Prisma } from '@package/database'
import type { PlantType, Species } from '@/interfaces'

import { revalidatePath } from 'next/cache'
import { prisma } from '@package/database'

import { Logger, normalizeSpeciesName, toTaxonomicSlug } from '@/lib'
import { sortVariantsByPotSizeAsc } from '@/config'
import { deleteR2Object } from '@/actions/storage/upload-actions'

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

export async function getSpecies() {
  try {
    const species = await prisma.species.findMany({
      orderBy: { name: 'asc' },
      include: {
        genus: { select: { id: true, name: true, type: true } },
        images: {
          select: { id: true, url: true },
          orderBy: { position: 'asc' },
        },
        variants: {
          select: { id: true, size: true, price: true },
          orderBy: { size: 'asc' },
        },
        plants: {
          where: { status: 'AVAILABLE' },
          select: { currentSize: true },
        },
        _count: { select: { variants: true, plants: true } },
      },
    })

    const formattedSpecies = species.map((specie) => {
      const updatedVariants = specie.variants.map((v) => {
        const qty = specie.plants.filter((p) => p.currentSize === v.size).length

        return {
          ...v,
          quantity: qty,
          available: qty > 0,
        }
      })

      return {
        ...specie,
        variants: updatedVariants,
      }
    })

    return { ok: true, species: formattedSpecies }
  } catch (err) {
    Logger.error('[Species] Error al obtener especies:', err)

    return { ok: false, message: 'No se pudieron cargar las especies.' }
  }
}

export async function getSpeciesById(identifier: string) {
  try {
    const species = await prisma.species.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        genus: { select: { id: true, name: true, type: true } },
        images: {
          select: { id: true, url: true, position: true },
          orderBy: { position: 'asc' },
        },
        variants: {
          select: { id: true, size: true, price: true },
          orderBy: { size: 'asc' },
        },
        plants: {
          select: {
            id: true,
            currentSize: true,
            pottingDate: true,
            status: true,
            location: { select: { id: true, zone: true, table: true } },
            FloweringEvent: {
              select: { id: true, startDate: true, endDate: true, notes: true },
              orderBy: { startDate: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { variants: true, plants: true } },
      },
    })

    if (!species) {
      return { ok: true, species: null }
    }

    const availablePlants = species.plants.filter((p) => p.status === 'AVAILABLE')
    const updatedVariants = sortVariantsByPotSizeAsc(
      species.variants.map((v) => {
        const qty = availablePlants.filter((p) => p.currentSize === v.size).length

        return {
          ...v,
          quantity: qty,
          available: qty > 0,
        }
      }),
    )

    return {
      ok: true,
      species: {
        ...species,
        variants: updatedVariants,
      },
    }
  } catch (err) {
    Logger.error('[Species] Error al obtener especie por ID o Slug:', err)

    return { ok: false, message: 'No se pudo cargar la especie.' }
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

export async function createSpecies(data: {
  name: string
  genusId: string
  description?: string
  glowColor?: string
}) {
  try {
    const cleanName = normalizeSpeciesName(data.name)

    if (!cleanName || cleanName.length < 2) {
      return { ok: false, message: 'El nombre científico es obligatorio (mínimo 2 caracteres).' }
    }

    // 1. Verificación previa insensible a mayúsculas/minúsculas
    const existing = await prisma.species.findFirst({
      where: {
        name: { equals: cleanName, mode: 'insensitive' },
      },
      include: {
        genus: { select: { name: true } },
      },
    })

    if (existing) {
      return {
        ok: false,
        message: `Ya existe una especie registrada con el nombre "${existing.name}" en la sección "${existing.genus.name}".`,
      }
    }

    const slug = toTaxonomicSlug(cleanName)

    // 2. Verificación previa de slug
    const existingSlug = await prisma.species.findFirst({
      where: { slug },
      include: {
        genus: { select: { name: true } },
      },
    })

    if (existingSlug) {
      return {
        ok: false,
        message: `El identificador derivado ("${slug}") ya está en uso por la especie "${existingSlug.name}".`,
      }
    }

    const species = await prisma.species.create({
      data: {
        name: cleanName,
        slug,
        genusId: data.genusId,
        description: data.description?.trim() ?? null,
        glowColor: data.glowColor?.trim() ?? null,
      },
    })

    revalidatePath('/catalog')

    return { ok: true, species }
  } catch (err: unknown) {
    Logger.error('[Species] Error al crear especie:', err)

    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        ok: false,
        message:
          'Ya existe una especie registrada con este nombre o identificador (no se distingue entre mayúsculas y minúsculas).',
      }
    }

    return { ok: false, message: 'Error al crear la especie.' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

export async function updateSpecies(
  id: string,
  data: { name: string; genusId: string; description?: string; glowColor?: string },
) {
  try {
    const cleanName = normalizeSpeciesName(data.name)

    if (!cleanName || cleanName.length < 2) {
      return { ok: false, message: 'El nombre científico es obligatorio (mínimo 2 caracteres).' }
    }

    // 1. Verificación previa insensible a mayúsculas/minúsculas excluyendo la especie actual
    const existing = await prisma.species.findFirst({
      where: {
        name: { equals: cleanName, mode: 'insensitive' },
        NOT: { id },
      },
      include: {
        genus: { select: { name: true } },
      },
    })

    if (existing) {
      return {
        ok: false,
        message: `Ya existe otra especie registrada con el nombre "${existing.name}" en la sección "${existing.genus.name}".`,
      }
    }

    const slug = toTaxonomicSlug(cleanName)

    // 2. Verificación de slug excluyendo el actual
    const existingSlug = await prisma.species.findFirst({
      where: {
        slug,
        NOT: { id },
      },
      include: {
        genus: { select: { name: true } },
      },
    })

    if (existingSlug) {
      return {
        ok: false,
        message: `El identificador derivado ("${slug}") ya está en uso por la especie "${existingSlug.name}".`,
      }
    }

    const species = await prisma.species.update({
      where: { id },
      data: {
        name: cleanName,
        slug,
        genusId: data.genusId,
        description: data.description?.trim() ?? null,
        glowColor: data.glowColor?.trim() ?? null,
      },
    })

    revalidatePath('/catalog')

    return { ok: true, species }
  } catch (err: unknown) {
    Logger.error('[Species] Error al actualizar especie:', err)

    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        ok: false,
        message:
          'Ya existe una especie registrada con este nombre o identificador (no se distingue entre mayúsculas y minúsculas).',
      }
    }

    return { ok: false, message: 'Error al actualizar la especie.' }
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

export async function deleteSpecies(id: string) {
  try {
    const plantsCount = await prisma.plant.count({ where: { speciesId: id } })

    if (plantsCount > 0) {
      return {
        ok: false,
        message: `No se puede eliminar: tiene ${plantsCount} planta(s) registrada(s).`,
      }
    }

    // Borrar imágenes de R2 antes de eliminar de BD
    const images = await prisma.speciesImage.findMany({ where: { speciesId: id } })

    for (const img of images) {
      const key = img.url.split('/').slice(-2).join('/')

      await deleteR2Object(key)
    }

    await prisma.species.delete({ where: { id } })
    revalidatePath('/catalog')

    return { ok: true }
  } catch (err) {
    Logger.error('[Species] Error al eliminar especie:', err)

    return { ok: false, message: 'Error al eliminar la especie.' }
  }
}

// ─────────────────────────────────────────────────────────────
// IMAGES
// ─────────────────────────────────────────────────────────────

/** Registra la URL pública de una imagen R2 en SpeciesImage */
export async function addSpeciesImage(speciesId: string, url: string) {
  try {
    const maxAgg = await prisma.speciesImage.aggregate({
      where: { speciesId },
      _max: { position: true },
    })

    const nextPosition = (maxAgg._max.position ?? -1) + 1

    const image = await prisma.speciesImage.create({
      data: {
        speciesId,
        url,
        position: nextPosition,
      },
    })

    revalidatePath('/catalog')
    revalidatePath(`/catalog/${speciesId}`)

    return { ok: true, image }
  } catch (err) {
    Logger.error('[Species] Error al guardar imagen:', err)

    return { ok: false, message: 'Error al registrar la imagen.' }
  }
}

/** Elimina imagen de Prisma y de R2 */
export async function deleteSpeciesImage(imageId: string) {
  try {
    const image = await prisma.speciesImage.findUnique({ where: { id: imageId } })

    if (!image) {
      return { ok: false, message: 'La imagen no existe.' }
    }

    // Extraer key de la URL (ej: images/species/slug/123.webp)
    // Si la URL es https://media.sisparrow.com/species/cattleya/123.webp
    // La key es species/cattleya/123.webp
    const urlParts = image.url.split('/')
    const r2Key = urlParts.slice(-3).join('/') // species/slug/file.webp

    await prisma.speciesImage.delete({ where: { id: imageId } })
    await deleteR2Object(r2Key)
    revalidatePath('/catalog')

    return { ok: true }
  } catch (err) {
    Logger.error('[Species] Error al eliminar imagen:', err)

    return { ok: false, message: 'Error al eliminar la imagen.' }
  }
}

/** Reordena la posición de las imágenes de una especie */
export async function reorderSpeciesImages(speciesId: string, orderedImageIds: string[]) {
  try {
    await prisma.$transaction(
      orderedImageIds.map((id, index) =>
        prisma.speciesImage.update({
          where: { id },
          data: { position: index },
        }),
      ),
    )

    revalidatePath('/catalog')
    revalidatePath(`/catalog/${speciesId}`)
    revalidatePath(`/stock/${speciesId}`)

    return { ok: true }
  } catch (err) {
    Logger.error('[Species] Error al reordenar imágenes:', err)

    return { ok: false, message: 'Error al actualizar el orden de las imágenes.' }
  }
}

// ─────────────────────────────────────────────────────────────
// FEATURED & LANDING
// ─────────────────────────────────────────────────────────────

/** Alterna el estado destacado de una especie */
export async function toggleSpeciesFeatured(id: string, isFeatured: boolean) {
  try {
    // Comentado temporalmente porque no existe isFeatured en BD de producción
    /*
    const species = await prisma.species.update({
      where: { id },
      data: { isFeatured },
    })
    */
    Logger.info(
      `[Species] toggleSpeciesFeatured llamado para ID ${id} con valor ${isFeatured} (deshabilitado en producción)`,
    )

    revalidatePath('/catalog')
    revalidatePath('/')
    revalidatePath('/shop-manager')

    return { ok: true, species: null }
  } catch (err) {
    Logger.error('[Species] Error al alternar destacado:', err)

    return { ok: false, message: 'No se pudo actualizar el estado de destacado.' }
  }
}

const landingSpeciesInclude = {
  genus: { select: { id: true, name: true, type: true } },
  images: {
    select: { id: true, url: true },
    orderBy: { position: 'asc' as const },
  },
  variants: true,
  plants: {
    where: {
      status: 'AVAILABLE' as const,
    },
    select: {
      id: true,
      currentSize: true,
      FloweringEvent: {
        where: {
          endDate: null,
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  },
} satisfies Prisma.SpeciesInclude

type LandingSpeciesQueryPayload = Prisma.SpeciesGetPayload<{
  include: typeof landingSpeciesInclude
}>

function formatSpeciesForLanding(specie: LandingSpeciesQueryPayload): Species {
  const isFlowering = specie.plants.some((p) => p.FloweringEvent && p.FloweringEvent.length > 0)

  const updatedVariants = sortVariantsByPotSizeAsc(
    specie.variants.map((v) => {
      const realQty = specie.plants.filter((p) => p.currentSize === v.size).length

      return {
        id: v.id,
        size: v.size,
        price: v.price,
        quantity: realQty,
        available: realQty > 0,
        speciesId: specie.slug,
      }
    }),
  )

  return {
    id: specie.id,
    name: specie.name,
    slug: specie.slug,
    description: specie.description,
    glowColor: specie.glowColor,
    images: specie.images.map((img) => img.url),
    genus: {
      name: specie.genus.name,
      type: specie.genus.type as PlantType,
    },
    variants: updatedVariants,
    isFlowering,
    floweringDurationDays: specie.floweringDurationDays,
    floweringFrequencyYear: specie.floweringFrequencyYear,
    floweringMonths: specie.floweringMonths,
    floweringRecordsCount: specie.floweringRecordsCount,
  }
}

/** Obtiene las especies destacadas (más vendidas) y las que tienen floración activa con stock sincronizado */
export async function getLandingSpecies(): Promise<{
  ok: boolean
  featured: Species[]
  flowering: Species[]
  message?: string
}> {
  try {
    // Intentar leer la configuración de la tienda
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'shop_layout' },
    })

    let featuredIds: string[] = []

    if (setting) {
      const config = setting.value as unknown as { featuredSpeciesIds?: string[] }

      featuredIds = config.featuredSpeciesIds || []
    }

    const featuredRaw =
      featuredIds.length > 0
        ? await (async () => {
            const speciesList = await prisma.species.findMany({
              where: { id: { in: featuredIds } },
              include: landingSpeciesInclude,
            })

            return featuredIds
              .map((id) => speciesList.find((s) => s.id === id))
              .filter((s): s is (typeof speciesList)[0] => !!s)
          })()
        : await prisma.species.findMany({
            where: { isFeatured: true },
            include: landingSpeciesInclude,
            take: 9,
            orderBy: { name: 'asc' },
          })

    // 2. Obtener especies con plantas en floración activa - máximo 9
    const floweringRaw = await prisma.species.findMany({
      where: {
        plants: {
          some: {
            status: 'AVAILABLE',
            FloweringEvent: {
              some: {
                endDate: null,
              },
            },
          },
        },
      },
      include: landingSpeciesInclude,
      take: 9,
      orderBy: { name: 'asc' },
    })

    return {
      ok: true,
      featured: featuredRaw.map(formatSpeciesForLanding),
      flowering: floweringRaw.map(formatSpeciesForLanding),
    }
  } catch (err) {
    Logger.error('[Species] Error al obtener especies para landing:', err)

    return {
      ok: false,
      featured: [],
      flowering: [],
      message: 'Error al obtener las plantas destacadas.',
    }
  }
}
