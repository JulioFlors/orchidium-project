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
  const paddedTag = tag.padEnd(4).substring(0, 4).toUpperCase()

  return `${colors.white}[ ${time} ]${colors.reset} ${color}${icon} [ ${paddedTag} ]${colors.reset} ${colors.white}${msg}${colors.reset}`
}

export const Logger = {
  info: (msg: string) => console.log(formatLog('📡', 'INFO', colors.blue, msg)),
  success: (msg: string) => console.log(formatLog('✅', 'DONE', colors.green, msg)),
  warn: (msg: string, err?: unknown) => {
    console.warn(formatLog('⚠️', 'WARN', colors.yellow, msg))
    if (err) {
      console.error(
        `${colors.yellow}      ╰─> ${err instanceof Error ? err.message : String(err)}${colors.reset}`,
      )
    }
  },
  error: (msg: string, err?: unknown) => {
    console.error(formatLog('❌', 'ERRO', colors.red, msg))
    if (err) {
      let tag = 'ERRO'
      let message = String(err)

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        tag = 'DBAS'
        message = `[${err.code}] ${err.message}`
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        tag = 'DBAS'
        message = '[VAL] ' + err.message
      } else if (err instanceof Error) {
        message = err.message
        if (message.includes('InfluxDB') || message.includes('influxdb')) {
          tag = 'INFX'
        } else if (message.includes('MQTT') || message.includes('broker')) {
          tag = 'MQTT'
        }
      }

      console.error(`${colors.red}      ╰─> [ ${tag} ] ${message}${colors.reset}`)
    }
  },
  debug: (msg: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('🔎', 'DBUG', colors.cyan, msg))
    }
  },
  mqtt: (msg: string) => console.log(formatLog('📡', 'MQTT', colors.magenta, msg)),
  cron: (msg: string) => console.log(formatLog('⏰', 'CRON', colors.cyan, msg)),
  node: (status: 'ONLINE' | 'OFFLINE' | 'REBOOT', origin?: string) => {
    const isOnline = status === 'ONLINE'
    const isReboot = status === 'REBOOT'
    const color = isOnline ? colors.green : isReboot ? colors.blue : colors.red
    const icon = isOnline ? '✅' : isReboot ? '🔄' : '❌'
    const displayStatus = origin ? `${status} [${origin}]` : status

    console.log(formatLog(icon, 'NODE', color, displayStatus))
  },
  oracle: (msg: string) => console.log(formatLog('🔮', 'ORCL', colors.blue, msg)),
}
