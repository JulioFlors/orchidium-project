import React from 'react'

/**
 * Resalta las coincidencias de búsqueda dentro de un texto dado.
 *
 * @param text - El texto en el que se buscarán y resaltarán las coincidencias.
 * @param query - El término de búsqueda que se utilizará para encontrar coincidencias.
 * @returns Un array de elementos React que representan el texto con las coincidencias resaltadas.
 * Las coincidencias se resaltan utilizando la etiqueta <strong>.
 */
export const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

  const parts = text.split(regex)

  let counter = 1 // Contador para asegurar claves únicas

  return parts.map((part) => {
    const key = `${query}-${counter++}` // Clave única

    return regex.test(part) ? (
      <strong key={key} className="font-semibold">
        {part}
      </strong>
    ) : (
      <span key={key} className="font-light">
        {part}
      </span>
    )
  })
}
