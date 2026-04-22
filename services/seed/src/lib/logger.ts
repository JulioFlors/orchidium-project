const colors = {
  reset: '\x1b[0m',
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
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
  const paddedTag = tag.padEnd(4).substring(0, 4).toUpperCase()

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
    console.error(formatLog('❌', 'ERRO', colors.red, msg))
    if (err) {
      console.error(`${colors.red}      ╰─> ${err instanceof Error ? err.message : String(err)}${colors.reset}`)
    }
  },
  raw: (msg: string) => {
    console.log(msg)
  },
}
