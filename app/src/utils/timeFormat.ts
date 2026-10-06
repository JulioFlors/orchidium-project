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

    // Normalizar a minúsculas y eliminar espacios y puntos
    formatted = formatted
      .replace(/a\.\s*m\./gi, 'am')
      .replace(/p\.\s*m\./gi, 'pm')
      .replace(/a\s*m/gi, 'am')
      .replace(/p\s*m/gi, 'pm')

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
    return 'Ayer'
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

/**
 * Obtiene la fecha actual en la zona horaria de Caracas en formato ISO 'YYYY-MM-DD'.
 * Previene que el usuario vea la fecha de mañana al operar en horario nocturno (ej. 8pm-12am).
 */
export function getTodayCalendarString(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

/**
 * Parsea una cadena de fecha de calendario 'YYYY-MM-DD' fijándola al mediodía UTC (12:00:00Z).
 * Esto evita desfases de día en cualquier huso horario entre UTC-11 y UTC+11.
 */
export function parseCalendarDate(dateStr: string): Date {
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr

  return new Date(`${cleanDate}T12:00:00.000Z`)
}

/**
 * Convierte un Date o string ISO a formato 'YYYY-MM-DD' en UTC para inputs HTML type="date".
 * Compatible tanto con registros históricos a las 00:00:00Z como con nuevos a las 12:00:00Z.
 */
export function toCalendarDateString(dateValue: Date | string): string {
  if (!dateValue) return ''

  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue

  if (isNaN(date.getTime())) return ''

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}

/**
 * Formatea una fecha de calendario en español (es-VE) fijando UTC para que
 * el navegador jamás reste horas ni cambie el día o mes seleccionado.
 */
export function formatCalendarDate(
  dateValue: Date | string,
  options: { month?: 'short' | 'long' } = { month: 'short' },
): string {
  if (!dateValue) return ''

  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue

  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: options.month ?? 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Extrae el mes del calendario (1 a 12) a partir de los componentes UTC de la fecha,
 * garantizando exactitud matemática sin importar el huso horario del servidor.
 */
export function getCalendarMonth(dateValue: Date | string): number {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue

  if (isNaN(date.getTime())) return 1

  return date.getUTCMonth() + 1
}
