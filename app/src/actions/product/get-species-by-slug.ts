'use server'

import prisma from '@package/database'

import { Logger } from '@/lib'
import { sortVariantsByPotSizeAsc } from '@/config/mappings'

export const getSpeciesBySlug = async (slug: string) => {
  try {
    const species = await prisma.species.findFirst({
      include: {
        images: {
          select: {
            url: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        variants: true,
        genus: true,
        plants: {
          where: {
            status: 'AVAILABLE',
          },
          select: {
            currentSize: true,
          },
        },
      },
      where: {
        slug: slug,
      },
    })

    if (!species) return null

    const updatedVariants = sortVariantsByPotSizeAsc(
      species.variants.map((v) => {
        const realQty = species.plants.filter((p) => p.currentSize === v.size).length

        return {
          ...v,
          quantity: realQty,
          available: realQty > 0,
        }
      }),
    )

    return {
      ...species,
      images: species.images.map((image) => image.url),
      variants: updatedVariants,
    }
  } catch (error) {
    Logger.error('Error al obtener el articulo por slug:', error)
    throw new Error('Error al obtener el articulo por slug')
  }
}
