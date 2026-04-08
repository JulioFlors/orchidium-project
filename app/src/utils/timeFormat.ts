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
