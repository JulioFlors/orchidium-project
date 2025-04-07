'use client'

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Species } from '@/interfaces/'
import { initialData } from '@/seed/seed'

const allSpeciesData = initialData.species

export function SearchResultsPage() {
  const router = useRouter()
  const { query } = router.query
  const searchTerm = typeof query === 'string' ? query : ''
  const [results, setResults] = useState<Species[]>([])

  useEffect(() => {
    if (searchTerm) {
      const searchTerms = searchTerm.toLowerCase().split(' ')
      const filteredSpecies = allSpeciesData.filter((species) =>
        searchTerms.some((term) => species.name.toLowerCase().includes(term)),
      )

      setResults(filteredSpecies)
    } else {
      setResults([])
    }
  }, [searchTerm])

  return (
    <>
      <h1
        aria-labelledby="category-heading"
        className="tracking-2 text-primary mt-17 mb-2 text-[1.625rem] leading-9 font-extralight antialiased"
        id=" category-heading"
      >
        Resultados de <span className="font-medium">{searchTerm}</span>
      </h1>

      {/* Todo: Hacer la funcionabilida de busqueda */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {results.map((species) => (
          <div key={species.slug}>
            {/* Renderizar la información de la especie, incluyendo un Link a su página de detalles */}
            <Link href={`/product/${species.slug}`}>{species.name}</Link>
          </div>
        ))}
      </div>
    </>
  )
}
