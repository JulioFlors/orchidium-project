'use server'

import prisma from '@package/database'

import { Logger } from '@/lib'

export const getStockBySlug = async (slug: string): Promise<number> => {
  try {
    const species = await prisma.species.findFirst({
      where: { slug },
      include: {
        variants: {
          select: {
            quantity: true,
          },
        },
      },
    })

    if (!species) return 0

    return species.variants.reduce((total, variant) => total + variant.quantity, 0)
  } catch (error) {
    Logger.error(`Error al obtener el stock de ${slug}:`, error)

    return 0
  }
}
