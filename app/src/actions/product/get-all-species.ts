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
        },
        genus: {
          select: {
            name: true,
            type: true,
          },
        },
        variants: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // formatea los datos
    return species.map((specie) => {
      return {
        ...specie,
        images: specie.images.map((image) => image.url),
      }
    })
  } catch (error) {
    Logger.error('Error fetching all species:', error)

    return []
  }
}
