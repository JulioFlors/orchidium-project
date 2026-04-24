export function formatTime12h(
  dateValue: string | Date | number,
  includeSeconds: boolean = false,
): string {
  if (!dateValue) return '--:--'

  const date = new Date(dateValue)

  if (isNaN(date.getTime())) return '--:--'

  let hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.'

  hours = hours % 12
  hours = hours || 12 // el 0 debe ser 12

  const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString()
  const secondsStr = seconds < 10 ? `0${seconds}` : seconds.toString()

  if (includeSeconds) {
    return `${hours}:${minutesStr}:${secondsStr} ${ampm}`
  }

  return `${hours}:${minutesStr} ${ampm}`
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
  const diffHours = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'Hace unos segundos'
  if (diffMin < 5) return 'Hace unos minutos'
  if (diffHours < 1) return `Hace ${diffMin}min`
  if (diffHours < 12) return `Hace ${diffHours}h`

  const timeStr = formatTime12h(date)

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return timeStr
  }

  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '')

  return `${day} ${month}, ${timeStr}`
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
