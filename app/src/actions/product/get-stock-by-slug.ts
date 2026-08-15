'use server'

import prisma from '@package/database'

import { Logger } from '@/lib'

export const getStockBySlug = async (slug: string): Promise<number> => {
  try {
    const availablePlantsCount = await prisma.plant.count({
      where: {
        species: { slug },
        status: 'AVAILABLE',
      },
    })

    return availablePlantsCount
  } catch (error) {
    Logger.error(`Error al obtener el stock de ${slug}:`, error)

    return 0
  }
}
