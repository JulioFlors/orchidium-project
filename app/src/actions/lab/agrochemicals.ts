'use server'

import { revalidatePath } from 'next/cache'
import { prisma, type AgrochemicalType, type AgrochemicalPurpose } from '@package/database'

/**
 * Obtiene todos los agroquímicos de la base de datos.
 */
export async function getAgrochemicals() {
  try {
    const agrochemicals = await prisma.agrochemical.findMany({
      orderBy: { name: 'asc' },
    })

    return { ok: true, agrochemicals }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener agroquímicos:', err)

    return { ok: false, message: 'No se pudieron cargar los insumos' }
  }
}

/**
 * Crea un nuevo agroquímico.
 */
export async function createAgrochemical(data: {
  name: string
  description: string
  type: AgrochemicalType
  purpose: AgrochemicalPurpose
  preparation: string
}) {
  try {
    const agrochemical = await prisma.agrochemical.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        purpose: data.purpose,
        preparation: data.preparation,
      },
    })

    revalidatePath('/supplies')

    return { ok: true, agrochemical }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error al crear agroquímico:', err)

    return { ok: false, message: 'Error al crear el insumo. ¿Ya existe ese nombre?' }
  }
}

/**
 * Actualiza un agroquímico existente.
 */
export async function updateAgrochemical(
  id: string,
  data: {
    name: string
    description: string
    type: AgrochemicalType
    purpose: AgrochemicalPurpose
    preparation: string
  },
) {
  try {
    const agrochemical = await prisma.agrochemical.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        purpose: data.purpose,
        preparation: data.preparation,
      },
    })

    revalidatePath('/supplies')

    return { ok: true, agrochemical }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error al actualizar agroquímico:', err)

    return { ok: false, message: 'Error al actualizar el insumo.' }
  }
}

/**
 * Elimina un agroquímico.
 */
export async function deleteAgrochemical(id: string) {
  try {
    await prisma.agrochemical.delete({
      where: { id },
    })

    revalidatePath('/supplies')

    return { ok: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error al eliminar agroquímico:', err)

    return {
      ok: false,
      message: 'No se pudo eliminar. Es posible que esté asociado a una receta activa.',
    }
  }
}
