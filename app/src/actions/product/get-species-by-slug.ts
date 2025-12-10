'use server'

import prisma from '@package/database'

export const getSpeciesBySlug = async (slug: string) => {
  try {
    const species = await prisma.species.findFirst({
      include: {
        images: {
          select: {
            url: true,
          },
        },
        stock: {
          select: {
            quantity: true,
            available: true,
          },
        },
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
    // eslint-disable-next-line no-console
    console.log(error)
    throw new Error('Error al obtener el articulo por slug')
  }
}
