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
    const trimmedName = name.trim()

    if (id) {
      // Actualización atómica en batch: borrar ciclos previos y actualizar datos/insertar ciclos
      const [, program] = await prisma.$transaction([
        prisma.fertilizationCycle.deleteMany({ where: { programId: id } }),
        prisma.fertilizationProgram.update({
          where: { id },
          data: {
            name: trimmedName,
            weeklyFrequency,
            productsCycle: {
              create: cycles.map((c) => ({
                sequence: c.sequence,
                agrochemicalId: c.agrochemicalId,
              })),
            },
          },
          include: {
            productsCycle: {
              include: { agrochemical: true },
              orderBy: { sequence: 'asc' },
            },
          },
        }),
      ])

      revalidatePath('/recipes')

      return { ok: true, program }
    } else {
      // Creación con ciclos anidados en una sola consulta
      const program = await prisma.fertilizationProgram.create({
        data: {
          name: trimmedName,
          weeklyFrequency,
          productsCycle: {
            create: cycles.map((c) => ({
              sequence: c.sequence,
              agrochemicalId: c.agrochemicalId,
            })),
          },
        },
        include: {
          productsCycle: {
            include: { agrochemical: true },
            orderBy: { sequence: 'asc' },
          },
        },
      })

      revalidatePath('/recipes')

      return { ok: true, program }
    }
  } catch (err: unknown) {
    Logger.error('Error al guardar programa de fertilización:', err)

    if (typeof err === 'object' && err !== null && 'code' in err) {
      if (err.code === 'P2002') {
        return {
          ok: false,
          message: 'Ya existe un plan de fertilización con este nombre. Elige un nombre diferente.',
        }
      }
    }

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
    const trimmedName = name.trim()

    if (id) {
      const [, program] = await prisma.$transaction([
        prisma.phytosanitaryCycle.deleteMany({ where: { programId: id } }),
        prisma.phytosanitaryProgram.update({
          where: { id },
          data: {
            name: trimmedName,
            monthlyFrequency,
            productsCycle: {
              create: cycles.map((c) => ({
                sequence: c.sequence,
                agrochemicalId: c.agrochemicalId,
              })),
            },
          },
          include: {
            productsCycle: {
              include: { agrochemical: true },
              orderBy: { sequence: 'asc' },
            },
          },
        }),
      ])

      revalidatePath('/recipes')

      return { ok: true, program }
    } else {
      const program = await prisma.phytosanitaryProgram.create({
        data: {
          name: trimmedName,
          monthlyFrequency,
          productsCycle: {
            create: cycles.map((c) => ({
              sequence: c.sequence,
              agrochemicalId: c.agrochemicalId,
            })),
          },
        },
        include: {
          productsCycle: {
            include: { agrochemical: true },
            orderBy: { sequence: 'asc' },
          },
        },
      })

      revalidatePath('/recipes')

      return { ok: true, program }
    }
  } catch (err: unknown) {
    Logger.error('Error al guardar programa fitosanitario:', err)

    if (typeof err === 'object' && err !== null && 'code' in err) {
      if (err.code === 'P2002') {
        return {
          ok: false,
          message: 'Ya existe un plan fitosanitario con este nombre. Elige un nombre diferente.',
        }
      }
    }

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
