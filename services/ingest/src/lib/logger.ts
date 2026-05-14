import { Prisma } from '@package/database'

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[34m',
  magenta: '\x1b[95m',
  cyan: '\x1b[96m',
  white: '\x1b[97m',
}

const getLogTime = () => {
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())
}

const formatLog = (icon: string, tag: string, color: string, msg: string) => {
  const time = getLogTime()
  const paddedTag = tag.padEnd(6).substring(0, 6).toUpperCase()

  return `${colors.white}[ ${time} ]${colors.reset} ${color}${icon} [ ${paddedTag} ]${colors.reset} ${colors.white}${msg}${colors.reset}`
}

export const Logger = {
  info: (msg: string) => {
    console.log(formatLog('📡', 'INFO', colors.blue, msg))
  },
  success: (msg: string) => {
    console.log(formatLog('✅', 'DONE', colors.green, msg))
  },
  warn: (msg: string) => {
    console.warn(formatLog('⚠️', 'WARN', colors.yellow, msg))
  },
  error: (msg: string, err?: unknown) => {
    console.error(formatLog('❌', 'ERROR', colors.red, msg))
    if (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(`${colors.red}      ╰─> [PRISMA ${err.code}] ${err.message}${colors.reset}`)
      } else if (err instanceof Error) {
        console.error(`${colors.red}      ╰─> ${err.message}${colors.reset}`)
      } else {
        console.error(`${colors.red}      ╰─> ${String(err)}${colors.reset}`)
      }
    }
  },
  debug: (msg: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('🔎', 'DEBUG', colors.cyan, msg))
    }
  },
  mqtt: (msg: string) => {
    console.log(formatLog('📡', 'MQTT', colors.blue, msg))
  },
  /**
   * Métrica ambiental (temp, hum, lux, rain_intensity)
   */
  metric: (msg: string) => {
    console.log(formatLog('📈', 'METRIC', colors.cyan, msg))
  },
  /**
   * Evento de lluvia (finalización del evento: duración + intensidad)
   */
  rain: (msg: string) => {
    console.log(formatLog('🌧️', 'RAIN', colors.blue, msg))
  },
  /**
   * Cambio de estado: Device_Status, Rain_State
   */
  state: (msg: string) => {
    console.log(formatLog('⚙️', 'STATUS', colors.magenta, msg))
  },
  /** @deprecated Usar metric / rain / state según el tipo de dato. */
  influx: (msg: string) => {
    console.log(formatLog('💾', 'INFLUX', colors.green, msg))
  },
}
