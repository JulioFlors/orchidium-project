'use server'

import prisma from '@package/database'

export const getSearchSpeciesByTerm = async (searchTerm: string) => {
  // Normalizamos el término de búsqueda
  const SearchTerm = searchTerm.trim().toLowerCase()

  // Si el término de búsqueda es muy corto, no hacemos la consulta a la DB
  if (SearchTerm.length < 3) {
    return []
  }

  try {
    const species = await prisma.species.findMany({
      where: {
        // Usamos 'OR' para buscar en múltiples campos
        OR: [
          {
            name: {
              contains: SearchTerm,
              mode: 'insensitive', // Búsqueda insensible a mayúsculas/minúsculas
            },
          },
          {
            description: {
              contains: SearchTerm,
              mode: 'insensitive',
            },
          },
          {
            // Búsqueda en el nombre del género relacionado
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
        },
        genus: {
          select: { name: true, type: true },
        },
        variants: true,
      },
    })

    // Devolvemos los datos formateados
    return species.map((specie) => {
      return {
        ...specie,
        images: specie.images.map((image) => image.url),
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error searching species:', error)

    return []
  }
}
