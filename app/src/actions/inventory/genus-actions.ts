'use server'

import { revalidatePath } from 'next/cache'
import { prisma, type PlantType } from '@package/database'

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

/**
 * Lista todos los géneros con su conteo de especies.
 */
export async function getGenera() {
  try {
    const genera = await prisma.genus.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { species: true } },
      },
    })

    return { ok: true, genera }
  } catch (err) {
    console.error('[Genus] Error al obtener géneros:', err)

    return { ok: false, message: 'No se pudieron cargar los géneros.' }
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

export async function createGenus(data: { name: string; type: PlantType }) {
  try {
    const genus = await prisma.genus.create({
      data: { name: data.name.trim(), type: data.type },
    })

    revalidatePath('/genus')
    revalidatePath('/species')

    return { ok: true, genus }
  } catch (err) {
    console.error('[Genus] Error al crear género:', err)

    return { ok: false, message: 'Error al crear. ¿El nombre ya existe?' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

export async function updateGenus(id: string, data: { name: string; type: PlantType }) {
  try {
    const genus = await prisma.genus.update({
      where: { id },
      data: { name: data.name.trim(), type: data.type },
    })

    revalidatePath('/genus')

    return { ok: true, genus }
  } catch (err) {
    console.error('[Genus] Error al actualizar género:', err)

    return { ok: false, message: 'Error al actualizar el género.' }
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

/**
 * Elimina un género. Falla si tiene especies asociadas (Cascade deshabilitado).
 */
export async function deleteGenus(id: string) {
  try {
    // Guard: no borrar si tiene especies
    const speciesCount = await prisma.species.count({ where: { genusId: id } })

    if (speciesCount > 0) {
      return {
        ok: false,
        message: `No se puede eliminar: tiene ${speciesCount} especie(s) asociada(s). Elimínalas primero.`,
      }
    }

    await prisma.genus.delete({ where: { id } })
    revalidatePath('/genus')

    return { ok: true }
  } catch (err) {
    console.error('[Genus] Error al eliminar género:', err)

    return { ok: false, message: 'Error al eliminar el género.' }
  }
}
