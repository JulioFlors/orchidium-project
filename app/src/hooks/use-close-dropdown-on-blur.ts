import { useEffect } from 'react'

/**
 * Hook personalizado para cerrar un menú desplegable (dropdown) o modal
 * cuando el navegador pierde el foco o el usuario cambia de pestaña/minimiza la ventana.
 *
 * @param isOpen - Estado booleano que indica si el dropdown está abierto actualmente.
 * @param closeDropdown - Función callback que se ejecuta para cerrar el dropdown.
 */
export function useCloseDropdownOnBlur(isOpen: boolean, closeDropdown: () => void) {
  useEffect(() => {
    // Si no está abierto, no necesitamos escuchar nada para ahorrar recursos.
    if (!isOpen) return

    // 1. Detectar pérdida de foco de la ventana (clic fuera del navegador o en otra app)
    const handleWindowBlur = () => {
      closeDropdown()
    }

    // 2. Detectar cambio de pestaña o navegador minimizado
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        closeDropdown()
      }
    }

    // Registramos los eventos
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Limpieza de eventos al desmontar o al cerrar el dropdown
    return () => {
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isOpen, closeDropdown])
}
