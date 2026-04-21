import { Cron } from 'croner'

import { syncOpenMeteo, syncOpenWeatherMap, syncAgroMonitoring } from './oracle'
import { Logger } from './logger'

Logger.info('Iniciando servicio Weather Oracle')

/**
 * Inicialización inmediata al arrancar el contenedor/servicio.
 */
async function bootstrap() {
  try {
    Logger.info('Iniciando sincronización (Bootstrap)')
    await Promise.allSettled([syncOpenMeteo(), syncOpenWeatherMap(), syncAgroMonitoring()])
    Logger.success('Bootstrap completado.')
  } catch (error) {
    Logger.error('Error crítico durante el bootstrap:', error)
  }
}

// Iniciar procesos
bootstrap()

// Programar sincronización periódica cada 3 horas.
const job = new Cron('0 */3 * * *', async () => {
  Logger.cron(`Iniciando sincronización meteorológica periódica`)
  await Promise.allSettled([syncOpenMeteo(), syncOpenWeatherMap(), syncAgroMonitoring()])
})

const nextRun = job.nextRun()

if (nextRun) {
  const formattedDate = new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(nextRun)

  Logger.info(`Servicio inactivo en espera. Próxima ejecución: ${formattedDate}`)
} else {
  Logger.warn('No se pudo programar la próxima ejecución del cron.')
}

// Mantener el proceso vivo (aunque croner lo hace, es buena práctica en Node)
process.on('SIGINT', () => {
  Logger.warn('Señal SIGINT recibida. Cerrando servicio oracle')
  process.exit(0)
})
