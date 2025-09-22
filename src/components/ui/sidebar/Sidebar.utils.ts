/**
 * Maneja la accesibilidad del sidebar, incluyendo el enfoque del teclado y el bloqueo del scroll del body.
 *
 * @param isSidebarOpen - Indica si el sidebar está abierto.
 * @param navRef - Una referencia al elemento nav del sidebar.
 * @param setSidebarRoute - Una función para establecer la ruta activa.
 * @returns Una función de limpieza para eliminar el event listener del teclado, o undefined si no es necesario.
 */
export function handleAccessibility(
  isSidebarOpen: boolean,
  navRef: React.RefObject<HTMLElement | null>,
  setSidebarRoute: (routeId: string | null) => void,
): () => void {
  if (isSidebarOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
    setSidebarRoute(null)
  }

  if (navRef.current) {
    // 'navRef.current' es null al inicio y si el sidebar no está en la página.
    // También es null si el sidebar se quita de la página.
    const focusableElements = navRef.current.querySelectorAll<HTMLElement>(
      'a, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    focusableElements.forEach((el: HTMLElement) => {
      if (isSidebarOpen && el !== document.activeElement) {
        el.removeAttribute('tabindex')
      } else {
        el.setAttribute('tabindex', '-1')
      }
    })

    if (isSidebarOpen) {
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

export const motionProps = {
  initial: { x: '80%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { duration: 0.5, ease: 'easeOut' },
      opacity: { duration: 0.3, ease: 'easeOut', delay: 0.1 },
    },
  },
  exit: {
    x: '80%',
    opacity: 0,
    transition: {
      x: { duration: 0.6, ease: 'easeIn' },
      opacity: { duration: 0.4, ease: 'easeIn', delay: 0.1 },
    },
  },
}
