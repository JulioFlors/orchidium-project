'use server'

import prisma from '@package/database'

import { Logger } from '@/lib'

export const getSpeciesBySlug = async (slug: string) => {
  try {
    const species = await prisma.species.findFirst({
      include: {
        images: {
          select: {
            url: true,
          },
        },
        variants: true,
        genus: true,
      },
      where: {
        slug: slug,
      },
    })

    if (!species) return null

    return {
      ...species,
      images: species.images.map((image) => image.url),
    }
  } catch (error) {
    Logger.error('Error al obtener el articulo por slug:', error)
    throw new Error('Error al obtener el articulo por slug')
  }
}
