import { Cron } from 'croner'

import { syncOpenMeteo, syncOpenWeatherMap, syncAgroMonitoring } from './oracle'
import { Logger } from './logger'

// Inmediatamente al arrancar el contenedor/servicio, realizamos una sincronización
async function initialSync() {
  try {
    await Promise.allSettled([syncOpenMeteo(), syncOpenWeatherMap(), syncAgroMonitoring()])
  } catch (error) {
    Logger.error('Error crítico durante la sincronización inicial:', error)
  }
}

// Iniciar procesos
initialSync().then(() => {
  console.log() // Espacio en blanco tras la conexión y sync inicial
})

// Programar sincronización periódica cada hora.
const job = new Cron('0 * * * *', async () => {
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
    timeZone: 'America/Caracas',
  }).format(nextRun)

  Logger.oracle(`Servicio a la espera. Próxima ejecución: ${formattedDate}`)
} else {
  Logger.warn('No se pudo programar la próxima ejecución del cron.')
}

// Mantener el proceso vivo (aunque croner lo hace, es buena práctica en Node)
process.on('SIGINT', () => {
  Logger.warn('Señal SIGINT recibida. Cerrando servicio oracle')
  process.exit(0)
})
