'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@package/database'

import { Logger } from '@/lib'
import { deleteR2Object } from '@/actions/storage/upload-actions'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Genera slug kebab-case desde nombre de especie */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

export async function getSpecies() {
  try {
    const species = await prisma.species.findMany({
      orderBy: { name: 'asc' },
      include: {
        genus: { select: { id: true, name: true, type: true } },
        images: { select: { id: true, url: true } },
        _count: { select: { variants: true, plants: true } },
      },
    })

    return { ok: true, species }
  } catch (err) {
    Logger.error('[Species] Error al obtener especies:', err)

    return { ok: false, message: 'No se pudieron cargar las especies.' }
  }
}

export async function getSpeciesById(id: string) {
  try {
    const species = await prisma.species.findUnique({
      where: { id },
      include: {
        genus: { select: { id: true, name: true, type: true } },
        images: { select: { id: true, url: true } },
        _count: { select: { variants: true, plants: true } },
      },
    })

    return { ok: true, species }
  } catch (err) {
    Logger.error('[Species] Error al obtener especie por ID:', err)

    return { ok: false, message: 'No se pudo cargar la especie.' }
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

export async function createSpecies(data: { name: string; genusId: string; description?: string }) {
  try {
    const slug = toSlug(data.name)
    const species = await prisma.species.create({
      data: {
        name: data.name.trim(),
        slug,
        genusId: data.genusId,
        description: data.description?.trim() ?? null,
      },
    })

    revalidatePath('/species')

    return { ok: true, species }
  } catch (err) {
    Logger.error('[Species] Error al crear especie:', err)

    return { ok: false, message: 'Error al crear. ¿El nombre ya existe?' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

export async function updateSpecies(
  id: string,
  data: { name: string; genusId: string; description?: string },
) {
  try {
    const slug = toSlug(data.name)
    const species = await prisma.species.update({
      where: { id },
      data: {
        name: data.name.trim(),
        slug,
        genusId: data.genusId,
        description: data.description?.trim() ?? null,
      },
    })

    revalidatePath('/species')

    return { ok: true, species }
  } catch (err) {
    Logger.error('[Species] Error al actualizar especie:', err)

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
    revalidatePath('/species')

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
    const image = await prisma.speciesImage.create({ data: { speciesId, url } })

    revalidatePath('/species')

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
    revalidatePath('/species')

    return { ok: true }
  } catch (err) {
    Logger.error('[Species] Error al eliminar imagen:', err)

    return { ok: false, message: 'Error al eliminar la imagen.' }
  }
}

// ─────────────────────────────────────────────────────────────
// FEATURED & LANDING
// ─────────────────────────────────────────────────────────────

/** Alterna el estado destacado de una especie */
export async function toggleSpeciesFeatured(id: string, isFeatured: boolean) {
  try {
    const species = await prisma.species.update({
      where: { id },
      data: { isFeatured },
    })

    revalidatePath('/species')
    revalidatePath('/')
    revalidatePath('/shop-manager')

    return { ok: true, species }
  } catch (err) {
    Logger.error('[Species] Error al alternar destacado:', err)

    return { ok: false, message: 'No se pudo actualizar el estado de destacado.' }
  }
}

/** Obtiene las especies destacadas (más vendidas) y las que tienen floración activa */
export async function getLandingSpecies() {
  try {
    // 1. Obtener destacadas (Los más vendidos) - comentado temporalmente porque no existe isFeatured en BD
    /*
    const featured = await prisma.species.findMany({
      where: { isFeatured: true },
      include: {
        genus: { select: { id: true, name: true, type: true } },
        images: { select: { id: true, url: true } },
        variants: true,
      },
      take: 9,
      orderBy: { name: 'asc' },
    })
    */
    const featured: typeof flowering = []

    // 2. Obtener especies con plantas en floración activa - máximo 9
    const flowering = await prisma.species.findMany({
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
      include: {
        genus: { select: { id: true, name: true, type: true } },
        images: { select: { id: true, url: true } },
        variants: true,
      },
      take: 9,
      orderBy: { name: 'asc' },
    })

    return { ok: true, featured, flowering }
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
