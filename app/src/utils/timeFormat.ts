export function formatTime12h(
  dateValue: string | Date | number,
  includeSeconds: boolean = false,
): string {
  if (!dateValue) return '--:--'

  const date = new Date(dateValue)

  if (isNaN(date.getTime())) return '--:--'

  try {
    const formatter = new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      hour: 'numeric',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      hour12: true,
    })

    let formatted = formatter.format(date).toLowerCase()

    // Normalizar a minúsculas y añadir espacio si es necesario
    if (formatted.includes('a.m.')) formatted = formatted.replace('a.m.', 'a. m.')
    if (formatted.includes('p.m.')) formatted = formatted.replace('p.m.', 'p. m.')
    if (formatted.includes('am')) formatted = formatted.replace('am', 'a. m.')
    if (formatted.includes('pm')) formatted = formatted.replace('pm', 'p. m.')

    return formatted
  } catch {
    return '--:--'
  }
}

export function formatDateLong(dateValue: string | Date | number): string {
  if (!dateValue) return ''

  const date = new Date(dateValue)

  if (isNaN(date.getTime())) return ''

  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'America/Caracas',
  }

  const formatter = new Intl.DateTimeFormat('es-VE', opts)
  const parts = formatter.formatToParts(date)

  // Capitalizar la primera letra del día
  const weekday = parts.find((p) => p.type === 'weekday')?.value || ''
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1)

  const day = parts.find((p) => p.type === 'day')?.value || ''
  const month = parts.find((p) => p.type === 'month')?.value || ''

  return `${weekdayCap}, ${day} de ${month}`
}

export function formatRelativeHeartbeat(dateValue: string | Date | number): string {
  if (!dateValue) return 'Sin datos'

  const date = new Date(dateValue)

  if (isNaN(date.getTime())) return 'Sin datos'

  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHoursRaw = diffMin / 60

  if (diffSec < 60) return 'Hace unos segundos'
  if (diffMin < 60) return `Hace ${diffMin} min`

  if (diffHoursRaw < 24) {
    return `Hace ${Math.round(diffHoursRaw)}h`
  }

  if (diffHoursRaw < 48) {
    return `Ayer, ${formatTime12h(date)}`
  }

  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '')
  const year = date.getFullYear()

  return `${day} ${month}. ${year}`
}

/**
 * Formato inteligente: Hoy, Ayer o Fecha Completa.
 */
export function formatSmartDateTime(dateValue: string | Date | number): string {
  if (!dateValue) return '--:--'
  const date = new Date(dateValue)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  const timeStr = formatTime12h(date)

  if (diffHours < 24) {
    if (date.getDate() === now.getDate()) {
      return `Hoy, ${timeStr}`
    } else {
      return `Ayer, ${timeStr}`
    }
  }

  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '')
  const year = date.getFullYear()

  return `${day} ${month}. ${year}, ${timeStr}`
}

/**
 * Obtiene la hora (0-23) de una fecha específicamente en la zona horaria de Caracas.
 */
export function getHourInCaracas(dateValue: string | Date | number): number {
  const date = new Date(dateValue)

  if (isNaN(date.getTime())) return 0

  const hourStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Caracas',
  }).format(date)

  // Nota: Intl.DateTimeFormat con hour12: false a veces devuelve "24" para medianoche.
  const hour = Number(hourStr)

  return hour === 24 ? 0 : hour
}
