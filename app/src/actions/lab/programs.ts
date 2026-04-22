'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@package/database'

import { Logger } from '@/lib'

/**
 * Obtiene todos los programas de cultivo (Fertilización y Fitosanitarios).
 */
export async function getPrograms() {
  try {
    const [fertilizationPrograms, phytosanitaryPrograms] = await Promise.all([
      prisma.fertilizationProgram.findMany({
        include: {
          productsCycle: {
            include: { agrochemical: true },
            orderBy: { sequence: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.phytosanitaryProgram.findMany({
        include: {
          productsCycle: {
            include: { agrochemical: true },
            orderBy: { sequence: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    return {
      ok: true,
      fertilizationPrograms,
      phytosanitaryPrograms,
    }
  } catch (err) {
    Logger.error('Error al obtener programas:', err)

    return { ok: false, message: 'No se pudieron cargar los programas' }
  }
}

/**
 * Crea o actualiza un programa de fertilización con sus ciclos.
 */
export async function upsertFertilizationProgram(data: {
  id?: string
  name: string
  weeklyFrequency: number
  cycles: { sequence: number; agrochemicalId: string }[]
}) {
  try {
    const { id, name, weeklyFrequency, cycles } = data

    const program = await prisma.$transaction(async (tx) => {
      // 1. Crear o actualizar el programa
      const p = await tx.fertilizationProgram.upsert({
        where: { id: id || 'new' },
        update: { name, weeklyFrequency },
        create: { name, weeklyFrequency },
      })

      // 2. Limpiar ciclos existentes si es una actualización
      if (id) {
        await tx.fertilizationCycle.deleteMany({ where: { programId: p.id } })
      }

      // 3. Crear los nuevos ciclos
      if (cycles.length > 0) {
        await tx.fertilizationCycle.createMany({
          data: cycles.map((c) => ({
            sequence: c.sequence,
            agrochemicalId: c.agrochemicalId,
            programId: p.id,
          })),
        })
      }

      return p
    })

    revalidatePath('/recipes')

    return { ok: true, program }
  } catch (err) {
    Logger.error('Error al guardar programa de fertilización:', err)

    return { ok: false, message: 'Error al guardar el programa de fertilización' }
  }
}

/**
 * Crea o actualiza un programa fitosanitario con sus ciclos.
 */
export async function upsertPhytosanitaryProgram(data: {
  id?: string
  name: string
  monthlyFrequency: number
  cycles: { sequence: number; agrochemicalId: string }[]
}) {
  try {
    const { id, name, monthlyFrequency, cycles } = data

    const program = await prisma.$transaction(async (tx) => {
      const p = await tx.phytosanitaryProgram.upsert({
        where: { id: id || 'new' },
        update: { name, monthlyFrequency },
        create: { name, monthlyFrequency },
      })

      if (id) {
        await tx.phytosanitaryCycle.deleteMany({ where: { programId: p.id } })
      }

      if (cycles.length > 0) {
        await tx.phytosanitaryCycle.createMany({
          data: cycles.map((c) => ({
            sequence: c.sequence,
            agrochemicalId: c.agrochemicalId,
            programId: p.id,
          })),
        })
      }

      return p
    })

    revalidatePath('/recipes')

    return { ok: true, program }
  } catch (err) {
    Logger.error('Error al guardar programa fitosanitario:', err)

    return { ok: false, message: 'Error al guardar el programa fitosanitario' }
  }
}

/**
 * Elimina un programa de fertilización.
 */
export async function deleteFertilizationProgram(id: string) {
  try {
    await prisma.fertilizationProgram.delete({ where: { id } })
    revalidatePath('/recipes')

    return { ok: true }
  } catch (err) {
    Logger.error('Error al eliminar programa de fertilización:', err)

    return { ok: false, message: 'No se pudo eliminar el programa' }
  }
}

/**
 * Elimina un programa fitosanitario.
 */
export async function deletePhytosanitaryProgram(id: string) {
  try {
    await prisma.phytosanitaryProgram.delete({ where: { id } })
    revalidatePath('/recipes')

    return { ok: true }
  } catch (err) {
    Logger.error('Error al eliminar programa fitosanitario:', err)

    return { ok: false, message: 'No se pudo eliminar el programa' }
  }
}
