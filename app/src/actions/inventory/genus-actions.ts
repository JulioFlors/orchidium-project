'use server'

import { revalidatePath } from 'next/cache'
import { prisma, type PlantType } from '@package/database'

import { Logger } from '@/lib'

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
    Logger.error('[Genus] Error al obtener géneros:', err)

    return { ok: false, message: 'No se pudieron cargar los géneros.' }
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatGenusName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function validateGenusNameInput(name: string): {
  isValid: boolean
  message?: string
  cleanName: string
} {
  const clean = name.trim().replace(/\s+/g, ' ')

  if (!clean || clean.length < 4) {
    return {
      isValid: false,
      message: 'El nombre del género debe tener al menos 4 letras.',
      cleanName: clean,
    }
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(clean)) {
    return {
      isValid: false,
      message: 'El nombre del género solo debe contener letras del abecedario.',
      cleanName: clean,
    }
  }

  return { isValid: true, cleanName: clean }
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

export async function createGenus(data: { name: string; type: PlantType }) {
  try {
    const validation = validateGenusNameInput(data.name)

    if (!validation.isValid) {
      return { ok: false, message: validation.message }
    }

    const formattedName = formatGenusName(validation.cleanName)

    // Validar duplicados case-insensitive
    const existing = await prisma.genus.findFirst({
      where: {
        name: { equals: formattedName, mode: 'insensitive' },
      },
    })

    if (existing) {
      return {
        ok: false,
        message: `Ya existe un género registrado con el nombre "${existing.name}".`,
      }
    }

    const genus = await prisma.genus.create({
      data: { name: formattedName, type: data.type },
    })

    revalidatePath('/catalog')

    return { ok: true, genus }
  } catch (err) {
    Logger.error('[Genus] Error al crear género:', err)

    return { ok: false, message: 'Error al crear el género.' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

export async function updateGenus(id: string, data: { name: string; type: PlantType }) {
  try {
    const validation = validateGenusNameInput(data.name)

    if (!validation.isValid) {
      return { ok: false, message: validation.message }
    }

    const formattedName = formatGenusName(validation.cleanName)

    // Validar duplicados case-insensitive excluyendo el registro actual
    const existing = await prisma.genus.findFirst({
      where: {
        name: { equals: formattedName, mode: 'insensitive' },
        NOT: { id },
      },
    })

    if (existing) {
      return {
        ok: false,
        message: `Ya existe un género registrado con el nombre "${existing.name}".`,
      }
    }

    const genus = await prisma.genus.update({
      where: { id },
      data: { name: formattedName, type: data.type },
    })

    revalidatePath('/catalog')

    return { ok: true, genus }
  } catch (err) {
    Logger.error('[Genus] Error al actualizar género:', err)

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
    revalidatePath('/catalog')

    return { ok: true }
  } catch (err) {
    Logger.error('[Genus] Error al eliminar género:', err)

    return { ok: false, message: 'Error al eliminar el género.' }
  }
}
