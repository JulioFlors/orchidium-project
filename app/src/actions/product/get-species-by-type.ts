'use server'

import type { PlantType } from '@/interfaces'

import prisma from '@package/database'

export const getSpeciesByType = async (plantType: PlantType) => {
  try {
    const species = await prisma.species.findMany({
      include: {
        images: {
          take: 2,
          select: {
            url: true,
          },
        },
        genus: {
          select: {
            name: true,
            type: true,
          },
        },
        variants: true,
      },

      where: {
        genus: {
          type: plantType,
        },
      },

      orderBy: {
        name: 'asc',
      },
    })

    return species.map((specie) => {
      return {
        ...specie,
        // Se aplana la estructura de las imágenes.
        images: specie.images.map((image) => image.url),
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching species by type:', error)

    // En lugar de lanzar un error que crashee la página,
    // Se devuelve un array vacío.
    // TODO La página debe mostrar un mensaje de "No se encontraron productos".

    return []
  }
}
