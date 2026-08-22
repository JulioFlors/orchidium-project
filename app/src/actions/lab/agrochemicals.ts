'use server'

import { revalidatePath } from 'next/cache'
import {
  prisma,
  type AgrochemicalType,
  type AgrochemicalPurpose,
  DosageUnit,
} from '@package/database'

import { Logger } from '@/lib'

/**
 * Obtiene los agroquímicos de la base de datos (por defecto solo los activos).
 */
export async function getAgrochemicals(options?: { includeInactive?: boolean }) {
  try {
    const agrochemicals = await prisma.agrochemical.findMany({
      where: options?.includeInactive ? undefined : { isActive: true },
      include: {
        mixIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return { ok: true, agrochemicals }
  } catch (err) {
    Logger.error('Error al obtener agroquímicos:', err)

    return { ok: false, message: 'Error al cargar los insumos' }
  }
}

/**
 * Crea un nuevo agroquímico (puro o mezcla) o reactiva uno archivado de forma inteligente.
 */
export async function createAgrochemical(data: {
  name: string
  description?: string
  type: AgrochemicalType
  purpose: AgrochemicalPurpose
  dosageValue?: number | null
  dosageUnit?: DosageUnit | null
  isMix?: boolean
  mixIngredients?: { ingredientId: string; dosageValue?: number; dosageUnit?: DosageUnit }[]
}) {
  try {
    const finalDescription = data.description || ''

    // --- CASO 1: CREACIÓN O REACTIVACIÓN DE MEZCLA ---
    if (data.isMix && data.mixIngredients && data.mixIngredients.length > 0) {
      const ingredientIds = data.mixIngredients.map((i) => i.ingredientId)
      const dbIngredients = await prisma.agrochemical.findMany({
        where: { id: { in: ingredientIds } },
      })
      const dbMap = new Map(dbIngredients.map((ing) => [ing.id, ing]))

      const resolvedIngredients = data.mixIngredients.map((item) => {
        const dbIng = dbMap.get(item.ingredientId)

        return {
          ingredientId: item.ingredientId,
          dosageValue: item.dosageValue ?? dbIng?.dosageValue ?? 1,
          dosageUnit: item.dosageUnit ?? dbIng?.dosageUnit ?? DosageUnit.ML_L,
        }
      })

      const newIngredientIds = [...resolvedIngredients.map((i) => i.ingredientId)].sort()

      // Buscar todas las mezclas del mismo tipo en la base de datos (activas e inactivas)
      const existingMixes = await prisma.agrochemical.findMany({
        where: {
          isMix: true,
          type: data.type,
        },
        include: {
          mixIngredients: true,
        },
      })

      // Comparar por conjunto de IDs de ingredientes (sin importar el orden de selección)
      const matchingMix = existingMixes.find((mix) => {
        const existingIds = mix.mixIngredients.map((i) => i.ingredientId).sort()

        if (existingIds.length !== newIngredientIds.length) return false

        return existingIds.every((id, idx) => id === newIngredientIds[idx])
      })

      if (matchingMix) {
        if (matchingMix.isActive) {
          return {
            ok: false,
            message: `Ya existe una mezcla activa con estos mismos insumos ("${matchingMix.name}").`,
          }
        }

        // Si existe inactiva, la reactivamos y actualizamos con la nueva configuración
        const reactivatedMix = await prisma.$transaction(async (tx) => {
          // Limpiar ingredientes antiguos de la mezcla
          await tx.agrochemicalMixItem.deleteMany({
            where: { parentMixId: matchingMix.id },
          })

          // Actualizar datos de la mezcla y reinsertar ingredientes con las nuevas dosis
          return tx.agrochemical.update({
            where: { id: matchingMix.id },
            data: {
              name: data.name,
              description: finalDescription,
              purpose: data.purpose,
              isActive: true,
              mixIngredients: {
                create: resolvedIngredients.map((item) => ({
                  ingredientId: item.ingredientId,
                  dosageValue: item.dosageValue,
                  dosageUnit: item.dosageUnit,
                })),
              },
            },
            include: {
              mixIngredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          })
        })

        revalidatePath('/supplies')

        return {
          ok: true,
          agrochemical: reactivatedMix,
          message: `Mezcla "${data.name}" reactivada y actualizada con éxito.`,
        }
      }

      // Mezcla nueva
      const agrochemical = await prisma.agrochemical.create({
        data: {
          name: data.name,
          description: finalDescription,
          type: data.type,
          purpose: data.purpose,
          dosageValue: null,
          dosageUnit: null,
          isMix: true,
          isActive: true,
          mixIngredients: {
            create: resolvedIngredients.map((item) => ({
              ingredientId: item.ingredientId,
              dosageValue: item.dosageValue,
              dosageUnit: item.dosageUnit,
            })),
          },
        },
        include: {
          mixIngredients: {
            include: {
              ingredient: true,
            },
          },
        },
      })

      revalidatePath('/supplies')

      return { ok: true, agrochemical }
    }

    // --- CASO 2: CREACIÓN O REACTIVACIÓN DE INSUMO SIMPLE ---
    if (!data.isMix) {
      const existingSimple = await prisma.agrochemical.findUnique({
        where: { name: data.name },
      })

      if (existingSimple) {
        if (existingSimple.isActive) {
          return {
            ok: false,
            message: `Ya existe un insumo activo registrado con el nombre "${data.name}".`,
          }
        }

        // Si está inactivo y coincide su tipo y propósito, lo reactivamos
        if (existingSimple.type === data.type && existingSimple.purpose === data.purpose) {
          const reactivatedSimple = await prisma.agrochemical.update({
            where: { id: existingSimple.id },
            data: {
              description: finalDescription,
              dosageValue: data.dosageValue || null,
              dosageUnit: data.dosageUnit || null,
              isActive: true,
            },
          })

          revalidatePath('/supplies')

          return {
            ok: true,
            agrochemical: reactivatedSimple,
            message: `Insumo "${data.name}" reactivado y actualizado con éxito.`,
          }
        }

        return {
          ok: false,
          message: `Existe un insumo archivado con el nombre "${data.name}" pero con clasificación diferente.`,
        }
      }
    }

    // --- CASO 3: INSUMO SIMPLE TOTALMENTE NUEVO ---
    const agrochemical = await prisma.agrochemical.create({
      data: {
        name: data.name,
        description: finalDescription,
        type: data.type,
        purpose: data.purpose,
        dosageValue: data.dosageValue || null,
        dosageUnit: data.dosageUnit || null,
        isMix: data.isMix || false,
        isActive: true,
      },
      include: {
        mixIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    })

    revalidatePath('/supplies')

    return { ok: true, agrochemical }
  } catch (err) {
    Logger.error('Error al crear agroquímico:', err)

    return { ok: false, message: 'Error al procesar el insumo. ¿Ya existe ese nombre?' }
  }
}

/**
 * Actualiza un agroquímico existente.
 */
export async function updateAgrochemical(
  id: string,
  data: {
    name: string
    description?: string
    type: AgrochemicalType
    purpose: AgrochemicalPurpose
    dosageValue?: number | null
    dosageUnit?: DosageUnit | null
    isMix?: boolean
    mixIngredients?: { ingredientId: string; dosageValue?: number; dosageUnit?: DosageUnit }[]
  },
) {
  try {
    const finalDescription = data.description || ''

    let resolvedIngredients = data.mixIngredients

    if (data.isMix && data.mixIngredients && data.mixIngredients.length > 0) {
      const ingredientIds = data.mixIngredients.map((i) => i.ingredientId)
      const dbIngredients = await prisma.agrochemical.findMany({
        where: { id: { in: ingredientIds } },
      })
      const dbMap = new Map(dbIngredients.map((ing) => [ing.id, ing]))

      resolvedIngredients = data.mixIngredients.map((item) => {
        const dbIng = dbMap.get(item.ingredientId)

        return {
          ingredientId: item.ingredientId,
          dosageValue: item.dosageValue ?? dbIng?.dosageValue ?? 1,
          dosageUnit: item.dosageUnit ?? dbIng?.dosageUnit ?? DosageUnit.ML_L,
        }
      })
    }

    const agrochemical = await prisma.$transaction(async (tx) => {
      // 1. Limpiar ingredientes existentes de la mezcla si existían
      await tx.agrochemicalMixItem.deleteMany({
        where: { parentMixId: id },
      })

      // 2. Actualizar el insumo principal
      return tx.agrochemical.update({
        where: { id },
        data: {
          name: data.name,
          description: finalDescription,
          type: data.type,
          purpose: data.purpose,
          dosageValue: data.dosageValue || null,
          dosageUnit: data.dosageUnit || null,
          isMix: data.isMix || false,
          mixIngredients:
            data.isMix && resolvedIngredients && resolvedIngredients.length > 0
              ? {
                  create: resolvedIngredients.map((item) => ({
                    ingredientId: item.ingredientId,
                    dosageValue: item.dosageValue!,
                    dosageUnit: item.dosageUnit!,
                  })),
                }
              : undefined,
        },
        include: {
          mixIngredients: {
            include: {
              ingredient: true,
            },
          },
        },
      })
    })

    revalidatePath('/supplies')

    return { ok: true, agrochemical }
  } catch (err) {
    Logger.error('Error al actualizar agroquímico:', err)

    return { ok: false, message: 'Error al actualizar el insumo.' }
  }
}

/**
 * Desincorpora/archiva de forma segura un agroquímico (Soft Delete con validaciones previas).
 */
export async function deleteAgrochemical(id: string) {
  try {
    const agrochemical = await prisma.agrochemical.findUnique({
      where: { id },
      include: {
        fertilizationCycles: {
          include: {
            program: true,
          },
        },
        phytosanitaryCycles: {
          include: {
            program: true,
          },
        },
        usedInMixes: {
          include: {
            parentMix: true,
          },
        },
      },
    })

    if (!agrochemical) {
      return { ok: false, message: 'El insumo no existe' }
    }

    // 1. Validar si el insumo forma parte de alguna mezcla ACTIVA
    const activeParentMixes = agrochemical.usedInMixes.filter(
      (mixItem) => mixItem.parentMix.isActive,
    )

    if (activeParentMixes.length > 0) {
      const mixNames = activeParentMixes.map((m) => `"${m.parentMix.name}"`).join(', ')

      return {
        ok: false,
        message: `No se puede archivar "${agrochemical.name}" porque forma parte de la mezcla activa ${mixNames}. Debes archivar o modificar la mezcla primero.`,
      }
    }

    // 2. Validar si está en Programas / Recetas de Fertilización
    if (agrochemical.fertilizationCycles.length > 0) {
      const programNames = agrochemical.fertilizationCycles
        .map((c) => `"${c.program.name}"`)
        .join(', ')

      return {
        ok: false,
        message: `No se puede archivar "${agrochemical.name}" porque está incluido en el programa de fertilización ${programNames}. Debes retirarlo del programa primero.`,
      }
    }

    // 3. Validar si está en Programas / Recetas Fitosanitarias
    if (agrochemical.phytosanitaryCycles.length > 0) {
      const programNames = agrochemical.phytosanitaryCycles
        .map((c) => `"${c.program.name}"`)
        .join(', ')

      return {
        ok: false,
        message: `No se puede archivar "${agrochemical.name}" porque está incluido en el programa fitosanitario ${programNames}. Debes retirarlo del programa primero.`,
      }
    }

    // 4. Validar si tiene tareas de dosificación ACTIVAS o PENDIENTES
    const pendingDosingLogs = await prisma.dosingLog.findMany({
      where: {
        agrochemicalId: id,
        status: {
          in: ['PENDING', 'WAITING_CONFIRMATION', 'IN_PROGRESS'],
        },
      },
    })

    if (pendingDosingLogs.length > 0) {
      return {
        ok: false,
        message: `No se puede archivar "${agrochemical.name}" porque tiene ${pendingDosingLogs.length} tarea(s) de dosificación activa(s) o pendiente(s) por ejecutar.`,
      }
    }

    // 5. Proceder al archivado seguro (Soft Delete)
    await prisma.agrochemical.update({
      where: { id },
      data: { isActive: false },
    })

    revalidatePath('/supplies')

    return { ok: true, message: `Insumo "${agrochemical.name}" archivado con éxito.` }
  } catch (err) {
    Logger.error('Error al archivar agroquímico:', err)

    return {
      ok: false,
      message: 'No se pudo archivar el insumo. Verifica que no tenga dependencias activas.',
    }
  }
}
