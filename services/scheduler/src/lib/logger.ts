import { Prisma } from '@package/database'

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[34m',
  magenta: '\x1b[95m',
  cyan: '\x1b[96m',
  white: '\x1b[97m',
  dim: '\x1b[90m',
}

function cleanAmPm(str: string): string {
  return str
    .replace(/a\.\s*m\./gi, 'am')
    .replace(/p\.\s*m\./gi, 'pm')
    .replace(/a\s*m/gi, 'am')
    .replace(/p\s*m/gi, 'pm')
}

function cleanAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

const getLogTime = () => {
  const formatted = new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())

  return cleanAmPm(formatted)
}

/**
 * Formatea una línea de log con icono, tag y mensaje coloreado.
 * El tag se justifica a la derecha dentro de un ancho fijo para alinear
 * el cuerpo del mensaje independientemente de la longitud del tag.
 */
const formatLog = (icon: string, tag: string, color: string, msg: string): string => {
  const time = getLogTime()
  const paddedTag = tag.toUpperCase().slice(0, 4).padEnd(4)

  const headerColor = `${colors.white}[ ${time} ]${colors.reset} ${color}${icon} [ ${paddedTag} ]${colors.reset} `

  const maxMsgLen = 80 // Límite de 80 caracteres de contenido real (limpio) del mensaje

  // Separar por saltos de línea preexistentes primero para respetar formato multilínea
  const rawParagraphs = msg.split('\n')
  const formattedLines: string[] = []

  for (const paragraph of rawParagraphs) {
    if (!paragraph.trim()) {
      formattedLines.push('')
      continue
    }

    const words = paragraph.split(' ')
    let currentLine = ''

    for (const word of words) {
      const wordCleanLen = cleanAnsi(word).length

      if (wordCleanLen > maxMsgLen) {
        if (currentLine) {
          formattedLines.push(currentLine)
          currentLine = ''
        }
        let remaining = word

        while (cleanAnsi(remaining).length > maxMsgLen) {
          formattedLines.push(remaining.slice(0, maxMsgLen))
          remaining = remaining.slice(maxMsgLen)
        }
        currentLine = remaining
      } else {
        const currentLineCleanLen = cleanAnsi(currentLine).length
        const combinedCleanLen = currentLine ? currentLineCleanLen + 1 + wordCleanLen : wordCleanLen

        if (combinedCleanLen > maxMsgLen) {
          if (currentLine) {
            formattedLines.push(currentLine)
          }
          currentLine = word
        } else {
          currentLine = currentLine ? currentLine + ' ' + word : word
        }
      }
    }
    if (currentLine) {
      formattedLines.push(currentLine)
    }
  }

  if (formattedLines.length === 0) {
    return headerColor
  }

  return formattedLines.map((line) => `${headerColor}${line}`).join('\n')
}

export const Logger = {
  // ---- Generales ----

  /** Información general del sistema. */
  info: (msg: string, icon = '📡') => console.log(formatLog(icon, 'INFO', colors.blue, msg)),

  /** Operación completada exitosamente. */
  success: (msg: string) => console.log(formatLog('✅', 'DONE', colors.green, msg)),

  /** Advertencia no crítica. */
  warn: (msg: string, err?: unknown) => {
    console.warn(formatLog('⚠️', 'WARN', colors.yellow, msg))
    if (err) {
      console.warn(
        `${colors.yellow}      ╰─> ${err instanceof Error ? err.message : String(err)}${colors.reset}`,
      )
    }
  },

  /** Error con detalle opcional de excepción. */
  error: (msg: string, err?: unknown) => {
    console.error(formatLog('❌', 'ERR ', colors.red, msg))
    if (err) {
      let prefix = 'ERR'
      let detail = String(err)

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        prefix = `PRISMA ${err.code}`
        detail = err.message
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        prefix = 'PRISMA VAL'
        detail = err.message
      } else if (err instanceof Error) {
        detail = err.message
        if (detail.includes('InfluxDB') || detail.includes('influxdb')) prefix = 'INFLUXDB'
        else if (detail.includes('MQTT') || detail.includes('broker')) prefix = 'MQTT'
      }

      console.error(`${colors.red}      ╰─> [ ${prefix} ] ${detail}${colors.reset}`)
    }
  },

  /** Debug (solo en desarrollo). */
  debug: (msg: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('🔎', 'DBUG', colors.dim, msg))
    }
  },

  // ---- Dominio: Conectividad del Nodo ----

  /**
   * Estado de conectividad del nodo actuador.
   * @param status ONLINE | OFFLINE | REBOOT o nombre de un nodo al conectarse.
   * @param origin Fuente del cambio de estado (BROKER, NODE, SCHEDULER)
   */
  node: (status: string, origin?: string) => {
    let icon = '📡'
    let color = colors.blue

    let nodeLabel = '[Actuador]'

    if (origin) {
      const lower = origin.toLowerCase()

      if (lower.includes('orquideario') || lower.includes('ema') || lower.includes('zona_a')) {
        nodeLabel = '[EMA]'
      }
    }

    if (status === 'ONLINE') {
      icon = '🟢'
      color = colors.green
    } else if (status === 'REBOOT') {
      icon = '🔄'
      color = colors.blue
    } else if (status === 'SLEEP') {
      icon = '💤'
      color = colors.cyan
    } else if (status === 'OFFLINE') {
      icon = '🔴'
      color = colors.red
    }

    let detail = ''

    if (origin) {
      if (origin.includes('Watchdog')) {
        detail = ` ${colors.dim}[Watchdog]${colors.reset}`
      } else if (origin.includes('BROKER')) {
        detail = ` ${colors.dim}[BROKER]${colors.reset}`
      } else if (origin.includes('NODE')) {
        detail = ` ${colors.dim}[NODE]${colors.reset}`
      } else if (origin.includes('SCHEDULER')) {
        detail = ` ${colors.dim}[SCHEDULER]${colors.reset}`
      }
    }

    const msg = `${status} ${colors.dim}${nodeLabel}${colors.reset}${detail}`

    console.log(formatLog(icon, 'NODE', color, msg))
  },

  // ---- Dominio: MQTT ----

  /** Comando MQTT enviado o recibido. */
  mqtt: (msg: string, node?: string) => {
    const nodeSuffix = node ? ` [${node}]` : ''

    console.log(formatLog('📡', 'MQTT', colors.magenta, `${msg}${nodeSuffix}`))
  },

  /** ACK recibido del nodo. */
  ack: (msg: string) => console.log(formatLog('📬', 'ACK ', colors.green, msg)),

  // ---- Dominio: Tareas y Circuitos ----

  /** Ciclo de vida de una tarea (despacho, completado, falla). */
  task: (msg: string) => console.log(formatLog('💧', 'TASK', colors.cyan, msg)),

  // ---- Dominio: Rutinas y Crons ----

  /** Ejecución y estado de crons programados. */
  cron: (msg: string) => console.log(formatLog('⏰', 'CRON', colors.cyan, msg)),

  // ---- Dominio: Motor de Inferencia ----

  /** Decisiones del Motor de Inferencia Ambiental. */
  inference: (msg: string) => console.log(formatLog('🔮', 'INFR', colors.blue, msg)),

  // ---- Dominio: Agroquímicos ----

  /** Gestión del ciclo de vida de tareas de agroquímicos. */
  agro: (msg: string) => console.log(formatLog('🧪', 'AGRO', colors.magenta, msg)),

  // ---- Dominio: Lluvia / Clima ----

  /** Eventos y guardias de lluvia. */
  rain: (msg: string) => console.log(formatLog('🌧️', 'RAIN', colors.blue, msg)),

  // ---- Dominio: Clasificador de Día ----

  /** Clasificación del día (DIF, DLI, temporal de lluvia). */
  dayClass: (msg: string) => console.log(formatLog('☀️', 'DAYC', colors.yellow, msg)),

  // ---- Dominio: Telemetría / Cierre Diario ----

  /** Procesamiento de telemetría histórica (cierre diario). */
  telemetry: (msg: string) => console.log(formatLog('📊', 'TLMT', colors.cyan, msg)),
}
