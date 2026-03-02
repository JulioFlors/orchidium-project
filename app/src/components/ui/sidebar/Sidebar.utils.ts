import type { Variants } from 'motion/react'

/**
 * GESTIONA la accesibilidad dentro del sidebar.
 * Mapea lo elementos que pueden/deben recibir el foco
 * y no permite que el `focus` escape hacia el `body`.
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

  let observer: MutationObserver | null = null
  let cleanupKeydown = () => {}

  if (isSidebarOpen && navRef.current) {
    const attachTrap = () => {
      cleanupKeydown()

      const currentNavRef = navRef.current

      if (!currentNavRef) return

      const focusableElements = Array.from(
        currentNavRef.querySelectorAll<HTMLElement>(
          'a, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')

      focusableElements.forEach((el: HTMLElement) => {
        if (el !== document.activeElement) {
          el.removeAttribute('tabindex')
        }
      })

      if (focusableElements.length === 0) return

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
            if (
              document.activeElement === lastFocusable ||
              !document.activeElement ||
              !currentNavRef.contains(document.activeElement)
            ) {
              e.preventDefault()
              firstFocusable.focus()
            }
          }
        }
      }

      currentNavRef.addEventListener('keydown', handleKeyDown)
      cleanupKeydown = () => {
        currentNavRef.removeEventListener('keydown', handleKeyDown)
      }
    }

    attachTrap()

    // Escuchar cambios del DOM (ej. carga asíncrona de authClient)
    observer = new MutationObserver(() => {
      attachTrap()
    })

    observer.observe(navRef.current, { childList: true, subtree: true })
  }

  return () => {
    cleanupKeydown()
    observer?.disconnect()
  }
}

export const motionProps: Variants = {
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
