/* eslint-disable no-console */
const isServer = typeof window === 'undefined'

const colors = {
  reset: '\x1b[0m',
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
  if (!isServer) return `${icon} [${tag}] ${msg}`

  const time = getLogTime()
  const paddedTag = tag.padEnd(4).substring(0, 4).toUpperCase()

  return `${colors.white}[ ${time} ]${colors.reset} ${color}${icon} [ ${paddedTag} ]${colors.reset} ${colors.white}${msg}${colors.reset}`
}

/**
 * Logger centralizado para PristinoPlant App.
 * Permite cumplir con las reglas de ESLint evitando el uso directo de console.
 */
export const Logger = {
  info: (msg: string, arg?: unknown) => {
    console.log(formatLog('📡', 'INFO', colors.blue, msg))
    if (arg) {
      console.log(
        isServer
          ? `${colors.blue}      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}${colors.reset}`
          : `      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}`,
      )
    }
  },
  success: (msg: string, arg?: unknown) => {
    console.log(formatLog('✅', 'DONE', colors.green, msg))
    if (arg) {
      console.log(
        isServer
          ? `${colors.green}      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}${colors.reset}`
          : `      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}`,
      )
    }
  },
  warn: (msg: string, arg?: unknown) => {
    console.warn(formatLog('⚠️', 'WARN', colors.yellow, msg))
    if (arg) {
      console.warn(
        isServer
          ? `${colors.yellow}      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}${colors.reset}`
          : `      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}`,
      )
    }
  },
  mqtt: (msg: string, arg?: unknown) => {
    console.log(formatLog('📡', 'MQTT', colors.blue, msg))
    if (arg) {
      console.log(
        isServer
          ? `${colors.blue}      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}${colors.reset}`
          : `      ╰─> ${typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}`,
      )
    }
  },
  error: (msg: string, err?: unknown) => {
    console.error(formatLog('❌', 'ERRO', colors.red, msg))
    if (err) {
      // Comprobación de error de Prisma sin importar el módulo (para compatibilidad con cliente)
      const isPrismaError =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        'clientVersion' in err &&
        'message' in err

      if (isPrismaError) {
        const prismaErr = err as unknown as { code: string; message: string }

        console.error(
          isServer
            ? `${colors.red}      ╰─> [PRISMA ${prismaErr.code}] ${prismaErr.message}${colors.reset}`
            : `      ╰─> [PRISMA ${prismaErr.code}] ${prismaErr.message}`,
        )
      } else if (err instanceof Error) {
        console.error(
          isServer
            ? `${colors.red}      ╰─> ${err.message}${colors.reset}`
            : `      ╰─> ${err.message}`,
        )
      } else {
        console.error(
          isServer
            ? `${colors.red}      ╰─> ${String(err)}${colors.reset}`
            : `      ╰─> ${String(err)}`,
        )
      }
    }
  },
}
