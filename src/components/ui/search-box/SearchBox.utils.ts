import type { Species } from '@/interfaces'

/**
 * Enfoca el primer elemento con role="searchbox" dentro del contenedor proporcionado.
 * Usado para devolver el foco al input de búsqueda después de ciertas acciones (ej: borrar término).
 * Usado en el TopMenu para enfocar el input de búsqueda cuando se abre/expande
 *
 * @param isOpen - Indica si el componente asociado (ej: SearchBox) está visible/activo.
 * @param containerRef - Referencia React al elemento contenedor que contiene el input con role="searchbox".
 */
export function handleFocusSearchInput(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
): void {
  // Solo intenta enfocar si el contenedor existe y se indica que está abierto/activo
  if (isOpen && containerRef.current) {
    // Busca el elemento de input dentro del contenedor
    const searchBoxElement =
      containerRef.current.querySelector<HTMLInputElement>('[role="searchbox"]')

    // Si se encuentra el input, lo enfoca
    if (searchBoxElement) {
      searchBoxElement.focus()
    }
  }
}

/**
 * Filtra las especies basándose en el término de búsqueda proporcionado,
 * aplicando opcionalmente un límite de resultados y un requisito mínimo de caracteres.
 *
 * @param searchTerm - El término de búsqueda a utilizar para filtrar.
 * @param speciesData - Array con todas las especies disponibles para buscar.
 * @param isLimited - Booleano para controlar el comportamiento:
 *                    `true`: Aplica límite de resultados (5) y mínimo de caracteres (2) (Searchbox).
 *                    `false`: Sin límite de resultados y mínimo de caracteres (3) (página de resultados).
 * @returns Un array de Especies que coinciden con el término de búsqueda,
 *          aplicando las restricciones según `isLimited`.
 *          Retorna un array vacío si no se cumple el mínimo de caracteres o no hay coincidencias.
 */
export function filterSearchResults(
  searchTerm: string,
  speciesData: Species[],
  isLimited: boolean,
): Species[] {
  // Configuración para el modo limitado (Searchbox)
  const limitedConfig = { minLength: 2, limit: 5 }
  // Configuración para el modo sin límite (Página de resultados)
  // Se requiere al menos 3 caracter para empezar a buscar en la página de resultados.
  const unlimitedConfig = { minLength: 3, limit: undefined } // Usar undefined para indicar "sin límite"

  // Seleccionar la configuración basada en el parámetro isLimited
  const config = isLimited ? limitedConfig : unlimitedConfig

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  // Validar longitud mínima del término de búsqueda según la configuración
  if (normalizedSearchTerm.length < config.minLength) {
    return [] // No cumple el mínimo de caracteres, retornar array vacío
  }

  // Filtrar las especies cuyo nombre incluya el término de búsqueda (insensible a mayúsculas/minúsculas)
  const speciesResults = speciesData.filter((species) =>
    species.name.toLowerCase().includes(normalizedSearchTerm),
  )

  // Aplicar el límite de resultados si está definido en la configuración
  if (config.limit !== undefined) {
    // Devuelve solo los primeros 'limit' resultados usando slice
    return speciesResults.slice(0, config.limit)
  }

  // Devuelve todos los resultados encontrados sin aplicar límite
  return speciesResults
}
