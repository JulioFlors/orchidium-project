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
