/**
 * Utilidad para el manejo de almacenamiento persistente de auditorías
 * Vincula el ciclo de vida de los datos al estado de la sesión
 */

export const AUDIT_STORAGE_PREFIX = 'pp_audit_'

export const UI_STORAGE_PREFIX = 'diag_'

/**
 * Limpia todos los datos relacionados con auditorías y estado de UI del buscador
 */
export const clearAuditData = () => {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)

    if (key && (key.startsWith(AUDIT_STORAGE_PREFIX) || key.startsWith(UI_STORAGE_PREFIX))) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))

  // Limpiar también posibles remanentes en sessionStorage por seguridad
  if (typeof sessionStorage !== 'undefined') {
    const sessionKeys: string[] = []

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)

      if (key && (key.startsWith('audit_history_') || key.startsWith('pp_audit_'))) {
        sessionKeys.push(key)
      }
    }
    sessionKeys.forEach((key) => sessionStorage.removeItem(key))
  }
}
