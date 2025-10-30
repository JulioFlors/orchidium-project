'use server'

import { prisma } from '@package/database'

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
        stock: {
          select: {
            quantity: true,
            available: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // formatea los datos
    return species.map((specie) => ({
      ...specie,
      images: specie.images.map((image) => image.url),
    }))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching all species:', error)

    return []
  }
}
