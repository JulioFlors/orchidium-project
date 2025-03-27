'use client'

import { useState, useEffect, useRef } from 'react'
import { IoSearchOutline, IoCloseCircleOutline } from 'react-icons/io5'
import Link from 'next/link'

// Interfaz para los resultados de la búsqueda
interface SearchResult {
  id: string
  title: string
  url: string
}

// Datos de ejemplo para la búsqueda
const searchData: SearchResult[] = [
  { id: 'orquideas', title: 'Orquídeas', url: '/category/orquideas' },
  { id: 'rosas-desierto', title: 'Rosas del Desierto', url: '/category/rosas-del-desierto' },
  { id: 'cactus', title: 'Cactus', url: '/category/cactus' },
  { id: 'suculentas', title: 'Suculentas', url: '/category/suculentas' },
  { id: 'macetas', title: 'Macetas', url: '/category/macetas' },
  { id: 'herramientas', title: 'Herramientas', url: '/category/herramientas' },
]

export function SearchBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([]) // Usamos la interfaz SearchResult[]
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Enfocar el input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Filtrar resultados
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([])

      return
    }

    const filtered = searchData.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    setResults(filtered)
  }, [searchTerm])

  // Función para resaltar coincidencias
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    let counter = 0 // Contador para asegurar claves únicas

    return parts.map((part) => {
      const key = `${crypto.randomUUID()}-${counter++}` // Clave única con UUID y contador

      return regex.test(part) ? <strong key={key}>{part}</strong> : <span key={key}>{part}</span>
    })
  }

  return (
    <div ref={searchRef} className="relative">
      <button
        aria-label="Buscar"
        className="focus-visible mx-2"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <IoSearchOutline className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 z-50 w-80 rounded-md bg-white p-4 shadow-lg">
          <div className="relative">
            <IoSearchOutline className="absolute top-2 left-2 text-gray-500" size={20} />
            <input
              ref={inputRef}
              className="w-full rounded border-b-2 border-gray-200 bg-gray-50 py-1 pr-10 pl-10 text-base focus:border-emerald-600 focus:outline-none"
              placeholder="Buscar"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                aria-label="Borrar búsqueda"
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                type="button"
                onClick={() => setSearchTerm('')}
              >
                <IoCloseCircleOutline size={20} />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <Link
                  key={result.id}
                  className="block border-b border-gray-100 px-2 py-2 hover:bg-gray-50"
                  href={result.url}
                  onClick={() => {
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                >
                  {highlightMatch(result.title, searchTerm)}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
