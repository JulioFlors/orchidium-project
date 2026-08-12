'use server'

import type { PlantType } from '@/interfaces'

import prisma from '@package/database'

import { Logger } from '@/lib'

export const getSpeciesByType = async (plantType: PlantType) => {
  try {
    const species = await prisma.species.findMany({
      include: {
        images: {
          take: 2,
          select: {
            url: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        genus: {
          select: {
            name: true,
            type: true,
          },
        },
        variants: true,
        plants: {
          where: {
            status: 'AVAILABLE',
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
      const isFlowering = specie.plants.some((p) => p.FloweringEvent && p.FloweringEvent.length > 0)

      const updatedVariants = specie.variants.map((v) => {
        const realQty = specie.plants.filter((p) => p.currentSize === v.size).length

        return {
          ...v,
          quantity: realQty,
          available: realQty > 0,
        }
      })

      return {
        ...specie,
        // Se aplana la estructura de las imágenes.
        images: specie.images.map((image) => image.url),
        variants: updatedVariants,
        isFlowering,
      }
    })
  } catch (error) {
    Logger.error('Error fetching species by type:', error)

    // En lugar de lanzar un error que crashee la página,
    // Se devuelve un array vacío.
    // TODO La página debe mostrar un mensaje de "No se encontraron productos".

    return []
  }
}
