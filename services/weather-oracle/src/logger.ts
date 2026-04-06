// ---- Colores para Logs ----
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

// ---- Debugging ----
const DEBUG = process.env.NODE_ENV !== 'production'

// ---- Sistema de Logs ----
const getLogTime = () => {
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date())
}

export const Logger = {
  info: (msg: string) => console.log(`${colors.cyan}⛅ [ ORACLE ]${colors.reset}${colors.magenta} [${getLogTime()}]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  cron: (msg: string) => console.log(`${colors.magenta}🕒 [ CRON ]${colors.reset}${colors.magenta} [${getLogTime()}]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ [ DONE ]${colors.reset}${colors.magenta} [${getLogTime()}]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  warn: (msg: string) => console.warn(`${colors.yellow}⚠️ [ WARN ]${colors.reset}${colors.magenta} [${getLogTime()}]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  error: (msg: string, err?: unknown) => console.error(`${colors.red}❌ [ ERROR ]${colors.reset}${colors.magenta} [${getLogTime()}]${colors.reset}${colors.white} ${msg}${colors.reset}`, err || ''),
  debug: (msg: string) => DEBUG && console.log(`${colors.green}🔎 [ DEBUG ]${colors.reset}${colors.magenta} [${getLogTime()}]${colors.reset}${colors.white} ${msg}${colors.reset}`),
  db: (msg: string) => DEBUG && console.log(`${colors.blue}🐘 [ PRISMA ]${colors.reset}${colors.magenta} [${getLogTime()}]${colors.reset}${colors.white} ${msg}${colors.reset}`),
}
