'use server'

import { prisma } from '@package/database'

export const getStockBySlug = async (slug: string): Promise<number> => {
  try {
    const species = await prisma.species.findFirst({
      where: { slug },
      include: {
        stock: {
          select: {
            quantity: true,
          },
        },
      },
    })

    // Si no se encuentra la especie o su stock, devolvemos 0
    return species?.stock?.quantity ?? 0
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error al obtener eel stock de ${slug}: ${error}`)

    return 0
  }
}
