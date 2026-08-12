'use server'

import prisma from '@package/database'

import { Logger } from '@/lib'

export const getSearchSpeciesByTerm = async (
  searchTerm: string,
  limit: number = 20,
  offset: number = 0,
) => {
  // Normalizamos el término de búsqueda
  const SearchTerm = searchTerm.trim().toLowerCase()

  // Si el término de búsqueda es muy corto, no hacemos la consulta a la DB
  if (SearchTerm.length < 3) {
    return []
  }

  try {
    const species = await prisma.species.findMany({
      take: limit,
      skip: offset,
      where: {
        // Usamos 'OR' para buscar en múltiples campos
        OR: [
          {
            name: {
              contains: SearchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: SearchTerm,
              mode: 'insensitive',
            },
          },
          {
            genus: {
              name: {
                contains: SearchTerm,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        images: {
          take: 2,
          select: { url: true },
          orderBy: { position: 'asc' },
        },
        genus: {
          select: { name: true, type: true },
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
    })

    // Devolvemos los datos formateados
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
    Logger.error('Error searching species:', error)

    return []
  }
}
