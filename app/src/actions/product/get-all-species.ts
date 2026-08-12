'use server'

import prisma from '@package/database'

import { Logger } from '@/lib'

export const getAllSpeciesWithImages = async () => {
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
      orderBy: {
        name: 'asc',
      },
    })

    // formatea los datos
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
        images: specie.images.map((image) => image.url),
        variants: updatedVariants,
        isFlowering,
      }
    })
  } catch (error) {
    Logger.error('Error fetching all species:', error)

    return []
  }
}
