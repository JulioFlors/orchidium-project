import { Category, Subcategory } from '@/interfaces'

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

/**
 * Filtra los resultados de búsqueda basados en el término de búsqueda proporcionado.
 *
 * @param categories - El array de categorías y subcategorías a filtrar.
 * @param searchTerm - El término de búsqueda a utilizar para filtrar.
 * @returns Un array de subcategorías y categorías que coinciden con el término de búsqueda.
 */
export function filterSearchResults(
  categories: Category[],
  searchTerm: string,
): (Subcategory | Category)[] {
  if (searchTerm.trim() === '') {
    return []
  }

  return categories.flatMap((category) => {
    if (category.subcategories) {
      return category.subcategories.filter((sub) =>
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    } else if (category.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return [category]
    } else {
      return []
    }
  })
}

/**
 * Maneja la accesibilidad del sidebar, incluyendo el enfoque del teclado y el bloqueo del scroll del body.
 *
 * @param isSideMenuOpen - Indica si el sidebar está abierto.
 * @param navRef - Una referencia al elemento nav del sidebar.
 * @param setActiveCategory - Una función para establecer la categoría activa.
 * @returns Una función de limpieza para eliminar el event listener del teclado, o undefined si no es necesario.
 */
export function handleAccessibility(
  isSideMenuOpen: boolean,
  navRef: React.RefObject<HTMLElement | null>,
  setActiveCategory: (categoryId: string | null) => void,
): () => void {
  if (isSideMenuOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
    setActiveCategory(null)
  }

  if (navRef.current) {
    // 'navRef.current' es null al inicio y si el sidebar no está en la página.
    // También es null si el sidebar se quita de la página.
    const focusableElements = navRef.current.querySelectorAll<HTMLElement>(
      'a, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    focusableElements.forEach((el: HTMLElement) => {
      if (isSideMenuOpen && el !== document.activeElement) {
        el.removeAttribute('tabindex')
      } else {
        el.setAttribute('tabindex', '-1')
      }
    })

    if (isSideMenuOpen) {
      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              e.preventDefault()
              lastFocusable.focus()
            }
          } else {
            if (document.activeElement === lastFocusable) {
              e.preventDefault()
              firstFocusable.focus()
            }
          }
        }
      }

      const currentNavRef = navRef.current

      currentNavRef.addEventListener('keydown', handleKeyDown)

      return () => {
        currentNavRef?.removeEventListener('keydown', handleKeyDown)
      }
    }
  }

  // Pasa cuando el sidebar no está en la página o está cerrado.
  return () => {
    /* No hay nada que limpiar */
  }
}

/**
 * Enfoca el primer elemento con role="searchbox" dentro del contenedor proporcionado.
 * En consecuencia logra enfocar el input de busqueda del componente Searchbox.
 *
 * @param isOpen - Indica si el componente está renderizado.
 * @param containerRef - referencia al elemento padre que contiene el elemento con role="searchbox".
 */
export function handleFocusSearchInput(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
): void {
  if (isOpen && containerRef.current) {
    const searchboxElement = containerRef.current.querySelector<HTMLElement>('[role="searchbox"]')

    if (searchboxElement) {
      searchboxElement.focus()
    }
  }
}
