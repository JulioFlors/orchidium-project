'use server'

import prisma from '@package/database'

import { PlantType } from '@/interfaces'

// Definimos la interfaz de los datos que necesita el menú de Plantas.
export interface PlantsNavData {
  name: string
  type: PlantType
}

/**
 * @ServerAction
 * Obtener los datos de navegación de la sección `Plants`
 *
 * Devuelve una lista de todos los géneros que tienen al menos una especie asociada
 */
export const getPlantsNavigation = async (): Promise<PlantsNavData[]> => {
  try {
    const navigationItems = await prisma.genus.findMany({
      // Filtramos para obtener solo géneros que tengan al menos una especie.
      where: {
        species: {
          some: {}, // 'some: {}' significa "que tenga al menos un registro relacionado"
        },
      },
      // Seleccionamos solo los campos que necesita el menú
      select: {
        name: true,
        type: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return navigationItems
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching genus navigation data:', error)

    return []
  }
}
