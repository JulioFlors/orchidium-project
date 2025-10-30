'use server'

import { prisma } from '@package/database'

export interface SearchSuggestion {
  name: string
  slug: string
}

export const getSearchSuggestions = async (): Promise<SearchSuggestion[]> => {
  try {
    const species = await prisma.species.findMany({
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return species
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching search suggestions:', error)

    return []
  }
}
